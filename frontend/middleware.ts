import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";
import { NextRequest, NextResponse } from "next/server";

const intlMiddleware = createMiddleware(routing);

export default function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Let admin through untouched
  if (pathname.startsWith("/admin")) return NextResponse.next();

  // Allow root and locale roots — these show the coming soon page
  const isRoot = pathname === "/" || pathname === "/fr" || pathname === "/en";
  if (isRoot) return intlMiddleware(req);

  // Redirect everything else to the coming soon homepage
  const isFr = pathname.startsWith("/fr") ||
    (!pathname.startsWith("/en") && (req.headers.get("accept-language") ?? "").toLowerCase().includes("fr"));
  return NextResponse.redirect(new URL(isFr ? "/fr" : "/en", req.url));
}

export const config = {
  matcher: ["/((?!_next|_vercel|.*\..*).*)"],
};
