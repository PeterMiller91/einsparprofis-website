import { NextRequest, NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import { join, resolve, basename, sep } from "node:path";
import { contentTypeFor } from "@/app/lib/abrechnung";
import { verify } from "@/app/lib/uploadSigning";

const uploadsDir = () => resolve(/*turbopackIgnore: true*/ process.env.UPLOAD_DIR ?? join(/*turbopackIgnore: true*/ process.cwd(), "uploads"));

export async function GET(request: NextRequest) {
  const payload = verify<{ p: string }>(request.nextUrl.searchParams.get("t"));
  if (!payload || !payload.p.startsWith("abrechnungen/")) {
    return new NextResponse("Link ungültig oder abgelaufen.", { status: 403 });
  }

  const base = uploadsDir();
  const filePath = join(/*turbopackIgnore: true*/ base, payload.p);

  if (!resolve(/*turbopackIgnore: true*/ filePath).startsWith(base + sep)) {
    return new NextResponse("Zugriff verweigert.", { status: 403 });
  }

  const contentType = contentTypeFor(payload.p) ?? "application/octet-stream";
  const fileName = basename(payload.p);

  try {
    const buffer = await readFile(/*turbopackIgnore: true*/ filePath);
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${encodeURIComponent(fileName)}"`,
        "Content-Length": buffer.length.toString(),
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Download error:", error);
    return new NextResponse("Datei nicht verfügbar.", { status: 404 });
  }
}
