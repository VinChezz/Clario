import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // const token = request.cookies.get("kinde_auth")?.value;
  const token = request.cookies.get("id_token")?.value;

  const { pathname } = request.nextUrl;

  if (token && pathname === "/") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (
    !token &&
    (pathname.startsWith("/dashboard") || pathname.startsWith("/api/teams"))
  ) {
    const loginUrl = `/api/auth/login?post_login_redirect_url=${encodeURIComponent(
      request.nextUrl.pathname
    )}`;
    return NextResponse.redirect(new URL(loginUrl, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/dashboard/:path*", "/api/teams/:path*"],
};
