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
                text: `You are a ticket purchase data extractor. Analyze this image which may be a screenshot of a ticket confirmation email or webpage from Ticketmaster, Viagogo, StubHub or similar platforms. 

Extract the following information and return ONLY a valid JSON object with no markdown, no explanation, no thinking tags: 
{ 
  "event_name": "full event name including tour name if present", 
  "artist": "artist or band name only", 
  "venue": "venue name", 
  "city": "city name", 
  "event_date": "YYYY-MM-DD format if found, otherwise null", 
  "quantity": total number of tickets as integer, 
  "buy_price": total price for all tickets (quantity × price per ticket) as number without currency symbol, 
  "total_price": total order amount as number without currency symbol, 
  "currency": "EUR or CZK or USD or GBP", 
  "platform": "Ticketmaster or Viagogo or StubHub etc", 
  "ticket_type": "Mobile Transfer or E-Ticket or Paper or null", 
  "sector": "section/sector/seat info if available or null", 
  "exchange": "platform where purchased or null" 
} 

IMPORTANT rules: 
- For quantity: count total number of tickets (e.g. "6 x tickets" = 6) 
- For buy_price: always return TOTAL price for all tickets (quantity × price per ticket) - never return price per single ticket (e.g. 6 tickets × 76.30€ = 457.80€ total → return buy_price: 457.80)
- For event_date: parse German dates too (e.g. "Donnerstag, 07. Mai 2026" = "2026-05-07") 
- For sector: combine section and seat info (e.g. "Innenraum Stehplatz") 
- If currency shows EUR/€ use "EUR" 
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
