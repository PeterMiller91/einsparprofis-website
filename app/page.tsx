"use client";

import { useState } from "react";

export default function Home() {
  // Configuration (from DESIGN.md section C)
  const CONFIG = {
    betrag: 20,
    praemie: 20,
    plaetze: 30,
    belegt: 21,
    monat: "Oktober",
    frist: "30.11.",
  };

  const frei = CONFIG.plaetze - CONFIG.belegt;
  const belegtPct = Math.round((CONFIG.belegt / CONFIG.plaetze) * 100) + "%";
  const gesamt = (499 + CONFIG.praemie) + " €";

  // State
  const [strom, setStrom] = useState(90);
  const [gas, setGas] = useState(110);
  const [vers, setVers] = useState(600);
  const [openFaqIndex, setOpenFaqIndex] = useState(0);
  const [formState, setFormState] = useState({
    name: "",
    plz: "",
    tel: "",
    consent: false,
  });
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Validation functions
  const isPhoneValid = (tel: string) => {
    const digits = tel.replace(/\D/g, "");
    // Germany: +49 (11-13 digits total), or 0 (10-11 digits total)
    if (tel.startsWith("+49")) {
      return digits.length >= 11 && digits.length <= 13;
    }
    if (tel.startsWith("0")) {
      return digits.length >= 10 && digits.length <= 11;
    }
    // Without prefix: at least 10 digits
    return digits.length >= 10 && digits.length <= 13;
  };

  const isPlzValid = (plz: string) => {
    // Germany PLZ: 5 digits, doesn't start with 0
    return /^[1-9]\d{4}$/.test(plz);
  };

  const isNameValid = (name: string) => {
    // At least 2 characters, only letters, spaces, hyphens, umlauts
    return /^[a-zA-ZäöüßÄÖÜ\s\-]{2,}$/.test(name.trim());
  };

  const isTelValid = touched.tel && formState.tel && isPhoneValid(formState.tel);
  const isPlzValid_check = touched.plz && formState.plz && isPlzValid(formState.plz);
  const isNameValid_check = touched.name && formState.name && isNameValid(formState.name);

  // Calculations (DESIGN.md section C, line 357)
  const eur = (n: number) => n.toLocaleString("de-DE") + " €";
  const sparText = eur(Math.round(strom * 12 * 0.15 + gas * 12 * 0.15 + vers * 0.2));

  // Data from DESIGN.md
  const problems = [
    { o: "Das ist mir zu kompliziert.", s: "Wir kündigen, melden an und füllen alle Formulare aus." },
    { o: "Dafür habe ich keine Zeit.", s: "Ein Anruf, 5 Minuten. Den Rest machen wir." },
    { o: "Am Ende spare ich doch nichts.", s: `Keine Ersparnis? Dann gibt es einen ${CONFIG.betrag}-€-Gutschein aufs Haus.` },
    { o: "Da gibt es bestimmt einen Haken.", s: "Kein Vertrag mit uns, keine Kosten. Sie können jederzeit Nein sagen." },
    { o: "Dann sitze ich ohne Strom da.", s: "Die Versorgung läuft beim Wechsel ohne Unterbrechung weiter." },
    { o: "Nächstes Jahr wird es wieder teurer.", s: "Der Preis-Wächter meldet sich vor jeder Erhöhung." },
  ];

  const stack = [
    { n: "1", t: "Strom- & Gas-Check", d: "Wir vergleichen alle Tarife in Ihrer Region, inklusive Bonus- und Laufzeitfallen.", v: "Wert 150 €", bg: "#1C1233", fg: "#FFD60A" },
    { n: "2", t: "Versicherungs-Check", d: "Hausrat, Wohngebäude und Haftpflicht: gleicher Schutz, weniger Beitrag.", v: "Wert 150 €", bg: "#1C1233", fg: "#FFD60A" },
    { n: "3", t: "Wechsel-Service", d: "Kündigung beim alten, Anmeldung beim neuen Anbieter, Zählerstände, Papierkram.", v: "Wert 100 €", bg: "#1C1233", fg: "#FFD60A" },
    { n: "+", t: "Bonus: Preis-Wächter", d: "Wir behalten Ihre Verträge im Blick und melden uns vor jeder Preiserhöhung.", v: "Wert 99 €/Jahr", bg: "#DB2C14", fg: "#FFFFFF" },
    { n: "+", t: "Bonus: Empfehlungsprämie", d: `${CONFIG.praemie} € für jeden Haushalt, den Sie uns empfehlen. Nur bei Abschluss.`, v: `je ${CONFIG.praemie} €`, bg: "#DB2C14", fg: "#FFFFFF" },
  ];

  const guaranteePoints = [
    "Sie zahlen für den Check nichts, auch wenn Sie nicht wechseln.",
    "Sie unterschreiben nur, wenn Ihnen der neue Tarif gefällt.",
    `Finden wir keine Ersparnis, bekommen Sie einen ${CONFIG.betrag}-€-Gutschein aufs Haus.`,
  ];

  const steps = [
    { n: "1", who: "Sie · 1 Min.", t: "Platz sichern", s: "Name, PLZ und Telefonnummer eintragen." },
    { n: "2", who: "Sie · 5 Min.", t: "Kurzes Telefonat", s: "Wir gehen Ihre Rechnungen gemeinsam durch." },
    { n: "3", who: "Wir · 24 h", t: "Ergebnis per WhatsApp", s: "Sie bekommen schwarz auf weiß, wie viel Sie sparen." },
    { n: "4", who: "Wir", t: "Wechsel", s: "Wir kündigen, melden an und bestätigen Ihnen alles." },
  ];

  const faqs = [
    { q: "Was kostet mich das?", a: "Nichts. Der neue Anbieter zahlt uns eine Provision. Ihr Tarif wird dadurch nicht teurer." },
    { q: "Was, wenn Sie keine Ersparnis finden?", a: `Dann bekommen Sie einen ${CONFIG.betrag}-€-Gutschein aufs Haus. Voraussetzung: Sie haben uns Ihre aktuellen Rechnungen gezeigt.` },
    { q: "Muss ich mich an Sie binden?", a: "Nein. Sie schließen keinen Vertrag mit uns. Gefällt Ihnen unser Vorschlag nicht, sagen Sie Nein." },
    { q: "Bin ich beim Wechsel ohne Strom oder Gas?", a: "Nein. Die Versorgung läuft beim Anbieterwechsel ohne Unterbrechung weiter." },
    { q: "Welche Versicherungen prüfen Sie?", a: "Hausrat, Wohngebäude und Privathaftpflicht. Wir vergleichen bei gleichem oder besserem Schutz." },
    { q: "Wie funktioniert die Empfehlungsprämie?", a: `Empfehlen Sie uns weiter. Schließt der empfohlene Haushalt ab, bekommen Sie ${CONFIG.praemie} €. Ohne Abschluss gibt es keine Prämie.` },
  ];

  // Validation
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formState.name.trim()) {
      newErrors.name = "Vorname erforderlich";
    }

    if (!/^\d{5}$/.test(formState.plz)) {
      newErrors.plz = "PLZ muss 5 Ziffern haben";
    }

    if (!/^\d{6,}/.test(formState.tel.replace(/\D/g, ""))) {
      newErrors.tel = "Telefon mindestens 6 Ziffern";
    }

    if (!formState.consent) {
      newErrors.consent = "Bitte akzeptieren Sie die Datenschutzbestimmungen";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    try {
      const response = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formState.name,
          plz: formState.plz,
          tel: formState.tel,
          schaetzung: sparText,
          src: new URLSearchParams(window.location.search).get("src") || "landingpage",
          consent: formState.consent,
        }),
      });

      if (response.ok) {
        setSent(true);
      } else {
        setErrors({ submit: "Fehler beim Absenden. Bitte versuchen Sie es später erneut." });
      }
    } catch (error) {
      setErrors({ submit: "Verbindungsfehler. Bitte versuchen Sie es später erneut." });
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSent(false);
    setFormState({ name: "", plz: "", tel: "", consent: false });
    setErrors({});
  };

  return (
    <div style={{ fontFamily: "var(--font-dm-sans)", color: "#1C1233", background: "#FFF7EA" }}>
      {/* B1. Banner */}
      <div style={{ background: "#1C1233", color: "#FFF7EA", padding: "10px 20px", display: "flex", justifyContent: "center", flexWrap: "wrap", gap: "6px 16px", fontSize: "15px", fontWeight: 700, textAlign: "center" }}>
        <span>Noch {frei} von {CONFIG.plaetze} Plätzen im {CONFIG.monat}</span>
        <span style={{ color: "#FFD60A" }}>Preis-Wächter gratis bis {CONFIG.frist}</span>
      </div>

      {/* B2. Header */}
      <header style={{ maxWidth: "1240px", margin: "0 auto", padding: "18px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px", flexWrap: "wrap" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "3px", fontFamily: "var(--font-bricolage)" }}>
          <span style={{ fontSize: "11px", fontWeight: 800, letterSpacing: "0.2em", textTransform: "uppercase", paddingLeft: "5px" }}>die</span>
          <div style={{ background: "#DB2C14", color: "#FFFFFF", transform: "rotate(-3deg)", padding: "5px 12px 8px", borderRadius: "9px", fontSize: "22px", fontWeight: 800, lineHeight: "0.86", textTransform: "uppercase", display: "flex", flexDirection: "column" }}>
            <span>Einspar</span>
            <span>Profis %</span>
          </div>
        </div>
        <nav style={{ display: "flex", alignItems: "center", gap: "8px 26px", flexWrap: "wrap", fontSize: "16px", fontWeight: 500 }}>
          <a href="#rechner" style={{ color: "#1C1233" }}>Rechner</a>
          <a href="#angebot" style={{ color: "#1C1233" }}>Angebot</a>
          <a href="#garantie" style={{ color: "#1C1233" }}>Gutschein</a>
          <a href="#faq" style={{ color: "#1C1233" }}>Fragen</a>
          <a href="#start" style={{ background: "#DB2C14", color: "#FFFFFF", padding: "12px 22px", borderRadius: "999px", fontWeight: 700 }}>Check sichern</a>
        </nav>
      </header>

      {/* B3. Hero */}
      <section style={{ maxWidth: "1240px", margin: "0 auto", padding: "40px 24px 80px", display: "grid", gridTemplateColumns: "1fr", gap: "56px", alignItems: "center" }} className="grid-2-desktop">
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          <span style={{ alignSelf: "flex-start", fontSize: "14px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", border: "2px solid #1C1233", borderRadius: "999px", padding: "7px 14px" }}>Der 400-€-Haushalts-Check</span>
          <h1 style={{ margin: 0, fontFamily: "var(--font-bricolage)", fontWeight: 800, fontSize: "clamp(46px, 6.4vw, 88px)", lineHeight: "0.98", letterSpacing: "-0.045em", textWrap: "balance" }}>
            Holen Sie sich{" "}
            <span style={{ display: "inline-block", background: "#FFD60A", padding: "0 14px 8px", borderRadius: "18px", transform: "rotate(-2deg)" }}>
              400 € im Jahr
            </span>{" "}
            zurück.
          </h1>
          <p style={{ margin: 0, fontSize: "clamp(18px, 1.7vw, 22px)", lineHeight: "1.45", color: "#4E4262", maxWidth: "580px", textWrap: "pretty" }}>
            Wir prüfen Strom, Gas und Ihre Sachversicherungen, kündigen die teuren Verträge und melden Sie beim günstigeren Anbieter an. Sie zahlen dafür nichts. Finden wir keine Ersparnis, bekommen Sie einen {CONFIG.betrag}-€-Gutschein aufs Haus.
          </p>
          <div style={{ display: "flex", gap: "14px", flexWrap: "wrap", alignItems: "center" }}>
            <a href="#start" style={{ background: "#DB2C14", color: "#FFFFFF", borderRadius: "999px", padding: "20px 32px", fontFamily: "var(--font-bricolage)", fontWeight: 800, fontSize: "22px", display: "inline-block", transition: "all 0.2s" }} onMouseEnter={(e) => (e.currentTarget.style.background = "#B8230F")} onMouseLeave={(e) => (e.currentTarget.style.background = "#DB2C14")}>
              Platz sichern →
            </a>
            <a href="#rechner" style={{ color: "#1C1233", fontWeight: 700, fontSize: "18px", borderBottom: "2px solid #1C1233", paddingBottom: "2px", display: "inline-block" }}>
              Erst Ersparnis schätzen
            </a>
          </div>
          <div style={{ display: "flex", gap: "10px 24px", flexWrap: "wrap", fontSize: "17px", fontWeight: 700 }}>
            <span>✓ 0 € Kosten</span>
            <span>✓ Ergebnis per WhatsApp in 24 h</span>
            <span>✓ Kein Vertrag mit uns</span>
          </div>
        </div>
        <div style={{ position: "relative", padding: "20px 20px 0 0" }}>
          <div style={{ position: "absolute", top: "-12px", right: "-4px", width: "132px", height: "132px", borderRadius: "50%", background: "#DB2C14", color: "#FFFFFF", transform: "rotate(12deg)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-bricolage)", fontWeight: 800, lineHeight: "1", textAlign: "center", zIndex: 1 }}>
            <span style={{ fontSize: "15px" }}>Wert</span>
            <span style={{ fontSize: "34px", textDecoration: "line-through", textDecorationColor: "#FFD60A" }}>450 €</span>
            <span style={{ fontSize: "18px" }}>für 0 €</span>
          </div>
          <div style={{ background: "#FFFFFF", borderRadius: "28px", padding: "32px", display: "flex", flexDirection: "column", gap: "6px", boxShadow: "0 0 0 4px #1C1233, 12px 12px 0 4px #1C1233" }}>
            <span style={{ alignSelf: "flex-start", fontSize: "13px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", border: "2px solid #1C1233", borderRadius: "999px", padding: "5px 12px" }}>Empfehlung des Hauses</span>
            <span style={{ margin: "14px 0 12px", fontFamily: "var(--font-bricolage)", fontSize: "36px", fontWeight: 800, letterSpacing: "-0.04em", lineHeight: "1.05" }}>
              Heute als Empfehlung:{" "}
              <span style={{ display: "inline-block", background: "#DB2C14", color: "#FFFFFF", padding: "0px 10px 5px", borderRadius: "12px", transform: "rotate(-2deg)" }}>
                die Spar-Karte.
              </span>
            </span>
            {["Strom- & Gas-Check", "Versicherungs-Check", "Wechsel-Service"].map((m, i) => (
              <div key={i} style={{ display: "flex", alignItems: "baseline", gap: "10px", padding: "8px 0", fontSize: "19px", fontWeight: 700 }}>
                <span style={{ whiteSpace: "nowrap" }}>{m}</span>
                <span style={{ flex: 1, borderBottom: "2px dotted #1C1233", transform: "translateY(-4px)" }}></span>
                <span style={{ fontFamily: "var(--font-bricolage)", fontWeight: 800 }}>0,00 €</span>
              </div>
            ))}
            <div style={{ marginTop: "8px", borderTop: "2px solid #1C1233", paddingTop: "10px", display: "flex", flexDirection: "column", gap: "4px" }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: "10px", fontSize: "19px", fontWeight: 700 }}>
                <span style={{ whiteSpace: "nowrap" }}>Empfehlungsprämie</span>
                <span style={{ flex: 1, borderBottom: "2px dotted #1C1233", transform: "translateY(-4px)" }}></span>
                <span style={{ fontFamily: "var(--font-bricolage)", fontWeight: 800, background: "#FFD60A", borderRadius: "6px", padding: "0 6px 2px", transform: "rotate(-3deg)" }}>+{CONFIG.praemie},00 €</span>
              </div>
              <span style={{ fontSize: "14px", fontWeight: 500, color: "#4E4262" }}>Für jeden Haushalt, den Sie uns empfehlen.* *nur bei Abschluss</span>
            </div>
            <div style={{ marginTop: "16px", display: "flex", alignItems: "center", gap: "12px", border: "2px dashed #1C1233", borderRadius: "14px", padding: "10px 14px" }}>
              <span style={{ flexShrink: 0, background: "#FFD60A", borderRadius: "8px", padding: "2px 8px 4px", fontFamily: "var(--font-bricolage)", fontSize: "24px", fontWeight: 800, transform: "rotate(-3deg)" }}>{CONFIG.betrag} €</span>
              <span style={{ fontSize: "15px", fontWeight: 700, lineHeight: "1.3" }}>Keine Ersparnis gefunden? Gutschein aufs Haus.</span>
            </div>
          </div>
        </div>
      </section>

      {/* B4. Probleme */}
      <section style={{ background: "#1C1233", color: "#FFF7EA", padding: "88px 24px" }}>
        <div style={{ maxWidth: "1240px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "44px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "14px", maxWidth: "820px" }}>
            <span style={{ fontSize: "14px", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#FFD60A" }}>Warum fast niemand wechselt</span>
            <h2 style={{ margin: 0, fontFamily: "var(--font-bricolage)", fontWeight: 800, fontSize: "clamp(36px, 4.6vw, 60px)", letterSpacing: "-0.04em", lineHeight: "1.02", textWrap: "balance" }}>
              Jeder Grund, es nicht zu tun, ist bei uns schon gelöst.
            </h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 340px), 1fr))", gap: "18px" }}>
            {problems.map((p, i) => (
              <div key={i} style={{ background: "#2E2447", borderRadius: "24px", padding: "28px", display: "flex", flexDirection: "column", gap: "14px" }}>
                <span style={{ fontSize: "19px", fontWeight: 500, color: "#D8D0E4", textDecoration: "line-through", textDecorationColor: "#DB2C14", textDecorationThickness: "2px" }}>
                  „{p.o}"
                </span>
                <span style={{ fontFamily: "var(--font-bricolage)", fontWeight: 800, fontSize: "26px", letterSpacing: "-0.02em", lineHeight: "1.1" }}>
                  {p.s}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* B5. Spar-Rechner */}
      <section id="rechner" style={{ maxWidth: "1240px", margin: "0 auto", padding: "96px 24px", display: "grid", gridTemplateColumns: "1fr", gap: "48px", alignItems: "center" }} className="grid-2-desktop">
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <span style={{ fontSize: "14px", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#DB2C14" }}>Spar-Rechner</span>
          <h2 style={{ margin: 0, fontFamily: "var(--font-bricolage)", fontWeight: 800, fontSize: "clamp(36px, 4.6vw, 60px)", letterSpacing: "-0.04em", lineHeight: "1.02" }}>
            Wie viel ist es{" "}
            <span style={{ display: "inline-block", background: "#FFD60A", padding: "0 12px 6px", borderRadius: "14px", transform: "rotate(-2deg)" }}>
              bei Ihnen?
            </span>
          </h2>
          <p style={{ margin: 0, fontSize: "19px", lineHeight: "1.5", color: "#4E4262", maxWidth: "500px" }}>
            Schieben Sie die Regler auf Ihre aktuellen Kosten. Den genauen Betrag ermitteln wir im Check anhand Ihrer Rechnungen.
          </p>
        </div>
        <div style={{ background: "#FFFFFF", borderRadius: "28px", padding: "32px", display: "flex", flexDirection: "column", gap: "26px", boxShadow: "inset 0 0 0 2px #F0E2CC" }}>
          <label style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <span style={{ display: "flex", justifyContent: "space-between", gap: "12px", fontSize: "17px" }}>
              <span style={{ fontWeight: 700 }}>Strom-Abschlag pro Monat</span>
              <span style={{ fontWeight: 700 }}>{eur(strom)}</span>
            </span>
            <input
              type="range"
              min="30"
              max="250"
              step="5"
              value={strom}
              onChange={(e) => setStrom(Number(e.target.value))}
              style={{ width: "100%", height: "28px" }}
            />
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <span style={{ display: "flex", justifyContent: "space-between", gap: "12px", fontSize: "17px" }}>
              <span style={{ fontWeight: 700 }}>Gas-Abschlag pro Monat</span>
              <span style={{ fontWeight: 700 }}>{eur(gas)}</span>
            </span>
            <input
              type="range"
              min="0"
              max="300"
              step="5"
              value={gas}
              onChange={(e) => setGas(Number(e.target.value))}
              style={{ width: "100%", height: "28px" }}
            />
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <span style={{ display: "flex", justifyContent: "space-between", gap: "12px", fontSize: "17px" }}>
              <span style={{ fontWeight: 700 }}>Sachversicherungen pro Jahr</span>
              <span style={{ fontWeight: 700 }}>{eur(vers)}</span>
            </span>
            <input
              type="range"
              min="0"
              max="1500"
              step="50"
              value={vers}
              onChange={(e) => setVers(Number(e.target.value))}
              style={{ width: "100%", height: "28px" }}
            />
          </label>
          <div style={{ background: "#DB2C14", color: "#FFFFFF", borderRadius: "22px", padding: "24px 26px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
              <span style={{ fontSize: "15px", fontWeight: 700 }}>Geschätzte Ersparnis pro Jahr</span>
              <span style={{ fontSize: "13px", opacity: 0.9 }}>unverbindlich</span>
            </div>
            <span style={{ fontFamily: "var(--font-bricolage)", fontWeight: 800, fontSize: "52px", letterSpacing: "-0.03em", lineHeight: "1" }}>
              {sparText}
            </span>
          </div>
          <a href="#start" style={{ background: "#1C1233", color: "#FFF7EA", borderRadius: "999px", padding: "18px", textAlign: "center", fontFamily: "var(--font-bricolage)", fontWeight: 800, fontSize: "20px", display: "block", cursor: "pointer", transition: "all 0.2s" }} onMouseEnter={(e) => (e.currentTarget.style.background = "#3a3347")} onMouseLeave={(e) => (e.currentTarget.style.background = "#1C1233")}>
            Diese Ersparnis sichern →
          </a>
        </div>
      </section>

      {/* B6. Wertstapel */}
      <section id="angebot" style={{ background: "#FFE9D6", padding: "96px 24px", width: "100%", overflowX: "hidden" }}>
        <div style={{ maxWidth: "1000px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "36px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "14px", textAlign: "center", alignItems: "center" }}>
            <span style={{ fontSize: "14px", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#DB2C14" }}>Das ist alles drin</span>
            <h2 style={{ margin: 0, fontFamily: "var(--font-bricolage)", fontWeight: 800, fontSize: "clamp(36px, 4.6vw, 60px)", letterSpacing: "-0.04em", lineHeight: "1.02", textWrap: "balance" }}>
              Der 400-€-Haushalts-Check
            </h2>
          </div>
          <div style={{ background: "#FFFFFF", borderRadius: "28px", padding: "clamp(20px, 3vw, 36px)", display: "flex", flexDirection: "column", boxShadow: "0 0 0 4px #1C1233, 12px 12px 0 4px #1C1233" }}>
            {stack.map((s, i) => (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "44px minmax(0, 1fr) auto", gap: "16px", alignItems: "start", padding: "20px 0", borderBottom: i < stack.length - 1 ? "2px solid #F0E2CC" : "none" }}>
                <span style={{ width: "44px", height: "44px", borderRadius: "50%", background: s.bg, color: s.fg, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-bricolage)", fontWeight: 800, fontSize: "18px" }}>
                  {s.n}
                </span>
                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  <span style={{ fontFamily: "var(--font-bricolage)", fontWeight: 800, fontSize: "24px", letterSpacing: "-0.02em" }}>
                    {s.t}
                  </span>
                  <span style={{ fontSize: "17px", lineHeight: "1.45", color: "#4E4262" }}>{s.d}</span>
                </div>
                <span style={{ fontWeight: 700, fontSize: "18px", whiteSpace: "nowrap", paddingTop: "4px" }}>{s.v}</span>
              </div>
            ))}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "20px", flexWrap: "wrap", paddingTop: "26px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                <span style={{ fontSize: "16px", color: "#4E4262" }}>Gesamtwert</span>
                <span style={{ fontFamily: "var(--font-bricolage)", fontSize: "40px", fontWeight: 800, textDecoration: "line-through", textDecorationColor: "#DB2C14" }}>
                  {gesamt}
                </span>
              </div>
              <div style={{ background: "#DB2C14", color: "#FFFFFF", borderRadius: "20px", padding: "14px 26px", display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
                <span style={{ fontSize: "14px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>Ihr Preis</span>
                <span style={{ fontFamily: "var(--font-bricolage)", fontSize: "56px", fontWeight: 800, lineHeight: "1" }}>0 €</span>
              </div>
            </div>
          </div>
          <p style={{ margin: 0, fontSize: "16px", lineHeight: "1.5", color: "#4E4262", textAlign: "center", maxWidth: "720px", alignSelf: "center", textWrap: "pretty" }}>
            Warum kostenlos? Der neue Anbieter zahlt uns eine Vermittlungsprovision. Ihr Tarif wird dadurch nicht teurer.
          </p>
        </div>
      </section>

      {/* B7. Garantie */}
      <section id="garantie" style={{ maxWidth: "1240px", margin: "0 auto", padding: "96px 24px", display: "grid", gridTemplateColumns: "1fr", gap: "40px", alignItems: "center" }} className="grid-2-desktop">
        <div style={{ background: "#FFD60A", borderRadius: "32px", padding: "clamp(28px, 4vw, 48px)", display: "flex", flexDirection: "column", gap: "16px", transform: "rotate(-1.5deg)" }}>
          <div style={{ border: "3px dashed #1C1233", borderRadius: "22px", background: "#FFF7EA", padding: "24px", display: "flex", flexDirection: "column", alignItems: "center", gap: "6px", textAlign: "center" }}>
            <span style={{ fontSize: "14px", fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase" }}>Gutschein aufs Haus</span>
            <span style={{ fontFamily: "var(--font-bricolage)", fontSize: "clamp(72px, 9vw, 112px)", fontWeight: 800, lineHeight: "0.9", letterSpacing: "-0.05em", color: "#DB2C14" }}>
              {CONFIG.betrag} €
            </span>
            <span style={{ fontSize: "18px", fontWeight: 700, lineHeight: "1.35" }}>wenn wir bei Strom, Gas und Versicherung keine Ersparnis finden.</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", gap: "16px", fontSize: "18px", fontWeight: 700 }}>
            <span>
              Ersparnis gefunden:
              <br />
              Ø 400 € im Jahr
            </span>
            <span style={{ textAlign: "right" }}>
              Nichts gefunden:
              <br />
              {CONFIG.betrag} € für Sie
            </span>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
          <h2 style={{ margin: 0, fontFamily: "var(--font-bricolage)", fontWeight: 800, fontSize: "clamp(34px, 4vw, 52px)", letterSpacing: "-0.04em", lineHeight: "1.04" }}>
            Sie gewinnen.{" "}
            <span style={{ display: "inline-block", background: "#DB2C14", color: "#FFFFFF", padding: "0 12px 6px", borderRadius: "14px", transform: "rotate(-2deg)" }}>
              So oder so.
            </span>
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            {guaranteePoints.map((g, i) => (
              <div key={i} style={{ display: "flex", gap: "14px", alignItems: "flex-start", fontSize: "18px", lineHeight: "1.45" }}>
                <span style={{ width: "32px", height: "32px", flexShrink: 0, borderRadius: "50%", background: "#1C1233", color: "#FFD60A", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px", fontWeight: 700 }}>
                  ✓
                </span>
                <span>{g}</span>
              </div>
            ))}
          </div>
          <span style={{ fontSize: "14px", lineHeight: "1.5", color: "#4E4262" }}>
            Bedingung: Sie legen aktuelle Rechnungen für Strom, Gas und Ihre Sachversicherungen vor. Einmal pro Haushalt.
          </span>
        </div>
      </section>

      {/* B8. Ablauf */}
      <section style={{ background: "#1C1233", color: "#FFF7EA", padding: "88px 24px" }}>
        <div style={{ maxWidth: "1240px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "44px" }}>
          <h2 style={{ margin: 0, fontFamily: "var(--font-bricolage)", fontWeight: 800, fontSize: "clamp(36px, 4.6vw, 60px)", letterSpacing: "-0.04em", lineHeight: "1.02" }}>
            Ihr Anteil an der Arbeit:{" "}
            <span style={{ display: "inline-block", background: "#FFD60A", color: "#1C1233", padding: "0 14px 6px", borderRadius: "14px", transform: "rotate(-2deg)" }}>
              5 Minuten.
            </span>
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 260px), 1fr))", gap: "18px" }}>
            {steps.map((st, i) => (
              <div key={i} style={{ background: "#2E2447", borderRadius: "24px", padding: "28px", display: "flex", flexDirection: "column", gap: "12px" }}>
                <span style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ width: "52px", height: "52px", borderRadius: "50%", background: "#DB2C14", color: "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-bricolage)", fontWeight: 800, fontSize: "24px" }}>
                    {st.n}
                  </span>
                  <span style={{ fontSize: "14px", fontWeight: 700, color: "#FFD60A" }}>{st.who}</span>
                </span>
                <span style={{ fontFamily: "var(--font-bricolage)", fontWeight: 800, fontSize: "26px", letterSpacing: "-0.02em" }}>
                  {st.t}
                </span>
                <span style={{ fontSize: "17px", lineHeight: "1.45", color: "#D8D0E4" }}>{st.s}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* B9. Plätze & Bonus */}
      <section style={{ maxWidth: "1240px", margin: "0 auto", padding: "96px 24px", display: "grid", gridTemplateColumns: "1fr", gap: "24px" }} className="grid-2-desktop">
        <div style={{ background: "#FFFFFF", borderRadius: "28px", padding: "36px", display: "flex", flexDirection: "column", gap: "18px", boxShadow: "inset 0 0 0 2px #F0E2CC" }}>
          <span style={{ fontSize: "14px", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#DB2C14" }}>Begrenzte Plätze</span>
          <span style={{ fontFamily: "var(--font-bricolage)", fontWeight: 800, fontSize: "clamp(30px, 3.4vw, 42px)", letterSpacing: "-0.03em", lineHeight: "1.05" }}>
            Nur {CONFIG.plaetze} Haushalte pro Monat.
          </span>
          <span style={{ fontSize: "18px", lineHeight: "1.45", color: "#4E4262" }}>
            Jeden Check macht ein Berater persönlich. Mehr schaffen wir nicht, ohne dass die Qualität leidet.
          </span>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <div style={{ height: "18px", background: "#FFE9D6", borderRadius: "999px", overflow: "hidden" }}>
              <div style={{ height: "100%", width: belegtPct, background: "#DB2C14", borderRadius: "999px" }}></div>
            </div>
            <span style={{ fontWeight: 700, fontSize: "16px" }}>
              {CONFIG.belegt} vergeben · noch {frei} frei im {CONFIG.monat}
            </span>
          </div>
        </div>
        <div style={{ background: "#DB2C14", color: "#FFFFFF", borderRadius: "28px", padding: "36px", display: "flex", flexDirection: "column", gap: "18px" }}>
          <span style={{ fontSize: "14px", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#FFD60A" }}>
            Nur bis {CONFIG.frist}
          </span>
          <span style={{ fontFamily: "var(--font-bricolage)", fontWeight: 800, fontSize: "clamp(30px, 3.4vw, 42px)", letterSpacing: "-0.03em", lineHeight: "1.05" }}>
            Preis-Wächter für 1 Jahr gratis.
          </span>
          <span style={{ fontSize: "18px", lineHeight: "1.45" }}>
            Wer bis {CONFIG.frist} startet, bekommt den Preis-Wächter (Wert 99 €) dazu. Danach gibt es den Check ohne diesen Bonus.
          </span>
        </div>
      </section>

      {/* B10. FAQ */}
      <section id="faq" style={{ background: "#FFE9D6", padding: "96px 24px" }}>
        <div style={{ maxWidth: "1240px", margin: "0 auto", display: "grid", gridTemplateColumns: "1fr", gap: "48px", alignItems: "start" }} className="grid-2-desktop">
          <h2 style={{ margin: 0, fontFamily: "var(--font-bricolage)", fontWeight: 800, fontSize: "clamp(40px, 5vw, 64px)", letterSpacing: "-0.04em", lineHeight: "1" }}>
            Wo ist der{" "}
            <span style={{ display: "inline-block", background: "#DB2C14", color: "#FFFFFF", padding: "0 14px 6px", borderRadius: "14px", transform: "rotate(-3deg)" }}>
              Haken?
            </span>
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {faqs.map((q, i) => (
              <div
                key={i}
                onClick={() => setOpenFaqIndex(openFaqIndex === i ? -1 : i)}
                style={{
                  background: "#FFFFFF",
                  borderRadius: "20px",
                  padding: "20px 24px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "16px" }}>
                  <span style={{ fontWeight: 700, fontSize: "19px" }}>{q.q}</span>
                  <span style={{ width: "36px", height: "36px", flexShrink: 0, borderRadius: "50%", background: "#1C1233", color: "#FFD60A", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px", fontWeight: 700 }}>
                    {openFaqIndex === i ? "−" : "+"}
                  </span>
                </div>
                {openFaqIndex === i && <span style={{ fontSize: "17px", lineHeight: "1.5", color: "#4E4262" }}>{q.a}</span>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* B11. Formular */}
      <section id="start" style={{ maxWidth: "1240px", margin: "0 auto", padding: "96px 24px", display: "grid", gridTemplateColumns: "1fr", gap: "48px", alignItems: "center" }} className="grid-2-desktop">
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <h2 style={{ margin: 0, fontFamily: "var(--font-bricolage)", fontWeight: 800, fontSize: "clamp(40px, 5.2vw, 72px)", letterSpacing: "-0.045em", lineHeight: "0.98" }}>
            Sichern Sie sich{" "}
            <span style={{ display: "inline-block", background: "#FFD60A", padding: "0 14px 8px", borderRadius: "16px", transform: "rotate(-2deg)" }}>
              Ihren Platz.
            </span>
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "18px", fontWeight: 700 }}>
            <span>✓ Strom- &amp; Gas-Check und Versicherungs-Check</span>
            <span>✓ Wechsel komplett durch uns</span>
            <span>✓ Preis-Wächter gratis bis {CONFIG.frist}</span>
            <span>✓ Keine Ersparnis? {CONFIG.betrag}-€-Gutschein aufs Haus</span>
            <span>✓ +{CONFIG.praemie} € Empfehlungsprämie pro Abschluss</span>
          </div>
        </div>
        <div style={{ background: "#FFFFFF", borderRadius: "28px", padding: "32px", display: "flex", flexDirection: "column", gap: "16px", boxShadow: "0 0 0 4px #1C1233, 12px 12px 0 4px #1C1233" }}>
          {!sent ? (
            <>
              <span style={{ fontFamily: "var(--font-bricolage)", fontSize: "28px", fontWeight: 800, letterSpacing: "-0.02em" }}>
                Ergebnis in 24 Stunden
              </span>
              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <label style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <span style={{ fontSize: "14px", fontWeight: 700, color: "#4E4262" }}>Vorname</span>
                  <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                    <input
                      type="text"
                      placeholder="z. B. Anna"
                      value={formState.name}
                      onChange={(e) => setFormState({ ...formState, name: e.target.value })}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = "#1C1233";
                        setTouched({ ...touched, name: true });
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = isNameValid_check ? "#2ECC71" : "#E6D9C4";
                      }}
                      style={{
                        border: "2px solid " + (isNameValid_check ? "#2ECC71" : errors.name ? "#DB2C14" : "#E6D9C4"),
                        borderRadius: "14px",
                        padding: "15px 16px",
                        paddingRight: "45px",
                        fontSize: "18px",
                        color: "#1C1233",
                        background: "#FFFFFF",
                        outline: "none",
                        transition: "border-color 0.2s",
                        width: "100%",
                      }}
                    />
                    {touched.name && formState.name && (
                      <span style={{ position: "absolute", right: "16px", fontSize: "18px", color: isNameValid_check ? "#2ECC71" : "#DB2C14" }}>
                        {isNameValid_check ? "✓" : "✗"}
                      </span>
                    )}
                  </div>
                  {errors.name && <span style={{ fontSize: "14px", color: "#DB2C14" }}>{errors.name}</span>}
                  {touched.name && isNameValid_check && <span style={{ fontSize: "13px", color: "#2ECC71", fontWeight: 600 }}>✓ Name gültig</span>}
                </label>
                <label style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <span style={{ fontSize: "14px", fontWeight: 700, color: "#4E4262" }}>Postleitzahl</span>
                  <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                    <input
                      type="text"
                      placeholder="z. B. 10115"
                      value={formState.plz}
                      onChange={(e) => setFormState({ ...formState, plz: e.target.value })}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = "#1C1233";
                        setTouched({ ...touched, plz: true });
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = isPlzValid_check ? "#2ECC71" : "#E6D9C4";
                      }}
                      maxLength={5}
                      style={{
                        border: "2px solid " + (isPlzValid_check ? "#2ECC71" : errors.plz ? "#DB2C14" : "#E6D9C4"),
                        borderRadius: "14px",
                        padding: "15px 16px",
                        paddingRight: "45px",
                        fontSize: "18px",
                        color: "#1C1233",
                        background: "#FFFFFF",
                        outline: "none",
                        transition: "border-color 0.2s",
                        width: "100%",
                      }}
                    />
                    {touched.plz && formState.plz && (
                      <span style={{ position: "absolute", right: "16px", fontSize: "18px", color: isPlzValid_check ? "#2ECC71" : "#DB2C14" }}>
                        {isPlzValid_check ? "✓" : "✗"}
                      </span>
                    )}
                  </div>
                  {errors.plz && <span style={{ fontSize: "14px", color: "#DB2C14" }}>{errors.plz}</span>}
                  {touched.plz && isPlzValid_check && <span style={{ fontSize: "13px", color: "#2ECC71", fontWeight: 600 }}>✓ PLZ gültig</span>}
                </label>
                <label style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <span style={{ fontSize: "14px", fontWeight: 700, color: "#4E4262" }}>Telefon</span>
                  <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                    <input
                      type="tel"
                      placeholder="z. B. +49 123 456789 oder 0123 456789"
                      value={formState.tel}
                      onChange={(e) => setFormState({ ...formState, tel: e.target.value })}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = "#1C1233";
                        setTouched({ ...touched, tel: true });
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = isTelValid ? "#2ECC71" : "#E6D9C4";
                      }}
                      style={{
                        border: "2px solid " + (isTelValid ? "#2ECC71" : errors.tel ? "#DB2C14" : "#E6D9C4"),
                        borderRadius: "14px",
                        padding: "15px 16px",
                        paddingRight: "45px",
                        fontSize: "18px",
                        color: "#1C1233",
                        background: "#FFFFFF",
                        outline: "none",
                        transition: "border-color 0.2s",
                        width: "100%",
                      }}
                    />
                    {touched.tel && formState.tel && (
                      <span style={{ position: "absolute", right: "16px", fontSize: "18px", color: isTelValid ? "#2ECC71" : "#DB2C14" }}>
                        {isTelValid ? "✓" : "✗"}
                      </span>
                    )}
                  </div>
                  {errors.tel && <span style={{ fontSize: "14px", color: "#DB2C14" }}>{errors.tel}</span>}
                  {touched.tel && isTelValid && <span style={{ fontSize: "13px", color: "#2ECC71", fontWeight: 600 }}>✓ Deutsche Nummer erkannt</span>}
                  {touched.tel && formState.tel && !isTelValid && !errors.tel && <span style={{ fontSize: "13px", color: "#FF9500", fontWeight: 600 }}>⚠ Nummer zu kurz oder ungültiges Format</span>}
                </label>
                <label style={{ display: "flex", gap: "10px", alignItems: "flex-start", fontSize: "14px", color: "#4E4262", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={formState.consent}
                    onChange={(e) => setFormState({ ...formState, consent: e.target.checked })}
                    style={{ marginTop: "4px" }}
                  />
                  <span>
                    Ich stimme zu, dass meine Daten für einen Rückruf und WhatsApp-Kontakt genutzt werden und akzeptiere die{" "}
                    <a href="#" style={{ color: "#DB2C14", textDecoration: "underline" }}>
                      Datenschutzerklärung
                    </a>
                    .
                  </span>
                </label>
                {errors.consent && <span style={{ fontSize: "14px", color: "#DB2C14" }}>{errors.consent}</span>}
                {errors.submit && <span style={{ fontSize: "14px", color: "#DB2C14" }}>{errors.submit}</span>}
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    background: "#DB2C14",
                    color: "#FFFFFF",
                    borderRadius: "999px",
                    padding: "20px",
                    textAlign: "center",
                    fontFamily: "var(--font-bricolage)",
                    fontWeight: 800,
                    fontSize: "22px",
                    border: "none",
                    cursor: loading ? "not-allowed" : "pointer",
                    transition: "all 0.2s",
                    opacity: loading ? 0.7 : 1,
                  }}
                  onMouseEnter={(e) => {
                    if (!loading) (e.currentTarget as HTMLElement).style.background = "#B8230F";
                  }}
                  onMouseLeave={(e) => {
                    if (!loading) (e.currentTarget as HTMLElement).style.background = "#DB2C14";
                  }}
                >
                  {loading ? "Wird gesendet …" : "Platz sichern →"}
                </button>
                <span style={{ fontSize: "14px", color: "#4E4262", textAlign: "center" }}>
                  Noch {frei} Plätze im {CONFIG.monat} · 0 € · jederzeit Nein sagen
                </span>
              </form>
            </>
          ) : (
            <>
              <span style={{ alignSelf: "flex-start", width: "64px", height: "64px", borderRadius: "50%", background: "#FFD60A", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "30px", fontWeight: 800 }}>
                ✓
              </span>
              <span style={{ fontFamily: "var(--font-bricolage)", fontSize: "32px", fontWeight: 800, letterSpacing: "-0.02em" }}>
                Ihr Platz ist reserviert, {formState.name || "danke"}.
              </span>
              <span style={{ fontSize: "18px", lineHeight: "1.5", color: "#4E4262" }}>
                Wir melden uns innerhalb von 24 Stunden, das Ergebnis kommt per WhatsApp. Legen Sie Ihre letzten Rechnungen für Strom, Gas und Versicherungen bereit.
              </span>
              <span onClick={handleReset} style={{ fontWeight: 700, color: "#DB2C14", cursor: "pointer", textDecoration: "underline" }}>
                Angaben ändern
              </span>
            </>
          )}
        </div>
      </section>

      {/* B12. Footer */}
      <footer style={{ background: "#1C1233", color: "#D8D0E4", padding: "32px 24px" }}>
        <div style={{ maxWidth: "1240px", margin: "0 auto", display: "flex", justifyContent: "space-between", gap: "16px 24px", flexWrap: "wrap", fontSize: "15px" }}>
          <span style={{ fontFamily: "var(--font-bricolage)", fontWeight: 800, fontSize: "20px", color: "#FFF7EA" }}>
            einsparprofis.de
          </span>
          <div style={{ display: "flex", gap: "24px", flexWrap: "wrap" }}>
            <a href="#" style={{ color: "#D8D0E4" }}>
              Impressum
            </a>
            <a href="#" style={{ color: "#D8D0E4" }}>
              Datenschutz
            </a>
            <a href="#" style={{ color: "#D8D0E4" }}>
              Gutscheinbedingungen
            </a>
            <a href="#" style={{ color: "#D8D0E4" }}>
              Kontakt
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}