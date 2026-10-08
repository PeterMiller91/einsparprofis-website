export default function StructuredData() {
  const organizationData = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Einsparprofis",
    url: "https://einsparprofis.de",
    logo: "https://einsparprofis.de/logo.png",
    description: "Kostenloser Haushalts-Check für Strom, Gas & Sachversicherungen",
    sameAs: [],
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "Customer Support",
      email: "info@einsparprofis.de"
    }
  };

  const localBusinessData = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: "Einsparprofis",
    image: "https://einsparprofis.de/logo.png",
    description: "Kostenloser Haushalts-Check für Strom, Gas & Sachversicherungen",
    url: "https://einsparprofis.de",
    telephone: "+49",
    email: "info@einsparprofis.de",
    areaServed: "DE",
    priceRange: "0",
    knowsAbout: ["Strom sparen", "Gas sparen", "Versicherungen vergleichen", "Energiekosten senken"],
  };

  const faqData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "Was kostet mich das?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "0 €. Sie zahlen nichts – egal ob Sie wechseln oder nicht. Der neue Anbieter zahlt uns eine Vermittlungsprovision. Dadurch wird Ihr Tarif nicht teurer; wir verdienen nur, wenn Sie sparen."
        }
      },
      {
        "@type": "Question",
        name: "Was ist, wenn Sie keine Ersparnis finden?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Sie bekommen einen 20-€-Gutschein. Keine Diskussionen. Das funktioniert nur, wenn Sie Ihre aktuellen Rechnungen zeigen – alles andere ist Glücksspiel."
        }
      },
      {
        "@type": "Question",
        name: "Muss ich mit Ihnen einen Vertrag unterschreiben?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Nein. Sie schließen keinen Vertrag mit uns ab. Sie unterschreiben nur bei dem neuen Energieversorger oder der Versicherung – und nur, wenn Ihnen das Angebot wirklich passt."
        }
      },
      {
        "@type": "Question",
        name: "Falle ich während des Wechsels in die Stromfalle?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Nein. Die Versorgung läuft nahtlos weiter. Dein alter Anbieter liefert bis zum letzten Tag, der neue ab dem ersten Tag. Keine Unterbrechung, keine Überraschungen."
        }
      },
      {
        "@type": "Question",
        name: "Welche Versicherungen checkt Ihr?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Hausrat, Wohngebäude und Privathaftpflicht. Wir vergleichen nur Angebote mit gleichem oder besserem Leistungsschutz – nicht mit Abschlägen bei der Sicherheit."
        }
      }
    ]
  };

  const serviceData = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: "Haushalts-Check",
    description: "Kostenloser Check für Strom-, Gas- und Versicherungstarife mit garantierter Ersparnis oder 20€ Gutschein",
    provider: {
      "@type": "Organization",
      name: "Einsparprofis"
    },
    serviceType: "Financial consulting",
    areaServed: "DE",
    priceCurrency: "EUR",
    price: "0",
    priceValidUntil: "2026-12-31"
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationData) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessData) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqData) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceData) }}
      />
    </>
  );
}
