import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const ADMIN_SECRET = process.env.ADMIN_SECRET_KEY!;

export async function POST(request: NextRequest) {
  const { userId, adminSecret } = await request.json();

  if (adminSecret !== ADMIN_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  // Get user by email
  const { data: { users }, error: userError } = await supabase.auth.admin.listUsers();
  const user = users?.find(u => u.email === userId);
  
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  // Call GoTrue API directly to create a session for the user
  const response = await fetch(`${supabaseUrl}/auth/v1/admin/users/${user.id}/tokens`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${serviceRoleKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({}),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: "Failed to create session" }));
    return NextResponse.json({ error: errorData.error ?? "No session" }, { status: 400 });
  }

  const data = await response.json();

  // Return session tokens
  return NextResponse.json({
    access_token: data.access_token,
    refresh_token: data.refresh_token,
  });
}
