import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { randomBytes } from "crypto";

export async function POST(request: NextRequest) {
  const sessionSupabase = await createClient();
  const {
    data: { user },
  } = await sessionSupabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: existing } = await supabase
    .from("extension_licenses")
    .select("license_key, is_active")
    .eq("user_id", user.id)
    .single();

  if (existing) {
    return NextResponse.json({
      key: existing.license_key,
      is_active: existing.is_active,
    });
  }

  const part = () => randomBytes(2).toString("hex").toUpperCase();
  const license_key = `TC-${part()}-${part()}-${part()}`;

  const { error } = await supabase.from("extension_licenses").insert({
    user_id: user.id,
    license_key,
    is_active: true,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ key: license_key, is_active: true });
}
