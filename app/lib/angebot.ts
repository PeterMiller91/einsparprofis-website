// Offer data shared by all landing pages – change the numbers here only.
export const ANGEBOT = {
  betrag: 20, // Gutschein, wenn keine Ersparnis gefunden wird
  praemie: 20, // Empfehlungsprämie pro Haushalt
  plaetze: 30, // Checks pro Monat
  // Real number of checks already taken this month, or null to hide the counter.
  // Only set this if it is updated regularly – a counter that never moves is misleading.
  belegt: null as number | null,
  monat: "November", // only shown together with `belegt`
  // Preis-Wächter bonus deadline; the urgency texts disappear by themselves after fristIso
  frist: "30.11.",
  fristIso: "2026-11-30",
  telefon: "+49 151 15524681",
  telefonHref: "tel:+4915115524681",
  whatsapp: "4915115524681",
  email: "kontakt@einsparprofis.de",
};

export const freiePlaetze = ANGEBOT.belegt === null ? null : ANGEBOT.plaetze - ANGEBOT.belegt;

export const eur = (n: number) => n.toLocaleString("de-DE") + " €"; // no line break before €

/** Rough yearly savings estimate used by the Spar-Rechner (15 % energy, 20 % insurance). */
export const schaetzeErsparnis = (stromMonat: number, gasMonat: number, versJahr: number) =>
  Math.round(stromMonat * 12 * 0.15 + gasMonat * 12 * 0.15 + versJahr * 0.2);

export const waLink = (text: string) => `https://wa.me/${ANGEBOT.whatsapp}?text=${encodeURIComponent(text)}`;

// Consent text of the Haushalts-Check lead form. Logged verbatim by public/api/lead.php – keep both in sync.
export const LEAD_CONSENT_VERSION = "hc-2026-11";
export const LEAD_CONSENT =
  "Ich stimme zu, dass die Einsparprofis (Daniel Schultes) mich zu meinem Haushalts-Check telefonisch und per WhatsApp unter der angegebenen Nummer kontaktieren. Diese Einwilligung kann ich jederzeit per E-Mail an kontakt@einsparprofis.de widerrufen.";

// One FAQ source for the page and for the structured data (Google)
export const FAQS = [
  { q: "Was kostet mich das?", a: "0 €. Sie zahlen nichts – egal ob Sie wechseln oder nicht. Der neue Anbieter zahlt uns eine Vermittlungsprovision. Dadurch wird Ihr Tarif nicht teurer; wir verdienen nur, wenn Sie sparen." },
  { q: "Was ist, wenn Sie keine Ersparnis finden?", a: `Dann bekommen Sie einen ${ANGEBOT.betrag}-€-Gutschein. Ohne Diskussion. Voraussetzung: Sie zeigen uns Ihre aktuellen Rechnungen – nur so können wir seriös vergleichen.` },
  { q: "Muss ich mit Ihnen einen Vertrag unterschreiben?", a: "Nein. Sie schließen keinen Vertrag mit uns ab. Sie unterschreiben nur beim neuen Energieversorger oder Versicherer – und nur, wenn Ihnen das Angebot wirklich passt." },
  { q: "Bin ich während des Wechsels ohne Strom?", a: "Nein. Ihr alter Anbieter liefert bis zum letzten Tag, der neue ab dem ersten Tag. Keine Unterbrechung, keine Überraschungen." },
  { q: "Welche Versicherungen prüfen Sie?", a: "Hausrat, Wohngebäude und Privathaftpflicht. Wir vergleichen nur Angebote mit gleichem oder besserem Leistungsumfang – keine Abstriche bei der Sicherheit." },
  { q: "Wie funktioniert die Empfehlungsprämie?", a: `Sie empfehlen uns weiter. Schließt der Haushalt einen Vertrag ab, bekommen Sie ${ANGEBOT.praemie} €. Ohne Abschluss keine Prämie.` },
];
