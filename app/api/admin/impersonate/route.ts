import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const ADMIN_SECRET = process.env.ADMIN_SECRET_KEY!;

export async function POST(request: NextRequest) {
  const { userId, adminSecret, action, tempPassword } = await request.json();

  if (adminSecret !== ADMIN_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Get user by email
  const { data: { users } } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  const user = users?.find(u => u.email === userId);
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  if (action === 'set_password') {
    // Temporarily set password
    const { error } = await supabase.auth.admin.updateUserById(user.id, {
      password: tempPassword
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true, message: "Password set temporarily" });
  }

  if (action === 'restore_password') {
    // Remove password (set random one)
    const randomPwd = Math.random().toString(36) + Math.random().toString(36);
    const { error } = await supabase.auth.admin.updateUserById(user.id, {
      password: randomPwd
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true, message: "Password restored" });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}