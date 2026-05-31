import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import createIntlMiddleware from "next-intl/middleware";

const intlMiddleware = createIntlMiddleware({
  locales: ["cs", "en"],
  defaultLocale: "cs",
});

export async function middleware(request: NextRequest) {
  const response = intlMiddleware(request);
  const supabase = createMiddlewareClient({ req: request, res: response });
  await supabase.auth.getSession();
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
