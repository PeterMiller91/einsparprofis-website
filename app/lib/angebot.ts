// Offer data shared by all landing pages – change the monthly numbers here only.
export const ANGEBOT = {
  betrag: 20, // Gutschein, wenn keine Ersparnis gefunden wird
  praemie: 20, // Empfehlungsprämie pro Haushalt
  plaetze: 30, // Checks pro Monat
  belegt: 21,
  monat: "Oktober",
  frist: "30.11.", // Preis-Wächter-Bonus
  telefon: "+49 151 15524681",
  telefonHref: "tel:+4915115524681",
};

export const freiePlaetze = ANGEBOT.plaetze - ANGEBOT.belegt;

export const eur = (n: number) => n.toLocaleString("de-DE") + " €";

/** Rough yearly savings estimate used by the Spar-Rechner (15 % energy, 20 % insurance). */
export const schaetzeErsparnis = (stromMonat: number, gasMonat: number, versJahr: number) =>
  Math.round(stromMonat * 12 * 0.15 + gasMonat * 12 * 0.15 + versJahr * 0.2);
