import { NextRequest, NextResponse, after } from "next/server";
import { BlobNotFoundError, del, get, head, put } from "@vercel/blob";
import { typLabel, formatBytes, type AbrechnungTyp } from "@/app/lib/abrechnung";
import { DRIVE_ROOT_FOLDER, ensureFolder, getAccessToken, isDriveConfigured, uploadFile } from "@/app/lib/googleDrive";
import { sign, verify, type UploadSession } from "@/app/lib/uploadSigning";

// Copying up to 10 × 20 MB to Google Drive runs after the response – give it time
export const maxDuration = 300;

const DOWNLOAD_LINK_TTL = 30 * 24 * 60 * 60 * 1000; // links in Telegram stay valid for 30 days

const escapeHtml = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// Rejects files whose content doesn't match the extension (e.g. renamed .exe -> .pdf)
function matchesMagicBytes(bytes: Uint8Array, pathname: string) {
  const ascii = (from: number, to: number) => String.fromCharCode(...bytes.slice(from, to));
  const ext = pathname.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "pdf":
      return ascii(0, 5) === "%PDF-";
    case "jpg":
    case "jpeg":
      return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
    case "png":
      return bytes[0] === 0x89 && ascii(1, 4) === "PNG";
    case "webp":
      return ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP";
    case "heic":
    case "heif":
      return ascii(4, 8) === "ftyp";
    default:
      return false;
  }
}

async function readHeader(pathname: string) {
  const result = await get(pathname, { access: "private", useCache: false });
  if (!result || result.statusCode !== 200) return null;
  const reader = result.stream.getReader();
  const { value } = await reader.read();
  await reader.cancel();
  return value ?? new Uint8Array();
}

async function exists(pathname: string) {
  try {
    await head(pathname);
    return true;
  } catch (error) {
    if (error instanceof BlobNotFoundError) return false;
    throw error;
  }
}

/** Copies the files from the Blob buffer into Google Drive: Einsparprofis Abrechnungen/<Monat>/<Upload>/ */
async function copyToDrive(session: UploadSession) {
  const accessToken = await getAccessToken();
  const [, month, uploadFolder] = session.folder.split("/");
  const root = await ensureFolder(accessToken, DRIVE_ROOT_FOLDER);
  const monthFolder = await ensureFolder(accessToken, month, root.id);
  const folder = await ensureFolder(accessToken, uploadFolder, monthFolder.id);

  const links: Record<string, string> = {};
  for (const f of session.files) {
    const blob = await get(f.pathname, { access: "private", useCache: false });
    if (!blob || blob.statusCode !== 200) throw new Error(`Blob not found: ${f.pathname}`);
    const data = await new Response(blob.stream).arrayBuffer();
    const uploaded = await uploadFile(accessToken, { name: f.fileName, mimeType: blob.blob.contentType, parentId: folder.id, data });
    links[f.pathname] = uploaded.webViewLink;
  }

  const angaben = new TextEncoder().encode(JSON.stringify({ ...session, completedAt: new Date().toISOString() }, null, 2));
  await uploadFile(accessToken, { name: "_angaben.json", mimeType: "application/json", parentId: folder.id, data: angaben.buffer as ArrayBuffer });

  return { folderLink: folder.webViewLink, links };
}

type Storage = { kind: "drive"; folderLink: string; links: Record<string, string> } | { kind: "blob"; driveFailed: boolean };

