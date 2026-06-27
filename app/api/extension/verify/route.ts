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

  console.log("[verify] START key:", key, "email:", email);

  if (!key || !email) {
    console.log("[verify] INVALID - missing key or email");
    return new NextResponse("INVALID", { status: 200, headers: corsHeaders });
  }

  const { data: license, error: licenseError } = await supabase
    .from("extension_licenses")
    .select("user_id, is_active, plan, active_profile_id")
    .eq("license_key", key)
    .single();

  console.log("[verify] license:", JSON.stringify(license), "error:", JSON.stringify(licenseError));

  if (!license || !license.is_active) {
    console.log("[verify] INVALID - no license or not active");
    return new NextResponse("INVALID", { status: 200, headers: corsHeaders });
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("email")
    .eq("id", license.user_id)
    .single();

  console.log("[verify] profile:", JSON.stringify(profile), "error:", JSON.stringify(profileError));

  if (!profile || profile.email.toLowerCase() !== email.toLowerCase()) {
    console.log("[verify] INVALID - email mismatch, db:", profile?.email, "input:", email);
    return new NextResponse("EMAIL_MISMATCH", { status: 200, headers: corsHeaders });
  }

  // After confirming license is valid and email matches, check plan limits:
  const plan = license.plan ?? "single";

  if (plan === "single") {
    // Get the stored chrome profile fingerprint from request
    const profileId = request.nextUrl.searchParams.get("profileId");
    console.log("[verify] checking profile limit, profileId:", profileId);

    if (profileId) {
      if (license.active_profile_id && license.active_profile_id !== profileId) {
        // Different profile is trying to use this license
        console.log("[verify] PROFILE_LIMIT: different profile", { active: license.active_profile_id, requested: profileId });
        return new NextResponse("PROFILE_LIMIT", { status: 200, headers: corsHeaders });
      }

      // Save this profile as the active one
      console.log("[verify] setting active_profile_id to:", profileId);
      await supabase
        .from("extension_licenses")
        .update({ active_profile_id: profileId })
        .eq("license_key", key);
    }
  }

  console.log("[verify] email OK, checking rate limit...");

  const { data: licenseData } = await supabase
    .from("extension_licenses")
    .select("verify_count_hour, verify_hour_start")
    .eq("license_key", key)
    .single();

  console.log("[verify] licenseData:", JSON.stringify(licenseData));

  const hourlyLimit = plan === "single" ? 20 : 200;
  const now = new Date();
  const hourStart = licenseData?.verify_hour_start ? new Date(licenseData.verify_hour_start) : null;
  const isNewHour = !hourStart || (now.getTime() - hourStart.getTime()) > 3600000;

  if (!isNewHour && (licenseData?.verify_count_hour ?? 0) >= hourlyLimit) {
    console.log("[verify] RATE_LIMIT", { current: licenseData?.verify_count_hour, limit: hourlyLimit, plan });
    return new NextResponse("RATE_LIMIT", { status: 200, headers: corsHeaders });
  }

  if (isNewHour) {
    console.log("[verify] new hour, resetting count to 1");
    await supabase.from("extension_licenses").update({
      verify_count_hour: 1,
      verify_hour_start: now.toISOString(),
      last_verified_at: now.toISOString(),
    }).eq("license_key", key);
  } else {
    console.log("[verify] incrementing count to", (licenseData?.verify_count_hour ?? 0) + 1);
    await supabase.from("extension_licenses").update({
      verify_count_hour: (licenseData?.verify_count_hour ?? 0) + 1,
      last_verified_at: now.toISOString(),
    }).eq("license_key", key);
  }

  console.log("[verify] returning VALID:", plan);
  return new NextResponse(`VALID:${plan}`, { status: 200, headers: corsHeaders });
}
