import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { fullSyncToSheet } from "@/lib/google-sheets";

export async function POST(request: NextRequest) {
  const sessionSupabase = await createClient();
  const { data: { user } } = await sessionSupabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Get sheet ID from profiles
  const { data: profile } = await supabase
    .from("profiles")
    .select("google_sheet_id")
    .eq("id", user.id)
    .single();

  if (!profile?.google_sheet_id) {
    return NextResponse.json({ error: "Google Sheet nie je prepojený" }, { status: 400 });
  }

  const [{ data: purchases }, { data: sales }] = await Promise.all([
    supabase.from("purchases").select("*").eq("user_id", user.id),
    supabase.from("sales").select("*").eq("user_id", user.id),
  ]);

  await fullSyncToSheet(profile.google_sheet_id, purchases ?? [], sales ?? []);

  return NextResponse.json({ ok: true, synced: purchases?.length ?? 0 });
}
