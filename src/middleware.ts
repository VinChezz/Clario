import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const token = request.cookies.get("id_token")?.value;
  const passed2fa = request.cookies.get("2fa_verified")?.value;
  const { pathname } = request.nextUrl;

  console.log("🔍 Middleware:", {
    path: pathname,
    hasToken: !!token,
    passed2fa: passed2fa || "NO_COOKIE",
  });

  if (
    !token &&
    (pathname.startsWith("/dashboard") || pathname === "/auth/2fa")
  ) {
    const loginUrl = `/api/auth/login?post_login_redirect_url=${encodeURIComponent(
      pathname
    )}`;
    return NextResponse.redirect(new URL(loginUrl, request.url));
  }

  if (token) {
    if (pathname === "/auth/2fa" && passed2fa) {
      console.log("✅ Already passed 2FA, redirecting to dashboard");
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    if (pathname.startsWith("/dashboard") && !passed2fa) {
      console.log("⚠️ No 2FA cookie, checking if 2FA is required...");

      try {
        const checkUrl = new URL("/api/auth/2fa/status", request.url);

        const headers = new Headers();
        const cookie = request.headers.get("cookie");
        if (cookie) headers.set("cookie", cookie);

        console.log("📡 Calling 2FA status check API...");
        const checkResponse = await fetch(checkUrl.toString(), {
          headers,
          cache: "no-store",
        });

        if (checkResponse.ok) {
          const data = await checkResponse.json();
          console.log("📊 2FA status response:", data);

          if (data.requires2fa === true) {
            console.log("🔐 2FA is ENABLED, redirecting to /auth/2fa");
            return NextResponse.redirect(new URL("/auth/2fa", request.url));
          } else {
            console.log("✅ 2FA is NOT enabled, setting 2fa_verified cookie");
            const response = NextResponse.next();
            response.cookies.set({
              name: "2fa_verified",
              value: "true",
              httpOnly: true,
              secure: process.env.NODE_ENV === "production",
              sameSite: "lax",
              path: "/",
              maxAge: 60 * 60 * 24 * 7,
            });
            return response;
          }
        } else {
          console.error("❌ Failed to check 2FA status:", checkResponse.status);

          const response = NextResponse.next();
          response.cookies.set({
            name: "2fa_verified",
            value: "true",
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
            maxAge: 60 * 60 * 24 * 7,
          });
          return response;
        }
      } catch (error) {
        console.error("❌ 2FA check failed:", error);

        const response = NextResponse.next();
        response.cookies.set({
          name: "2fa_verified",
          value: "true",
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          path: "/",
          maxAge: 60 * 60 * 24 * 7,
        });
        return response;
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/auth/:path*"],
};
