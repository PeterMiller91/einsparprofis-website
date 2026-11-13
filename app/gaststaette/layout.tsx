import type { Metadata } from "next";

// Same offer as the main page, only addressed to restaurant guests – keep it out of search results
export const metadata: Metadata = {
  title: "Einsparprofis – Ø 400 € im Jahr sparen",
  robots: { index: false, follow: true },
  alternates: { canonical: "https://einsparprofis.de" },
};

export default function GaststaetteLayout({ children }: { children: React.ReactNode }) {
  return children;
}
