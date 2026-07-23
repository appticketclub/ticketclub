import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { fullSyncToSheet } from "@/lib/google-sheets";

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Get all users with google_sheet_id
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, google_sheet_id")
    .not("google_sheet_id", "is", null);

  if (!profiles?.length) return NextResponse.json({ ok: true, synced: 0 });

  let synced = 0;
  for (const profile of profiles) {
    try {
      const [{ data: purchases }, { data: sales }] = await Promise.all([
        supabase.from("purchases").select("*").eq("user_id", profile.id),
        supabase.from("sales").select("*").eq("user_id", profile.id),
      ]);
      await fullSyncToSheet(profile.google_sheet_id!, purchases ?? [], sales ?? []);
      synced++;
    } catch (e) {
      console.error(`[cron] Failed to sync for user ${profile.id}:`, e);
    }
  }

  return NextResponse.json({ ok: true, synced });
}
