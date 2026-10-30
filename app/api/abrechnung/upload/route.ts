import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "node:fs/promises";
import { join, resolve, sep } from "node:path";
import { MAX_FILE_SIZE } from "@/app/lib/abrechnung";
import { verify, type UploadTicket } from "@/app/lib/uploadSigning";

const uploadsDir = () => resolve(process.env.UPLOAD_DIR ?? join(process.cwd(), "uploads"));

export async function POST(request: NextRequest) {
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Ungültige Anfrage" }, { status: 400 });
  }

  const ticketRaw = formData.get("ticket");
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Keine Datei erhalten" }, { status: 400 });
  }

  const ticket = verify<UploadTicket>(ticketRaw);
  if (!ticket) {
    return NextResponse.json({ error: "Upload nicht autorisiert" }, { status: 403 });
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: "Datei zu groß (max. 20 MB)" }, { status: 413 });
  }

  const base = uploadsDir();
  const filePath = join(base, ticket.p);

  if (!resolve(filePath).startsWith(base + sep)) {
    return NextResponse.json({ error: "Ungültiger Pfad" }, { status: 403 });
  }

  try {
    await mkdir(join(filePath, ".."), { recursive: true });
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(filePath, buffer);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("File write error:", error);
    return NextResponse.json({ error: "Upload fehlgeschlagen" }, { status: 500 });
  }
}
