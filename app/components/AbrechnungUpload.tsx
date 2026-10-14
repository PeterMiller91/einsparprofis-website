"use client";

import { useEffect, useRef, useState } from "react";
import { upload } from "@vercel/blob/client";
import {
  ABRECHNUNG_TYPEN,
  ACCEPT_ATTR,
  MAX_FILE_SIZE,
  MAX_FILES,
  contentTypeFor,
  formatBytes,
  isNameValid,
  typLabel,
  type AbrechnungTyp,
  type SessionResponse,
} from "@/app/lib/abrechnung";

type Status = "bereit" | "laedt" | "fertig" | "fehler";

interface Item {
  id: string;
  file: File;
  typ: AbrechnungTyp | null;
  status: Status;
  loaded: number;
  error?: string;
  preview?: string;
}

const C = {
  dark: "#1C1233",
  red: "#DB2C14",
  yellow: "#FFD60A",
  muted: "#4E4262",
  border: "#E6D9C4",
  light: "#FFE9D6",
  green: "#2ECC71",
};

const inputStyle = (state: "ok" | "error" | "neutral"): React.CSSProperties => ({
  border: "2px solid " + (state === "ok" ? C.green : state === "error" ? C.red : C.border),
  borderRadius: "14px",
  padding: "15px 16px",
  fontSize: "18px",
  color: C.dark,
  background: "#FFFFFF",
  outline: "none",
  transition: "border-color 0.2s",
  width: "100%",
});

const labelText: React.CSSProperties = { fontSize: "14px", fontWeight: 700, color: C.muted };
const errorText: React.CSSProperties = { fontSize: "14px", color: C.red };

const STALL_TIMEOUT = 45_000;

const fileKey = (f: File) => `${f.name}|${f.size}|${f.lastModified}`;

