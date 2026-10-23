import { NextResponse, type NextRequest } from "next/server";

// gaststaette.einsparprofis.de shows the restaurant landing page (QR codes on the table stands).
// Only the start page is rewritten; uploads, API, legal pages etc. work as on the main domain.
export function proxy(request: NextRequest) {
  const host = request.headers.get("host") ?? "";
  if (host.startsWith("gaststaette.")) {
    return NextResponse.rewrite(new URL("/gaststaette", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: "/",
};
