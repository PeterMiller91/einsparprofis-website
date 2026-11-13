import type { Metadata, Viewport } from "next";
import { DM_Sans, Bricolage_Grotesque } from "next/font/google";
import CookieBanner from "./components/CookieBanner";
import StructuredData from "./components/StructuredData";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#1C1233",
};

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
  title: "Einsparprofis – Ø 400 € im Jahr sparen | Strom, Gas & Versicherungen",
  description: "Kostenloser Haushalts-Check für Strom, Gas & Sachversicherungen: Ø 400 € Ersparnis im Jahr – oder 20-€-Gutschein. Wir vergleichen, kündigen und wechseln für Sie.",
  keywords: [
    "Strom sparen",
    "Gas sparen",
    "Versicherung sparen",
    "Haushalts-Check",
    "Energiekosten senken",
    "Versicherungsvergleich",
    "Wechselservice",
    "Deutschland"
  ],
  authors: [{ name: "Einsparprofis" }],
  creator: "Einsparprofis",
  publisher: "Einsparprofis",
  formatDetection: {
    email: false,
    telephone: false,
    address: false,
  },
  alternates: {
    canonical: "https://einsparprofis.de",
  },
  openGraph: {
    title: "Einsparprofis – Ø 400 € im Jahr sparen",
    description: "Kostenloser Haushalts-Check für Strom, Gas & Sachversicherungen: Ø 400 € Ersparnis im Jahr – oder 20-€-Gutschein.",
    url: "https://einsparprofis.de",
    siteName: "Einsparprofis",
    locale: "de_DE",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Einsparprofis – Ø 400 € im Jahr sparen",
    description: "Kostenloser Haushalts-Check für Strom, Gas & Sachversicherungen.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-snippet": -1,
      "max-image-preview": "large",
      "max-video-preview": -1,
    },
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="de"
      className={`${dmSans.variable} ${bricolage.variable} scroll-smooth`}
    >
      <head>
        <meta charSet="utf-8" />
        <link rel="icon" href="/favicon.ico" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <StructuredData />
      </head>
      <body className="min-h-full flex flex-col bg-[#FFF7EA] text-[#1C1233]">
        {children}
        <CookieBanner />
      </body>
    </html>
  );
}
