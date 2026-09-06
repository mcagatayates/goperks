import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/session";
import { DEMO_SLUG } from "@/lib/constants";

// Optimistic gate only: verifies the session cookie's signature/expiry, not
// whether it belongs to the restaurant in the URL — that per-resource check
// needs a database lookup and happens in app/admin/[slug]/page.tsx instead
// (see assertRestaurantAccess in lib/auth.ts and the Next.js auth guide's
// Proxy-vs-DAL split).
export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const slugMatch = pathname.match(/^\/admin\/([^/]+)/);
  if (!slugMatch) return NextResponse.next();
  if (slugMatch[1] === DEMO_SLUG) return NextResponse.next();

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const session = verifySessionToken(token);
  if (!session) {
    const loginUrl = new URL("/giris", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
