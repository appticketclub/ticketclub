import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

const intlMiddleware = createMiddleware(routing);

const protectedRoutes = ["/dashboard", "/nakupy", "/prodeje", "/statistiky", "/nastaveni"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtected = protectedRoutes.some((route) =>
    pathname.includes(route)
  );

  if (isProtected) {
    const token =
      request.cookies.get("sb-access-token") ||
      request.cookies.get("sb-eoeiuohwxulkgppjaogk-auth-token");

    if (!token) {
      const loginUrl = new URL("/prihlaseni", request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)",
  ],
};
