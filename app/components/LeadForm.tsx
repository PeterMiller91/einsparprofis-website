"use client";

import { useState } from "react";
import styles from "../landing.module.css";
import { ANGEBOT, freiePlaetze } from "../lib/angebot";
import { isNameValid, isPhoneValid, isPlzValid, normalizePhone } from "../lib/leadValidation";

interface Props {
  /** Estimate from the Spar-Rechner, sent along to Telegram */
  schaetzung: string;
  /** Lead source when the URL has no ?src= */
  defaultSrc: string;
}

export default function LeadForm({ schaetzung, defaultSrc }: Props) {
  const [form, setForm] = useState({ vorname: "", nachname: "", plz: "", tel: "", consent: false });
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const checks = {
    vorname: isNameValid(form.vorname),
    nachname: isNameValid(form.nachname),
    plz: isPlzValid(form.plz),
    tel: isPhoneValid(form.tel),
  };

  const set = (key: keyof typeof form, value: string | boolean) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: "", submit: "" }));
  };

  const fieldClass = (key: keyof typeof checks) => (touched[key] && checks[key] ? styles.valid : undefined);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!checks.vorname) e.vorname = "Bitte Vornamen eingeben";
    if (!checks.nachname) e.nachname = "Bitte Nachnamen eingeben";
    if (!checks.plz) e.plz = "5-stellige PLZ, z. B. 95704";
    if (!checks.tel) e.tel = "Bitte gültige deutsche Nummer eingeben";
    if (!form.consent) e.consent = "Bitte stimmen Sie zu, damit wir Sie kontaktieren dürfen";
    setErrors(e);
    setTouched({ vorname: true, nachname: true, plz: true, tel: true });
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev: React.FormEvent) => {
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
          schaetzung,
          src: new URLSearchParams(window.location.search).get("src") || defaultSrc,
          consent: form.consent,
        }),
      });
      if (response.ok) {
        setSent(true);
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

  if (sent) {
    const uploadLink = `/abrechnung-hochladen?${new URLSearchParams({ vorname: form.vorname.trim(), nachname: form.nachname.trim(), src: "nach-lead" })}`;
    return (
      <div className={styles.success} role="status">
        <span className={styles.successIcon}>✓</span>
        <h3>Danke, {form.vorname.trim()}! Ihr Platz ist reserviert.</h3>
        <p className={styles.lead}>
          Wir melden uns innerhalb von 24 Stunden – das Ergebnis kommt per WhatsApp. Noch schneller geht es mit einem Foto Ihrer letzten Rechnungen:
        </p>
        <a href={uploadLink} className={styles.btn}>
          📷 Rechnung fotografieren →
        </a>
        <button type="button" className={styles.resetLink} onClick={() => setSent(false)}>
          Angaben ändern
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className={styles.form}>
      <span className={styles.formTitle}>Ergebnis in 24 Stunden</span>
      <div className={styles.row2}>
        <label className={styles.field}>
          <span>Vorname</span>
          <input
            type="text"
            autoComplete="given-name"
            placeholder="z. B. Anna"
            value={form.vorname}
            onChange={(e) => set("vorname", e.target.value)}
            onBlur={() => setTouched((t) => ({ ...t, vorname: true }))}
            aria-invalid={!!errors.vorname}
            className={fieldClass("vorname")}
          />
          {errors.vorname && <span className={styles.error}>{errors.vorname}</span>}
        </label>
        <label className={styles.field}>
          <span>Nachname</span>
          <input
            type="text"
            autoComplete="family-name"
            placeholder="z. B. Müller"
            value={form.nachname}
            onChange={(e) => set("nachname", e.target.value)}
            onBlur={() => setTouched((t) => ({ ...t, nachname: true }))}
            aria-invalid={!!errors.nachname}
            className={fieldClass("nachname")}
          />
          {errors.nachname && <span className={styles.error}>{errors.nachname}</span>}
        </label>
      </div>
      <label className={styles.field}>
        <span>Postleitzahl</span>
        <input
          type="text"
          inputMode="numeric"
          autoComplete="postal-code"
          placeholder="z. B. 95704"
          maxLength={5}
          value={form.plz}
          onChange={(e) => set("plz", e.target.value.replace(/\D/g, ""))}
          onBlur={() => setTouched((t) => ({ ...t, plz: true }))}
          aria-invalid={!!errors.plz}
          className={fieldClass("plz")}
        />
        {errors.plz && <span className={styles.error}>{errors.plz}</span>}
      </label>
      <label className={styles.field}>
        <span>Handynummer (für WhatsApp)</span>
        <input
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="z. B. 0151 12345678"
          value={form.tel}
          onChange={(e) => set("tel", e.target.value)}
          onBlur={() => setTouched((t) => ({ ...t, tel: true }))}
          aria-invalid={!!errors.tel}
          className={fieldClass("tel")}
        />
        {errors.tel && <span className={styles.error}>{errors.tel}</span>}
      </label>
      <label className={styles.consent}>
        <input type="checkbox" checked={form.consent} onChange={(e) => set("consent", e.target.checked)} />
        <span>
          Ich stimme zu, dass meine Daten für einen Rückruf und WhatsApp-Kontakt genutzt werden, und akzeptiere die{" "}
          <a href="/datenschutz.html" target="_blank">
            Datenschutzerklärung
          </a>
          .
        </span>
      </label>
      {errors.consent && <span className={styles.error}>{errors.consent}</span>}
      {errors.submit && (
        <span className={styles.error} role="alert">
          {errors.submit}
        </span>
      )}
      <button type="submit" disabled={loading} className={styles.btn}>
        {loading ? "Wird gesendet …" : "Kostenlos prüfen lassen →"}
      </button>
      <span className={styles.micro}>
        🔒 0 € · kein Vertrag · noch {freiePlaetze} Plätze im {ANGEBOT.monat}
      </span>
    </form>
  );
}
