"use client";

import { useEffect, useState } from "react";

interface ConsentData {
  v: number;
  necessary: boolean;
  statistics: boolean;
  marketing: boolean;
  ts: number;
}

export default function CookieBanner() {
  const [showBanner, setShowBanner] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [isDesktop, setIsDesktop] = useState(true);
  const [consent, setConsent] = useState<ConsentData>({
    v: 1,
    necessary: true,
    statistics: false,
    marketing: false,
    ts: Date.now(),
  });

  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 768);
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    const stored = localStorage.getItem("ep_consent");
    if (stored) {
      const parsed = JSON.parse(stored) as ConsentData;
      if (parsed.v === 1) {
        setConsent(parsed);
        loadScripts(parsed);
      } else {
        setShowBanner(true);
      }
    } else {
      setShowBanner(true);
    }

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape" && showModal) {
        setShowModal(false);
      }
    };

    document.addEventListener("keydown", handleEsc);
    return () => {
      window.removeEventListener("resize", handleResize);
      document.removeEventListener("keydown", handleEsc);
    };
  }, [showModal]);

  const loadScripts = (data: ConsentData) => {
    if (data.statistics) {
      const scripts = document.querySelectorAll('[data-consent="statistics"]');
      scripts.forEach((script) => {
        const newScript = document.createElement("script");
        if (script.textContent) newScript.textContent = script.textContent;
        script.parentNode?.replaceChild(newScript, script);
      });
    }
    if (data.marketing) {
      const scripts = document.querySelectorAll('[data-consent="marketing"]');
      scripts.forEach((script) => {
        const newScript = document.createElement("script");
        if (script.textContent) newScript.textContent = script.textContent;
        script.parentNode?.replaceChild(newScript, script);
      });
    }
  };

  const saveConsent = (data: ConsentData) => {
    const consentData = { ...data, ts: Date.now() };
    localStorage.setItem("ep_consent", JSON.stringify(consentData));
    setConsent(consentData);
    setShowBanner(false);
    setShowModal(false);
    loadScripts(consentData);
  };

  const handleAcceptAll = () => {
    saveConsent({ v: 1, necessary: true, statistics: true, marketing: true, ts: Date.now() });
  };

  const handleOnlyNecessary = () => {
    saveConsent({ v: 1, necessary: true, statistics: false, marketing: false, ts: Date.now() });
  };

  const handleSaveSettings = () => {
    saveConsent(consent);
  };

  if (!showBanner && !showModal) return null;

  const colors = {
    ink: "#1C1233",
    cream: "#FFF7EA",
    red: "#DB2C14",
    yellow: "#FFD60A",
    white: "#FFFFFF",
    muted: "#4E4262",
    divider: "#F0E6D6",
    toggleOff: "#CFC4B4",
    handle: "#E3D8C6",
    overlay: "rgba(28,18,51,0.45)",
  };

  return (
    <>
      {/* Overlay */}
      {(showBanner || showModal) && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: colors.overlay,
            zIndex: 999,
            pointerEvents: showModal ? "auto" : "none",
          }}
          onClick={() => showModal && setShowModal(false)}
        />
      )}

      {/* Desktop Banner */}
      {isDesktop && showBanner && !showModal && (
        <div
          role="banner"
          style={{
            position: "fixed",
            left: "24px",
            right: "24px",
            bottom: "24px",
            background: colors.white,
            borderRadius: "24px",
            boxShadow: "0 24px 60px rgba(28,18,51,.35)",
            padding: "28px 32px",
            display: "flex",
            gap: "32px",
            alignItems: "center",
            zIndex: 1000,
            maxWidth: "calc(100% - 48px)",
          }}
        >
          {/* Icon */}
          <div
            style={{
              width: "64px",
              height: "64px",
              minWidth: "64px",
              borderRadius: "50%",
              background: colors.yellow,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: "var(--font-bricolage)",
              fontSize: "30px",
              fontWeight: 800,
              transform: "rotate(-6deg)",
            }}
          >
            %
          </div>

          {/* Text Block */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "6px" }}>
            <h2
              style={{
                margin: 0,
                fontFamily: "var(--font-bricolage)",
                fontSize: "26px",
                fontWeight: 800,
                letterSpacing: "-0.03em",
                color: colors.ink,
              }}
            >
              Ihr 400-€-Check funktioniert auch ohne Werbe-Cookies.
            </h2>
            <p
              style={{
                margin: 0,
                fontSize: "16px",
                lineHeight: "1.5",
                color: colors.muted,
              }}
            >
              Notwendige Cookies brauchen wir, damit Rechner und Formular funktionieren. Mit Ihrer Zustimmung messen wir zusätzlich, welche Werbung Sie zu uns gebracht hat. Sie können das jederzeit im Footer ändern.{" "}
              <a href="/datenschutz.html" style={{ color: colors.red, fontWeight: 700 }}>
                Datenschutz
              </a>{" "}
              · <a href="/impressum.html" style={{ color: colors.red, fontWeight: 700 }}>
                Impressum
              </a>
            </p>
          </div>

          {/* Buttons */}
          <div style={{ width: "260px", display: "flex", flexDirection: "column", gap: "10px" }}>
            <button
              onClick={handleOnlyNecessary}
              style={{
                height: "52px",
                borderRadius: "999px",
                background: colors.ink,
                color: colors.cream,
                border: "none",
                fontSize: "16px",
                fontWeight: 700,
                cursor: "pointer",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.85")}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
            >
              Nur notwendige
            </button>
            <button
              onClick={handleAcceptAll}
              style={{
                height: "52px",
                borderRadius: "999px",
                background: colors.ink,
                color: colors.cream,
                border: "none",
                fontSize: "16px",
                fontWeight: 700,
                cursor: "pointer",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.85")}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
            >
              Alle akzeptieren
            </button>
            <button
              onClick={() => setShowModal(true)}
              style={{
                height: "32px",
                background: "transparent",
                color: colors.ink,
                border: "none",
                fontSize: "15px",
                fontWeight: 700,
                cursor: "pointer",
                textDecoration: "underline",
                textUnderlineOffset: "3px",
              }}
            >
              Einstellungen
            </button>
          </div>
        </div>
      )}

      {/* Mobile Bottom Sheet */}
      {!isDesktop && showBanner && !showModal && (
        <div
          role="banner"
          style={{
            position: "fixed",
            left: 0,
            right: 0,
            bottom: 0,
            background: colors.white,
            borderRadius: "28px 28px 0 0",
            boxShadow: "0 -12px 40px rgba(28,18,51,.3)",
            padding: `14px 20px calc(34px + env(safe-area-inset-bottom))`,
            display: "flex",
            flexDirection: "column",
            gap: "14px",
            zIndex: 1000,
          }}
        >
          {/* Handle */}
          <div
            style={{
              width: "40px",
              height: "5px",
              borderRadius: "3px",
              background: colors.handle,
              margin: "0 auto",
            }}
          />

          {/* Icon + Headline */}
          <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
            <div
              style={{
                width: "44px",
                height: "44px",
                minWidth: "44px",
                borderRadius: "50%",
                background: colors.yellow,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "var(--font-bricolage)",
                fontSize: "22px",
                fontWeight: 800,
                transform: "rotate(-6deg)",
              }}
            >
              %
            </div>
            <h2
              style={{
                margin: 0,
                fontFamily: "var(--font-bricolage)",
                fontSize: "22px",
                fontWeight: 800,
                letterSpacing: "-0.03em",
                lineHeight: "1.05",
                color: colors.ink,
                flex: 1,
              }}
            >
              Ihr 400-€-Check funktioniert auch ohne Werbe-Cookies.
            </h2>
          </div>

          {/* Text */}
          <p
            style={{
              margin: 0,
              fontSize: "15px",
              lineHeight: "1.5",
              color: colors.muted,
            }}
          >
            Notwendige Cookies brauchen wir, damit Rechner und Formular funktionieren. Mit Ihrer Zustimmung messen wir zusätzlich, welche Werbung Sie zu uns gebracht hat.{" "}
            <a href="/datenschutz.html" style={{ color: colors.red, fontWeight: 700 }}>
              Datenschutz
            </a>
          </p>

          {/* Buttons Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            <button
              onClick={handleOnlyNecessary}
              style={{
                height: "52px",
                borderRadius: "999px",
                background: colors.ink,
                color: colors.cream,
                border: "none",
                fontSize: "15px",
                fontWeight: 700,
                cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              Nur notwendige
            </button>
            <button
              onClick={handleAcceptAll}
              style={{
                height: "52px",
                borderRadius: "999px",
                background: colors.ink,
                color: colors.cream,
                border: "none",
                fontSize: "15px",
                fontWeight: 700,
                cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              Alle akzeptieren
            </button>
          </div>

          {/* Settings Button */}
          <button
            onClick={() => setShowModal(true)}
            style={{
              height: "44px",
              background: "transparent",
              color: colors.ink,
              border: "none",
              fontSize: "15px",
              fontWeight: 700,
              cursor: "pointer",
              textDecoration: "underline",
              textUnderlineOffset: "3px",
            }}
          >
            Einstellungen
          </button>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="cookie-modal-title"
          style={{
            position: "fixed",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            background: colors.white,
            borderRadius: "24px",
            padding: "32px",
            width: isDesktop ? "600px" : "calc(100% - 40px)",
            maxHeight: isDesktop ? "auto" : "calc(100vh - 180px)",
            display: "flex",
            flexDirection: "column",
            gap: "20px",
            zIndex: 1001,
            overflow: "auto",
          }}
        >
          {/* Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3
              id="cookie-modal-title"
              style={{
                margin: 0,
                fontFamily: "var(--font-bricolage)",
                fontSize: "28px",
                fontWeight: 800,
                letterSpacing: "-0.03em",
                color: colors.ink,
              }}
            >
              Cookie-Einstellungen
            </h3>
            <button
              onClick={() => setShowModal(false)}
              aria-label="Schließen"
              style={{
                width: "44px",
                height: "44px",
                borderRadius: "50%",
                border: `2px solid ${colors.ink}`,
                background: "transparent",
                fontSize: "24px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = colors.ink;
                e.currentTarget.style.color = colors.cream;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.color = colors.ink;
              }}
            >
              ×
            </button>
          </div>

          {/* Categories */}
          <div style={{ display: "flex", flexDirection: "column" }}>
            {/* Necessary */}
            <div style={{ padding: "16px 0", borderTop: `2px solid ${colors.divider}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: "17px", fontWeight: 700, color: colors.ink }}>
                    Notwendig · immer aktiv
                  </h4>
                  <p style={{ margin: "4px 0 0 0", fontSize: "14px", lineHeight: "1.45", color: colors.muted }}>
                    Speichert Ihre Cookie-Auswahl und hält Rechner und Formular am Laufen.
                  </p>
                </div>
                <div
                  role="switch"
                  aria-checked="true"
                  style={{
                    width: "56px",
                    height: "32px",
                    borderRadius: "999px",
                    background: colors.red,
                    padding: "4px",
                    display: "flex",
                    alignItems: "center",
                    marginLeft: "12px",
                    marginTop: "2px",
                    opacity: 0.55,
                    cursor: "not-allowed",
                  }}
                >
                  <div
                    style={{
                      width: "24px",
                      height: "24px",
                      borderRadius: "50%",
                      background: colors.white,
                      marginLeft: "auto",
                      transition: "all 0.2s",
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Statistics */}
            <div style={{ padding: "16px 0", borderTop: `2px solid ${colors.divider}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: "17px", fontWeight: 700, color: colors.ink }}>Statistik</h4>
                  <p style={{ margin: "4px 0 0 0", fontSize: "14px", lineHeight: "1.45", color: colors.muted }}>
                    Anonyme Messung, welche Seiten gelesen werden. Hilft uns, die Seite zu verbessern.
                  </p>
                </div>
                <label
                  role="switch"
                  aria-checked={consent.statistics}
                  style={{
                    width: "56px",
                    height: "32px",
                    borderRadius: "999px",
                    background: consent.statistics ? colors.red : colors.toggleOff,
                    padding: "4px",
                    display: "flex",
                    alignItems: "center",
                    cursor: "pointer",
                    marginLeft: "12px",
                    marginTop: "2px",
                    transition: "all 0.2s",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={consent.statistics}
                    onChange={(e) => setConsent({ ...consent, statistics: e.target.checked })}
                    style={{ display: "none" }}
                  />
                  <div
                    style={{
                      width: "24px",
                      height: "24px",
                      borderRadius: "50%",
                      background: colors.white,
                      transition: "all 0.2s",
                      marginLeft: consent.statistics ? "auto" : "0",
                    }}
                  />
                </label>
              </div>
            </div>

            {/* Marketing */}
            <div style={{ padding: "16px 0", borderTop: `2px solid ${colors.divider}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: "17px", fontWeight: 700, color: colors.ink }}>Marketing</h4>
                  <p style={{ margin: "4px 0 0 0", fontSize: "14px", lineHeight: "1.45", color: colors.muted }}>
                    Zeigt uns, ob Sie über Flyer, Aufkleber oder Anzeige gekommen sind.
                  </p>
                </div>
                <label
                  role="switch"
                  aria-checked={consent.marketing}
                  style={{
                    width: "56px",
                    height: "32px",
                    borderRadius: "999px",
                    background: consent.marketing ? colors.red : colors.toggleOff,
                    padding: "4px",
                    display: "flex",
                    alignItems: "center",
                    cursor: "pointer",
                    marginLeft: "12px",
                    marginTop: "2px",
                    transition: "all 0.2s",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={consent.marketing}
                    onChange={(e) => setConsent({ ...consent, marketing: e.target.checked })}
                    style={{ display: "none" }}
                  />
                  <div
                    style={{
                      width: "24px",
                      height: "24px",
                      borderRadius: "50%",
                      background: colors.white,
                      transition: "all 0.2s",
                      marginLeft: consent.marketing ? "auto" : "0",
                    }}
                  />
                </label>
              </div>
            </div>
          </div>

          {/* Footer Buttons */}
          <div style={{ display: isDesktop ? "grid" : "flex", gridTemplateColumns: isDesktop ? "1fr 1fr" : undefined, flexDirection: isDesktop ? undefined : "column", gap: "10px", marginTop: "12px" }}>
            <button
              onClick={handleSaveSettings}
              style={{
                height: isDesktop ? "auto" : "52px",
                padding: isDesktop ? "14px" : "0",
                borderRadius: "999px",
                background: colors.white,
                color: colors.ink,
                border: `2px solid ${colors.ink}`,
                fontSize: "16px",
                fontWeight: 700,
                cursor: "pointer",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = colors.ink;
                e.currentTarget.style.color = colors.cream;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = colors.white;
                e.currentTarget.style.color = colors.ink;
              }}
            >
              Auswahl speichern
            </button>
            <button
              onClick={handleAcceptAll}
              style={{
                height: isDesktop ? "auto" : "52px",
                padding: isDesktop ? "14px" : "0",
                borderRadius: "999px",
                background: colors.ink,
                color: colors.cream,
                border: "none",
                fontSize: "16px",
                fontWeight: 700,
                cursor: "pointer",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.85")}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
            >
              Alle akzeptieren
            </button>
          </div>
        </div>
      )}
    </>
  );
}
