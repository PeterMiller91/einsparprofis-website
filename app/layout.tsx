import type { Metadata } from "next";
import { DM_Sans, Bricolage_Grotesque } from "next/font/google";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
  weight: ["400", "600", "800"],
});

export const metadata: Metadata = {
  title: "Einsparprofis - Der 400€ Haushalts-Check",
  description: "Wir prüfen Strom, Gas und Sachversicherungen. 0€ Kosten. Garantiert 400€ Ersparnis oder Gutschein.",
  openGraph: {
    title: "Einsparprofis - Der 400€ Haushalts-Check",
    description: "Wir prüfen Strom, Gas und Sachversicherungen. 0€ Kosten. Garantiert 400€ Ersparnis oder Gutschein.",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="de"
      className={`${dmSans.variable} ${bricolage.variable} scroll-smooth`}
    >
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className="min-h-full flex flex-col bg-[#FFF7EA] text-[#1C1233]">
        {children}
      </body>
    </html>
  );
}
