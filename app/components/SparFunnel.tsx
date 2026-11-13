"use client";

import { useRef, useState } from "react";
import styles from "../landing.module.css";
import { ANGEBOT, LEAD_CONSENT, LEAD_CONSENT_VERSION, eur, schaetzeErsparnis, waLink } from "../lib/angebot";
import { isNameValid, isPhoneValid, isPlzValid, normalizePhone } from "../lib/leadValidation";

const SPARTEN = [
  { id: "strom", label: "Strom", icon: "⚡", unit: "pro Monat", min: 30, max: 250, step: 5, start: 90 },
  { id: "gas", label: "Gas", icon: "🔥", unit: "pro Monat", min: 20, max: 300, step: 5, start: 110 },
  { id: "versicherung", label: "Versicherungen", icon: "🛡️", unit: "pro Jahr", min: 100, max: 1500, step: 50, start: 600 },
] as const;
type SparteId = (typeof SPARTEN)[number]["id"];

interface Props {
  /** Lead source when the URL has no ?src= */
  defaultSrc: string;
}

/** Lead funnel: 1. choose what to check, 2. rough costs with instant estimate, 3. contact. */
export default function SparFunnel({ defaultSrc }: Props) {
  const [step, setStep] = useState(1);
  const [selected, setSelected] = useState<SparteId[]>([]);
  const [values, setValues] = useState<Record<SparteId, number>>({ strom: 90, gas: 110, versicherung: 600 });
  const [form, setForm] = useState({ vorname: "", nachname: "", plz: "", tel: "", consent: false, firma: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const top = useRef<HTMLDivElement>(null);

  const has = (id: SparteId) => selected.includes(id);
  const ersparnis = schaetzeErsparnis(has("strom") ? values.strom : 0, has("gas") ? values.gas : 0, has("versicherung") ? values.versicherung : 0);
  const spartenText = SPARTEN.filter((s) => has(s.id))
    .map((s) => s.label)
    .join(", ");

  const goTo = (next: number) => {
    setStep(next);
    setErrors({});
    // Keep the card in view on phones when its height changes
    requestAnimationFrame(() => top.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  };

  const toggle = (id: SparteId) => {
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
    setErrors({});
  };

  const set = (key: keyof typeof form, value: string | boolean) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: "", submit: "" }));
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!isNameValid(form.vorname)) e.vorname = "Bitte Vornamen eingeben";
    if (!isNameValid(form.nachname)) e.nachname = "Bitte Nachnamen eingeben";
    if (!isPlzValid(form.plz)) e.plz = "5-stellige PLZ, z. B. 95704";
    if (!isPhoneValid(form.tel)) e.tel = "Bitte gültige deutsche Nummer eingeben";
    if (!form.consent) e.consent = "Ohne Ihre Zustimmung dürfen wir Sie nicht kontaktieren";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (loading || !validate()) return;
    setLoading(true);
    try {
      const response = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: `${form.vorname.trim()} ${form.nachname.trim()}`,
          plz: form.plz,
          tel: normalizePhone(form.tel),
          schaetzung: `${eur(ersparnis).replace(" ", " ")} (${spartenText})`,
          src: new URLSearchParams(window.location.search).get("src") || defaultSrc,
          consent: form.consent,
          consentVersion: LEAD_CONSENT_VERSION,
          firma: form.firma, // honeypot
        }),
      });
      if (response.ok) {
        setSent(true);
        requestAnimationFrame(() => top.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
      } else {
        const data = await response.json().catch(() => ({}));
        setErrors({ submit: data.error || "Fehler beim Absenden. Bitte versuchen Sie es erneut." });
      }
    } catch {
      setErrors({ submit: "Verbindungsfehler. Bitte prüfen Sie Ihre Internetverbindung." });
    } finally {
      setLoading(false);
    }
  };

  const card = `${styles.card} ${styles.shadowCard} ${styles.funnel}`;

  if (sent) {
    const vorname = form.vorname.trim();
    const upload = `/abrechnung-hochladen?${new URLSearchParams({ vorname, nachname: form.nachname.trim(), src: "nach-lead" })}`;
    return (
      <div ref={top} className={card} role="status">
        <div className={styles.success}>
          <span className={styles.successIcon}>✓</span>
          <h3>Danke, {vorname}! Ihr Check ist reserviert.</h3>
          <p className={styles.lead}>Wir melden uns innerhalb von 24 Stunden. Am schnellsten geht es, wenn Sie uns jetzt ein Foto Ihrer letzten Rechnungen schicken:</p>
          <a href={upload} className={styles.btn}>
            📷 Rechnung hochladen →
          </a>
          <a
            href={waLink(`Hallo, hier ist ${vorname} ${form.nachname.trim()}. Ich habe gerade den Haushalts-Check angefragt und schicke Ihnen meine Rechnungen.`)}
            target="_blank"
            rel="noopener"
            className={`${styles.btn} ${styles.btnWhatsapp}`}
          >
            Oder per WhatsApp schicken
          </a>
          <p className={styles.micro}>
            Tipp: Für jeden Haushalt, den Sie empfehlen und der wechselt, bekommen Sie {ANGEBOT.praemie}&nbsp;€.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div ref={top} className={card}>
      <div className={styles.funnelHead}>
        <span>Schritt {step} von 3</span>
        <span>{step === 1 ? "Dauert 1 Minute" : step === 2 ? "Fast geschafft" : "Letzter Schritt"}</span>
      </div>
      <div className={styles.funnelBar} role="progressbar" aria-valuenow={step} aria-valuemin={1} aria-valuemax={3}>
        <div style={{ width: `${(step / 3) * 100}%` }} />
      </div>

      {step === 1 && (
        <>
          <h3 className={styles.funnelTitle}>Was sollen wir für Sie prüfen?</h3>
          <p className={styles.funnelHint}>Mehrfachauswahl möglich</p>
          <div className={styles.funnelOptions}>
            {SPARTEN.map((s) => (
              <button key={s.id} type="button" aria-pressed={has(s.id)} className={`${styles.funnelOption} ${has(s.id) ? styles.funnelSelected : ""}`} onClick={() => toggle(s.id)}>
                <span aria-hidden="true">{s.icon}</span>
                {s.label}
                <i aria-hidden="true">{has(s.id) ? "✓" : ""}</i>
              </button>
            ))}
          </div>
          {errors.sparten && <span className={styles.error}>{errors.sparten}</span>}
          <button
            type="button"
            className={styles.btn}
            onClick={() => (selected.length ? goTo(2) : setErrors({ sparten: "Bitte wählen Sie mindestens einen Bereich." }))}
          >
            Weiter →
          </button>
        </>
      )}

      {step === 2 && (
        <>
          <h3 className={styles.funnelTitle}>Was zahlen Sie ungefähr?</h3>
          <p className={styles.funnelHint}>Eine grobe Schätzung reicht.</p>
          <div className={styles.calc}>
            {SPARTEN.filter((s) => has(s.id)).map((s) => (
              <label key={s.id} className={styles.slider}>
                <span>
                  {s.label} {s.unit} <b>{eur(values[s.id])}</b>
                </span>
                <input type="range" min={s.min} max={s.max} step={s.step} value={values[s.id]} onChange={(e) => setValues((v) => ({ ...v, [s.id]: Number(e.target.value) }))} />
              </label>
            ))}
            <div className={styles.result} aria-live="polite">
              <span>
                <b>Mögliche Ersparnis</b>
                <small>pro Jahr, unverbindlich</small>
              </span>
              <span className={styles.resultValue}>ca. {eur(ersparnis)}</span>
            </div>
          </div>
          <button type="button" className={styles.btn} onClick={() => goTo(3)}>
            Diese Ersparnis prüfen lassen →
          </button>
          <button type="button" className={styles.funnelBack} onClick={() => goTo(1)}>
            ← Zurück
          </button>
        </>
      )}

      {step === 3 && (
        <form onSubmit={submit} noValidate className={styles.form}>
          <h3 className={styles.funnelTitle}>
            Wohin dürfen wir Ihr Ergebnis schicken?
            <small>
              Mögliche Ersparnis: ca. {eur(ersparnis)} · {spartenText}
            </small>
          </h3>
          {/* Honeypot – hidden from people */}
          <input
            type="text"
            name="firma"
            value={form.firma}
            onChange={(e) => set("firma", e.target.value)}
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
            style={{ position: "absolute", left: "-9999px", width: 1, height: 1, opacity: 0 }}
          />
          <div className={styles.row2}>
            <label className={styles.field}>
              <span>Vorname</span>
              <input type="text" autoComplete="given-name" value={form.vorname} onChange={(e) => set("vorname", e.target.value)} aria-invalid={!!errors.vorname} />
              {errors.vorname && <span className={styles.error}>{errors.vorname}</span>}
            </label>
            <label className={styles.field}>
              <span>Nachname</span>
              <input type="text" autoComplete="family-name" value={form.nachname} onChange={(e) => set("nachname", e.target.value)} aria-invalid={!!errors.nachname} />
              {errors.nachname && <span className={styles.error}>{errors.nachname}</span>}
            </label>
          </div>
          <label className={styles.field}>
            <span>Postleitzahl</span>
            <input
              type="text"
              inputMode="numeric"
              autoComplete="postal-code"
              maxLength={5}
              value={form.plz}
              onChange={(e) => set("plz", e.target.value.replace(/\D/g, ""))}
              aria-invalid={!!errors.plz}
            />
            {errors.plz && <span className={styles.error}>{errors.plz}</span>}
          </label>
          <label className={styles.field}>
            <span>Handynummer (für WhatsApp)</span>
            <input type="tel" inputMode="tel" autoComplete="tel" placeholder="z. B. 0151 12345678" value={form.tel} onChange={(e) => set("tel", e.target.value)} aria-invalid={!!errors.tel} />
            {errors.tel && <span className={styles.error}>{errors.tel}</span>}
          </label>
          <label className={`${styles.consent} ${styles.optIn} ${errors.consent ? styles.optInError : ""}`}>
            <input type="checkbox" checked={form.consent} onChange={(e) => set("consent", e.target.checked)} />
            <span>{LEAD_CONSENT}</span>
          </label>
          {errors.consent && <span className={styles.error}>{errors.consent}</span>}
          <p className={styles.privacy}>
            Ihre Angaben verwenden wir nur für Ihren Haushalts-Check. Details in der{" "}
            <a href="/datenschutz.html" target="_blank">
              Datenschutzerklärung
            </a>
            .
          </p>
          {errors.submit && (
            <span className={styles.error} role="alert">
              {errors.submit}
            </span>
          )}
          <button type="submit" disabled={loading} className={styles.btn}>
            {loading ? "Wird gesendet …" : "Kostenlos prüfen lassen →"}
          </button>
          <span className={styles.micro}>🔒 0 € · kein Vertrag · jederzeit Nein sagen</span>
          <button type="button" className={styles.funnelBack} onClick={() => goTo(2)}>
            ← Zurück
          </button>
        </form>
      )}

      {step < 3 && (
        <a href={waLink("Hallo, ich möchte den kostenlosen Haushalts-Check.")} target="_blank" rel="noopener" className={styles.funnelWa}>
          Lieber direkt per WhatsApp schreiben
        </a>
      )}
    </div>
  );
}
