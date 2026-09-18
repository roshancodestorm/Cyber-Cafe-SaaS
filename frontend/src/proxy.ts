import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function proxy(request: NextRequest) {
  // getToken returns a Promise<JWT | null>
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  const path = request.nextUrl.pathname;

  // Protect user routes - redirect to signup if not authenticated
  if (path.startsWith("/user") && !token) {
    const signupUrl = new URL(`/signup?from=${encodeURIComponent(path)}`, request.url);
    return NextResponse.redirect(signupUrl);
  }

  // Protect admin routes - redirect to login if not authenticated
  if (path.startsWith("/admin") && !token) {
    const loginUrl = new URL(`/login?from=${encodeURIComponent(path)}`, request.url);
    return NextResponse.redirect(loginUrl);
  }

  // If user is not admin but tries to access admin, redirect to user
  if (path.startsWith("/admin") && token?.role !== "admin") {
    const userUrl = new URL("/user", request.url);
    return NextResponse.redirect(userUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/user/:path*",
    "/admin/:path*",
    "/login",
    "/signup",
    "/register/cafe",
    "/api/auth/providers",
  ],
};