// Next.js Proxy — kiểm tra JWT token, redirect về login nếu chưa đăng nhập
import { NextRequest, NextResponse } from "next/server";

const AUTH_PATHS = ["/auth/sign-in"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Redirect sign-up → sign-in (admin không cần đăng ký)
  if (pathname.startsWith("/auth/sign-up")) {
    return NextResponse.redirect(new URL("/auth/sign-in", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|images|.*\\..*).*)"],
};
