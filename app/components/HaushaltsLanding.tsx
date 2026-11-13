"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import SparFunnel from "./SparFunnel";
import styles from "../landing.module.css";
import { ANGEBOT, FAQS, freiePlaetze, waLink } from "../lib/angebot";
import { useFristAktiv } from "../lib/useFristAktiv";

const VARIANTEN = {
  allgemein: { pill: "Für jeden Haushalt in Deutschland", src: "allgemein" },
  // Table stands in restaurants (gaststaette.einsparprofis.de)
  gaststaette: { pill: "Empfehlung des Hauses · Check in 1 Minute", src: "gaststaette" },
};

const steps = [
  { t: "Check starten", time: "1 Min.", d: "Bereiche wählen, Kosten schätzen, Handynummer angeben." },
  { t: "Rechnung zeigen", time: "2–5 Min.", d: "Foto hochladen, per WhatsApp schicken oder kurz telefonieren." },
  { t: "Wir erledigen den Rest", time: "24 h", d: "Ergebnis per WhatsApp. Sie sagen Ja – wir kündigen, melden an, fertig." },
];

const objections = [
  { o: "Dafür habe ich keine Zeit.", s: "Ein Foto oder 5 Minuten am Telefon. Den Rest machen wir." },
  { o: "Da gibt es bestimmt einen Haken.", s: "Kein Vertrag mit uns, keine Kosten. Sie können jederzeit Nein sagen." },
  { o: "Am Ende spare ich doch nichts.", s: `Dann bekommen Sie einen ${ANGEBOT.betrag}-€-Gutschein.` },
  { o: "Das ist mir zu kompliziert.", s: "Wir kündigen, melden an und füllen alle Formulare aus." },
  { o: "Dann sitze ich ohne Strom da.", s: "Die Versorgung läuft beim Wechsel ohne Unterbrechung weiter." },
  { o: "Nächstes Jahr wird es wieder teurer.", s: "Der Preis-Wächter meldet sich vor jeder Erhöhung.", preisWaechter: true },
];

const stack = [
  { n: "1", t: "Strom- & Gas-Check", d: "Wir vergleichen alle Tarife – nicht nur die Großen. Bonus- und Laufzeitfallen werden sichtbar.", wert: 150 },
  { n: "2", t: "Versicherungs-Check", d: "Hausrat, Wohngebäude, Haftpflicht: derselbe Schutz, weniger Beitrag.", wert: 150 },
  { n: "3", t: "Wechsel komplett", d: "Kündigung, Anmeldung, Zählerstände – alles von uns. Sie unterschreiben nur, wenn es passt.", wert: 100 },
  { n: "+", t: "Bonus: Preis-Wächter 1 Jahr", d: "Wir melden uns vor jeder Preiserhöhung. Sie haben immer die Wahl.", wert: 99, bonus: true, preisWaechter: true },
  { n: "+", t: "Bonus: Empfehlungsprämie", d: `${ANGEBOT.praemie} € für jeden Haushalt, den Sie empfehlen und der einen Vertrag abschließt.`, wert: ANGEBOT.praemie, je: true, bonus: true },
];

const WA_TEXT = "Hallo, ich möchte den kostenlosen Haushalts-Check.";

