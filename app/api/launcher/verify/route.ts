import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get("token");

    if (!token) {
      return new NextResponse("INVALID", {
        status: 200,
        headers: { "Content-Type": "text/plain" },
      });
    }

    // Use service role — no user session needed
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data, error } = await supabase
      .from("launcher_tokens")
      .select("id, is_active")
      .eq("token", token)
      .eq("is_active", true)
      .single();

    console.log("Verify result:", data, error);

    if (!data || error) {
      return new NextResponse("INVALID", {
        status: 200,
        headers: { "Content-Type": "text/plain" },
      });
    }

    // Update last used
    await supabase
      .from("launcher_tokens")
      .update({ last_used_at: new Date().toISOString() })
      .eq("id", data.id);

    return new NextResponse("VALID", {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });

  } catch (e: any) {
    console.error("Verify error:", e);
    return new NextResponse("INVALID", {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  }
}