async function notifyTelegram(session: UploadSession, origin: string, storage: Storage) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!botToken || !chatId) {
    console.warn("Telegram credentials missing. Skipping upload notification.");
    return;
  }

  const fileLines = session.files.map((f) => {
    const link =
      storage.kind === "drive" ? storage.links[f.pathname] : `${origin}/api/abrechnung/datei?t=${sign({ p: f.pathname }, DOWNLOAD_LINK_TTL)}`;
    return `📄 <a href="${escapeHtml(link)}">${escapeHtml(f.fileName)}</a> (${formatBytes(f.size)})`;
  });

  const footer =
    storage.kind === "drive"
      ? `📁 <a href="${escapeHtml(storage.folderLink)}">Ordner in Google Drive öffnen</a>`
      : `${storage.driveFailed ? "⚠️ Übertragung nach Google Drive fehlgeschlagen – Dateien liegen im Vercel-Speicher.\n" : ""}<i>Links 30 Tage gültig · Ordner: ${escapeHtml(session.folder)}</i>`;

  const message = `
📥 <b>Neue Abrechnungen hochgeladen!</b>

👤 <b>Name:</b> ${escapeHtml(session.vorname)} ${escapeHtml(session.nachname)}
🧾 <b>Typ:</b> ${session.typen.map((t) => typLabel(t as AbrechnungTyp)).join(", ")}
📊 <b>Quelle:</b> ${escapeHtml(session.src)}
⏰ <b>Zeit:</b> ${new Date(session.createdAt).toLocaleString("de-DE", { timeZone: "Europe/Berlin" })}

${fileLines.join("\n")}

${footer}
  `.trim();

  const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text: message, parse_mode: "HTML", disable_web_page_preview: true }),
  });
  if (!response.ok) {
    throw new Error(`Telegram API error: ${response.status} ${await response.text()}`);
  }
}

export async function POST(request: NextRequest) {
  let sessionToken: unknown;
  try {
    ({ sessionToken } = await request.json());
  } catch {
    return NextResponse.json({ error: "Ungültige Anfrage" }, { status: 400 });
  }

  const session = verify<UploadSession>(sessionToken);
  if (!session) {
    return NextResponse.json({ error: "Upload-Sitzung abgelaufen. Bitte erneut hochladen." }, { status: 400 });
  }

  try {
    // Marker without personal data – a repeated call (double click, retry) must not process twice
    const markerPath = `${session.folder}/_erledigt.json`;
    if (await exists(markerPath)) {
      return NextResponse.json({ success: true, files: session.files.map((f) => f.fileName) });
    }

    const missing: string[] = [];
    const invalid: string[] = [];
    for (const f of session.files) {
      const header = await readHeader(f.pathname);
      if (!header) {
        missing.push(f.originalName);
      } else if (!matchesMagicBytes(header, f.pathname)) {
        invalid.push(f.originalName);
        await del(f.pathname);
      }
    }

    if (missing.length) {
      return NextResponse.json({ error: `Noch nicht hochgeladen: ${missing.join(", ")}`, missing }, { status: 409 });
    }
    if (invalid.length) {
      return NextResponse.json(
        { error: `Datei beschädigt oder falsches Format: ${invalid.join(", ")}`, invalid },
        { status: 422 }
      );
    }

    await put(markerPath, JSON.stringify({ completedAt: new Date().toISOString() }), {
      access: "private",
      contentType: "application/json",
      addRandomSuffix: false,
      allowOverwrite: true,
    });

    // The customer gets the confirmation right away; Drive copy + notification run afterwards
    const origin = request.nextUrl.origin;
    after(async () => {
      let storage: Storage = { kind: "blob", driveFailed: false };
      if (isDriveConfigured()) {
        try {
          storage = { kind: "drive", ...(await copyToDrive(session)) };
          // Drive is the archive now – don't keep a second copy of the bills
          await del(session.files.map((f) => f.pathname));
        } catch (driveError) {
          console.error("Google Drive transfer failed, files stay in Blob:", driveError);
          storage = { kind: "blob", driveFailed: true };
        }
      }
      if (storage.kind === "blob") {
        // Keep the form data next to the files for the archive
        await put(`${session.folder}/_angaben.json`, JSON.stringify({ ...session, completedAt: new Date().toISOString() }, null, 2), {
          access: "private",
          contentType: "application/json",
          addRandomSuffix: false,
          allowOverwrite: true,
        });
      }

      try {
        await notifyTelegram(session, origin, storage);
      } catch (telegramError) {
        // Files are stored safely; notification failure must not fail the upload
        console.error("Failed to send upload notification to Telegram:", telegramError);
      }
    });

    return NextResponse.json({ success: true, files: session.files.map((f) => f.fileName) }, { status: 201 });
  } catch (error) {
    console.error("Upload completion error:", error);
    return NextResponse.json({ error: "Interner Server-Fehler" }, { status: 500 });
  }
}
