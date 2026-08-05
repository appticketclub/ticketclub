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
          content: `You are parsing a Ticketmaster order confirmation email. The email may be forwarded multiple times (Fwd: Fwd: etc). Search through ALL content including forwarded parts carefully.

Email subject: ${subject}
Email content: ${content.substring(0, 5000)}

Extract ALL of these fields:
- event_name: Artist/band name and tour name (e.g. "Tame Impala - The Slow Rush Tour")
- event_date: The CONCERT date in YYYY-MM-DD format (NOT today, NOT purchase date - look for day/month/year near venue info)
- venue: Venue/arena name (e.g. "Co-op Live", "Ziggo Dome", "O2 Arena")
- city: City where the concert is (e.g. "Manchester", "Amsterdam", "Prague")
- quantity: Total number of tickets as integer (look for "x tickets", "6 tickets", "Qty:")
- buy_price: Total order amount as number (look for "Order Total:", "Total:", "457,80 EUR", "Gesamtbetrag" - use the FINAL total)
- currency: Currency code (EUR, GBP, CZK, USD)
- ticket_type: "Mobile Transfer" or "E-Ticket" or "Paper" (look for "Mobile Ticket", "E-Ticket", "Print at Home")
- exchange: Always "Ticketmaster"
- is_ticketmaster_confirmation: true if this is a Ticketmaster order confirmation, false otherwise

Return ONLY valid JSON, no markdown, no explanation:
{
  "event_name": "string or null",
  "event_date": "YYYY-MM-DD or null",
  "venue": "string or null",
  "city": "string or null",
  "quantity": number or null",
  "buy_price": number or null",
  "currency": "EUR/GBP/CZK/USD or null",
  "ticket_type": "Mobile Transfer or E-Ticket or Paper or null",
  "exchange": "Ticketmaster",
  "is_ticketmaster_confirmation": true or false
}`
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
      venue: parsed.venue,
      city: parsed.city,
      quantity: parsed.quantity,
      quantity_remaining: parsed.quantity,
      buy_price: parsed.buy_price,
      currency: parsed.currency ?? "EUR",
      ticket_type: parsed.ticket_type,
      exchange: parsed.exchange ?? "Ticketmaster",
      status: "active",
      delivered: false,
      paid_out: false,
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
