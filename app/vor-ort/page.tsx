import type { Metadata } from "next";
import VorOrt from "./VorOrt";

// Door-to-door tool: filled in together with the customer on the advisor's phone. Not indexed.
export const metadata: Metadata = {
  title: "Vor-Ort-Erfassung | Einsparprofis",
  robots: { index: false, follow: false },
};

export default function VorOrtPage() {
  return <VorOrt />;
}
