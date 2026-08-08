import { NextRequest, NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

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

  // Rate limit for free users on event lookup
  const sessionSupabase = await createClient();
  const { data: { user } } = await sessionSupabase.auth.getUser();

  if (user) {
    const supabaseService = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: sub } = await supabaseService
      .from("subscriptions").select("status").eq("user_id", user.id).single();
    const { data: profile } = await supabaseService
      .from("profiles").select("role").eq("id", user.id).single();

    const isPro = sub?.status === "active" || sub?.status === "trialing";
    const isAdmin = profile?.role === "admin";

    if (!isPro && !isAdmin) {
      // Check rolling 24h usage
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { data: usage } = await supabaseService
        .from("sales_tracker_usage")
        .select("searched_at")
        .eq("user_id", user.id)
        .gte("searched_at", since)
        .order("searched_at", { ascending: false })
        .limit(1);

      if (usage && usage.length >= 1) {
        const lastSearch = new Date(usage[0].searched_at);
        const nextSearch = new Date(lastSearch.getTime() + 24 * 60 * 60 * 1000);
        const nextSearchTime = nextSearch.toLocaleTimeString("cs-CZ", { hour: "2-digit", minute: "2-digit" });

        return NextResponse.json({
          error: `Denní limit vyčerpán. Další vyhledávání možné od ${nextSearchTime}.`,
          limitReached: true
        }, { status: 429 });
      }

      // Log usage with email
      await supabaseService.from("sales_tracker_usage").insert({
        user_id: user.id,
        date: new Date().toISOString().split("T")[0],
        searched_at: new Date().toISOString(),
        email: user.email,
      });
    }
  }

  let id = eventId.toString().trim();
  const urlMatch = id.match(/\/(\d{6,})/);
  if (urlMatch) id = urlMatch[1];

  try {
    // Auto-add event to TickSights tracking
    try {
      await fetch(`${BASE}/event`, {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ eventID: parseInt(id), marketplace: 1 }) // 1 = Viagogo
      });
    } catch {}

    // Then fetch event data as before
    const [eventRes, avgPriceRes, salesRes, devRes] = await Promise.all([
      fetch(`${BASE}/event/${id}`, { headers }),
      fetch(`${BASE}/event/${id}/avgprice`, { headers }),
      fetch(`${BASE}/event/${id}/sales?limit=50`, { headers }),
      fetch(`${BASE}/event/${id}/sales/development`, { headers }),
    ]);

    if (!eventRes.ok) {
      const err = await eventRes.json().catch(() => ({}));
      return NextResponse.json({ error: err.message ?? "Event nenájdený" }, { status: 404 });
    }

    const [event, avgPrice, salesData, devData] = await Promise.all([
      eventRes.json(),
      avgPriceRes.ok ? avgPriceRes.json() : [],
      salesRes.ok ? salesRes.json() : { sales: [] },
      devRes.ok ? devRes.json() : { points: [] },
    ]);

    return NextResponse.json({
      event,
      avgPrice,
      sales: salesData.sales ?? [],
      total_count: salesData.total_count ?? 0,
      development: devData.points ?? [],
    });
  } catch {
    return NextResponse.json({ error: "Chyba servera" }, { status: 500 });
  }
}
