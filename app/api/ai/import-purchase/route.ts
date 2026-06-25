import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { imageBase64, mimeType } = await request.json();

    const response = await fetch("https://api.novita.ai/openai/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.NOVITA_API_KEY}`,
      },
      body: JSON.stringify({
        model: "qwen/qwen3.5-27b",
        max_tokens: 500,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: { url: `data:${mimeType};base64,${imageBase64}` },
              },
              {
                type: "text",
                text: `You are a ticket purchase data extractor. Analyze this image which may be a screenshot of a ticket confirmation email or webpage from Ticketmaster, Viagogo, or similar platforms.

Extract the following information and return ONLY a valid JSON object with no markdown, no explanation:
{
  "event_name": "artist/band name and tour if present",
  "venue": "venue name",
  "city": "city name only",
  "event_date": "YYYY-MM-DD format — this is the CONCERT DATE (e.g. Fri 08 May 2026 = 2026-05-08)",
  "purchase_date": null,
  "quantity": total number of tickets as integer,
  "buy_price": total order amount as number (convert to EUR if needed),
  "original_price": original price before conversion,
  "original_currency": "GBP or USD or CZK or EUR",
  "currency": "EUR",
  "ticket_type": "Mobile Transfer or E-Ticket or Paper or null",
  "sector": "section/standing/seat info if available",
  "exchange": "Ticketmaster or Viagogo etc"
}

CRITICAL RULES:
- event_date = the date of the CONCERT/EVENT (e.g. "Fri 08 May 2026" = "2026-05-08"). NOT today's date.
- purchase_date = always return null (app will use today's date)
- For currency conversion: if price is in GBP multiply by 1.18 to get EUR. If USD multiply by 0.92. If CZK divide by 25. Always return final EUR amount in buy_price.
- original_price = the original amount before conversion
- original_currency = the original currency symbol found (GBP, USD, CZK, EUR)
- quantity: count total tickets
- Return ONLY the JSON, nothing else`,
              },
            ],
          },
        ],
      }),
    });

    console.log("Novita status:", response.status);
    const raw = await response.text();
    console.log("Novita response:", raw.substring(0, 500));

    if (!response.ok) {
      return NextResponse.json({ success: false, error: raw }, { status: 500 });
    }

    const data = JSON.parse(raw);
    let content = data.choices?.[0]?.message?.content ?? "{}";

    // Remove thinking tags if present
    content = content.replace(/<think>[\s\S]*?<\/think>/g, "").trim();
    // Remove markdown
    content = content.replace(/```json|```/g, "").trim();

    const parsed = JSON.parse(content);
    return NextResponse.json({ success: true, data: parsed });

  } catch (error: any) {
    console.error("AI import error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
