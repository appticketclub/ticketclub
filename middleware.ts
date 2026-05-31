import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import createIntlMiddleware from "next-intl/middleware";
import { updateSession } from "@/lib/supabase/middleware";

const intlMiddleware = createIntlMiddleware({
  locales: ["cs", "en"],
  defaultLocale: "cs",
});

export async function middleware(request: NextRequest) {
  let response = intlMiddleware(request);
  response = await updateSession(request);
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
