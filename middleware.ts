import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "./auth.config";

// Deliberately built from authConfig (no providers/adapter), not from
// "@/auth" — see auth.config.ts. Importing the full auth.ts here is what
// broke the Edge runtime build.
const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { pathname } = req.nextUrl;

  const isPublic =
    pathname.startsWith("/signin") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/cron");

  if (!req.auth && !isPublic) {
    const signInUrl = new URL("/signin", req.nextUrl.origin);
    signInUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(signInUrl);
  }
});

export const config = {
  // Run on everything except static assets / Next internals.
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
