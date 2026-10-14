import { NextResponse } from "next/server";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { MAX_FILE_SIZE } from "@/app/lib/abrechnung";
import { verify, type UploadTicket } from "@/app/lib/uploadSigning";

// Issues short-lived client tokens so the browser uploads straight to Vercel Blob.
// This bypasses the 4.5 MB request body limit of Vercel Functions.
export async function POST(request: Request) {
  let body: HandleUploadBody;
  try {
    body = (await request.json()) as HandleUploadBody;
  } catch {
    return NextResponse.json({ error: "Ungültige Anfrage" }, { status: 400 });
  }

  try {
    const result = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        // Only pathnames issued by /api/abrechnung/session may be written
        const ticket = verify<UploadTicket>(clientPayload);
        if (!ticket || ticket.p !== pathname) {
          throw new Error("Upload nicht autorisiert");
        }
        return {
          allowedContentTypes: [ticket.t],
          maximumSizeInBytes: MAX_FILE_SIZE,
          addRandomSuffix: false,
          allowOverwrite: false,
          validUntil: Date.now() + 30 * 60 * 1000,
        };
      },
    });
    return NextResponse.json(result);
  } catch (error) {
    console.error("Blob client token error:", error);
    return NextResponse.json({ error: "Upload nicht möglich" }, { status: 400 });
  }
}
