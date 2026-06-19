import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const { token } = await request.json();
  if (!token) return NextResponse.json({ success: false, error: "No token" });

  const res = await fetch("https://www.google.com/recaptcha/api/siteverify", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `secret=${process.env.RECAPTCHA_SECRET_KEY}&response=${token}`,
  });

  const data = await res.json();
  if (!data.success || data.score < 0.5) {
    return NextResponse.json({ success: false, error: "reCAPTCHA failed", score: data.score });
  }

  return NextResponse.json({ success: true, score: data.score });
}
