import type { Metadata } from "next";
import WaermepumpeLanding from "./WaermepumpeLanding";
import { WP, wpMaxFoerderung } from "../lib/waermepumpe";
import { eur } from "../lib/angebot";

export const metadata: Metadata = {
  title: `Wärmepumpe: bis zu ${WP.foerderung.deckel} % Zuschuss sichern | Einsparprofis`,
  description: `Kostenloser Wärmepumpen-Check: Eignung prüfen, KfW-Förderung bis ${eur(wpMaxFoerderung)} sichern, Festpreis-Angebot von einem der führenden Anbieter – in ${WP.garantieTage} Tagen entscheidungsreif.`,
  alternates: { canonical: "https://einsparprofis.de/waermepumpe" },
};

export default function WaermepumpePage() {
  return <WaermepumpeLanding />;
}
