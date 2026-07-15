import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

const intlMiddleware = createMiddleware(routing);

const protectedRoutes = ["/dashboard", "/nakupy", "/dostupne-sluzby", "/ucet", "/chrome-launcher"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Bypass everything for auth callback, confirm, or admin impersonate
  if (pathname === "/auth/callback" || 
      pathname.startsWith("/auth/callback") || 
      pathname === "/auth/confirm" || 
      pathname.startsWith("/auth/confirm") ||
      pathname.startsWith("/admin/impersonate")) {
    return NextResponse.next();
  }

  // Bypass API routes
  if (pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  // Allow access to protected routes if magic link token is present
  const searchParams = request.nextUrl.searchParams;
  const hasMagicLinkToken = searchParams.get("token_hash") && searchParams.get("type");

  const isProtected = protectedRoutes.some(route => pathname.startsWith(route));
 
  if (isProtected && !hasMagicLinkToken) {
    const allCookies = request.cookies.getAll();
    console.log("Cookies:", allCookies.map(c => c.name));
    // Supabase stores auth in these cookies
    const token =
      request.cookies.get("sb-access-token")?.value ||
      request.cookies.get(`sb-eoeiuohwxulkgppjaogk-auth-token`)?.value ||
      request.cookies.get(`sb-eoeiuohwxulkgppjaogk-auth-token.0`)?.value ||
      request.cookies.get(`sb-eoeiuohwxulkgppjaogk-auth-token.1`)?.value;

    if (!token) {
      const loginUrl = new URL("/prihlaseni", request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: [
    "/((?!auth/callback|_next/static|_next/image|favicon.ico|.*\\..*).*)",
  ],
};
