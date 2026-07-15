import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey)
    return NextResponse.json(
      { message: "Server nie je správne nakonfigurovaný." },
      { status: 500 }
    );
  const { token } = await request.json();
  if (!token)
    return NextResponse.json(
      { message: "Chýbajúci token." },
      { status: 400 }
    );
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  const { data: tokenData, error: tokenError } = await supabase
    .from("admin_impersonation_tokens")
    .select("*")
    .eq("token_hash", tokenHash)
    .is("used_at", null)
    .gt("expires_at", new Date().toISOString())
    .single();
  if (tokenError || !tokenData)
    return NextResponse.json(
      { message: "Neplatný, expirovaný alebo už použitý token." },
      { status: 401 }
    );
  await supabase
    .from("admin_impersonation_tokens")
    .update({ used_at: new Date().toISOString() })
    .eq("id", tokenData.id);
  await supabase.from("admin_impersonation_logs").insert({
    admin_user_id: tokenData.admin_user_id,
    target_user_id: tokenData.target_user_id,
    token_id: tokenData.id,
    action: "used",
  });
  const { data: targetUser } = await supabase.auth.admin.getUserById(
    tokenData.target_user_id
  );
  const { data: linkData, error: linkError } =
    await supabase.auth.admin.generateLink({
      type: "magiclink",
      email: targetUser.user?.email || "",
    });
  if (linkError || !linkData)
    return NextResponse.json(
      { message: "Nepodarilo sa vygenerovať prístupový link." },
      { status: 500 }
    );
  return NextResponse.json({
    magic_link: linkData.properties.action_link,
    admin_id: tokenData.admin_user_id,
  });
}