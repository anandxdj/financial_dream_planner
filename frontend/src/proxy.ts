import { NextResponse, type NextRequest } from "next/server";
import { COOKIE, ROUTES, safeReturnPath } from "@/constants/api";

export function proxy(request: NextRequest) {
  const refresh =
    request.cookies.get(COOKIE.refresh) ??
    request.cookies.get("refresh_token") ??
    request.cookies.get("__Host-refresh_token");
  if (refresh?.value) {
    return NextResponse.next();
  }

  const login = request.nextUrl.clone();
  login.pathname = ROUTES.login;
  const destination = safeReturnPath(`${request.nextUrl.pathname}${request.nextUrl.search}`);
  login.searchParams.set("next", destination);
  return NextResponse.redirect(login);
}

export const config = {
  matcher: ["/dashboard", "/dashboard/:path*", "/onboarding", "/onboarding/:path*"],
};
