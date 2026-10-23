import type { Metadata } from "next";
import Link from "next/link";
import AbrechnungUpload from "../components/AbrechnungUpload";

export const metadata: Metadata = {
  title: "Abrechnungen hochladen | Einsparprofis",
  description: "Laden Sie Ihre Strom-, Gas- und Versicherungsabrechnungen sicher hoch – wir prüfen Ihr Sparpotenzial.",
  robots: { index: false, follow: false },
  alternates: { canonical: "https://einsparprofis.de/abrechnung-hochladen" },
};

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)?.slice(0, 50) ?? "";

export default async function AbrechnungHochladenPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  // Personal links from WhatsApp, e.g. /abrechnung-hochladen?vorname=Anna&nachname=Müller
  const params = await searchParams;

  return (
    <div className="legacy" style={{ fontFamily: "var(--font-dm-sans)", color: "#1C1233", background: "#FFF7EA", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <header style={{ maxWidth: "1240px", width: "100%", margin: "0 auto", padding: "18px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px", flexWrap: "wrap" }}>
        <Link href="/" style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "3px", fontFamily: "var(--font-bricolage)", color: "#1C1233" }} aria-label="Zur Startseite">
          <span style={{ fontSize: "11px", fontWeight: 800, letterSpacing: "0.2em", textTransform: "uppercase", paddingLeft: "5px" }}>die</span>
          <span style={{ background: "#DB2C14", color: "#FFFFFF", transform: "rotate(-3deg)", padding: "5px 12px 8px", borderRadius: "9px", fontSize: "22px", fontWeight: 800, lineHeight: "0.86", textTransform: "uppercase", display: "flex", flexDirection: "column" }}>
            <span>Einspar</span>
            <span>Profis %</span>
          </span>
        </Link>
        <Link href="/" style={{ color: "#1C1233", fontWeight: 700, fontSize: "16px", borderBottom: "2px solid #1C1233" }}>
          ← Zur Startseite
        </Link>
      </header>

      <main style={{ flex: 1 }}>
        <section style={{ maxWidth: "1240px", margin: "0 auto", padding: "40px 24px 96px", display: "grid", gridTemplateColumns: "1fr", gap: "48px", alignItems: "start" }} className="grid-2-desktop">
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <span style={{ fontSize: "14px", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#DB2C14" }}>Schritt 2 · Unterlagen</span>
            <h1 style={{ margin: 0, fontFamily: "var(--font-bricolage)", fontWeight: 800, fontSize: "clamp(40px, 5.2vw, 72px)", letterSpacing: "-0.045em", lineHeight: "0.98" }}>
              Abrechnungen{" "}
              <span style={{ display: "inline-block", background: "#FFD60A", padding: "0 14px 8px", borderRadius: "16px", transform: "rotate(-2deg)" }}>
                hochladen.
              </span>
            </h1>
            <p style={{ margin: 0, fontSize: "19px", lineHeight: "1.5", color: "#4E4262", maxWidth: "520px" }}>
              Je genauer Ihre Unterlagen, desto genauer Ihre Ersparnis. Laden Sie Ihre letzten Jahresabrechnungen bzw. Versicherungsscheine hoch – ein Foto mit dem Handy reicht.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "17px", fontWeight: 700 }}>
              <span>✓ Strom & Gas: letzte Jahresabrechnung (alle Seiten)</span>
              <span>✓ Versicherungen: aktueller Versicherungsschein / Beitragsrechnung</span>
              <span>✓ Fotos: gerade, scharf, gut ausgeleuchtet</span>
              <span>✓ Ergebnis in 24 h per WhatsApp</span>
            </div>
            <div style={{ border: "2px dashed #1C1233", borderRadius: "14px", padding: "12px 16px", fontSize: "15px", lineHeight: "1.45", maxWidth: "520px" }}>
              🔒 Ihre Dateien werden verschlüsselt übertragen, privat gespeichert und ausschließlich zur Prüfung Ihrer Verträge genutzt.
            </div>
          </div>
          <div style={{ background: "#FFFFFF", borderRadius: "28px", padding: "32px", boxShadow: "0 0 0 4px #1C1233, 12px 12px 0 4px #1C1233" }}>
            <AbrechnungUpload initialVorname={first(params.vorname)} initialNachname={first(params.nachname)} />
          </div>
        </section>
      </main>

      <footer style={{ background: "#1C1233", color: "#D8D0E4", padding: "32px 24px" }}>
        <div style={{ maxWidth: "1240px", margin: "0 auto", display: "flex", justifyContent: "space-between", gap: "16px 24px", flexWrap: "wrap", fontSize: "15px" }}>
          <span style={{ fontFamily: "var(--font-bricolage)", fontWeight: 800, fontSize: "20px", color: "#FFF7EA" }}>einsparprofis.de</span>
          <div style={{ display: "flex", gap: "24px", flexWrap: "wrap" }}>
            <a href="/impressum.html" target="_blank" style={{ color: "#D8D0E4" }}>Impressum</a>
            <a href="/datenschutz.html" target="_blank" style={{ color: "#D8D0E4" }}>Datenschutz</a>
            <a href="mailto:info@einsparprofis.de" style={{ color: "#D8D0E4" }}>Kontakt</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
