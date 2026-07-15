import { NextRequest, NextResponse } from "next/server";

const EVENTORY_KEY = process.env.EVENTORY_API_KEY!;
const DATA_BASE = "https://api.eventory.ai/eventory/data";

export async function POST(request: NextRequest) {
  const { url } = await request.json();
  if (!url) return NextResponse.json({ error: "URL je povinná" }, { status: 400 });

  const match = url.match(/E-(\d+)/i) || url.match(/\/(\d+)(?:\?|$)/);
  if (!match) return NextResponse.json({ error: "Nepodarilo sa nájsť event ID z URL" }, { status: 400 });

  const eventId = `E-${match[1]}`;

  try {
    const [marketRes, salesRes] = await Promise.all([
      fetch(`${DATA_BASE}/viagogo/${eventId}`, {
        headers: { apikey: EVENTORY_KEY }
      }),
      fetch(`${DATA_BASE}/sales/viagogo/${eventId}`, {
        headers: { apikey: EVENTORY_KEY }
      }),
    ]);

    const marketData = await marketRes.json();
    const salesData = salesRes.ok ? await salesRes.json() : { sales: [] };

    if (!marketRes.ok) return NextResponse.json({ error: marketData.message ?? "Event nenájdený" }, { status: 404 });
    return NextResponse.json({ marketData, sales: salesData.sales ?? [] });
  } catch {
    return NextResponse.json({ error: "Chyba servera" }, { status: 500 });
  }
}
