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
          content: `You are parsing a Ticketmaster confirmation email. The email may be forwarded and may be in any language (Spanish, German, Czech, Dutch, English, etc.). Search through ALL content carefully.

Email subject: ${subject}
Email content:
${content.substring(0, 5000)}

Extract ALL fields:
- event_name: Artist/band name and tour (e.g. "Bad Bunny - World Tour")
- event_date: The CONCERT date YYYY-MM-DD (look for concert day/date near venue, NOT purchase date)
- venue: Venue/arena name only (e.g. "Estadi Olímpic Lluis Companys")
- city: City where concert is (e.g. "Barcelona")
- sector: Section/seat info (e.g. "Lateral Inferior / Sector 120 / Row 25")
- quantity: Total number of tickets as integer (look for "x entrada(s)", "x tickets", "Qty:")
- buy_price: TOTAL order amount as single number - look for "Total" with the GRAND TOTAL (e.g. "700,00 €" = 700, NOT per-ticket price, NOT sum of individual tickets)
- currency: EUR/GBP/CZK/USD
- ticket_type: "Mobile Transfer" if digital/mobile ticket, "E-Ticket" if PDF, "Paper" if physical
- exchange: Always "Ticketmaster"
- is_ticketmaster_confirmation: true if Ticketmaster order, false otherwise

CRITICAL RULES:
- event_date = CONCERT date (e.g. "Sábado, 23 de Mayo de 2026" = "2026-05-23"), NOT purchase date
- buy_price = GRAND TOTAL (one number, e.g. 700 not 1400) - the final total paid
- sector = section + row + seat info combined (e.g. "Lateral Inferior / Sector 120 / Row 25 / Seat 15")
- venue = only the venue name, NOT city
- quantity = count of tickets (e.g. "2 entrada(s)" = 2)
- Return ONLY valid JSON, no markdown`
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
