import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

function isComingSoon(): boolean {
  return (
    process.env.COMING_SOON === "true" ||
    process.env.NEXT_PUBLIC_COMING_SOON === "true"
  );
}

const BLOCKED_PREFIXES = ["/dashboard", "/student", "/admin"];

export function proxy(request: NextRequest) {
  if (!isComingSoon()) {
    return NextResponse.next();
  }

  const { pathname, searchParams } = request.nextUrl;

  if (BLOCKED_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.search = "notice=coming-soon";
    return NextResponse.redirect(url);
  }

  const authQuery = searchParams.get("auth");
  if (
    authQuery === "login" ||
    authQuery === "register" ||
    authQuery === "verify" ||
    authQuery === "forgot" ||
    authQuery === "reset"
  ) {
    const url = request.nextUrl.clone();
    url.searchParams.delete("auth");
    url.searchParams.delete("userId");
    url.searchParams.delete("email");
    if (!url.searchParams.has("notice")) {
      url.searchParams.set("notice", "coming-soon");
    }
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|images|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
