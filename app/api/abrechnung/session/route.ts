import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import {
  ABRECHNUNG_TYPEN,
  MAX_FILE_SIZE,
  MAX_FILES,
  contentTypeFor,
  fileExtension,
  isAbrechnungTyp,
  isNameValid,
  type AbrechnungTyp,
  type SessionResponse,
} from "@/app/lib/abrechnung";
import { sign, type UploadSession, type UploadTicket } from "@/app/lib/uploadSigning";

const SESSION_TTL = 2 * 60 * 60 * 1000; // 2 h to finish all uploads

// "Müller-Lüdenscheidt" -> "Mueller-Luedenscheidt", safe for file systems and URLs
function slug(input: string) {
  return input
    .trim()
    .replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue")
    .replace(/Ä/g, "Ae").replace(/Ö/g, "Oe").replace(/Ü/g, "Ue")
    .replace(/ß/g, "ss")
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^A-Za-z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

// Server runs in UTC – file names should show German local time.
function berlinTimestamp(date: Date) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("de-DE", {
      timeZone: "Europe/Berlin",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(date)
      .map((p) => [p.type, p.value])
  );
  return {
    day: `${parts.year}-${parts.month}-${parts.day}`,
    month: `${parts.year}-${parts.month}`,
    time: `${parts.hour}-${parts.minute}-${parts.second}`,
  };
}

const bad = (error: string) => NextResponse.json({ error }, { status: 400 });

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return bad("Ungültige Anfrage");
  }

  const { vorname, nachname, typen, files, consent, firma, src } = body as {
    vorname?: unknown;
    nachname?: unknown;
    typen?: unknown;
    files?: unknown;
    consent?: unknown;
    firma?: unknown;
    src?: unknown;
  };

  // Honeypot: only bots fill the hidden "firma" field
  if (typeof firma === "string" && firma.trim() !== "") {
    return bad("Ungültige Anfrage");
  }

  if (typeof vorname !== "string" || !isNameValid(vorname)) return bad("Vorname ungültig (mind. 2 Buchstaben)");
  if (typeof nachname !== "string" || !isNameValid(nachname)) return bad("Nachname ungültig (mind. 2 Buchstaben)");
  if (consent !== true) return bad("Bitte stimmen Sie der Datenverarbeitung zu");

  if (!Array.isArray(typen) || typen.length === 0 || !typen.every(isAbrechnungTyp)) {
    return bad("Bitte mindestens einen Typ der Abrechnung auswählen");
  }
  const selectedTypen = ABRECHNUNG_TYPEN.filter((t) => (typen as string[]).includes(t.id)).map((t) => t.id);

  if (!Array.isArray(files) || files.length === 0) return bad("Bitte mindestens eine Datei auswählen");
  if (files.length > MAX_FILES) return bad(`Maximal ${MAX_FILES} Dateien pro Upload`);

  for (const f of files) {
    if (!f || typeof f.name !== "string" || typeof f.size !== "number" || !isAbrechnungTyp(f.typ)) {
      return bad("Ungültige Dateiangaben");
    }
    if (!contentTypeFor(f.name)) return bad(`Dateiformat nicht erlaubt: ${f.name}`);
    if (f.size <= 0 || f.size > MAX_FILE_SIZE) return bad(`Datei zu groß (max. 20 MB): ${f.name}`);
    if (!selectedTypen.includes(f.typ)) return bad(`Typ der Datei passt nicht zur Auswahl: ${f.name}`);
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    console.error("BLOB_READ_WRITE_TOKEN missing. Connect a Vercel Blob store to the project.");
    return NextResponse.json({ error: "Upload ist gerade nicht verfügbar. Bitte später erneut versuchen." }, { status: 503 });
  }

  const now = new Date();
  const ts = berlinTimestamp(now);
  const person = `${slug(nachname as string) || "Unbekannt"}_${slug(vorname as string) || "Unbekannt"}`;
  const id = randomBytes(4).toString("hex");
  const folder = `abrechnungen/${ts.month}/${person}_${ts.day}_${ts.time}_${id}`;

  // Number files only when the same type appears more than once: Strom_1, Strom_2 …
  const requested = files as { name: string; size: number; typ: AbrechnungTyp }[];
  const perTyp: Record<string, number> = {};
  const totalPerTyp = requested.reduce<Record<string, number>>((acc, f) => ({ ...acc, [f.typ]: (acc[f.typ] || 0) + 1 }), {});

  const sessionFiles: UploadSession["files"] = [];
  const response: SessionResponse = { sessionToken: "", files: [] };

  for (const f of requested) {
    const typFile = ABRECHNUNG_TYPEN.find((t) => t.id === f.typ)!.file;
    perTyp[f.typ] = (perTyp[f.typ] || 0) + 1;
    const counter = totalPerTyp[f.typ] > 1 ? `_${perTyp[f.typ]}` : "";
    const fileName = `${person}_${typFile}_${ts.day}_${ts.time}${counter}.${fileExtension(f.name)}`;
    const pathname = `${folder}/${fileName}`;
    const contentType = contentTypeFor(f.name)!;

    sessionFiles.push({ pathname, fileName, originalName: f.name.slice(0, 200), typ: f.typ, size: f.size });
    response.files.push({
      pathname,
      fileName,
      contentType,
      ticket: sign<UploadTicket>({ p: pathname, t: contentType }, SESSION_TTL),
    });
  }

  const session: UploadSession = {
    id,
    folder,
    vorname: (vorname as string).trim(),
    nachname: (nachname as string).trim(),
    typen: selectedTypen,
    files: sessionFiles,
    createdAt: now.toISOString(),
    src: typeof src === "string" ? src.slice(0, 100) : "website",
  };
  response.sessionToken = sign(session, SESSION_TTL);

  return NextResponse.json(response);
}
