"use client";

import { useEffect, useState } from "react";
import base from "../landing.module.css";
import wp from "../waermepumpe/waermepumpe.module.css";
import { isNameValid, isPhoneValid, isPlzValid, normalizePhone } from "../lib/leadValidation";
import { VORORT_CONSENT, VORORT_CONSENT_VERSION } from "../lib/waermepumpe";

const TOUR_KEY = "vorort-tour";

const WP_FRAGEN = [
  { key: "eigentum", frage: "Eigentümer?", optionen: [["selbst", "Ja, selbst bewohnt"], ["vermietet", "Ja, vermietet"], ["mieter", "Mieter"]] },
  { key: "haustyp", frage: "Haus", optionen: [["efh", "Einfamilienhaus"], ["dhh", "Doppel-/Reihenhaus"], ["zfh", "Zweifamilienhaus"], ["mfh", "Mehrfamilienhaus"]] },
  { key: "heizung", frage: "Heizung", optionen: [["gas", "Gas"], ["oel", "Öl"], ["nachtspeicher", "Nachtspeicher"], ["andere", "Anderes"]] },
  { key: "alter", frage: "Heizung älter als 15 Jahre?", optionen: [["ja", "Ja"], ["nein", "Nein"], ["unbekannt", "Weiß nicht"]] },
] as const;

type WpKey = (typeof WP_FRAGEN)[number]["key"];
const EMPTY = { vorname: "", nachname: "", plz: "", tel: "" };

