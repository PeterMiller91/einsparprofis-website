"use client";

import { useRef, useState } from "react";
import base from "../landing.module.css";
import styles from "./waermepumpe.module.css";
import { isNameValid, isPhoneValid, isPlzValid, normalizePhone } from "../lib/leadValidation";
import {
  CONSENT_TELEFON,
  CONSENT_VERSION,
  CONSENT_WEITERGABE,
  QUIZ,
  WP,
  berechneFoerderung,
  labelFor,
  wpFreiePlaetze,
  type QuizAnswers,
  type QuizKey,
} from "../lib/waermepumpe";
import { eur } from "../lib/angebot";

const RUECKRUF = ["Egal", "Vormittags", "Nachmittags", "Abends"];

export default function WaermepumpeQuiz() {
  const [step, setStep] = useState(0); // 0..4 questions, 5 result + contact
  const [answers, setAnswers] = useState<QuizAnswers>({});
  const [form, setForm] = useState({ vorname: "", nachname: "", plz: "", tel: "", rueckruf: "Egal", firma: "" });
  const [consentTel, setConsentTel] = useState(false);
  const [consentWeitergabe, setConsentWeitergabe] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const top = useRef<HTMLDivElement>(null);

  const total = QUIZ.length;
  const foerderung = berechneFoerderung(answers);

  const goTo = (next: number) => {
    setStep(next);
    // Keep the card in view on phones when the content height changes
    requestAnimationFrame(() => top.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  };

  const choose = (key: QuizKey, value: string) => {
    setAnswers((a) => ({ ...a, [key]: value }));
    goTo(step + 1);
  };

  const set = (key: keyof typeof form, value: string) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: "", submit: "" }));
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!isNameValid(form.vorname)) e.vorname = "Bitte Vornamen eingeben";
    if (!isNameValid(form.nachname)) e.nachname = "Bitte Nachnamen eingeben";
    if (!isPlzValid(form.plz)) e.plz = "5-stellige PLZ";
    if (!isPhoneValid(form.tel)) e.tel = "Bitte gültige deutsche Nummer eingeben";
    if (!consentTel) e.consentTel = "Ohne Ihre Zustimmung dürfen wir Sie nicht anrufen";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (loading || !validate()) return;
    setLoading(true);
    try {
      const response = await fetch("/api/waermepumpe-lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vorname: form.vorname.trim(),
          nachname: form.nachname.trim(),
          plz: form.plz,
          tel: normalizePhone(form.tel),
          rueckruf: form.rueckruf,
          firma: form.firma, // honeypot
          answers,
          foerderung: `${foerderung.prozent} % · bis ${eur(foerderung.euro).replace("\u00a0", " ")}`,
          consentTelefon: consentTel,
          consentWeitergabe,
          consentVersion: CONSENT_VERSION,
          src: new URLSearchParams(window.location.search).get("src") || "waermepumpe",
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

  if (sent) {
    const upload = `/abrechnung-hochladen?${new URLSearchParams({ vorname: form.vorname.trim(), nachname: form.nachname.trim(), src: "waermepumpe" })}`;
    return (
      <div ref={top} className={`${base.card} ${base.shadowCard} ${styles.quizCard}`} role="status">
        <div className={base.success}>
          <span className={base.successIcon}>✓</span>
          <h3>Danke, {form.vorname.trim()}! Wir rufen Sie innerhalb von 24 Stunden an.</h3>
          <p className={base.lead}>
            {form.rueckruf !== "Egal" ? `Am besten ${form.rueckruf.toLowerCase()} – notiert. ` : ""}
            Damit wir Ihr Haus schon vorab einschätzen können: Schicken Sie uns ein Foto Ihrer letzten Heizkostenabrechnung.
          </p>
          <a href={upload} className={base.btn}>
            📷 Abrechnung senden →
          </a>
        </div>
      </div>
    );
  }

  if (step < total) {
    const q = QUIZ[step];
    const pct = Math.round((step / total) * 100);
    return (
      <div ref={top} className={`${base.card} ${base.shadowCard} ${styles.quizCard}`}>
        <div className={styles.progressHead}>
          <span>
            Frage {step + 1} von {total}
          </span>
          <span>{pct} %</span>
        </div>
        <div className={styles.progress} role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
          <div style={{ width: `${Math.max(pct, 4)}%` }} />
        </div>
        <h3 className={styles.question}>{q.frage}</h3>
        <div className={styles.options}>
          {q.optionen.map((o) => (
            <button
              key={o.value}
              type="button"
              className={`${styles.option} ${answers[q.key] === o.value ? styles.selected : ""}`}
              onClick={() => choose(q.key, o.value)}
            >
              <span aria-hidden="true">{o.icon}</span>
              {o.label}
            </button>
          ))}
        </div>
        {step > 0 && (
          <button type="button" className={styles.back} onClick={() => goTo(step - 1)}>
            ← Zurück
          </button>
        )}
      </div>
    );
  }

  return (
    <div ref={top} className={`${base.card} ${base.shadowCard} ${styles.quizCard}`}>
      <div className={styles.result}>
        <span className={styles.resultEyebrow}>Ihr Ergebnis</span>
        {foerderung.prozent > 0 ? (
          <>
            <b className={styles.resultTitle}>Ihre mögliche Förderung</b>
            <strong className={styles.resultValue}>bis {eur(foerderung.euro)}</strong>
            <div className={styles.chips}>
              {foerderung.teile.map((t) => (
                <span key={t.label}>
                  {t.label} {t.prozent} %
                </span>
              ))}
              {foerderung.teile.reduce((s, t) => s + t.prozent, 0) > WP.foerderung.deckel && <span>gedeckelt auf {WP.foerderung.deckel} %</span>}
            </div>
            <p className={styles.resultNote}>
              {foerderung.prozent} % von max. {eur(WP.foerderung.maxKosten)} förderfähigen Kosten (KfW 458). Den genauen Betrag berechnen wir mit Ihrem Angebot.
              {answers.einkommen === "unbekannt" && " Mit Einkommensbonus sind bis zu " + WP.foerderung.deckel + "\u00a0% möglich – das klären wir im Gespräch."}
            </p>
          </>
        ) : (
          <>
            <b className={styles.resultTitle}>Die Förderung beantragt Ihr Vermieter</b>
            <p className={styles.resultNote}>
              Als Mieter können Sie den Zuschuss nicht selbst beantragen. Gerne sprechen wir trotzdem mit Ihnen – zum Beispiel über einen günstigeren Strom- oder Gastarif.
            </p>
          </>
        )}
      </div>

      <form onSubmit={submit} noValidate className={base.form}>
        <span className={base.formTitle}>Wie erreichen wir Sie?</span>
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
        <div className={base.row2}>
          <label className={base.field}>
            <span>Vorname</span>
            <input type="text" autoComplete="given-name" value={form.vorname} onChange={(e) => set("vorname", e.target.value)} aria-invalid={!!errors.vorname} />
            {errors.vorname && <span className={base.error}>{errors.vorname}</span>}
          </label>
          <label className={base.field}>
            <span>Nachname</span>
            <input type="text" autoComplete="family-name" value={form.nachname} onChange={(e) => set("nachname", e.target.value)} aria-invalid={!!errors.nachname} />
            {errors.nachname && <span className={base.error}>{errors.nachname}</span>}
          </label>
        </div>
        <div className={base.row2}>
          <label className={base.field}>
            <span>PLZ des Hauses</span>
            <input
              type="text"
              inputMode="numeric"
              autoComplete="postal-code"
              maxLength={5}
              value={form.plz}
              onChange={(e) => set("plz", e.target.value.replace(/\D/g, ""))}
              aria-invalid={!!errors.plz}
            />
            {errors.plz && <span className={base.error}>{errors.plz}</span>}
          </label>
          <label className={base.field}>
            <span>Rückruf am besten</span>
            <select className={styles.select} value={form.rueckruf} onChange={(e) => set("rueckruf", e.target.value)}>
              {RUECKRUF.map((r) => (
                <option key={r}>{r}</option>
              ))}
            </select>
          </label>
        </div>
        <label className={base.field}>
          <span>Telefonnummer</span>
          <input
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="z. B. 0151 12345678"
            value={form.tel}
            onChange={(e) => set("tel", e.target.value)}
            aria-invalid={!!errors.tel}
          />
          {errors.tel && <span className={base.error}>{errors.tel}</span>}
        </label>

        <label className={`${base.consent} ${styles.optIn} ${errors.consentTel ? styles.optInError : ""}`}>
          <input
            type="checkbox"
            checked={consentTel}
            onChange={(e) => {
              setConsentTel(e.target.checked);
              setErrors((er) => ({ ...er, consentTel: "" }));
            }}
          />
          <span>
            <b>{CONSENT_TELEFON}</b>
          </span>
        </label>
        {errors.consentTel && <span className={base.error}>{errors.consentTel}</span>}

        <label className={base.consent}>
          <input type="checkbox" checked={consentWeitergabe} onChange={(e) => setConsentWeitergabe(e.target.checked)} />
          <span>
            {CONSENT_WEITERGABE} <i>(optional – sonst fragen wir Sie vorher.)</i>
          </span>
        </label>

        <p className={styles.privacy}>
          Ihre Angaben verwenden wir nur für Ihren Wärmepumpen-Check. Details in der{" "}
          <a href="/datenschutz.html" target="_blank">
            Datenschutzerklärung
          </a>
          .
        </p>

        {errors.submit && (
          <span className={base.error} role="alert">
            {errors.submit}
          </span>
        )}
        <button type="submit" disabled={loading} className={base.btn}>
          {loading ? "Wird gesendet …" : "Rückruf anfordern →"}
        </button>
        <span className={base.micro}>
          🔒 0 € · unverbindlich · noch {wpFreiePlaetze} Plätze im {WP.monat}
        </span>
        <button type="button" className={styles.back} onClick={() => goTo(total - 1)}>
          ← Antworten ändern
        </button>
      </form>
      <p className={styles.summary}>
        {QUIZ.map((q) => labelFor(q.key, answers[q.key])).join(" · ")}
      </p>
    </div>
  );
}
