import { NextRequest, NextResponse } from "next/server";

const TICKSIGHTS_KEY = process.env.TICKSIGHTS_API_KEY!;
const BASE = "https://api.ticksights.com";
const headers = {
  "Authorization": `Bearer ${TICKSIGHTS_KEY}`,
  "Accept": "application/json",
};

export async function POST(request: NextRequest) {
  const { eventId, search } = await request.json();

  // Search mode
  if (search) {
    const res = await fetch(`${BASE}/events?limit=20&sort=date_asc`, { headers });
    const data = await res.json();
    // Filter by title/performer
    const filtered = (data.events ?? []).filter((e: any) =>
      e.title?.toLowerCase().includes(search.toLowerCase()) ||
      e.Performer?.toLowerCase().includes(search.toLowerCase())
    );
    return NextResponse.json({ events: filtered });
  }

  if (!eventId) return NextResponse.json({ error: "Event ID je povinný" }, { status: 400 });

  let id = eventId.toString().trim();
  const urlMatch = id.match(/\/(\d{6,})/);
  if (urlMatch) id = urlMatch[1];

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

    return NextResponse.json({ event, avgPrice, sales: salesData.sales ?? [], total_count: salesData.total_count ?? 0 });
  } catch {
    return NextResponse.json({ error: "Chyba servera" }, { status: 500 });
  }
}
