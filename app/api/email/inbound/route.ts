import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const recipient = formData.get("recipient")?.toString() ?? "";
    const sender = formData.get("sender")?.toString() ?? "";
    const subject = formData.get("subject")?.toString() ?? "";
    const bodyPlain = formData.get("body-plain")?.toString() ?? "";
    const bodyHtml = formData.get("body-html")?.toString() ?? "";

    console.log("[email/inbound] From:", sender, "To:", recipient, "Subject:", subject);

    const recipientLocal = recipient.split("@")[0];

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
          content: `Parse this Ticketmaster confirmation email and extract purchase data. Return ONLY valid JSON, no markdown, no explanation.

Email subject: ${subject}
Email content: ${content.substring(0, 3000)}

Return this exact JSON:
{
  "event_name": "string or null",
  "event_date": "YYYY-MM-DD or null",
  "venue": "string or null",
  "city": "string or null",
  "quantity": number or null,
  "buy_price": number or null,
  "currency": "EUR/GBP/CZK/etc or null",
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
