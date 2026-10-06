import { NextRequest, NextResponse } from "next/server";

const SESSION_COOKIE_NAME = "powersync_session";

export function proxy(request: NextRequest) {
  const session = request.cookies.get(SESSION_COOKIE_NAME)?.value;

  if (session) {
    return NextResponse.next();
  }

  const loginUrl = new URL("/login", request.url);

  const requestedPath = request.nextUrl.pathname + request.nextUrl.search;

  loginUrl.searchParams.set("next", requestedPath);

  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/dashboard/:path*", "/operator/:path*", "/admin/:path*"],
};
