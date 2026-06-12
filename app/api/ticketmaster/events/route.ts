import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const { keyword, city, countryCode, classificationName, dateFrom, dateTo, size } = await request.json();

    const tmUrl = new URL("https://app.ticketmaster.com/discovery/v2/events.json");
    tmUrl.searchParams.set("apikey", process.env.TICKETMASTER_API_KEY!);
    tmUrl.searchParams.set("size", String(size ?? 20));
    tmUrl.searchParams.set("sort", "date,asc");
    if (keyword) tmUrl.searchParams.set("keyword", keyword);
    if (city) tmUrl.searchParams.set("city", city);
    if (countryCode) tmUrl.searchParams.set("countryCode", countryCode);
    else tmUrl.searchParams.set("countryCode", "CZ");
    if (classificationName && classificationName !== "all") tmUrl.searchParams.set("classificationName", classificationName);
    if (dateFrom) tmUrl.searchParams.set("startDateTime", dateFrom + "T00:00:00Z");
    if (dateTo) tmUrl.searchParams.set("endDateTime", dateTo + "T23:59:59Z");
    else tmUrl.searchParams.set("startDateTime", new Date().toISOString().split(".")[0] + "Z");

    const tmRes = await fetch(tmUrl.toString());
    const tmData = await tmRes.json();

    const events = tmData._embedded?.events?.map((e: any) => ({
      id: e.id,
      name: e.name,
      date: e.dates?.start?.localDate,
      time: e.dates?.start?.localTime,
      venue: e._embedded?.venues?.[0]?.name ?? null,
      city: e._embedded?.venues?.[0]?.city?.name ?? null,
      country: e._embedded?.venues?.[0]?.country?.name ?? null,
      image: e.images?.find((img: any) => img.ratio === "16_9" && img.width > 500)?.url ?? e.images?.[0]?.url ?? null,
      url: e.url,
      priceMin: e.priceRanges?.[0]?.min ?? null,
      priceMax: e.priceRanges?.[0]?.max ?? null,
      currency: e.priceRanges?.[0]?.currency ?? "EUR",
      genre: e.classifications?.[0]?.genre?.name ?? null,
      segment: e.classifications?.[0]?.segment?.name ?? null,
      artist: e._embedded?.attractions?.[0]?.name ?? null,
      totalResults: tmData.page?.totalElements ?? 0,
    })) ?? [];

    // Get short AI description for each event
    if (events.length > 0) {
      const aiPrompt = `For each of these events, write a very short 1-sentence reselling tip in Czech (max 12 words). Return ONLY a JSON array of strings in the same order:
${events.map((e: any, i: number) => `${i}. ${e.name} | ${e.date} | ${e.venue}, ${e.city}`).join("\n")}`;

      try {
        // ... existing AI call ...
        const aiRes = await fetch("https://api.novita.ai/openai/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${process.env.NOVITA_API_KEY}`,
          },
          body: JSON.stringify({
            model: "qwen/qwen3.5-27b",
            max_tokens: 800,
            messages: [{ role: "user", content: aiPrompt }],
          }),
        });
        const aiRaw = await aiRes.text();
        if (!aiRes.ok) throw new Error(aiRaw);
        const aiData = JSON.parse(aiRaw);
        let aiContent = aiData.choices?.[0]?.message?.content ?? "[]";
        aiContent = aiContent.replace(/<think>[\s\S]*?<\/think>/g, "").trim();
        aiContent = aiContent.replace(/```json|```/g, "").trim();
        const arrMatch = aiContent.match(/\[[\s\S]*\]/);
        if (arrMatch) {
          const tips = JSON.parse(arrMatch[0]);
          events.forEach((e: any, i: number) => { e.ai_tip = tips[i] ?? null; });
        }
      } catch (e) {
        console.error("AI tips failed:", e);
        events.forEach((e: any) => { e.ai_tip = null; });
      }
    }

    return NextResponse.json({ success: true, events, total: tmData.page?.totalElements ?? 0 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
