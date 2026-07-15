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
    const res = await fetch(`${DATA_BASE}/viagogo/${eventId}`, {
      headers: { apikey: EVENTORY_KEY }
    });
    const marketData = await res.json();
    if (!res.ok) return NextResponse.json({ error: marketData.message ?? "Event nenájdený" }, { status: 404 });
    return NextResponse.json({ marketData });
  } catch {
    return NextResponse.json({ error: "Chyba servera" }, { status: 500 });
  }
}
