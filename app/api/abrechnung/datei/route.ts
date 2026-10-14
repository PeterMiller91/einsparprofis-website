import { NextRequest, NextResponse } from "next/server";
import { issueSignedToken, presignUrl } from "@vercel/blob";
import { verify } from "@/app/lib/uploadSigning";

// Download link from the Telegram notification. The files are private, so we
// verify our own signature and redirect to a presigned Blob URL valid for 10 min.
// Redirecting (instead of proxying) avoids the 4.5 MB response limit.
export async function GET(request: NextRequest) {
  const payload = verify<{ p: string }>(request.nextUrl.searchParams.get("t"));
  if (!payload || !payload.p.startsWith("abrechnungen/")) {
    return new NextResponse("Link ungültig oder abgelaufen.", { status: 403 });
  }

  try {
    const validUntil = Date.now() + 10 * 60 * 1000;
    const signedToken = await issueSignedToken({ pathname: payload.p, operations: ["get"], validUntil });
    const { presignedUrl } = await presignUrl(signedToken, {
      operation: "get",
      pathname: payload.p,
      access: "private",
      validUntil,
    });
    return NextResponse.redirect(presignedUrl, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Download link error:", error);
    return new NextResponse("Datei nicht verfügbar.", { status: 404 });
  }
}
