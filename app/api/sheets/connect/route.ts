import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { getSheetsClient } from "@/lib/google-sheets";

export async function POST(request: NextRequest) {
  const sessionSupabase = await createClient();
  const { data: { user } } = await sessionSupabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { sheetUrl } = await request.json();
  
  // Extract sheet ID from URL
  const match = sheetUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (!match) return NextResponse.json({ error: "Neplatná URL sheetu" }, { status: 400 });
  
  const sheetId = match[1];

  // Verify access
  try {
    const sheets = getSheetsClient();
    await sheets.spreadsheets.get({ spreadsheetId: sheetId });
  } catch {
    return NextResponse.json({ error: "Nemáme prístup k sheetu. Zdieľajte ho s: ticketclub-zaloha@ticketclub-sheets.iam.gserviceaccount.com" }, { status: 400 });
  }

  const supabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  await supabase.from("profiles").update({ google_sheet_id: sheetId }).eq("id", user.id);

  return NextResponse.json({ ok: true, sheetId });
}
