import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Check cache
  const { data: cached } = await supabase
    .from("ai_cache")
    .select("data, created_at")
    .eq("user_id", user.id)
    .eq("cache_key", "ai_statistics")
    .single();

  if (cached) {
    const age = Date.now() - new Date(cached.created_at).getTime();
    if (age < 24 * 60 * 60 * 1000) {
      return NextResponse.json({ success: true, analysis: cached.data, cached: true, cached_at: cached.created_at });
    }
  }

  return NextResponse.json({ success: true, analysis: null, cached: false });
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Load user data
    const [{ data: purchases }, { data: sales }, { data: profile }] = await Promise.all([
      supabase.from("purchases").select("*").eq("user_id", user.id),
      supabase.from("sales").select("*").eq("user_id", user.id),
      supabase.from("profiles").select("capital, capital_initial, capital_currency").eq("id", user.id).single(),
    ]);

    // Build stats summary for AI
    const totalPurchases = purchases?.length ?? 0;
    const totalSales = sales?.length ?? 0;
    const totalInvested = purchases?.reduce((s, p) => s + (p.buy_price * p.quantity), 0) ?? 0;
    const totalRevenue = sales?.reduce((s, s2) => s + (s2.sell_price * s2.quantity_sold), 0) ?? 0;
    const totalFees = sales?.reduce((s, s2) => s + (s2.fees ?? 0), 0) ?? 0;
    const totalProfit = totalRevenue - totalFees - purchases?.filter(p => p.status === "sold" || p.status === "partial").reduce((s, p) => s + (p.buy_price * p.quantity), 0)!;

    // Per-purchase analysis
    const purchaseDetails = purchases?.map(p => {
      const relatedSales = sales?.filter(s => s.purchase_id === p.id) ?? [];
      const revenue = relatedSales.reduce((s, s2) => s + (s2.sell_price * s2.quantity_sold), 0);
      const fees = relatedSales.reduce((s, s2) => s + (s2.fees ?? 0), 0);
      const cost = p.buy_price * p.quantity;
      const profit = revenue - fees - cost;
      const roi = cost > 0 ? (profit / cost) * 100 : 0;
      const buyDate = p.event_date;
      const sellDate = relatedSales[0]?.sold_at;
      const daysHeld = buyDate && sellDate ? Math.round((new Date(sellDate).getTime() - new Date(buyDate).getTime()) / (1000 * 60 * 60 * 24)) : null;
      return {
        event: p.event_name,
        status: p.status,
        quantity: p.quantity,
        buy_price: p.buy_price,
        currency: p.currency,
        revenue,
        profit: Math.round(profit * 100) / 100,
        roi: Math.round(roi * 10) / 10,
        days_held: daysHeld,
        platform: relatedSales[0]?.platform ?? null,
      };
    });

    const prompt = `You are a professional ticket reselling analyst. Analyze this reseller's performance data and provide actionable insights in Czech language.

RESELLER STATS:
- Total purchases: ${totalPurchases}
- Total sales: ${totalSales}
- Total invested: ${Math.round(totalInvested)} ${profile?.capital_currency}
- Total revenue: ${Math.round(totalRevenue)} ${profile?.capital_currency}
- Total profit: ${Math.round(totalProfit)} ${profile?.capital_currency}
- Starting capital: ${profile?.capital_initial} ${profile?.capital_currency}
- Current capital: ${profile?.capital} ${profile?.capital_currency}

INDIVIDUAL PURCHASES:
${JSON.stringify(purchaseDetails, null, 2)}

Provide analysis in this EXACT JSON format (no markdown, no thinking tags):
{
  "overall_score": 7.5,
  "overall_verdict": "Krátké shrnutí výkonu (2-3 věty)",
  "best_flip": {"event": "název", "profit": 500, "roi": 85.5, "reason": "proč to byl dobrý flip"},
  "worst_flip": {"event": "název", "profit": -200, "roi": -30.0, "reason": "proč to byl špatný flip"},
  "insights": [
    {"type": "positive", "title": "Nadpis", "description": "Popis pozitivního poznatku"},
    {"type": "negative", "title": "Nadpis", "description": "Popis negativního poznatku"},
    {"type": "tip", "title": "Nadpis", "description": "Doporučení pro zlepšení"}
  ],
  "platform_analysis": "Analýza výkonu podle platforem",
  "timing_analysis": "Analýza načasování nákupů a prodejů",
  "recommendation": "Hlavní doporučení pro příštích 30 dní"
}`;

    const response = await fetch("https://api.novita.ai/openai/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.NOVITA_API_KEY}`,
      },
      body: JSON.stringify({
        model: "qwen/qwen3.5-27b",
        max_tokens: 2000,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    const raw = await response.text();
    console.log("Novita raw:", raw.substring(0, 200));

    if (!response.ok) {
      return NextResponse.json({ success: false, error: `Novita error: ${raw.substring(0, 200)}` }, { status: 500 });
    }

    let data: any;
    try {
      data = JSON.parse(raw);
    } catch {
      return NextResponse.json({ success: false, error: "Novita returned invalid response" }, { status: 500 });
    }

    let content = data.choices?.[0]?.message?.content ?? "";
    if (!content) {
      return NextResponse.json({ success: false, error: "AI returned empty response" }, { status: 500 });
    }

    // Clean response
    content = content.replace(/<think>[\s\S]*?<\/think>/g, "").trim();
    content = content.replace(/```json|```/g, "").trim();

    // Extract JSON object if wrapped in text
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ success: false, error: "AI response did not contain valid JSON" }, { status: 500 });
    }

    let parsed: any;
    try {
      parsed = JSON.parse(jsonMatch[0]);
    } catch {
      return NextResponse.json({ success: false, error: "Failed to parse AI JSON response" }, { status: 500 });
    }

    // Save to cache
    await supabase.from("ai_cache").upsert({
      user_id: user.id,
      cache_key: "ai_statistics",
      data: parsed,
      created_at: new Date().toISOString(),
    }, { onConflict: "user_id,cache_key" });

    return NextResponse.json({ success: true, analysis: parsed, cached: false });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
