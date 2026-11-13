"use client";

import { useSearchParams } from "next/navigation";
import base from "../../landing.module.css";

export default function DankeClient() {
  const params = useSearchParams();
  const vorname = params.get("vorname")?.slice(0, 50) ?? "";
  const nachname = params.get("nachname")?.slice(0, 50) ?? "";
  const rueckruf = params.get("rueckruf") ?? "Egal";
  const upload = `/abrechnung-hochladen?${new URLSearchParams({ vorname, nachname, src: "waermepumpe" })}`;

  return (
    <main className={base.page} style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <div className={base.wrap} style={{ flex: 1, width: "100%", maxWidth: 640, padding: "48px 18px" }}>
        <div className={`${base.card} ${base.shadowCard}`} role="status">
          <div className={base.success}>
            <span className={base.successIcon}>✓</span>
            <h3>{vorname ? `Danke, ${vorname}!` : "Danke!"} Wir rufen Sie innerhalb von 24 Stunden an.</h3>
            <p className={base.lead}>
              {["Vormittags", "Nachmittags", "Abends"].includes(rueckruf) ? `Am besten ${rueckruf.toLowerCase()} – notiert. ` : ""}
              Damit wir Ihr Haus schon vorab einschätzen können: Schicken Sie uns ein Foto Ihrer letzten Heizkostenabrechnung.
            </p>
            <a href={upload} className={base.btn}>
              📷 Abrechnung senden →
            </a>
          </div>
        </div>
      </div>
      <footer style={{ padding: "20px 18px", fontSize: 14, textAlign: "center", color: "#4E4262" }}>
        <a href="/impressum.html" style={{ color: "inherit" }}>Impressum</a> · <a href="/datenschutz.html" style={{ color: "inherit" }}>Datenschutz</a>
      </footer>
    </main>
  );
}
