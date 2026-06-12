import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(request: NextRequest) {
  try {
    const key = request.nextUrl.searchParams.get("key");

    if (!key) {
      return new NextResponse("INVALID", {
        status: 200,
        headers: { "Content-Type": "text/plain" },
      });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data } = await supabase
      .from("extension_licenses")
      .select("id, is_active")
      .eq("license_key", key)
      .eq("is_active", true)
      .single();

    if (!data) {
      return new NextResponse("INVALID", {
        status: 200,
        headers: { "Content-Type": "text/plain" },
      });
    }

    await supabase
      .from("extension_licenses")
      .update({ last_verified_at: new Date().toISOString() })
      .eq("id", data.id);

    return new NextResponse("VALID", {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  } catch {
    return new NextResponse("INVALID", {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  }
}
