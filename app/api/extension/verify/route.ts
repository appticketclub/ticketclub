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
  const extensionType = request.nextUrl.searchParams.get("type") ?? "refresh_bot";

  if (!key || !email) return new NextResponse("INVALID", { headers: corsHeaders });

  const { data: license } = await supabase
    .from("extension_licenses")
    .select("user_id, is_active, plan")
    .eq("license_key", key)
    .single();

  if (!license || !license.is_active) return new NextResponse("INVALID", { headers: corsHeaders });

  const { data: profile } = await supabase
    .from("profiles")
    .select("email")
    .eq("id", license.user_id)
    .single();

  if (!profile || profile.email.toLowerCase() !== email.toLowerCase()) {
    return new NextResponse("EMAIL_MISMATCH", { headers: corsHeaders });
  }

  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("plan, status")
    .eq("user_id", license.user_id)
    .single();

  const plan = subscription?.plan ?? "free";

  if (extensionType === "discord_watcher" && plan !== "scale") {
    return new NextResponse("SCALE_REQUIRED", { headers: corsHeaders });
  }

  if (extensionType === "refresh_bot" && plan !== "pro" && plan !== "scale" && plan !== "pro_max" && subscription?.status !== "trialing") {
    return new NextResponse("PRO_REQUIRED", { headers: corsHeaders });
  }

  const licensePlan = license.plan ?? "single";

  if (licensePlan === "single") {
    const profileId = request.nextUrl.searchParams.get("profileId");
    const forceActivate = request.nextUrl.searchParams.get("forceActivate") === "true";

    if (profileId) {
      const { data: licenseData } = await supabase
        .from("extension_licenses")
        .select("active_profile_id")
        .eq("license_key", key)
        .single();

      if (!forceActivate && licenseData?.active_profile_id && licenseData.active_profile_id !== profileId) {
        return new NextResponse("PROFILE_LIMIT", { headers: corsHeaders });
      }

      await supabase
        .from("extension_licenses")
        .update({ active_profile_id: profileId, last_verified_at: new Date().toISOString() })
        .eq("license_key", key);
    }
  }

  const validText = `VALID:${(plan === "scale" || plan === "pro_max") ? "unlimited" : "single"}`;

  return new NextResponse(validText, {
    headers: {
      ...corsHeaders,
      "Content-Type": "text/plain"
    }
  });
}