export default function HaushaltsLanding({ variante = "allgemein" }: { variante?: keyof typeof VARIANTEN }) {
  const v = VARIANTEN[variante];
  const fristAktiv = useFristAktiv();
  const [openFaq, setOpenFaq] = useState(0);
  const [showAllObjections, setShowAllObjections] = useState(false);
  const [stickyVisible, setStickyVisible] = useState(false);

  const funnel = useRef<HTMLDivElement>(null);
  const heroCta = useRef<HTMLDivElement>(null);
  const finalCta = useRef<HTMLElement>(null);

  // The Preis-Wächter bonus is only promised until the deadline
  const stackSichtbar = stack.filter((s) => fristAktiv || !s.preisWaechter);
  const einwaende = objections.filter((o) => fristAktiv || !o.preisWaechter);
  const gesamtwert = stackSichtbar.reduce((sum, s) => sum + s.wert, 0);

  // Sticky CTA on phones: only while neither the hero button, the funnel nor the final CTA is on screen
  useEffect(() => {
    const visible = new Map<Element, boolean>();
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((e) => visible.set(e.target, e.isIntersecting));
      setStickyVisible(![...visible.values()].some(Boolean));
    });
    [heroCta.current, funnel.current, finalCta.current].forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <div className={styles.page}>
      <div className={styles.banner}>
        <span>
          {freiePlaetze !== null
            ? `⚠️ Nur noch ${freiePlaetze} von ${ANGEBOT.plaetze} Checks im ${ANGEBOT.monat} frei`
            : `✓ Kostenlos · max. ${ANGEBOT.plaetze} Checks pro Monat`}
        </span>
        {fristAktiv && <span>🎁 Preis-Wächter gratis – nur bis {ANGEBOT.frist}</span>}
      </div>

      <header className={`${styles.wrap} ${styles.header}`}>
        <a href="#" className={styles.logo} aria-label="Einsparprofis – nach oben">
          <small>die</small>
          <span>
            Einspar
            <br />
            Profis %
          </span>
        </a>
        <nav className={styles.nav}>
          <a href="#ablauf">Ablauf</a>
          <a href="#angebot">Angebot</a>
          <a href="#garantie">Garantie</a>
          <a href="#faq">Fragen</a>
        </nav>
        <a href="#start" className={styles.headerCta}>
          Check starten
        </a>
      </header>

      <main>
        {/* Hero + Funnel */}
        <section className={`${styles.wrap} ${styles.hero}`}>
          <div>
            <span className={styles.pill}>{v.pill}</span>
            <h1 className={styles.h1}>
              <span className={styles.hl}>Ø 400 € im Jahr</span> weniger für Strom, Gas &amp; Versicherungen
            </h1>
            <p className={`${styles.lead} ${styles.heroText}`}>
              Der kostenlose Haushalts-Check der Einsparprofis: Wir vergleichen, kündigen und wechseln für Sie. <b>Keine Ersparnis? {ANGEBOT.betrag}-€-Gutschein.</b>
            </p>
            <div className={styles.heroCtas} ref={heroCta}>
              <a href="#start" className={styles.btn}>
                Ersparnis berechnen →
              </a>
            </div>
            <ul className={styles.checks} style={{ marginTop: 18 }}>
              <li>0 € Kosten – auch wenn Sie nicht wechseln</li>
              <li>Ergebnis in 24 h per WhatsApp</li>
              <li>Kein Vertrag mit uns, kein Papierkram</li>
            </ul>
            <div className={styles.person}>
              <span className={styles.avatar} aria-hidden="true">
                DS
              </span>
              <span>
                <b>Daniel Schultes</b>
                <br />
                Ihr Energie- &amp; Versicherungsmakler aus der Oberpfalz – persönlich, kein Callcenter
              </span>
            </div>
          </div>
          <div id="start" ref={funnel} style={{ scrollMarginTop: 16 }}>
            <SparFunnel defaultSrc={v.src} />
          </div>
        </section>

        {/* Ablauf */}
        <section id="ablauf" className={`${styles.section} ${styles.darkBg}`}>
          <div className={styles.wrap}>
            <h2 className={styles.h2}>
              In 3 Schritten zu <span className={styles.hl}>weniger Fixkosten</span>
            </h2>
            <div className={styles.steps}>
              {steps.map((s, i) => (
                <div key={s.t} className={styles.step}>
                  <span className={styles.stepNum}>{i + 1}</span>
                  <div>
                    <h3>
                      {s.t}
                      <small>{s.time}</small>
                    </h3>
                    <p>{s.d}</p>
                  </div>
                </div>
              ))}
            </div>
            <a href="#start" className={`${styles.btn} ${styles.stepsCta}`}>
              Jetzt Check starten →
            </a>
          </div>
        </section>

        {/* Einwände */}
        <section className={styles.section}>
          <div className={styles.wrap}>
            <span className={styles.eyebrow}>Klingt gut – aber …</span>
            <h2 className={styles.h2}>Alle Einwände – geklärt.</h2>
            <div className={styles.objections}>
              {(showAllObjections ? einwaende : einwaende.slice(0, 3)).map((p) => (
                <div key={p.o} className={`${styles.card} ${styles.objection}`}>
                  <s>„{p.o}“</s>
                  <b>{p.s}</b>
                </div>
              ))}
              {!showAllObjections && (
                <button type="button" className={styles.moreBtn} onClick={() => setShowAllObjections(true)}>
                  + {einwaende.length - 3} weitere anzeigen
                </button>
              )}
            </div>
          </div>
        </section>

        {/* Wertstapel */}
        <section id="angebot" className={`${styles.section} ${styles.peach}`}>
          <div className={styles.wrap}>
            <h2 className={styles.h2} style={{ textAlign: "center" }}>
              Das bekommen Sie – <span className={styles.hlRed}>für 0 €</span>
            </h2>
            <div className={`${styles.card} ${styles.shadowCard} ${styles.stackCard}`}>
              {stackSichtbar.map((s) => (
                <div key={s.t} className={styles.stackRow}>
                  <span className={`${styles.stackIcon} ${s.bonus ? styles.stackIconBonus : ""}`}>{s.n}</span>
                  <div>
                    <h3>{s.t}</h3>
                    <p>{s.d}</p>
                  </div>
                  <span className={styles.stackValue}>{s.je ? `je ${s.wert} €` : `Wert ${s.wert} €`}</span>
                </div>
              ))}
              <div className={styles.stackTotal}>
                <span>
                  <span style={{ fontSize: 13, color: "var(--muted)" }}>Gesamtwert</span>
                  <br />
                  <s>{gesamtwert} €</s>
                </span>
                <span className={styles.price}>
                  <small>Ihr Preis</small>
                  <strong>0 €</strong>
                </span>
              </div>
            </div>
            <p className={styles.why}>Warum kostenlos? Der neue Anbieter zahlt uns eine Vermittlungsprovision. Ihr Tarif wird dadurch nicht teurer.</p>
            <a href="#start" className={`${styles.btn} ${styles.centerCta}`}>
              Kostenlos prüfen lassen →
            </a>
          </div>
        </section>

        {/* Garantie */}
        <section id="garantie" className={styles.section}>
          <div className={`${styles.wrap} ${styles.split}`}>
            <div className={styles.guarantee}>
              <div className={styles.guaranteeInner}>
                <small>Die Spar-oder-Gutschein-Garantie</small>
                <strong>{ANGEBOT.betrag} €</strong>
                <p>
                  Finden wir bei Strom, Gas und Versicherungen keine Ersparnis, bekommen Sie einen {ANGEBOT.betrag}-€-Gutschein. Ohne Diskussion.
                </p>
              </div>
            </div>
            <div className={styles.guaranteeSide}>
              <h2 className={styles.h2}>
                Sie können <span className={styles.hlRed}>nur gewinnen.</span>
              </h2>
              <ul className={styles.checks}>
                <li>Der Check kostet nichts – auch ohne Wechsel</li>
                <li>Sie unterschreiben nur, wenn Ihnen das Angebot gefällt</li>
                <li>Die Versorgung läuft ohne Unterbrechung weiter</li>
              </ul>
              <p className={styles.small}>
                Es gelten die{" "}
                <a href="/gutscheinbedingungen.html" target="_blank" style={{ color: "var(--red)", textDecoration: "underline" }}>
                  Gutscheinbedingungen
                </a>
                .
              </p>
            </div>
          </div>
        </section>

        {/* Wer steckt dahinter + Limit */}
        <section className={`${styles.section} ${styles.peach}`}>
          <div className={`${styles.wrap} ${styles.scarcity}`}>
            <div className={`${styles.card} ${styles.about}`}>
              <span className={styles.eyebrow}>Wer steckt dahinter?</span>
              <div className={styles.aboutHead}>
                <span className={`${styles.avatar} ${styles.avatarLarge}`} aria-hidden="true">
                  DS
                </span>
                <div>
                  <h3>Daniel Schultes</h3>
                  <p>Energie- &amp; Versicherungsmakler, Pullenreuth</p>
                </div>
              </div>
              <p className={styles.quote}>
                „Kein Callcenter, kein Bot: Sie sprechen mit mir persönlich. Ich prüfe jede Rechnung selbst – und sage Ihnen ehrlich, wenn sich ein Wechsel nicht lohnt.“
              </p>
              <a href={ANGEBOT.telefonHref} className={styles.phone}>
                📞 {ANGEBOT.telefon}
              </a>
            </div>
            <div className={styles.limitCol}>
              <div className={styles.card}>
                <span className={styles.eyebrow}>Warum ein Limit?</span>
                <h3>Nur {ANGEBOT.plaetze} Checks pro Monat – jeder wird persönlich gemacht.</h3>
                {ANGEBOT.belegt !== null && (
                  <>
                    <div className={styles.bar} role="img" aria-label={`${ANGEBOT.belegt} von ${ANGEBOT.plaetze} Plätzen vergeben`}>
                      <div style={{ width: `${Math.round((ANGEBOT.belegt / ANGEBOT.plaetze) * 100)}%` }} />
                    </div>
                    <b style={{ display: "block", marginTop: 8, fontSize: 14 }}>
                      {ANGEBOT.belegt} vergeben · noch {freiePlaetze} frei im {ANGEBOT.monat}
                    </b>
                  </>
                )}
              </div>
              {fristAktiv && (
                <div className={styles.bonusCard}>
                  <span className={styles.eyebrow}>Nur bis {ANGEBOT.frist}</span>
                  <h3>Preis-Wächter 1 Jahr gratis (Wert 99 €)</h3>
                  <p>Wer bis {ANGEBOT.frist} startet, bekommt ihn dazu. Danach gibt es den Check ohne diesen Bonus.</p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className={styles.section}>
          <div className={`${styles.wrap} ${styles.faqWrap}`}>
            <h2 className={styles.h2}>
              Wo ist der <span className={styles.hlRed}>Haken?</span>
            </h2>
            <div className={styles.faq}>
              {FAQS.map((f, i) => (
                <div key={f.q} className={styles.faqItem}>
                  <button type="button" aria-expanded={openFaq === i} onClick={() => setOpenFaq(openFaq === i ? -1 : i)}>
                    {f.q}
                    <span className={styles.faqIcon} aria-hidden="true">
                      {openFaq === i ? "−" : "+"}
                    </span>
                  </button>
                  {openFaq === i && <p>{f.a}</p>}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section ref={finalCta} className={`${styles.section} ${styles.darkBg}`} style={{ textAlign: "center" }}>
          <div className={styles.wrap} style={{ maxWidth: 640 }}>
            <h2 className={styles.h2}>
              In 1 Minute wissen Sie, <span className={styles.hl}>was Sie sparen können.</span>
            </h2>
            <a href="#start" className={`${styles.btn} ${styles.btnYellow}`}>
              Ersparnis jetzt berechnen →
            </a>
            <a href={waLink(WA_TEXT)} target="_blank" rel="noopener" className={`${styles.btn} ${styles.btnWhatsapp}`} style={{ marginTop: 10 }}>
              Oder per WhatsApp anfragen
            </a>
            <p style={{ fontSize: 13, color: "#d8d0e4", marginTop: 12 }}>0 € · kein Vertrag · jederzeit Nein sagen</p>
          </div>
        </section>

        {/* Cross-Sell – after the main CTA, so it doesn't distract from the funnel */}
        <section className={styles.sectionSmall}>
          <div className={styles.wrap}>
            <Link href="/waermepumpe" className={styles.crossSell}>
              <span aria-hidden="true">🏠</span>
              <span>
                <b>Hausbesitzer mit Gas- oder Ölheizung?</b>
                Wärmepumpe mit bis zu 70&nbsp;% Zuschuss – zum Förder-Check →
              </span>
            </Link>
          </div>
        </section>
      </main>

      <footer className={styles.footer}>
        <div className={`${styles.wrap} ${styles.footerInner}`}>
          <strong>einsparprofis.de</strong>
          <nav>
            <a href="/impressum.html" target="_blank">
              Impressum
            </a>
            <a href="/datenschutz.html" target="_blank">
              Datenschutz
            </a>
            <a href="/gutscheinbedingungen.html" target="_blank">
              Gutscheinbedingungen
            </a>
            <Link href="/abrechnung-hochladen">Abrechnung hochladen</Link>
            <Link href="/waermepumpe">Wärmepumpe</Link>
            <a href={`mailto:${ANGEBOT.email}`}>Kontakt</a>
          </nav>
        </div>
      </footer>

      {/* WhatsApp: floating on desktop, part of the sticky bar on phones */}
      <a href={waLink(WA_TEXT)} target="_blank" rel="noopener" className={styles.waFloat} aria-label="Per WhatsApp schreiben">
        <WhatsappIcon />
      </a>

      <div className={`${styles.sticky} ${stickyVisible ? "" : styles.hidden}`} aria-hidden={!stickyVisible}>
        <a href={waLink(WA_TEXT)} target="_blank" rel="noopener" className={styles.stickyWa} aria-label="Per WhatsApp schreiben" tabIndex={stickyVisible ? 0 : -1}>
          <WhatsappIcon />
        </a>
        <a href="#start" className={styles.btn} tabIndex={stickyVisible ? 0 : -1}>
          Ersparnis berechnen →
        </a>
      </div>
    </div>
  );
}

export function WhatsappIcon() {
  return (
    <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 3a9 9 0 0 0-7.7 13.6L3 21l4.5-1.2A9 9 0 1 0 12 3Z" />
      <path d="M9 8.5c-.5 1 .2 2.800 1.700 4.300s3.300 2.200 4.300 1.700" />
    </svg>
  );
}
