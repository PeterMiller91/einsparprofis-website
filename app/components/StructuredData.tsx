import { ANGEBOT, FAQS } from "../lib/angebot";

// Structured data for search engines – built from the same data as the page, so both always match
export default function StructuredData() {
  const beschreibung = "Kostenloser Haushalts-Check für Strom, Gas & Sachversicherungen";

  const data = [
    {
      "@context": "https://schema.org",
      "@type": "ProfessionalService",
      name: "Einsparprofis",
      url: "https://einsparprofis.de",
      description: beschreibung,
      telephone: ANGEBOT.telefon.replace(/\s/g, ""),
      email: ANGEBOT.email,
      founder: { "@type": "Person", name: "Daniel Schultes" },
      address: {
        "@type": "PostalAddress",
        streetAddress: "Trevesen 141",
        postalCode: "95704",
        addressLocality: "Pullenreuth",
        addressCountry: "DE",
      },
      areaServed: "DE",
      priceRange: "kostenlos",
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: FAQS.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    },
    {
      "@context": "https://schema.org",
      "@type": "Service",
      name: "Haushalts-Check",
      description: `${beschreibung}. Keine Ersparnis gefunden? Dann gibt es einen ${ANGEBOT.betrag}-€-Gutschein.`,
      provider: { "@type": "Organization", name: "Einsparprofis" },
      areaServed: "DE",
      offers: { "@type": "Offer", price: "0", priceCurrency: "EUR" },
    },
  ];

  return (
    <>
      {data.map((d) => (
        <script key={d["@type"]} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(d) }} />
      ))}
    </>
  );
}
