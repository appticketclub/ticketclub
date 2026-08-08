import { NextRequest, NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

const EVENTORY_KEY = process.env.EVENTORY_API_KEY!;
const DATA_BASE = "https://api.eventory.ai/eventory/data";

export async function POST(request: NextRequest) {
  const { url } = await request.json();
  if (!url) return NextResponse.json({ error: "URL je povinná" }, { status: 400 });

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
      return NextResponse.json({
        error: "Sales Tracker od Eventory je dostupný pouze v PRO plánu.",
        proRequired: true
      }, { status: 403 });
    }
  }

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