export default function AbrechnungUpload({ initialVorname = "", initialNachname = "" }: { initialVorname?: string; initialNachname?: string }) {
  const [vorname, setVorname] = useState(initialVorname);
  const [nachname, setNachname] = useState(initialNachname);
  const [typen, setTypen] = useState<AbrechnungTyp[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [consent, setConsent] = useState(false);
  const [firma, setFirma] = useState(""); // honeypot
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [notices, setNotices] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [done, setDone] = useState<string[] | null>(null);

  const fileInput = useRef<HTMLInputElement>(null);
  const cameraInput = useRef<HTMLInputElement>(null);
  // Session is reused for retries as long as the file list doesn't change
  const session = useRef<{ signature: string; data: SessionResponse } | null>(null);

  // Warn before leaving while files are uploading
  useEffect(() => {
    if (!busy) return;
    const handler = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [busy]);

  // Free image previews when the component unmounts
  const itemsRef = useRef(items);
  useEffect(() => {
    itemsRef.current = items;
  }, [items]);
  useEffect(() => () => itemsRef.current.forEach((i) => i.preview && URL.revokeObjectURL(i.preview)), []);

  const toggleTyp = (id: AbrechnungTyp) => {
    const next = typen.includes(id) ? typen.filter((t) => t !== id) : ABRECHNUNG_TYPEN.map((t) => t.id).filter((t) => t === id || typen.includes(t));
    setTypen(next);
    // Keep each file's type consistent with the selected types
    setItems((prev) =>
      prev.map((i) => {
        if (next.length === 1) return { ...i, typ: next[0] };
        return i.typ && next.includes(i.typ) ? i : { ...i, typ: null };
      })
    );
    setErrors((e) => ({ ...e, typen: "" }));
  };

  const addFiles = (list: FileList | File[]) => {
    const incoming = Array.from(list);
    const msgs: string[] = [];
    const known = new Set(items.map((i) => fileKey(i.file)));
    const added: Item[] = [];

    for (const file of incoming) {
      if (known.has(fileKey(file))) {
        msgs.push(`„${file.name}" ist bereits in der Liste.`);
      } else if (!contentTypeFor(file.name)) {
        msgs.push(`„${file.name}": Format nicht erlaubt (PDF, JPG, PNG, WEBP, HEIC).`);
      } else if (file.size > MAX_FILE_SIZE) {
        msgs.push(`„${file.name}" ist ${formatBytes(file.size)} groß – maximal 20 MB erlaubt.`);
      } else if (file.size === 0) {
        msgs.push(`„${file.name}" ist leer.`);
      } else if (items.length + added.length >= MAX_FILES) {
        msgs.push(`Maximal ${MAX_FILES} Dateien – „${file.name}" wurde nicht hinzugefügt.`);
      } else {
        known.add(fileKey(file));
        added.push({
          id: Math.random().toString(36).slice(2),
          file,
          typ: typen.length === 1 ? typen[0] : null,
          status: "bereit",
          loaded: 0,
          preview: /^image\/(jpeg|png|webp)$/.test(contentTypeFor(file.name)!) ? URL.createObjectURL(file) : undefined,
        });
      }
    }

    setNotices(msgs);
    if (added.length) {
      setItems((prev) => [...prev, ...added]);
      setErrors((e) => ({ ...e, files: "" }));
    }
  };

  const removeItem = (id: string) => {
    setItems((prev) => {
      const item = prev.find((i) => i.id === id);
      if (item?.preview) URL.revokeObjectURL(item.preview);
      return prev.filter((i) => i.id !== id);
    });
  };

  const setItemTyp = (id: string, typ: AbrechnungTyp) => setItems((prev) => prev.map((i) => (i.id === id ? { ...i, typ } : i)));
  const patchItem = (id: string, patch: Partial<Item>) => setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...patch } : i)));

  const validate = () => {
    const e: Record<string, string> = {};
    if (!isNameValid(vorname)) e.vorname = "Bitte Vornamen eingeben (mind. 2 Buchstaben)";
    if (!isNameValid(nachname)) e.nachname = "Bitte Nachnamen eingeben (mind. 2 Buchstaben)";
    if (typen.length === 0) e.typen = "Bitte mindestens einen Typ auswählen";
    if (items.length === 0) e.files = "Bitte mindestens eine Abrechnung hinzufügen";
    else if (items.some((i) => !i.typ)) e.files = "Bitte für jede Datei die Art der Abrechnung wählen";
    if (!consent) e.consent = "Bitte stimmen Sie der Datenverarbeitung zu";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    setNotices([]);
    if (busy || !validate()) return;

    setBusy(true);
    setErrors({});
    try {
      // 1. Ask the server for file names + upload permissions
      const signature = JSON.stringify([vorname.trim(), nachname.trim(), typen, items.map((i) => [i.id, i.typ])]);
      const isNewSession = session.current?.signature !== signature;
      if (isNewSession) {
        const res = await fetch("/api/abrechnung/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            vorname,
            nachname,
            typen,
            consent,
            firma,
            src: new URLSearchParams(window.location.search).get("src") || "upload-seite",
            files: items.map((i) => ({ name: i.file.name, size: i.file.size, typ: i.typ })),
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || "Upload konnte nicht gestartet werden.");
        session.current = { signature, data };
        setItems((prev) => prev.map((i) => ({ ...i, status: "bereit", loaded: 0, error: undefined })));
      }
      const data: SessionResponse = session.current!.data;

      // 2. Upload directly to storage, one file after another
      let failed = 0;
      for (const [index, item] of items.entries()) {
        if (!isNewSession && item.status === "fertig") continue;
        const target = data.files[index];
        patchItem(item.id, { status: "laedt", loaded: 0, error: undefined });
        // The SDK retries for many minutes on a dead connection – give up after 45 s without progress
        const controller = new AbortController();
        let watchdog = setTimeout(() => controller.abort(), STALL_TIMEOUT);
        try {
          await upload(target.pathname, item.file, {
            access: "private",
            handleUploadUrl: "/api/abrechnung/upload",
            clientPayload: target.ticket,
            contentType: target.contentType,
            multipart: item.file.size > 8 * 1024 * 1024,
            abortSignal: controller.signal,
            onUploadProgress: ({ loaded }) => {
              clearTimeout(watchdog);
              watchdog = setTimeout(() => controller.abort(), STALL_TIMEOUT);
              patchItem(item.id, { loaded });
            },
          });
          patchItem(item.id, { status: "fertig", loaded: item.file.size });
        } catch (err) {
          console.error("Upload failed:", err);
          failed++;
          patchItem(item.id, { status: "fehler", loaded: 0, error: "Upload fehlgeschlagen – bitte erneut versuchen." });
        } finally {
          clearTimeout(watchdog);
        }
      }
      if (failed) throw new Error(`${failed} Datei(en) konnten nicht hochgeladen werden. Bitte prüfen Sie Ihre Verbindung und klicken Sie auf „Erneut versuchen“.`);

      // 3. Confirm, so the server can verify the files and notify the team
      const res = await fetch("/api/abrechnung/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionToken: data.sessionToken }),
      });
      const result = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (Array.isArray(result.invalid)) {
          // Server deleted these files – they have to be replaced, which needs a new session
          session.current = null;
          setItems((prev) =>
            prev.map((i) => (result.invalid.includes(i.file.name) ? { ...i, status: "fehler", error: "Datei beschädigt oder falsches Format – bitte entfernen." } : i))
          );
        }
        throw new Error(result.error || "Abschluss fehlgeschlagen.");
      }

      setDone(result.files ?? data.files.map((f) => f.fileName));
      items.forEach((i) => i.preview && URL.revokeObjectURL(i.preview));
    } catch (err) {
      setErrors({ submit: err instanceof Error ? err.message : "Verbindungsfehler. Bitte später erneut versuchen." });
    } finally {
      setBusy(false);
    }
  };

  const reset = () => {
    session.current = null;
    setItems([]);
    setTypen([]);
    setConsent(false);
    setDone(null);
    setErrors({});
    setNotices([]);
  };

  const totalBytes = items.reduce((s, i) => s + i.file.size, 0);
  const loadedBytes = items.reduce((s, i) => s + (i.status === "fertig" ? i.file.size : i.loaded), 0);
  const progressPct = totalBytes ? Math.round((loadedBytes / totalBytes) * 100) : 0;
  const hasFailed = items.some((i) => i.status === "fehler");

  if (done) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }} role="status">
        <span style={{ alignSelf: "flex-start", width: "64px", height: "64px", borderRadius: "50%", background: C.yellow, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "30px", fontWeight: 800 }}>✓</span>
        <span style={{ fontFamily: "var(--font-bricolage)", fontSize: "32px", fontWeight: 800, letterSpacing: "-0.02em" }}>
          Danke, {vorname.trim()}! {done.length === 1 ? "Ihre Abrechnung ist" : `Ihre ${done.length} Abrechnungen sind`} angekommen.
        </span>
        <span style={{ fontSize: "18px", lineHeight: "1.5", color: C.muted }}>
          Wir prüfen alles und melden uns innerhalb von 24 Stunden mit Ihrer Ersparnis – per WhatsApp.
        </span>
        <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "6px", background: C.light, borderRadius: "14px", padding: "14px 16px", fontSize: "14px", wordBreak: "break-all" }}>
          {done.map((name) => (
            <li key={name}>📄 {name}</li>
          ))}
        </ul>
        <button type="button" onClick={reset} style={{ alignSelf: "flex-start", background: "none", border: "none", padding: 0, fontSize: "16px", fontWeight: 700, color: C.red, cursor: "pointer", textDecoration: "underline" }}>
          Weitere Abrechnungen hochladen
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Honeypot – hidden from people, tempting for bots */}
      <input type="text" name="firma" value={firma} onChange={(e) => setFirma(e.target.value)} tabIndex={-1} autoComplete="off" aria-hidden="true" style={{ position: "absolute", left: "-9999px", width: "1px", height: "1px", opacity: 0 }} />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 200px), 1fr))", gap: "12px" }}>
        <label style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <span style={labelText}>Vorname *</span>
          <input
            type="text"
            autoComplete="given-name"
            placeholder="z. B. Anna"
            value={vorname}
            disabled={busy}
            onChange={(e) => setVorname(e.target.value)}
            aria-invalid={!!errors.vorname}
            style={inputStyle(errors.vorname ? "error" : vorname && isNameValid(vorname) ? "ok" : "neutral")}
          />
          {errors.vorname && <span style={errorText}>{errors.vorname}</span>}
        </label>
        <label style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <span style={labelText}>Nachname *</span>
          <input
            type="text"
            autoComplete="family-name"
            placeholder="z. B. Müller"
            value={nachname}
            disabled={busy}
            onChange={(e) => setNachname(e.target.value)}
            aria-invalid={!!errors.nachname}
            style={inputStyle(errors.nachname ? "error" : nachname && isNameValid(nachname) ? "ok" : "neutral")}
          />
          {errors.nachname && <span style={errorText}>{errors.nachname}</span>}
        </label>
      </div>

      <fieldset style={{ border: "none", display: "flex", flexDirection: "column", gap: "10px" }} aria-invalid={!!errors.typen}>
        <legend style={{ ...labelText, marginBottom: "10px" }}>Typ der Abrechnung * (mehrere möglich)</legend>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
          {ABRECHNUNG_TYPEN.map((t) => {
            const checked = typen.includes(t.id);
            return (
              <label
                key={t.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "10px 16px",
                  borderRadius: "999px",
                  border: `2px solid ${checked ? C.dark : errors.typen ? C.red : C.border}`,
                  background: checked ? C.dark : "#FFFFFF",
                  color: checked ? "#FFF7EA" : C.dark,
                  fontWeight: 700,
                  fontSize: "16px",
                  cursor: busy ? "not-allowed" : "pointer",
                  transition: "all 0.15s",
                  userSelect: "none",
                }}
              >
                <input type="checkbox" checked={checked} disabled={busy} onChange={() => toggleTyp(t.id)} style={{ accentColor: C.yellow, width: "18px", height: "18px" }} />
                {t.label}
              </label>
            );
          })}
        </div>
        {errors.typen && <span style={errorText}>{errors.typen}</span>}
      </fieldset>

      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        <span style={labelText}>Abrechnungen * (max. {MAX_FILES} Dateien, je max. 20 MB)</span>
        <div
          role="button"
          tabIndex={0}
          onClick={() => !busy && fileInput.current?.click()}
          onKeyDown={(e) => {
            if (!busy && (e.key === "Enter" || e.key === " ")) {
              e.preventDefault();
              fileInput.current?.click();
            }
          }}
          onDragOver={(e) => {
            e.preventDefault();
            if (!busy) setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            if (!busy) addFiles(e.dataTransfer.files);
          }}
          style={{
            border: `3px dashed ${dragOver ? C.red : errors.files ? C.red : C.dark}`,
            borderRadius: "20px",
            background: dragOver ? C.light : "#FFF7EA",
            padding: "28px 20px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "8px",
            textAlign: "center",
            cursor: busy ? "not-allowed" : "pointer",
            transition: "all 0.15s",
          }}
        >
          <span style={{ fontSize: "36px" }} aria-hidden="true">📎</span>
          <span style={{ fontFamily: "var(--font-bricolage)", fontWeight: 800, fontSize: "20px" }}>Dateien hierher ziehen oder klicken</span>
          <span style={{ fontSize: "14px", color: C.muted }}>PDF, JPG, PNG, WEBP oder HEIC</span>
        </div>
        <input
          ref={fileInput}
          type="file"
          multiple
          accept={ACCEPT_ATTR}
          hidden
          onChange={(e) => {
            if (e.target.files) addFiles(e.target.files);
            e.target.value = "";
          }}
        />
        <input
          ref={cameraInput}
          type="file"
          accept="image/*"
          capture="environment"
          hidden
          onChange={(e) => {
            if (e.target.files) addFiles(e.target.files);
            e.target.value = "";
          }}
        />
        <button
          type="button"
          className="mobile-only"
          disabled={busy}
          onClick={() => cameraInput.current?.click()}
          style={{ alignSelf: "center", background: "#FFFFFF", border: `2px solid ${C.dark}`, borderRadius: "999px", padding: "10px 20px", fontSize: "16px", fontWeight: 700, color: C.dark, cursor: "pointer" }}
        >
          📷 Abrechnung fotografieren
        </button>
        {notices.map((n) => (
          <span key={n} style={{ fontSize: "14px", color: "#B26A00", fontWeight: 600 }}>⚠ {n}</span>
        ))}
        {errors.files && <span style={errorText}>{errors.files}</span>}

        {items.length > 0 && (
          <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "10px" }}>
            {items.map((item) => {
              const pct = item.status === "fertig" ? 100 : Math.round((item.loaded / item.file.size) * 100);
              return (
                <li
                  key={item.id}
                  style={{
                    border: `2px solid ${item.status === "fehler" ? C.red : item.status === "fertig" ? C.green : C.border}`,
                    borderRadius: "16px",
                    padding: "12px",
                    display: "grid",
                    gridTemplateColumns: "48px minmax(0, 1fr) auto",
                    gap: "12px",
                    alignItems: "center",
                    background: "#FFFFFF",
                  }}
                >
                  {item.preview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.preview} alt="" style={{ width: "48px", height: "48px", objectFit: "cover", borderRadius: "10px" }} />
                  ) : (
                    <span style={{ width: "48px", height: "48px", borderRadius: "10px", background: C.light, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: 800 }}>
                      {item.file.name.split(".").pop()?.toUpperCase()}
                    </span>
                  )}
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px", minWidth: 0 }}>
                    <span style={{ fontWeight: 700, fontSize: "15px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={item.file.name}>
                      {item.file.name}
                    </span>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", fontSize: "13px", color: C.muted }}>
                      <span>{formatBytes(item.file.size)}</span>
                      {typen.length > 1 ? (
                        <select
                          value={item.typ ?? ""}
                          disabled={busy || item.status === "fertig"}
                          onChange={(e) => setItemTyp(item.id, e.target.value as AbrechnungTyp)}
                          aria-label={`Art der Abrechnung für ${item.file.name}`}
                          style={{ border: `2px solid ${item.typ ? C.border : C.red}`, borderRadius: "8px", padding: "4px 8px", fontSize: "13px", fontWeight: 700, color: C.dark, background: "#FFFFFF" }}
                        >
                          <option value="" disabled>
                            Art wählen …
                          </option>
                          {typen.map((t) => (
                            <option key={t} value={t}>
                              {typLabel(t)}
                            </option>
                          ))}
                        </select>
                      ) : item.typ ? (
                        <span style={{ background: C.yellow, color: C.dark, borderRadius: "6px", padding: "1px 8px", fontWeight: 700 }}>{typLabel(item.typ)}</span>
                      ) : (
                        <span style={{ color: C.red, fontWeight: 600 }}>Bitte oben einen Typ wählen</span>
                      )}
                    </div>
                    {(item.status === "laedt" || item.status === "fertig") && (
                      <div style={{ height: "6px", background: C.light, borderRadius: "999px", overflow: "hidden" }} role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
                        <div style={{ height: "100%", width: `${pct}%`, background: item.status === "fertig" ? C.green : C.red, transition: "width 0.2s" }} />
                      </div>
                    )}
                    {item.error && <span style={{ fontSize: "13px", color: C.red }}>{item.error}</span>}
                  </div>
                  {item.status === "fertig" ? (
                    <span style={{ color: C.green, fontSize: "22px", fontWeight: 800, padding: "0 8px" }} aria-label="Hochgeladen">✓</span>
                  ) : item.status === "laedt" ? (
                    <span style={{ fontSize: "13px", fontWeight: 700, padding: "0 4px" }}>{pct} %</span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      disabled={busy}
                      aria-label={`${item.file.name} entfernen`}
                      style={{ width: "36px", height: "36px", borderRadius: "50%", border: "none", background: C.dark, color: C.yellow, fontSize: "18px", fontWeight: 700, cursor: "pointer" }}
                    >
                      ×
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <label style={{ display: "flex", gap: "10px", alignItems: "flex-start", fontSize: "14px", color: C.muted, cursor: "pointer" }}>
        <input type="checkbox" checked={consent} disabled={busy} onChange={(e) => setConsent(e.target.checked)} style={{ marginTop: "4px" }} />
        <span>
          Ich stimme zu, dass meine Abrechnungen zur Prüfung von Einsparmöglichkeiten verarbeitet werden, und akzeptiere die{" "}
          <a href="/datenschutz.html" target="_blank" style={{ color: C.red, textDecoration: "underline" }}>
            Datenschutzerklärung
          </a>
          . *
        </span>
      </label>
      {errors.consent && <span style={errorText}>{errors.consent}</span>}

      {busy && items.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }} aria-live="polite">
          <div style={{ height: "12px", background: C.light, borderRadius: "999px", overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${progressPct}%`, background: C.red, borderRadius: "999px", transition: "width 0.2s" }} />
          </div>
          <span style={{ fontSize: "14px", fontWeight: 700 }}>
            {progressPct} % · {formatBytes(loadedBytes)} von {formatBytes(totalBytes)} – bitte Seite nicht schließen
          </span>
        </div>
      )}
      {errors.submit && (
        <span style={errorText} role="alert">
          {errors.submit}
        </span>
      )}

      <button
        type="submit"
        disabled={busy}
        style={{
          background: C.red,
          color: "#FFFFFF",
          borderRadius: "999px",
          padding: "20px",
          fontFamily: "var(--font-bricolage)",
          fontWeight: 800,
          fontSize: "22px",
          border: "none",
          cursor: busy ? "not-allowed" : "pointer",
          transition: "all 0.2s",
          opacity: busy ? 0.7 : 1,
        }}
      >
        {busy ? "Wird hochgeladen …" : hasFailed ? "Erneut versuchen →" : items.length > 1 ? `${items.length} Abrechnungen hochladen →` : "Abrechnung hochladen →"}
      </button>
      <span style={{ fontSize: "14px", color: C.muted, textAlign: "center" }}>🔒 Verschlüsselte Übertragung · Dateien sind nicht öffentlich abrufbar</span>
    </form>
  );
}
