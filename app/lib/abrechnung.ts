// Shared between the upload form (client) and the /api/abrechnung routes (server).

export const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB pro Datei
export const MAX_FILES = 10;

export const ABRECHNUNG_TYPEN = [
  { id: "strom", label: "Strom", file: "Strom" },
  { id: "gas", label: "Gas", file: "Gas" },
  { id: "hausrat", label: "Hausrat", file: "Hausrat" },
  { id: "wohngebaeude", label: "Wohngebäude", file: "Wohngebaeude" },
  { id: "haftpflicht", label: "Haftpflicht", file: "Haftpflicht" },
  { id: "sonstige", label: "Sonstige", file: "Sonstige" },
] as const;

export type AbrechnungTyp = (typeof ABRECHNUNG_TYPEN)[number]["id"];

export const isAbrechnungTyp = (v: unknown): v is AbrechnungTyp =>
  ABRECHNUNG_TYPEN.some((t) => t.id === v);

export const typLabel = (id: AbrechnungTyp) => ABRECHNUNG_TYPEN.find((t) => t.id === id)!.label;

// Allowed formats: extension -> content type. Phones often deliver HEIC photos.
export const ALLOWED_FORMATS: Record<string, string> = {
  pdf: "application/pdf",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  heic: "image/heic",
  heif: "image/heif",
};

export const ACCEPT_ATTR = Object.keys(ALLOWED_FORMATS)
  .map((ext) => "." + ext)
  .concat([...new Set(Object.values(ALLOWED_FORMATS))])
  .join(",");

export const fileExtension = (name: string) => {
  const m = /\.([a-z0-9]+)$/i.exec(name);
  return m ? m[1].toLowerCase() : "";
};

/** Resolves the content type from the extension (browsers often report "" for HEIC). */
export const contentTypeFor = (name: string): string | null => ALLOWED_FORMATS[fileExtension(name)] ?? null;

export const isNameValid = (name: string) => /^[\p{L}][\p{L}\s'’.\-]{1,49}$/u.test(name.trim());

export const formatBytes = (bytes: number) =>
  bytes >= 1024 * 1024
    ? (bytes / (1024 * 1024)).toLocaleString("de-DE", { maximumFractionDigits: 1 }) + " MB"
    : Math.max(1, Math.round(bytes / 1024)).toLocaleString("de-DE") + " KB";

export interface SessionFileRequest {
  name: string;
  size: number;
  typ: AbrechnungTyp;
}

export interface SessionResponse {
  sessionToken: string;
  files: { pathname: string; fileName: string; contentType: string; ticket: string }[];
}
