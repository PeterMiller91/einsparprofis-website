import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { DRIVE_SCOPE } from "@/app/lib/googleDrive";
import { sign } from "@/app/lib/uploadSigning";

// One-time setup: /api/drive/connect?key=<DRIVE_SETUP_KEY> -> Google consent -> /api/drive/callback
export async function GET(request: NextRequest) {
  const setupKey = process.env.DRIVE_SETUP_KEY;
  const key = request.nextUrl.searchParams.get("key") ?? "";
  if (!setupKey || !process.env.GOOGLE_DRIVE_CLIENT_ID || !process.env.GOOGLE_DRIVE_CLIENT_SECRET) {
    return new NextResponse("Google Drive ist nicht eingerichtet (DRIVE_SETUP_KEY, GOOGLE_DRIVE_CLIENT_ID, GOOGLE_DRIVE_CLIENT_SECRET fehlen).", { status: 404 });
  }
  const a = Buffer.from(key);
  const b = Buffer.from(setupKey);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return new NextResponse("Nicht erlaubt.", { status: 403 });
  }

  const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  authUrl.search = new URLSearchParams({
    client_id: process.env.GOOGLE_DRIVE_CLIENT_ID,
    redirect_uri: `${request.nextUrl.origin}/api/drive/callback`,
    response_type: "code",
    scope: DRIVE_SCOPE,
    access_type: "offline",
    prompt: "consent", // always return a refresh token
    state: sign({ drive: true }, 10 * 60 * 1000),
  }).toString();
  return NextResponse.redirect(authUrl, { headers: { "Cache-Control": "no-store" } });
}
