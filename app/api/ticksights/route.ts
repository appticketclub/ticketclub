import { NextRequest, NextResponse } from "next/server";

const TICKSIGHTS_KEY = process.env.TICKSIGHTS_API_KEY!;
const BASE = "https://api.ticksights.com";

const headers = {
  "Authorization": `Bearer ${TICKSIGHTS_KEY}`,
  "Accept": "application/json",
};

export async function POST(request: NextRequest) {
  const { eventId } = await request.json();
  if (!eventId) return NextResponse.json({ error: "Event ID je povinný" }, { status: 400 });

  const id = eventId.toString().trim();

  try {
    const [eventRes, avgPriceRes, salesRes] = await Promise.all([
      fetch(`${BASE}/event/${id}`, { headers }),
      fetch(`${BASE}/event/${id}/avgprice`, { headers }),
      fetch(`${BASE}/event/${id}/sales?limit=50`, { headers }),
    ]);

    if (!eventRes.ok) {
      const err = await eventRes.json().catch(() => ({}));
      return NextResponse.json({ error: err.message ?? "Event nenájdený" }, { status: 404 });
    }

    const [event, avgPrice, salesData] = await Promise.all([
      eventRes.json(),
      avgPriceRes.ok ? avgPriceRes.json() : [],
      salesRes.ok ? salesRes.json() : { sales: [] },
    ]);

    return NextResponse.json({ event, avgPrice, sales: salesData.sales ?? [] });
  } catch {
    return NextResponse.json({ error: "Chyba servera" }, { status: 500 });
  }
}