export default function VorOrt() {
  const [tour, setTour] = useState("");
  const [form, setForm] = useState(EMPTY);
  const [wpAktiv, setWpAktiv] = useState(false);
  const [wpAntworten, setWpAntworten] = useState<Partial<Record<WpKey, string>>>({});
  const [consent, setConsent] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState<{ vorname: string; nachname: string; wp: boolean } | null>(null);

  // Remember the tour (e.g. "vohenstrauss") on this phone only
  useEffect(() => {
    try {
      // Read after hydration (static export renders without localStorage)
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTour(localStorage.getItem(TOUR_KEY) ?? "");
    } catch {}
  }, []);
  const saveTour = (value: string) => {
    const clean = value.toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 30);
    setTour(clean);
    try {
      localStorage.setItem(TOUR_KEY, clean);
    } catch {}
  };

  const set = (key: keyof typeof EMPTY, value: string) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: "", submit: "" }));
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!isNameValid(form.vorname)) e.vorname = "Vorname fehlt";
    if (!isNameValid(form.nachname)) e.nachname = "Nachname fehlt";
    if (!isPlzValid(form.plz)) e.plz = "5-stellige PLZ";
    if (!isPhoneValid(form.tel)) e.tel = "Deutsche Handy- oder Festnetznummer";
    if (!consent) e.consent = "Der Kunde muss selbst zustimmen";
    if (wpAktiv && WP_FRAGEN.some((q) => !wpAntworten[q.key])) e.wp = "Bitte alle Wärmepumpen-Fragen beantworten oder Bereich schließen";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (loading || !validate()) return;
    setLoading(true);
    try {
      const response = await fetch("/api/vor-ort-lead.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vorname: form.vorname.trim(),
          nachname: form.nachname.trim(),
          plz: form.plz,
          tel: normalizePhone(form.tel),
          wp: wpAktiv ? wpAntworten : null,
          consent,
          consentVersion: VORORT_CONSENT_VERSION,
          src: tour ? `d2d-${tour}` : "d2d",
        }),
      });
      if (response.ok) {
        setSent({ vorname: form.vorname.trim(), nachname: form.nachname.trim(), wp: wpAktiv });
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        const data = await response.json().catch(() => ({}));
        setErrors({ submit: data.error || "Fehler beim Speichern. Bitte nochmal versuchen." });
      }
    } catch {
      setErrors({ submit: "Kein Netz? Bitte nochmal versuchen – die Eingaben bleiben stehen." });
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setForm(EMPTY);
    setWpAktiv(false);
    setWpAntworten({});
    setConsent(false);
    setErrors({});
    setSent(null);
    window.scrollTo({ top: 0 });
  };

  return (
    <main className={base.page} style={{ minHeight: "100vh" }}>
      <div className={base.wrap} style={{ maxWidth: 560, padding: "18px 14px 48px" }}>
        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 14 }}>
          <b className={base.display} style={{ fontSize: 22 }}>Vor-Ort-Erfassung</b>
          <label style={{ fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}>
            Tour
            <input
              value={tour}
              onChange={(e) => saveTour(e.target.value)}
              placeholder="z. B. vohenstrauss"
              style={{ width: 130, padding: "6px 8px", borderRadius: 8, border: "2px solid #e6d9c4", font: "inherit" }}
            />
          </label>
        </header>

        {sent ? (
          <div className={`${base.card} ${base.shadowCard}`} role="status">
            <div className={base.success}>
              <span className={base.successIcon}>✓</span>
              <h3>Gespeichert: {sent.vorname} {sent.nachname}</h3>
              <p className={base.lead}>{sent.wp ? "Spar-Check + Wärmepumpen-Daten sind in Telegram." : "Lead ist in Telegram."} Jetzt direkt die Abrechnung fotografieren:</p>
              <a
                href={`/abrechnung-hochladen?${new URLSearchParams({ vorname: sent.vorname, nachname: sent.nachname, src: tour ? `d2d-${tour}` : "d2d" })}`}
                className={base.btn}
              >
                📷 Abrechnung fotografieren →
              </a>
              <button type="button" className={base.resetLink} onClick={reset}>
                Nächster Kunde
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={submit} noValidate className={`${base.card} ${base.shadowCard} ${base.form}`}>
            <div className={base.row2}>
              <label className={base.field}>
                <span>Vorname</span>
                <input type="text" autoComplete="off" value={form.vorname} onChange={(e) => set("vorname", e.target.value)} aria-invalid={!!errors.vorname} />
                {errors.vorname && <span className={base.error}>{errors.vorname}</span>}
              </label>
              <label className={base.field}>
                <span>Nachname</span>
                <input type="text" autoComplete="off" value={form.nachname} onChange={(e) => set("nachname", e.target.value)} aria-invalid={!!errors.nachname} />
                {errors.nachname && <span className={base.error}>{errors.nachname}</span>}
              </label>
            </div>
            <div className={base.row2}>
              <label className={base.field}>
                <span>PLZ</span>
                <input type="text" inputMode="numeric" maxLength={5} autoComplete="off" value={form.plz} onChange={(e) => set("plz", e.target.value.replace(/\D/g, ""))} aria-invalid={!!errors.plz} />
                {errors.plz && <span className={base.error}>{errors.plz}</span>}
              </label>
              <label className={base.field}>
                <span>Telefon</span>
                <input type="tel" inputMode="tel" autoComplete="off" value={form.tel} onChange={(e) => set("tel", e.target.value)} aria-invalid={!!errors.tel} />
                {errors.tel && <span className={base.error}>{errors.tel}</span>}
              </label>
            </div>

            <label className={base.consent} style={{ fontSize: 16, color: "#1c1233", fontWeight: 700 }}>
              <input type="checkbox" checked={wpAktiv} onChange={(e) => setWpAktiv(e.target.checked)} />
              <span>🔥 Wärmepumpe interessant? (Hausbesitzer)</span>
            </label>

            {wpAktiv && (
              <div style={{ display: "grid", gap: 12 }}>
                {WP_FRAGEN.map((q) => (
                  <div key={q.key} style={{ display: "grid", gap: 6 }}>
                    <b style={{ fontSize: 14 }}>{q.frage}</b>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                      {q.optionen.map(([value, label]) => (
                        <button
                          key={value}
                          type="button"
                          className={`${wp.option} ${wpAntworten[q.key] === value ? wp.selected : ""}`}
                          style={{ padding: "11px 10px", fontSize: 15 }}
                          onClick={() => {
                            setWpAntworten((a) => ({ ...a, [q.key]: value }));
                            setErrors((e) => ({ ...e, wp: "" }));
                          }}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
                {errors.wp && <span className={base.error}>{errors.wp}</span>}
              </div>
            )}

            <div style={{ fontSize: 12, fontWeight: 700, color: "#db2c14", textTransform: "uppercase", letterSpacing: "0.08em" }}>
              👉 Handy übergeben – Kunde hakt selbst an
            </div>
            <label className={`${base.consent} ${wp.optIn} ${errors.consent ? wp.optInError : ""}`} style={{ fontSize: 15 }}>
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => {
                  setConsent(e.target.checked);
                  setErrors((er) => ({ ...er, consent: "" }));
                }}
              />
              <span>
                <b>{VORORT_CONSENT}</b> Ihre Angaben gibt Daniel Schultes nur weiter, wenn Sie im Gespräch ausdrücklich zustimmen.{" "}
                <a href="/datenschutz.html" target="_blank">
                  Datenschutz
                </a>
              </span>
            </label>
            {errors.consent && <span className={base.error}>{errors.consent}</span>}

            {errors.submit && (
              <span className={base.error} role="alert">
                {errors.submit}
              </span>
            )}
            <button type="submit" disabled={loading} className={base.btn}>
              {loading ? "Wird gespeichert …" : "Speichern →"}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
