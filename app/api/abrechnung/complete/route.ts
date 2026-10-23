import { NextRequest, NextResponse } from "next/server";
import { BlobNotFoundError, del, get, head, put } from "@vercel/blob";
import { typLabel, formatBytes, type AbrechnungTyp } from "@/app/lib/abrechnung";
import { sign, verify, type UploadSession } from "@/app/lib/uploadSigning";

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

async function notifyTelegram(session: UploadSession, origin: string) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!botToken || !chatId) {
    console.warn("Telegram credentials missing. Skipping upload notification.");
    return;
  }

  const fileLines = session.files.map((f) => {
    const link = `${origin}/api/abrechnung/datei?t=${sign({ p: f.pathname }, DOWNLOAD_LINK_TTL)}`;
    return `📄 <a href="${escapeHtml(link)}">${escapeHtml(f.fileName)}</a> (${formatBytes(f.size)})`;
  });

  const message = `
📥 <b>Neue Abrechnungen hochgeladen!</b>

👤 <b>Name:</b> ${escapeHtml(session.vorname)} ${escapeHtml(session.nachname)}
🧾 <b>Typ:</b> ${session.typen.map((t) => typLabel(t as AbrechnungTyp)).join(", ")}
📊 <b>Quelle:</b> ${escapeHtml(session.src)}
⏰ <b>Zeit:</b> ${new Date(session.createdAt).toLocaleString("de-DE", { timeZone: "Europe/Berlin" })}

${fileLines.join("\n")}

<i>Links 30 Tage gültig · Ordner: ${escapeHtml(session.folder)}</i>
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
    const metaPath = `${session.folder}/_angaben.json`;
    // Idempotent: a repeated call (e.g. double click, retry) must not notify twice
    if (await exists(metaPath)) {
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

    // Keep the form data next to the files for the archive
    await put(metaPath, JSON.stringify({ ...session, completedAt: new Date().toISOString() }, null, 2), {
      access: "private",
      contentType: "application/json",
      addRandomSuffix: false,
      allowOverwrite: true,
    });

    try {
      await notifyTelegram(session, request.nextUrl.origin);
    } catch (telegramError) {
      // Files are stored safely; notification failure must not fail the upload
      console.error("Failed to send upload notification to Telegram:", telegramError);
    }

    return NextResponse.json({ success: true, files: session.files.map((f) => f.fileName) }, { status: 201 });
  } catch (error) {
    console.error("Upload completion error:", error);
    return NextResponse.json({ error: "Interner Server-Fehler" }, { status: 500 });
  }
}
