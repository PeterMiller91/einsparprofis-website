import { createHmac, timingSafeEqual } from "node:crypto";

// Stateless signed tokens (payload.signature, both base64url). They tie every
// client upload to a pathname the server generated, so the Blob store can't be
// used as an open file dump, and they sign the download links sent to Telegram.

function secret() {
  const s = process.env.UPLOAD_SIGNING_SECRET || process.env.BLOB_READ_WRITE_TOKEN;
  if (!s) {
    throw new Error("UPLOAD_SIGNING_SECRET (oder BLOB_READ_WRITE_TOKEN) fehlt in den Umgebungsvariablen.");
  }
  return s;
}

const hmac = (data: string) => createHmac("sha256", secret()).update(data).digest("base64url");

export function sign<T extends object>(payload: T, ttlMs: number): string {
  const data = Buffer.from(JSON.stringify({ ...payload, exp: Date.now() + ttlMs })).toString("base64url");
  return `${data}.${hmac(data)}`;
}

export function verify<T>(token: unknown): T | null {
  if (typeof token !== "string") return null;
  const [data, sig] = token.split(".");
  if (!data || !sig) return null;

  const expected = Buffer.from(hmac(data));
  const actual = Buffer.from(sig);
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return null;

  try {
    const payload = JSON.parse(Buffer.from(data, "base64url").toString("utf8"));
    if (typeof payload.exp !== "number" || payload.exp < Date.now()) return null;
    return payload as T;
  } catch {
    return null;
  }
}

export interface UploadTicket {
  p: string; // pathname
  t: string; // content type
}

export interface UploadSession {
  id: string;
  folder: string;
  vorname: string;
  nachname: string;
  typen: string[];
  files: { pathname: string; fileName: string; originalName: string; typ: string; size: number }[];
  createdAt: string;
  src: string;
}
