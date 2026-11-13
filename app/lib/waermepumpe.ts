// Wärmepumpen-Landingpage: offer numbers, KfW subsidy values and quiz options.
// Subsidy values: KfW 458 as of 21.07.2026 according to several guides – verify on kfw.de/458
// before changing campaigns. Everything on the page is calculated from here.

export const WP = {
  plaetze: 15, // Wärmepumpen-Checks pro Monat
  // Real number of checks taken this month, or null to hide the counter (see angebot.ts)
  belegt: null as number | null,
  monat: "November",
  garantieTage: 14,
  garantieBetrag: 50,
  // Only true statements: set to null if the date is not confirmed
  // Not confirmed by KfW yet – set e.g. "1.2.2027" once it is
  klimabonusEnde: null as string | null,
  foerderung: {
    grund: 30,
    klima: 16, // Klimageschwindigkeitsbonus: owner-occupiers replacing gas, oil or night storage heating
    einkommen: 30, // Einkommensbonus: owner-occupiers below the income limit
    einkommenGrenze: "40.000 €",
    deckel: 70,
    maxKosten: 28000, // förderfähige Kosten, first residential unit
  },
};

export const wpFreiePlaetze = WP.belegt === null ? null : WP.plaetze - WP.belegt;
export const wpMaxFoerderung = Math.round((WP.foerderung.maxKosten * WP.foerderung.deckel) / 100);

export const QUIZ = [
  {
    key: "heizung",
    frage: "Womit heizen Sie heute?",
    optionen: [
      { value: "gas", label: "Gas", icon: "🔥" },
      { value: "oel", label: "Öl", icon: "🛢️" },
      { value: "nachtspeicher", label: "Nachtspeicher / Strom", icon: "⚡" },
      { value: "andere", label: "Anderes", icon: "🪵" },
    ],
  },
  {
    key: "haustyp",
    frage: "Was für ein Haus ist es?",
    optionen: [
      { value: "efh", label: "Einfamilienhaus", icon: "🏠" },
      { value: "dhh", label: "Doppel- oder Reihenhaus", icon: "🏘️" },
      { value: "zfh", label: "Zweifamilienhaus", icon: "🏡" },
      { value: "mfh", label: "Mehrfamilienhaus", icon: "🏢" },
    ],
  },
  {
    key: "baujahr",
    frage: "Wann wurde das Haus gebaut?",
    optionen: [
      { value: "vor1978", label: "Vor 1978", icon: "🧱" },
      { value: "1978-1994", label: "1978 – 1994", icon: "📐" },
      { value: "1995-2009", label: "1995 – 2009", icon: "🏗️" },
      { value: "ab2010", label: "Ab 2010", icon: "✨" },
    ],
  },
  {
    key: "eigentum",
    frage: "Wohnen Sie selbst im Haus?",
    optionen: [
      { value: "selbst", label: "Ja, es ist mein Haus", icon: "🔑" },
      { value: "vermietet", label: "Mein Haus, aber vermietet", icon: "📄" },
      { value: "mieter", label: "Nein, ich bin Mieter", icon: "🙋" },
    ],
  },
  {
    key: "einkommen",
    frage: `Liegt Ihr zu versteuerndes Haushaltseinkommen unter ${WP.foerderung.einkommenGrenze} im Jahr?`,
    optionen: [
      { value: "ja", label: "Ja", icon: "✅" },
      { value: "nein", label: "Nein", icon: "➖" },
      { value: "unbekannt", label: "Weiß ich nicht", icon: "🤷" },
    ],
  },
] as const;

export type QuizKey = (typeof QUIZ)[number]["key"];
export type QuizAnswers = Partial<Record<QuizKey, string>>;

export const labelFor = (key: QuizKey, value?: string) =>
  QUIZ.find((q) => q.key === key)?.optionen.find((o) => o.value === value)?.label ?? "–";

/** Possible KfW 458 subsidy from the quiz answers (estimate, the exact amount depends on the offer). */
export function berechneFoerderung(a: QuizAnswers) {
  const f = WP.foerderung;
  if (a.eigentum === "mieter") return { prozent: 0, euro: 0, teile: [] as { label: string; prozent: number }[] };

  const selbst = a.eigentum === "selbst";
  const teile = [{ label: "Grundförderung", prozent: f.grund }];
  if (selbst && ["gas", "oel", "nachtspeicher"].includes(a.heizung ?? "")) teile.push({ label: "Klimabonus", prozent: f.klima });
  if (selbst && a.einkommen === "ja") teile.push({ label: "Einkommensbonus", prozent: f.einkommen });

  const prozent = Math.min(f.deckel, teile.reduce((s, t) => s + t.prozent, 0));
  return { prozent, euro: Math.round((f.maxKosten * prozent) / 100), teile };
}

// Consent texts are logged verbatim by public/api/waermepumpe-lead.php – keep both files in sync
export const CONSENT_VERSION = "wp-2026-11b";
export const CONSENT_TELEFON =
  "Ja, ich möchte, dass die Einsparprofis (Daniel Schultes) mich zu meinem Wärmepumpen-Check telefonisch und per WhatsApp unter der angegebenen Nummer kontaktieren. Diese Einwilligung kann ich jederzeit per E-Mail an kontakt@einsparprofis.de widerrufen.";
export const CONSENT_WEITERGABE =
  "Meine Angaben dürfen zur Erstellung eines Angebots an den Installationspartner der Einsparprofis weitergegeben werden.";
