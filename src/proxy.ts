import { NextResponse, type NextRequest } from "next/server";

/**
 * Optimistic gate only: bounces requests without a session cookie away from /admin.
 * Real authorization happens server-side in every admin page, action and route.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname.startsWith("/admin") && pathname !== "/admin/login" && !request.cookies.has("vb_session")) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/login";
    url.search = "";
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
