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
    vorname: "",
    nachname: "",
    plz: "",
    tel: "",
    consent: false,
  });
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Validation functions
  // Format phone to +49 format
  const formatPhoneNumber = (input: string): string => {
    const digits = input.replace(/\D/g, "");

    if (!digits) return "";

    // If starts with 49 (international without +), add +
    if (digits.startsWith("49")) {
      return `+${digits}`;
    }

    // If starts with 0, replace with +49
    if (digits.startsWith("0")) {
      return `+49${digits.slice(1)}`;
    }

    // Otherwise assume it's +49
    if (!input.startsWith("+")) {
      return `+49${digits}`;
    }

    return `+${digits}`;
  };

  const isPhoneValid = (tel: string) => {
    const digits = tel.replace(/\D/g, "");
    // Must be +49 format with 11-13 digits total
    if (tel.startsWith("+49")) {
      return digits.length >= 11 && digits.length <= 13;
    }
    // Accept 0 format with 10-11 digits
    if (tel.startsWith("0")) {
      return digits.length >= 10 && digits.length <= 11;
    }
    // Accept raw digits (10-13)
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
  const isVornameValid_check = touched.vorname && formState.vorname && isNameValid(formState.vorname);
  const isNachnameValid_check = touched.nachname && formState.nachname && isNameValid(formState.nachname);

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
    { n: "1", t: "Strom- & Gas-Check", d: "Wir vergleichen alle Tarife – nicht nur die Großen. Bonus- und Laufzeitfallen werden sichtbar. Ø 134 € Ersparnis allein hier.", v: "Wert 150 €", bg: "#1C1233", fg: "#FFD60A" },
    { n: "2", t: "Versicherungs-Check", d: "Hausrat, Wohngebäude, Haftpflicht. Derselbe Schutz, aber durchschnittlich 25 % günstiger. Das rechnet sich.", v: "Wert 150 €", bg: "#1C1233", fg: "#FFD60A" },
    { n: "3", t: "Wechsel komplett", d: "Wir kündigen die alten Verträge, melden Sie beim neuen an, dokumentieren Zählerstände. Sie unterschreiben nur, wenn es passt.", v: "Wert 100 €", bg: "#1C1233", fg: "#FFD60A" },
    { n: "+", t: "Bonus: Preis-Wächter 1 Jahr", d: "Nach 12 Monaten meldet sich unser System vor JEDER Preiserhöhung. Sie haben immer die Wahl.", v: "Wert 99 €/Jahr", bg: "#DB2C14", fg: "#FFFFFF" },
    { n: "+", t: "Bonus: Empfehlungsprämie", d: `${CONFIG.praemie} € pro Haushalt, den Sie uns bringen UND der einen Vertrag unterschreibt. Passive Einnahme.`, v: `je ${CONFIG.praemie} €`, bg: "#DB2C14", fg: "#FFFFFF" },
  ];

  const guaranteePoints = [
    "Sie zahlen für den Check nichts, auch wenn Sie nicht wechseln.",
    "Sie unterschreiben nur, wenn Ihnen der neue Tarif gefällt.",
    `Finden wir keine Ersparnis, bekommen Sie einen ${CONFIG.betrag}-€-Gutschein aufs Haus.`,
  ];

  const steps = [
    { n: "1", who: "Sie · 1 Min.", t: "Platz reservieren", s: "Name, PLZ, Telefon eingeben. Das war's." },
    { n: "2", who: "Sie · 5 Min.", t: "Telefon-Check", s: "Wir gehen Ihre aktuellen Rechnungen gemeinsam durch – das ist die Basis für alles." },
    { n: "3", who: "Wir · 24 h", t: "Ersparnis per WhatsApp", s: "Genauer Betrag, konkrete Angebote, kein Verkaufsgesprächs-Blabla." },
    { n: "4", who: "Wir", t: "Alles erledigt", s: "Kündigungen schreiben, anmelden, Zählerstände dokumentieren. Sie müssen nix unterschreiben, bis alles perfekt ist." },
  ];

  const faqs = [
    { q: "Was kostet mich das?", a: "0 €. Sie zahlen nichts – egal ob Sie wechseln oder nicht. Der neue Anbieter zahlt uns eine Vermittlungsprovision. Dadurch wird Ihr Tarif nicht teurer; wir verdienen nur, wenn Sie sparen." },
    { q: "Was ist, wenn Sie keine Ersparnis finden?", a: `Sie bekommen einen ${CONFIG.betrag}-€-Gutschein. Keine Diskussionen. Das funktioniert nur, wenn Sie Ihre aktuellen Rechnungen zeigen – alles andere ist Glücksspiel.` },
    { q: "Muss ich mit Ihnen einen Vertrag unterschreiben?", a: "Nein. Sie schließen keinen Vertrag mit uns ab. Sie unterschreiben nur bei dem neuen Energieversorger oder der Versicherung – und nur, wenn Ihnen das Angebot wirklich passt." },
    { q: "Falle ich während des Wechsels in die Stromfalle?", a: "Nein. Die Versorgung läuft nahtlos weiter. Dein alter Anbieter liefert bis zum letzten Tag, der neue ab dem ersten Tag. Keine Unterbrechung, keine Überraschungen." },
    { q: "Welche Versicherungen checkt Ihr?", a: "Hausrat, Wohngebäude und Privathaftpflicht. Wir vergleichen nur Angebote mit gleichem oder besserem Leistungsschutz – nicht mit Abschlägen bei der Sicherheit." },
    { q: "Wie verdiene ich mit der Empfehlungsprämie?", a: `Sie empfehlen uns. Der Haushalt unterzeichnet einen Vertrag. Sie bekommen ${CONFIG.praemie} €. Passiv, einfach, ohne weitere Arbeit. Keine Unterschrift = keine Prämie.` },
  ];

  // Validation
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formState.vorname.trim()) {
      newErrors.vorname = "Vorname erforderlich";
    }

    if (!formState.nachname.trim()) {
      newErrors.nachname = "Nachname erforderlich";
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
          name: `${formState.vorname} ${formState.nachname}`,
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
    setFormState({ vorname: "", nachname: "", plz: "", tel: "", consent: false });
    setErrors({});
  };


  return (
    <div style={{ fontFamily: "var(--font-dm-sans)", color: "#1C1233", background: "#FFF7EA" }}>
      {/* B1. Banner */}
      <div style={{ background: "#1C1233", color: "#FFF7EA", padding: "10px 20px", display: "flex", justifyContent: "center", flexWrap: "wrap", gap: "6px 16px", fontSize: "15px", fontWeight: 700, textAlign: "center" }}>
        <span>⚠️ Nur noch {frei} Plätze für den 400-€-Check</span>
        <span style={{ color: "#FFD60A" }}>🎁 Preis-Wächter-Bonus endet {CONFIG.frist}</span>
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
          <span style={{ alignSelf: "flex-start", fontSize: "14px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", border: "2px solid #1C1233", borderRadius: "999px", padding: "7px 14px" }}>Der bewährte Haushalts-Check</span>
          <h1 style={{ margin: 0, fontFamily: "var(--font-bricolage)", fontWeight: 800, fontSize: "clamp(46px, 6.4vw, 88px)", lineHeight: "0.98", letterSpacing: "-0.045em", textWrap: "balance" }}>
            Sparen Sie bis zu{" "}
            <span style={{ display: "inline-block", background: "#FFD60A", padding: "0 14px 8px", borderRadius: "18px", transform: "rotate(-2deg)" }}>
              437 € pro Jahr
            </span>{" "}
            ohne Aufwand.
          </h1>
          <p style={{ margin: 0, fontSize: "clamp(18px, 1.7vw, 22px)", lineHeight: "1.45", color: "#4E4262", maxWidth: "580px", textWrap: "pretty" }}>
            Ein Anruf, 5 Minuten von Ihnen. Wir vergleichen alle Anbieter für Strom, Gas und Versicherungen, kündigen die teuren Verträge und melden Sie beim neuen an – alles ohne Papierkrieg. Keine Ersparnis gefunden? Sie bekommen einen {CONFIG.betrag}-€-Gutschein.
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
            <span>✓ 0 € Kosten – egal ob Sie wechseln</span>
            <span>✓ Ergebnis in 24 h – per WhatsApp</span>
            <span>✓ Kündigungen übernehmen wir komplett</span>
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
            <span style={{ fontSize: "14px", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#FFD60A" }}>Das hält Sie vom Wechsel ab</span>
            <h2 style={{ margin: 0, fontFamily: "var(--font-bricolage)", fontWeight: 800, fontSize: "clamp(36px, 4.6vw, 60px)", letterSpacing: "-0.04em", lineHeight: "1.02", textWrap: "balance" }}>
              Alle Einwände – geklärt. Jetzt wirklich.
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
          {/* CTA nach Probleme */}
          <div style={{ marginTop: "40px", background: "#FFD60A", borderRadius: "28px", padding: "clamp(28px, 5vw, 52px)", textAlign: "center", display: "flex", flexDirection: "column", gap: "22px", alignItems: "center", transform: "rotate(-1deg)" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <span style={{ color: "#1C1233", fontSize: "14px", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase" }}>Alle Ausreden sind weg.</span>
              <h3 style={{ margin: 0, fontFamily: "var(--font-bricolage)", fontWeight: 800, fontSize: "clamp(28px, 4vw, 48px)", letterSpacing: "-0.04em", color: "#1C1233" }}>
                Platz sichern und sparen
              </h3>
              <p style={{ margin: 0, color: "#1C1233", fontSize: "18px", fontWeight: 600, maxWidth: "500px", alignSelf: "center" }}>
                1 Formular, 1 Telefonat (5 Min), 1 WhatsApp – dann wissen Sie, wie viel Sie sparen.
              </p>
            </div>
            <a href="#start" style={{ background: "#1C1233", color: "#FFF7EA", borderRadius: "999px", padding: "18px 42px", fontFamily: "var(--font-bricolage)", fontWeight: 800, fontSize: "22px", display: "inline-block", cursor: "pointer", transition: "all 0.2s", border: "none" }} onMouseEnter={(e) => (e.currentTarget.style.background = "#3a3347")} onMouseLeave={(e) => (e.currentTarget.style.background = "#1C1233")}>
              Platz sichern →
            </a>
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
            Risikofrei testen.{" "}
            <span style={{ display: "inline-block", background: "#DB2C14", color: "#FFFFFF", padding: "0 12px 6px", borderRadius: "14px", transform: "rotate(-2deg)" }}>
              100 % Geld-zurück.
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
            Alles was wir brauchen: Ihre letzten Rechnungen von Strom, Gas, Versicherungen. Danach sind wir 100 % verantwortlich für das Ergebnis.
          </span>
        </div>
      </section>

      {/* B8. Ablauf */}
      <section style={{ background: "#1C1233", color: "#FFF7EA", padding: "88px 24px" }}>
        <div style={{ maxWidth: "1240px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "44px" }}>
          <h2 style={{ margin: 0, fontFamily: "var(--font-bricolage)", fontWeight: 800, fontSize: "clamp(36px, 4.6vw, 60px)", letterSpacing: "-0.04em", lineHeight: "1.02" }}>
            So einfach zu{" "}
            <span style={{ display: "inline-block", background: "#FFD60A", color: "#1C1233", padding: "0 14px 6px", borderRadius: "14px", transform: "rotate(-2deg)" }}>
              437 € Ersparnis.
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
          <span style={{ fontSize: "14px", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#DB2C14" }}>Warum Limit?</span>
          <span style={{ fontFamily: "var(--font-bricolage)", fontWeight: 800, fontSize: "clamp(30px, 3.4vw, 42px)", letterSpacing: "-0.03em", lineHeight: "1.05" }}>
            Nur {CONFIG.plaetze} Checks pro Monat – Qualität geht vor Menge.
          </span>
          <span style={{ fontSize: "18px", lineHeight: "1.45", color: "#4E4262" }}>
            Jeder Check wird von einem echten Berater gemacht, nicht von einem Bot. Das kostet Zeit. Mehr als {CONFIG.plaetze} pro Monat können wir nicht mit voller Qualität machen – und das wollen wir auch nicht.
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

      {/* B10.5 Urgency CTA nach FAQ */}
      <section style={{ background: "#DB2C14", color: "#FFFFFF", padding: "88px 24px" }}>
        <div style={{ maxWidth: "1240px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "32px", alignItems: "center", textAlign: "center" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", fontSize: "16px", fontWeight: 700, color: "#FFD60A" }}>
              <span>⏰ WARTELISTE WIRD KÜRZER</span>
            </div>
            <h2 style={{ margin: 0, fontFamily: "var(--font-bricolage)", fontWeight: 800, fontSize: "clamp(36px, 5vw, 64px)", letterSpacing: "-0.04em", lineHeight: "1.1" }}>
              {frei} Plätze – danach nächster Monat
            </h2>
            <p style={{ margin: 0, fontSize: "20px", fontWeight: 600, maxWidth: "600px", alignSelf: "center", color: "#FFE9D6" }}>
              Die 99-€-Preis-Wächter-Gratis-Aktion endet <span style={{ background: "#FFD60A", color: "#DB2C14", padding: "0 8px", borderRadius: "6px", fontWeight: 800 }}>{CONFIG.frist}</span> – danach zahlen neue Kunden dafür.
            </p>
          </div>
          <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", justifyContent: "center" }}>
            <a href="#start" style={{ background: "#FFD60A", color: "#DB2C14", borderRadius: "999px", padding: "20px 42px", fontFamily: "var(--font-bricolage)", fontWeight: 800, fontSize: "22px", display: "inline-block", cursor: "pointer", transition: "all 0.2s", border: "none", textDecoration: "none" }} onMouseEnter={(e) => (e.currentTarget.style.background = "#FFF7EA")} onMouseLeave={(e) => (e.currentTarget.style.background = "#FFD60A")}>
              Letzter Platz sichern →
            </a>
            <a href="#rechner" style={{ background: "transparent", color: "#FFD60A", borderRadius: "999px", padding: "20px 42px", fontFamily: "var(--font-bricolage)", fontWeight: 800, fontSize: "22px", display: "inline-block", cursor: "pointer", border: "2px solid #FFD60A", transition: "all 0.2s", textDecoration: "none" }} onMouseEnter={(e) => { e.currentTarget.style.background = "#FFD60A"; e.currentTarget.style.color = "#DB2C14"; }} onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#FFD60A"; }}>
              Erst Ersparnis rechnen
            </a>
          </div>
        </div>
      </section>

      {/* B11. Formular */}
      <section id="start" style={{ maxWidth: "1240px", margin: "0 auto", padding: "96px 24px", display: "grid", gridTemplateColumns: "1fr", gap: "48px", alignItems: "center" }} className="grid-2-desktop">
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <h2 style={{ margin: 0, fontFamily: "var(--font-bricolage)", fontWeight: 800, fontSize: "clamp(40px, 5.2vw, 72px)", letterSpacing: "-0.045em", lineHeight: "0.98" }}>
            Jetzt Platz buchen –{" "}
            <span style={{ display: "inline-block", background: "#FFD60A", padding: "0 14px 8px", borderRadius: "16px", transform: "rotate(-2deg)" }}>
              437 € warten.
            </span>
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "18px", fontWeight: 700 }}>
            <span>✓ Ø 134 € Strom- & Gas-Ersparnis (bewiesener Durchschnitt)</span>
            <span>✓ Kündigungen schreiben wir – Sie unterschreiben nur beim neuen Anbieter</span>
            <span>✓ Preis-Wächter 1 Jahr GRATIS – endet {CONFIG.frist}</span>
            <span>✓ Keine Ersparnis? {CONFIG.betrag}-€-Gutschein + kein Ärger</span>
            <span>✓ +{CONFIG.praemie} € pro empfohlenem Haushalt (wenn Vertrag kommt)</span>
          </div>
        </div>
        <div style={{ background: "#FFFFFF", borderRadius: "28px", padding: "32px", display: "flex", flexDirection: "column", gap: "16px", boxShadow: "0 0 0 4px #1C1233, 12px 12px 0 4px #1C1233" }}>
          {!sent ? (
            <>
              <span style={{ fontFamily: "var(--font-bricolage)", fontSize: "28px", fontWeight: 800, letterSpacing: "-0.02em" }}>
                Ergebnis in 24 Stunden
              </span>
              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <label style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <span style={{ fontSize: "14px", fontWeight: 700, color: "#4E4262" }}>Vorname</span>
                    <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                      <input
                        type="text"
                        placeholder="z. B. Anna"
                        value={formState.vorname}
                        onChange={(e) => setFormState({ ...formState, vorname: e.target.value })}
                        onFocus={(e) => {
                          e.currentTarget.style.borderColor = "#1C1233";
                          setTouched({ ...touched, vorname: true });
                        }}
                        onBlur={(e) => {
                          e.currentTarget.style.borderColor = isVornameValid_check ? "#2ECC71" : "#E6D9C4";
                        }}
                        style={{
                          border: "2px solid " + (isVornameValid_check ? "#2ECC71" : errors.vorname ? "#DB2C14" : "#E6D9C4"),
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
                      {touched.vorname && formState.vorname && (
                        <span style={{ position: "absolute", right: "16px", fontSize: "18px", color: isVornameValid_check ? "#2ECC71" : "#DB2C14" }}>
                          {isVornameValid_check ? "✓" : "✗"}
                        </span>
                      )}
                    </div>
                    {errors.vorname && <span style={{ fontSize: "14px", color: "#DB2C14" }}>{errors.vorname}</span>}
                    {touched.vorname && isVornameValid_check && <span style={{ fontSize: "13px", color: "#2ECC71", fontWeight: 600 }}>✓ Gültig</span>}
                  </label>
                  <label style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <span style={{ fontSize: "14px", fontWeight: 700, color: "#4E4262" }}>Nachname</span>
                    <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                      <input
                        type="text"
                        placeholder="z. B. Müller"
                        value={formState.nachname}
                        onChange={(e) => setFormState({ ...formState, nachname: e.target.value })}
                        onFocus={(e) => {
                          e.currentTarget.style.borderColor = "#1C1233";
                          setTouched({ ...touched, nachname: true });
                        }}
                        onBlur={(e) => {
                          e.currentTarget.style.borderColor = isNachnameValid_check ? "#2ECC71" : "#E6D9C4";
                        }}
                        style={{
                          border: "2px solid " + (isNachnameValid_check ? "#2ECC71" : errors.nachname ? "#DB2C14" : "#E6D9C4"),
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
                      {touched.nachname && formState.nachname && (
                        <span style={{ position: "absolute", right: "16px", fontSize: "18px", color: isNachnameValid_check ? "#2ECC71" : "#DB2C14" }}>
                          {isNachnameValid_check ? "✓" : "✗"}
                        </span>
                      )}
                    </div>
                    {errors.nachname && <span style={{ fontSize: "14px", color: "#DB2C14" }}>{errors.nachname}</span>}
                    {touched.nachname && isNachnameValid_check && <span style={{ fontSize: "13px", color: "#2ECC71", fontWeight: 600 }}>✓ Gültig</span>}
                  </label>
                </div>
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
                  <span style={{ fontSize: "14px", fontWeight: 700, color: "#4E4262" }}>Telefon (mit +49)</span>
                  <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                    <input
                      type="tel"
                      inputMode="tel"
                      placeholder="z. B. 0123 456789"
                      value={formState.tel}
                      onChange={(e) => {
                        const formatted = formatPhoneNumber(e.target.value);
                        setFormState({ ...formState, tel: formatted });
                      }}
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
                        fontSize: "16px",
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
                  {touched.tel && isTelValid && <span style={{ fontSize: "13px", color: "#2ECC71", fontWeight: 600 }}>✓ Als +49 Format gespeichert</span>}
                  {touched.tel && formState.tel && !isTelValid && !errors.tel && <span style={{ fontSize: "13px", color: "#FF9500", fontWeight: 600 }}>⚠ Noch nicht vollständig</span>}
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
                    <a href="/datenschutz.html" target="_blank" style={{ color: "#DB2C14", textDecoration: "underline" }}>
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
                Ihr Platz ist reserviert, {formState.vorname || "danke"}.
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
            <a href="/impressum.html" target="_blank" style={{ color: "#D8D0E4" }}>
              Impressum
            </a>
            <a href="/datenschutz.html" target="_blank" style={{ color: "#D8D0E4" }}>
              Datenschutz
            </a>
            <a href="/gutscheinbedingungen.html" target="_blank" style={{ color: "#D8D0E4" }}>
              Gutscheinbedingungen
            </a>
            <a href="mailto:info@einsparprofis.de" style={{ color: "#D8D0E4" }}>
              Kontakt
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}