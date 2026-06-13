import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const key = request.nextUrl.searchParams.get("key");
  const email = request.nextUrl.searchParams.get("email");

  if (!key || !email) return new NextResponse("INVALID", { status: 200, headers: { "Content-Type": "text/plain" } });

  // Find license
  const { data: license } = await supabase
    .from("extension_licenses")
    .select("user_id, is_active")
    .eq("license_key", key)
    .single();

  if (!license || !license.is_active) return new NextResponse("INVALID", { status: 200, headers: { "Content-Type": "text/plain" } });

  // Verify email matches
  const { data: profile } = await supabase
    .from("profiles")
    .select("email")
    .eq("id", license.user_id)
    .single();

  if (!profile || profile.email.toLowerCase() !== email.toLowerCase()) {
    return new NextResponse("EMAIL_MISMATCH", { status: 200, headers: { "Content-Type": "text/plain" } });
  }

  // Rate limiting
  const { data: licenseData } = await supabase
    .from("extension_licenses")
    .select("verify_count_hour, verify_hour_start")
    .eq("license_key", key)
    .single();

  const now = new Date();
  const hourStart = licenseData?.verify_hour_start ? new Date(licenseData.verify_hour_start) : null;
  const isNewHour = !hourStart || (now.getTime() - hourStart.getTime()) > 3600000;

  if (isNewHour) {
    await supabase.from("extension_licenses").update({
      verify_count_hour: 1,
      verify_hour_start: now.toISOString(),
      last_verified_at: now.toISOString(),
    }).eq("license_key", key);
  } else {
    if ((licenseData?.verify_count_hour ?? 0) >= 200) {
      return new NextResponse("RATE_LIMIT", { status: 200, headers: { "Content-Type": "text/plain" } });
    }
    await supabase.from("extension_licenses").update({
      verify_count_hour: (licenseData?.verify_count_hour ?? 0) + 1,
      last_verified_at: now.toISOString(),
    }).eq("license_key", key);
  }

  return new NextResponse("VALID", { status: 200, headers: { "Content-Type": "text/plain" } });
}
