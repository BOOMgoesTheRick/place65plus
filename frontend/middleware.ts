import { NextRequest, NextResponse } from "next/server";

export default function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Let admin through untouched
  if (pathname.startsWith("/admin")) return NextResponse.next();

  // Detect locale from path or Accept-Language
  const isFr = pathname.startsWith("/fr") ||
    (!pathname.startsWith("/en") && (req.headers.get("accept-language") ?? "").toLowerCase().includes("fr"));

  const home = isFr ? "/fr" : "/en";

  // Already on the coming soon page
  if (pathname === home || pathname === "/fr" || pathname === "/en" || pathname === "/") {
    return NextResponse.next();
  }

  // Redirect everything else to the coming soon homepage
  return NextResponse.redirect(new URL(home, req.url));
}

export const config = {
  matcher: ["/((?!_next|_vercel|.*\\..*).*)"],
};
