import type { Metadata } from "next";
import { Suspense } from "react";
import AbrechnungHochladenClient from "./client";

export const metadata: Metadata = {
  title: "Abrechnungen hochladen | Einsparprofis",
  description: "Laden Sie Ihre Strom-, Gas- und Versicherungsabrechnungen sicher hoch – wir prüfen Ihr Sparpotenzial.",
  robots: { index: false, follow: false },
  alternates: { canonical: "https://einsparprofis.de/abrechnung-hochladen" },
};

export default function Page() {
  return (
    <Suspense fallback={null}>
      <AbrechnungHochladenClient />
    </Suspense>
  );
}
