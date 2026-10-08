"use client";

import { useEffect, useState } from "react";

type CookieConsent = {
  essential: boolean;
  analytics: boolean;
  marketing: boolean;
  preferences: boolean;
};

export default function CookieBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [consent, setConsent] = useState<CookieConsent>({
    essential: true,
    analytics: false,
    marketing: false,
    preferences: false,
  });

  useEffect(() => {
    const storedConsent = localStorage.getItem("cookieConsent");
    if (!storedConsent) {
      setIsVisible(true);
    } else {
      setConsent(JSON.parse(storedConsent));
      loadCookieScripts(JSON.parse(storedConsent));
    }
  }, []);

  const loadCookieScripts = (consentData: CookieConsent) => {
    if (consentData.analytics) {
      loadGoogleAnalytics();
    }
    if (consentData.marketing) {
      loadMarketingScripts();
    }
  };

  const loadGoogleAnalytics = () => {
    const script1 = document.createElement("script");
    script1.async = true;
    script1.src = "https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX";
    document.head.appendChild(script1);

    const script2 = document.createElement("script");
    script2.innerHTML = `
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', 'G-XXXXXXXXXX');
    `;
    document.head.appendChild(script2);
  };

  const loadMarketingScripts = () => {
    const fbPixelScript = document.createElement("script");
    fbPixelScript.innerHTML = `
      !function(f,b,e,v,n,t,s)
      {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
      n.callMethod.apply(n,arguments):n.queue.push(arguments)};
      if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
      n.queue=[];t=b.createElement(e);t.async=!0;
      t.src=v;s=b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t,s)}(window, document,'script',
      'https://connect.facebook.net/en_US/fbevents.js');
      fbq('init', 'YOUR_PIXEL_ID');
      fbq('track', 'PageView');
    `;
    document.head.appendChild(fbPixelScript);
  };

  const handleAcceptAll = () => {
    const allConsent: CookieConsent = {
      essential: true,
      analytics: true,
      marketing: true,
      preferences: true,
    };
    saveConsent(allConsent);
  };

  const handleRejectAll = () => {
    const minimalConsent: CookieConsent = {
      essential: true,
      analytics: false,
      marketing: false,
      preferences: false,
    };
    saveConsent(minimalConsent);
  };

  const handleSavePreferences = () => {
    saveConsent(consent);
  };

  const saveConsent = (consentData: CookieConsent) => {
    localStorage.setItem("cookieConsent", JSON.stringify(consentData));
    localStorage.setItem("cookieConsentDate", new Date().toISOString());
    setConsent(consentData);
    setIsVisible(false);
    setShowDetails(false);
    loadCookieScripts(consentData);
  };

  if (!isVisible) return null;

  return (
    <>
      {/* Overlay */}
      {isVisible && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(28, 18, 51, 0.5)",
            zIndex: 999,
          }}
        />
      )}

      {/* Banner Container */}
      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          background: "#FFFFFF",
          boxShadow: "0 -8px 32px rgba(28, 18, 51, 0.15)",
          zIndex: 1000,
          animation: "slideUp 0.3s ease-out",
        }}
      >
        <style>{`
          @keyframes slideUp {
            from {
              transform: translateY(100%);
              opacity: 0;
            }
            to {
              transform: translateY(0);
              opacity: 1;
            }
          }

          @media (max-width: 768px) {
            .cookie-banner-content {
              padding: 20px 16px !important;
            }
            .cookie-banner-title {
              font-size: 18px !important;
            }
            .cookie-banner-text {
              font-size: 14px !important;
            }
            .cookie-banner-buttons {
              flex-direction: column !important;
              gap: 10px !important;
            }
            .cookie-banner-button {
              width: 100% !important;
            }
          }
        `}</style>

        <div
          className="cookie-banner-content"
          style={{
            maxWidth: "1240px",
            margin: "0 auto",
            padding: "32px 24px",
            display: "flex",
            flexDirection: "column",
            gap: "24px",
          }}
        >
          {!showDetails ? (
            <>
              {/* Main Banner */}
              <div style={{ display: "flex", gap: "24px", alignItems: "flex-start" }}>
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "12px" }}>
                  <h3
                    className="cookie-banner-title"
                    style={{
                      margin: 0,
                      fontFamily: "var(--font-bricolage)",
                      fontSize: "24px",
                      fontWeight: 800,
                      color: "#1C1233",
                    }}
                  >
                    🍪 Wir nutzen Cookies
                  </h3>
                  <p
                    className="cookie-banner-text"
                    style={{
                      margin: 0,
                      fontSize: "16px",
                      lineHeight: "1.5",
                      color: "#4E4262",
                    }}
                  >
                    Wir verwenden Cookies, um Ihre Erfahrung zu verbessern, Ihre Daten zu schützen und die Website zu optimieren. Einige Cookies sind notwendig (essentiell), während andere Ihnen helfen, unsere Dienste besser zu nutzen.
                  </p>
                </div>
              </div>

              {/* Buttons */}
              <div
                className="cookie-banner-buttons"
                style={{
                  display: "flex",
                  gap: "12px",
                  flexWrap: "wrap",
                }}
              >
                <button
                  className="cookie-banner-button"
                  onClick={handleRejectAll}
                  style={{
                    flex: 1,
                    minWidth: "140px",
                    padding: "14px 24px",
                    background: "#FFFFFF",
                    color: "#1C1233",
                    border: "2px solid #E6D9C4",
                    borderRadius: "999px",
                    fontSize: "16px",
                    fontWeight: 700,
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "#DB2C14";
                    e.currentTarget.style.background = "#FFF7EA";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "#E6D9C4";
                    e.currentTarget.style.background = "#FFFFFF";
                  }}
                >
                  Ablehnen
                </button>

                <button
                  onClick={() => setShowDetails(true)}
                  style={{
                    flex: 1,
                    minWidth: "140px",
                    padding: "14px 24px",
                    background: "transparent",
                    color: "#1C1233",
                    border: "2px solid #1C1233",
                    borderRadius: "999px",
                    fontSize: "16px",
                    fontWeight: 700,
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "#1C1233";
                    e.currentTarget.style.color = "#FFF7EA";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.color = "#1C1233";
                  }}
                >
                  Einstellungen
                </button>

                <button
                  className="cookie-banner-button"
                  onClick={handleAcceptAll}
                  style={{
                    flex: 1,
                    minWidth: "140px",
                    padding: "14px 24px",
                    background: "#DB2C14",
                    color: "#FFFFFF",
                    border: "none",
                    borderRadius: "999px",
                    fontSize: "16px",
                    fontWeight: 700,
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "#B8230F";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "#DB2C14";
                  }}
                >
                  Alle akzeptieren
                </button>
              </div>
            </>
          ) : (
            <>
              {/* Details View */}
              <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                <h3
                  style={{
                    margin: 0,
                    fontFamily: "var(--font-bricolage)",
                    fontSize: "24px",
                    fontWeight: 800,
                    color: "#1C1233",
                  }}
                >
                  Cookie-Einstellungen
                </h3>

                {/* Essential Cookies */}
                <div
                  style={{
                    background: "#F8F7F3",
                    borderRadius: "16px",
                    padding: "20px",
                    border: "2px solid #E6D9C4",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: "16px",
                      marginBottom: "12px",
                    }}
                  >
                    <div>
                      <h4
                        style={{
                          margin: 0,
                          fontSize: "18px",
                          fontWeight: 700,
                          color: "#1C1233",
                        }}
                      >
                        ✓ Erforderliche Cookies
                      </h4>
                      <p
                        style={{
                          margin: "4px 0 0 0",
                          fontSize: "14px",
                          color: "#4E4262",
                        }}
                      >
                        Immer aktiv – für Sicherheit & Funktionalität
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={true}
                      disabled
                      style={{
                        width: "20px",
                        height: "20px",
                        cursor: "not-allowed",
                      }}
                    />
                  </div>
                  <ul
                    style={{
                      margin: 0,
                      paddingLeft: "20px",
                      fontSize: "14px",
                      color: "#4E4262",
                      lineHeight: "1.6",
                    }}
                  >
                    <li>Session-Cookies (Formular-Daten)</li>
                    <li>CSRF-Schutz (Sicherheit)</li>
                    <li>Cookie-Einstellungen (dieses Banner)</li>
                  </ul>
                </div>

                {/* Analytics Cookies */}
                <div
                  style={{
                    background: "#F8F7F3",
                    borderRadius: "16px",
                    padding: "20px",
                    border: "2px solid #E6D9C4",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: "16px",
                      marginBottom: "12px",
                    }}
                  >
                    <div>
                      <h4
                        style={{
                          margin: 0,
                          fontSize: "18px",
                          fontWeight: 700,
                          color: "#1C1233",
                        }}
                      >
                        📊 Analytics & Performance
                      </h4>
                      <p
                        style={{
                          margin: "4px 0 0 0",
                          fontSize: "14px",
                          color: "#4E4262",
                        }}
                      >
                        Helfen uns, die Website zu verbessern
                      </p>
                    </div>
                    <label
                      style={{
                        position: "relative",
                        display: "flex",
                        alignItems: "center",
                        width: "48px",
                        height: "28px",
                        cursor: "pointer",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={consent.analytics}
                        onChange={(e) =>
                          setConsent({
                            ...consent,
                            analytics: e.target.checked,
                          })
                        }
                        style={{
                          display: "none",
                        }}
                      />
                      <div
                        style={{
                          position: "absolute",
                          width: "100%",
                          height: "100%",
                          background: consent.analytics ? "#DB2C14" : "#E6D9C4",
                          borderRadius: "999px",
                          transition: "all 0.2s",
                        }}
                      />
                      <div
                        style={{
                          position: "relative",
                          width: "24px",
                          height: "24px",
                          background: "#FFFFFF",
                          borderRadius: "50%",
                          marginLeft: consent.analytics ? "auto" : "2px",
                          marginRight: consent.analytics ? "2px" : "auto",
                          transition: "all 0.2s",
                          zIndex: 1,
                        }}
                      />
                    </label>
                  </div>
                  <ul
                    style={{
                      margin: 0,
                      paddingLeft: "20px",
                      fontSize: "14px",
                      color: "#4E4262",
                      lineHeight: "1.6",
                    }}
                  >
                    <li>Google Analytics (Besucherzahlen, Verhalten)</li>
                    <li>Hotjar (Heatmaps, Session-Aufzeichnungen)</li>
                    <li>Performance-Metriken</li>
                  </ul>
                </div>

                {/* Marketing Cookies */}
                <div
                  style={{
                    background: "#F8F7F3",
                    borderRadius: "16px",
                    padding: "20px",
                    border: "2px solid #E6D9C4",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: "16px",
                      marginBottom: "12px",
                    }}
                  >
                    <div>
                      <h4
                        style={{
                          margin: 0,
                          fontSize: "18px",
                          fontWeight: 700,
                          color: "#1C1233",
                        }}
                      >
                        📢 Marketing & Remarketing
                      </h4>
                      <p
                        style={{
                          margin: "4px 0 0 0",
                          fontSize: "14px",
                          color: "#4E4262",
                        }}
                      >
                        Personalisierte Werbeanzeigen & Verfolgung
                      </p>
                    </div>
                    <label
                      style={{
                        position: "relative",
                        display: "flex",
                        alignItems: "center",
                        width: "48px",
                        height: "28px",
                        cursor: "pointer",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={consent.marketing}
                        onChange={(e) =>
                          setConsent({
                            ...consent,
                            marketing: e.target.checked,
                          })
                        }
                        style={{
                          display: "none",
                        }}
                      />
                      <div
                        style={{
                          position: "absolute",
                          width: "100%",
                          height: "100%",
                          background: consent.marketing ? "#DB2C14" : "#E6D9C4",
                          borderRadius: "999px",
                          transition: "all 0.2s",
                        }}
                      />
                      <div
                        style={{
                          position: "relative",
                          width: "24px",
                          height: "24px",
                          background: "#FFFFFF",
                          borderRadius: "50%",
                          marginLeft: consent.marketing ? "auto" : "2px",
                          marginRight: consent.marketing ? "2px" : "auto",
                          transition: "all 0.2s",
                          zIndex: 1,
                        }}
                      />
                    </label>
                  </div>
                  <ul
                    style={{
                      margin: 0,
                      paddingLeft: "20px",
                      fontSize: "14px",
                      color: "#4E4262",
                      lineHeight: "1.6",
                    }}
                  >
                    <li>Facebook Pixel (Remarketing, Conversions)</li>
                    <li>Google Ads (Werbekampagnen)</li>
                    <li>TikTok Pixel (Cross-Platform Marketing)</li>
                    <li>LinkedIn Insight Tag (B2B Tracking)</li>
                  </ul>
                </div>

                {/* Preferences Cookies */}
                <div
                  style={{
                    background: "#F8F7F3",
                    borderRadius: "16px",
                    padding: "20px",
                    border: "2px solid #E6D9C4",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: "16px",
                      marginBottom: "12px",
                    }}
                  >
                    <div>
                      <h4
                        style={{
                          margin: 0,
                          fontSize: "18px",
                          fontWeight: 700,
                          color: "#1C1233",
                        }}
                      >
                        ⚙️ Voreinstellungen
                      </h4>
                      <p
                        style={{
                          margin: "4px 0 0 0",
                          fontSize: "14px",
                          color: "#4E4262",
                        }}
                      >
                        Speichert Ihre Einstellungen & Präferenzen
                      </p>
                    </div>
                    <label
                      style={{
                        position: "relative",
                        display: "flex",
                        alignItems: "center",
                        width: "48px",
                        height: "28px",
                        cursor: "pointer",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={consent.preferences}
                        onChange={(e) =>
                          setConsent({
                            ...consent,
                            preferences: e.target.checked,
                          })
                        }
                        style={{
                          display: "none",
                        }}
                      />
                      <div
                        style={{
                          position: "absolute",
                          width: "100%",
                          height: "100%",
                          background: consent.preferences ? "#DB2C14" : "#E6D9C4",
                          borderRadius: "999px",
                          transition: "all 0.2s",
                        }}
                      />
                      <div
                        style={{
                          position: "relative",
                          width: "24px",
                          height: "24px",
                          background: "#FFFFFF",
                          borderRadius: "50%",
                          marginLeft: consent.preferences ? "auto" : "2px",
                          marginRight: consent.preferences ? "2px" : "auto",
                          transition: "all 0.2s",
                          zIndex: 1,
                        }}
                      />
                    </label>
                  </div>
                  <ul
                    style={{
                      margin: 0,
                      paddingLeft: "20px",
                      fontSize: "14px",
                      color: "#4E4262",
                      lineHeight: "1.6",
                    }}
                  >
                    <li>Spracheinstellungen</li>
                    <li>Design-Präferenzen (Dark/Light Mode)</li>
                    <li>Gespeicherte Filtereinstellungen</li>
                  </ul>
                </div>

                <p
                  style={{
                    margin: 0,
                    fontSize: "13px",
                    color: "#4E4262",
                    lineHeight: "1.6",
                  }}
                >
                  Detaillierte Informationen finden Sie in unserer{" "}
                  <a
                    href="/datenschutz.html"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      color: "#DB2C14",
                      textDecoration: "underline",
                    }}
                  >
                    Datenschutzerklärung
                  </a>
                  .
                </p>
              </div>

              {/* Action Buttons */}
              <div
                style={{
                  display: "flex",
                  gap: "12px",
                  flexWrap: "wrap",
                }}
              >
                <button
                  onClick={() => setShowDetails(false)}
                  style={{
                    flex: 1,
                    minWidth: "140px",
                    padding: "14px 24px",
                    background: "#FFFFFF",
                    color: "#1C1233",
                    border: "2px solid #E6D9C4",
                    borderRadius: "999px",
                    fontSize: "16px",
                    fontWeight: 700,
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "#DB2C14";
                    e.currentTarget.style.background = "#FFF7EA";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "#E6D9C4";
                    e.currentTarget.style.background = "#FFFFFF";
                  }}
                >
                  Zurück
                </button>

                <button
                  onClick={handleSavePreferences}
                  style={{
                    flex: 1,
                    minWidth: "140px",
                    padding: "14px 24px",
                    background: "#DB2C14",
                    color: "#FFFFFF",
                    border: "none",
                    borderRadius: "999px",
                    fontSize: "16px",
                    fontWeight: 700,
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "#B8230F";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "#DB2C14";
                  }}
                >
                  Einstellungen speichern
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
