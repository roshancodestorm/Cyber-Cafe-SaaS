import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const token = request.cookies.get("next-auth.session-token")?.value
    || request.cookies.get("__Secure-next-auth.session-token")?.value;
  const isAuth = !!token;
  const pathname = request.nextUrl.pathname;
  const isAuthPage = pathname.startsWith("/login");

  if (isAuthPage) {
    if (isAuth) {
      return NextResponse.redirect(new URL("/user", request.url));
    }
    return NextResponse.next();
  }

  if (!isAuth) {
    let from = pathname;
    if (request.nextUrl.search) {
      from += request.nextUrl.search;
    }
    return NextResponse.redirect(
      new URL(`/login?from=${encodeURIComponent(from)}`, request.url)
    );
  }

  if (pathname.startsWith("/admin")) {
    // TODO: verify admin role from JWT payload if needed
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/user/:path*", "/login"],
};
