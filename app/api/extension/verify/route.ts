import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Content-Type": "text/plain"
};

export const dynamic = "force-dynamic";

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: corsHeaders });
}

export async function GET(request: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const key = request.nextUrl.searchParams.get("key");
  const email = request.nextUrl.searchParams.get("email");

  console.log("[verify] key:", key, "email:", email);

  if (!key || !email) return new NextResponse("INVALID", { status: 200, headers: corsHeaders });

  const { data: license, error: licenseError } = await supabase
    .from("extension_licenses")
    .select("user_id, is_active, plan, active_profile_id")
    .eq("license_key", key)
    .single();

  console.log("[verify] license:", license, "error:", licenseError);

  if (!license || !license.is_active) return new NextResponse("INVALID", { status: 200, headers: corsHeaders });

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("email")
    .eq("id", license.user_id)
    .single();

  console.log("[verify] profile:", profile, "error:", profileError);

  if (!profile || profile.email.toLowerCase() !== email.toLowerCase()) {
    return new NextResponse("EMAIL_MISMATCH", { status: 200, headers: corsHeaders });
  }

  // After confirming license is valid and email matches, check plan limits:
  const plan = license.plan ?? "single";

  if (plan === "single") {
    // Get the stored chrome profile fingerprint from request
    const profileId = request.nextUrl.searchParams.get("profileId");

    if (profileId) {
      if (license.active_profile_id && license.active_profile_id !== profileId) {
        // Different profile is trying to use this license
        console.log("[verify] PROFILE_LIMIT: different profile", { active: license.active_profile_id, requested: profileId });
        return new NextResponse("PROFILE_LIMIT", { status: 200, headers: corsHeaders });
      }

      // Save this profile as the active one
      await supabase
        .from("extension_licenses")
        .update({ active_profile_id: profileId })
        .eq("license_key", key);
    }
  }

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
      return new NextResponse("RATE_LIMIT", { status: 200, headers: corsHeaders });
    }
    await supabase.from("extension_licenses").update({
      verify_count_hour: (licenseData?.verify_count_hour ?? 0) + 1,
      last_verified_at: now.toISOString(),
    }).eq("license_key", key);
  }

  console.log("[verify] returning VALID:", plan);
  return new NextResponse(`VALID:${plan}`, { status: 200, headers: corsHeaders });
}
