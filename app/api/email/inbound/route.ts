import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get("content-type");
    console.log("[email/inbound] Content-Type:", contentType);

    const body = await request.json();
    console.log("[email/inbound] Body keys:", Object.keys(body));
    console.log("[email/inbound] From:", body.From, "Subject:", body.Subject);

    const recipient = body.OriginalRecipient ?? body.To ?? "";
    const sender = body.From ?? "";
    const subject = body.Subject ?? "";
    const bodyPlain = body.TextBody ?? "";
    const bodyHtml = body.HtmlBody ?? "";
    const mailboxHash = body.MailboxHash ?? "";

    console.log("[email/inbound] From:", sender, "To:", recipient, "Subject:", subject, "Hash:", mailboxHash);

    // Use MailboxHash or extract from recipient
    const recipientLocal = mailboxHash || recipient.split("@")[0];

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, email")
      .eq("import_email", recipient)
      .limit(1);

    const profile = profiles?.[0];

    if (!profile) {
      console.log("[email/inbound] No user found for:", recipient);
      return NextResponse.json({ ok: false, error: "User not found" });
    }

    const content = bodyPlain || bodyHtml.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();

    const aiRes = await fetch("https://api.novita.ai/openai/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.NOVITA_API_KEY}`,
      },
      body: JSON.stringify({
        model: "qwen/qwen3.5-27b",
        max_tokens: 500,
        messages: [{
          role: "user",
          content: `You are a ticket purchase data extractor. Analyze this Ticketmaster confirmation email (may be forwarded multiple times - search ALL content).

Email subject: ${subject}
Email content:
${content.substring(0, 5000)}

Extract the following and return ONLY a valid JSON object with no markdown, no explanation:
{
  "event_name": "artist/band name and tour if present",
  "venue": "venue/arena name",
  "city": "city name only",
  "event_date": "YYYY-MM-DD format - this is the CONCERT DATE not purchase date",
  "quantity": total number of tickets as integer,
  "buy_price": total order amount as number (look for Order Total, Gesamtbetrag, Total),
  "currency": "EUR/GBP/CZK/USD",
  "ticket_type": "Mobile Transfer or E-Ticket or Paper or null",
  "exchange": "Ticketmaster",
  "is_ticketmaster_confirmation": true or false
}

CRITICAL RULES:
- event_date = the CONCERT/EVENT date when the show happens (e.g. "Donnerstag, 07. Mai 2026" = "2026-05-07", "Thu 08 May 2026" = "2026-05-08"). This is NEVER today's date.
- buy_price = final Order Total amount as number (e.g. "457,80 EUR" = 457.80, "457.80 EUR" = 457.80)
- DO NOT use today's date as event_date
- The event_date appears near venue/location info in the email
- Search through ALL forwarded content for these values
- Return ONLY the JSON, nothing else`
        }]
      })
    });

    const raw = await aiRes.text();
    console.log("[email/inbound] Novita response:", raw.substring(0, 300));

    if (!aiRes.ok) {
      return NextResponse.json({ ok: false, error: raw }, { status: 500 });
    }

    const aiData = JSON.parse(raw);
    let content2 = aiData.choices?.[0]?.message?.content ?? "{}";
    content2 = content2.replace(/<think>[\s\S]*?<\/think>/g, "").trim();
    content2 = content2.replace(/```json|```/g, "").trim();

    const jsonMatch = content2.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return NextResponse.json({ ok: false, error: "AI parse failed" });

    const parsed = JSON.parse(jsonMatch[0]);

    if (!parsed.is_ticketmaster_confirmation) {
      console.log("[email/inbound] Not a Ticketmaster confirmation");
      return NextResponse.json({ ok: false, error: "Not a Ticketmaster confirmation" });
    }

    const { error } = await supabase.from("purchases").insert({
      user_id: profile.id,
      event_name: parsed.event_name,
      event_date: parsed.event_date,
      event_actual_date: parsed.event_date,
      venue: parsed.venue,
      city: parsed.city,
      quantity: parsed.quantity,
      quantity_remaining: parsed.quantity,
      buy_price: parsed.buy_price ?? 0,
      currency: parsed.currency ?? "EUR",
      ticket_type: parsed.ticket_type,
      exchange: parsed.exchange ?? "Ticketmaster",
      status: "active",
      delivered: false,
      paid_out: false,
      created_at: new Date().toISOString(),
    });

    if (error) {
      console.error("[email/inbound] DB error:", error);
      return NextResponse.json({ ok: false, error: error.message });
    }

    console.log("[email/inbound] Purchase created:", parsed.event_name);
    return NextResponse.json({ ok: true });

  } catch (e: any) {
    console.error("[email/inbound] Error:", e);
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
