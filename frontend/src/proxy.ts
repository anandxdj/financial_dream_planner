import { NextResponse } from "next/server";

export function proxy() {
  // Login disabled for development/demo
  return NextResponse.next();
}

export const config = {
  matcher: [],
};
