"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import base from "../landing.module.css";
import styles from "./waermepumpe.module.css";
import WaermepumpeQuiz from "./WaermepumpeQuiz";
import { ANGEBOT, eur, waLink } from "../lib/angebot";
import { WhatsappIcon } from "../components/HaushaltsLanding";
import { WP, wpFreiePlaetze, wpMaxFoerderung } from "../lib/waermepumpe";


const steps = [
  { t: "Förder-Check", time: "Sie · 60 Sek.", d: "5 Fragen antippen, mögliche Förderung sofort sehen." },
  { t: "Fotos schicken", time: "Sie · 5 Min.", d: "Heizkostenabrechnung, Heizungskeller, Heizkörper – per Handy hochladen." },
  { t: "Eignung & Angebot", time: "Wir · bis Tag 10", d: "Wir prüfen Ihr Haus und besorgen Ihnen ein Festpreis-Angebot – geprüft von uns." },
  { t: "Förderung sichern", time: `Wir · bis Tag ${WP.garantieTage}`, d: "Angebot gemeinsam durchgehen. Sie entscheiden – wir stellen den KfW-Antrag vor der Unterschrift." },
];

const objections = [
  { o: "Mein Haus ist zu alt dafür.", s: "Viele Altbauten eignen sich. Wir prüfen Heizlast und Heizkörper – und sagen Ihnen ehrlich, wenn nicht." },
  { o: "Den Förderantrag verstehe ich nicht.", s: "Müssen Sie nicht. Wir stellen ihn – vor der Unterschrift, damit kein Euro verloren geht." },
  { o: "Handwerker haben eh keine Zeit.", s: "Unser Installationspartner gehört zu den größten Anbietern Deutschlands – mit eigenen Montageteams." },
  { o: "Der Strom frisst die Ersparnis auf.", s: "Wir suchen Ihnen den passenden Wärmepumpen-Stromtarif – das ist unser Kerngeschäft." },
  { o: "Die ist doch viel zu laut.", s: "Der Aufstellort wird so geplant, dass die Lärm-Grenzwerte zum Nachbarn eingehalten werden." },
  { o: "Morgen ändert sich die Förderung wieder.", s: "Maßgeblich sind die Bedingungen bei Antragstellung. Deshalb stellen wir den Antrag zügig." },
];

const stack = [
  { n: "1", t: "Eignungs-Check fürs Haus", d: "Heizlast, Heizkörper, Aufstellort – auch im Altbau. Mit ehrlichem Ergebnis.", v: "Wert 250 €" },
  { n: "2", t: "Förder-Service KfW 458", d: "Fördersumme berechnen, Antrag stellen, Fristen im Blick – komplett für Sie.", v: "Wert 400 €" },
  { n: "3", t: "Festpreis-Komplettangebot", d: "Von einem der führenden Wärmepumpen-Anbieter Deutschlands: Planung, Montage und Inbetriebnahme aus einer Hand.", v: "Wert 300 €" },
  { n: "4", t: "Angebots-Check durch uns", d: "Wir prüfen das Angebot für Sie: passt die Größe zu Ihrem Haus, stimmt die Förderung, gibt es versteckte Posten?", v: "Wert 150 €" },
  { n: "+", t: "Bonus: Wärmepumpen-Stromtarif", d: "Der günstigste passende Tarif – damit die Ersparnis auch ankommt.", v: "Wert 150 €/Jahr", bonus: true },
  { n: "+", t: "Bonus: Preis-Wächter 1 Jahr", d: "Wir melden uns vor jeder Strompreiserhöhung.", v: "Wert 99 €", bonus: true },
];
const gesamtwert = stack.reduce((sum, s) => sum + Number(s.v.replace(/\D/g, "")), 0);

const WA_TEXT = "Hallo, ich interessiere mich für den kostenlosen Wärmepumpen-Check.";

const faqs = [
  {
    q: "Was kostet mich der Wärmepumpen-Check?",
    a: "0 €. Sie zahlen nichts – auch wenn Sie sich gegen eine Wärmepumpe entscheiden. Unser Installationspartner bzw. der Stromanbieter zahlt uns eine Vermittlungsprovision; Ihr Angebot wird dadurch nicht teurer.",
  },
  {
    q: "Eignet sich mein Altbau überhaupt?",
    a: "Oft ja – entscheidend sind Heizlast, Heizkörper und Vorlauftemperatur, nicht das Baujahr allein. Genau das prüfen wir im Eignungs-Check. Lohnt es sich nicht, sagen wir es Ihnen schriftlich.",
  },
  {
    q: "Wie laut ist eine Wärmepumpe?",
    a: "Moderne Geräte sind deutlich leiser als ihr Ruf. Entscheidend ist der Aufstellort: Er wird so geplant, dass die Grenzwerte der TA Lärm zum Nachbarn eingehalten werden.",
  },
  {
    q: "Was, wenn sich die Förderung ändert?",
    a: "Maßgeblich sind die Bedingungen zum Zeitpunkt Ihres Antrags. Deshalb stellen wir den Antrag zügig – und immer vor der Auftragsvergabe, sonst wäre die Förderung verloren.",
  },
  {
    q: "Wie finanziere ich den Eigenanteil?",
    a: "Neben dem Zuschuss bietet die KfW einen zinsgünstigen Ergänzungskredit an. Ob er für Sie passt, besprechen wir im Gespräch.",
  },
  {
    q: "Ich bin Mieter – geht das auch?",
    a: "Die Förderung beantragt der Eigentümer. Als Mieter helfen wir Ihnen gern mit einem günstigeren Strom- oder Gastarif.",
  },
];

export default function WaermepumpeLanding() {
  const [openFaq, setOpenFaq] = useState(0);
  const [showAll, setShowAll] = useState(false);
  const [stickyVisible, setStickyVisible] = useState(false);
  const heroCta = useRef<HTMLDivElement>(null);
  const quiz = useRef<HTMLDivElement>(null);
  const finalCta = useRef<HTMLElement>(null);

  // Sticky CTA on phones: only while neither the hero button, the quiz nor the final CTA is on screen
  useEffect(() => {
    const visible = new Map<Element, boolean>();
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((e) => visible.set(e.target, e.isIntersecting));
      setStickyVisible(![...visible.values()].some(Boolean));
    });
    [heroCta.current, quiz.current, finalCta.current].forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <div className={base.page}>
      <div className={base.banner}>
        <span>
          🔥 Kostenlos · max. {WP.plaetze} Wärmepumpen-Checks pro Monat
        </span>
        {WP.klimabonusEnde && <span>⏳ Klimabonus sinkt voraussichtlich ab {WP.klimabonusEnde}</span>}
      </div>

      <header className={`${base.wrap} ${base.header}`}>
        <Link href="/" className={base.logo} aria-label="Einsparprofis – Startseite">
          <small>die</small>
          <span>
            Einspar
            <br />
            Profis %
          </span>
        </Link>
        <nav className={base.nav}>
          <a href="#ablauf">Ablauf</a>
          <a href="#angebot">Angebot</a>
          <a href="#garantie">Garantie</a>
          <a href="#faq">Fragen</a>
        </nav>
        <a href="#check" className={base.headerCta}>
          Check starten
        </a>
      </header>

      <main>
        {/* Hero + Quiz */}
        <section className={`${base.wrap} ${base.hero}`}>
          <div>
            <span className={base.pill}>Für Hausbesitzer mit Gas- oder Ölheizung</span>
            <h1 className={base.h1}>
              <span className={base.hl}>Bis zu {WP.foerderung.deckel} % Zuschuss</span> für Ihre Wärmepumpe – wir erledigen den Rest.
            </h1>
            <p className={`${base.lead} ${base.heroText}`}>
              Der kostenlose Wärmepumpen-Check der Einsparprofis: Wir prüfen, ob sich die Wärmepumpe für Ihr Haus lohnt, sichern die Förderung und besorgen Ihnen ein
              Festpreis-Angebot von einem der führenden Wärmepumpen-Anbieter Deutschlands. <b>In {WP.garantieTage} Tagen entscheidungsreif.</b>
            </p>
            <div className={base.heroCtas} ref={heroCta}>
              <a href="#check" className={base.btn}>
                Förderung in 60 Sek. prüfen →
              </a>
            </div>
            <ul className={base.checks} style={{ marginTop: 18 }}>
              <li>0 € – auch wenn Sie sich gegen die Wärmepumpe entscheiden</li>
              <li>Förderantrag stellen wir für Sie</li>
              <li>Ehrliche Antwort, auch wenn es sich nicht lohnt</li>
            </ul>
            <div className={styles.stats}>
              <div className={styles.stat}>
                <strong>{WP.foerderung.deckel} %</strong>
                <span>max. Zuschuss</span>
              </div>
              <div className={styles.stat}>
                <strong>{eur(wpMaxFoerderung)}</strong>
                <span>max. Förderung</span>
              </div>
              <div className={styles.stat}>
                <strong>{WP.garantieTage} Tage</strong>
                <span>bis zur Entscheidung</span>
              </div>
            </div>
          </div>
          <div id="check" ref={quiz} style={{ scrollMarginTop: 16 }}>
            <span className={base.eyebrow} style={{ textAlign: "center" }}>
              Förder-Check · 60 Sekunden
            </span>
            <WaermepumpeQuiz />
          </div>
        </section>

        {/* Ablauf */}
        <section id="ablauf" className={`${base.section} ${base.darkBg}`}>
          <div className={base.wrap}>
            <h2 className={base.h2}>
              In {WP.garantieTage} Tagen <span className={base.hl}>entscheidungsreif</span>
            </h2>
            <div className={`${base.steps} ${styles.steps4}`}>
              {steps.map((s, i) => (
                <div key={s.t} className={base.step}>
                  <span className={base.stepNum}>{i + 1}</span>
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
          </div>
        </section>

        {/* Einwände */}
        <section className={base.section}>
          <div className={base.wrap}>
            <span className={base.eyebrow}>Klingt gut – aber …</span>
            <h2 className={base.h2}>Ihre Bedenken – ehrlich beantwortet.</h2>
            <div className={base.objections}>
              {(showAll ? objections : objections.slice(0, 3)).map((p) => (
                <div key={p.o} className={`${base.card} ${base.objection}`}>
                  <s>„{p.o}“</s>
                  <b>{p.s}</b>
                </div>
              ))}
              {!showAll && (
                <button type="button" className={base.moreBtn} onClick={() => setShowAll(true)}>
                  + {objections.length - 3} weitere anzeigen
                </button>
              )}
            </div>
          </div>
        </section>

        {/* Wertstapel */}
        <section id="angebot" className={`${base.section} ${base.peach}`}>
          <div className={base.wrap}>
            <h2 className={base.h2} style={{ textAlign: "center" }}>
              Das bekommen Sie – <span className={base.hlRed}>für 0 €</span>
            </h2>
            <div className={`${base.card} ${base.shadowCard} ${base.stackCard}`}>
              {stack.map((s) => (
                <div key={s.t} className={base.stackRow}>
                  <span className={`${base.stackIcon} ${s.bonus ? base.stackIconBonus : ""}`}>{s.n}</span>
                  <div>
                    <h3>{s.t}</h3>
                    <p>{s.d}</p>
                  </div>
                  <span className={base.stackValue}>{s.v}</span>
                </div>
              ))}
              <div className={base.stackTotal}>
                <span>
                  <span style={{ fontSize: 13, color: "var(--muted)" }}>Gesamtwert</span>
                  <br />
                  <s>{eur(gesamtwert)}</s>
                </span>
                <span className={base.price}>
                  <small>Ihr Preis</small>
                  <strong>0 €</strong>
                </span>
              </div>
            </div>
            <p className={base.why}>
              Warum kostenlos? Unser Installationspartner bzw. der Stromanbieter zahlt uns eine Vermittlungsprovision. Ihr Angebot wird dadurch nicht teurer.
            </p>
          </div>
        </section>

        {/* Garantie */}
        <section id="garantie" className={base.section}>
          <div className={`${base.wrap} ${base.split}`}>
            <div className={base.guarantee}>
              <div className={base.guaranteeInner}>
                <small>Die {WP.garantieTage}-Tage-Garantie</small>
                <strong>{WP.garantieBetrag} €</strong>
                <p>
                  Liegt Ihnen nach {WP.garantieTage} Tagen kein Festpreis-Angebot vor, bekommen Sie {WP.garantieBetrag}&nbsp;€ – ohne Diskussion.*
                </p>
              </div>
            </div>
            <div className={base.guaranteeSide}>
              <h2 className={base.h2}>
                Plus die <span className={base.hlRed}>Ehrlich-Garantie.</span>
              </h2>
              <p className={base.lead}>
                Lohnt sich eine Wärmepumpe für Ihr Haus nicht, sagen wir es Ihnen schriftlich mit Begründung – und empfehlen, was stattdessen spart.
              </p>
              <p className={base.small}>* Voraussetzung: Fotos und Angaben vollständig innerhalb von 3 Tagen nach dem Erstgespräch.</p>
            </div>
          </div>
        </section>

        {/* Knappheit */}
        <section className={`${base.section} ${base.peach}`}>
          <div className={`${base.wrap} ${base.scarcity}`}>
            <div className={base.card} style={{ boxShadow: "inset 0 0 0 2px var(--line)" }}>
              <span className={base.eyebrow}>Warum ein Limit?</span>
              <h3>Nur {WP.plaetze} Wärmepumpen-Checks pro Monat – jeder wird persönlich betreut.</h3>
              {WP.belegt !== null && (
                <>
                  <div className={base.bar} role="img" aria-label={`${WP.belegt} von ${WP.plaetze} Plätzen vergeben`}>
                    <div style={{ width: `${Math.round((WP.belegt / WP.plaetze) * 100)}%` }} />
                  </div>
                  <b style={{ display: "block", marginTop: 8, fontSize: 14 }}>
                    {WP.belegt} vergeben · noch {wpFreiePlaetze} frei im {WP.monat}
                  </b>
                </>
              )}
            </div>
            {WP.klimabonusEnde ? (
              <div className={base.bonusCard}>
                <span className={base.eyebrow}>Jetzt handeln lohnt sich</span>
                <h3>
                  Der Klimabonus ({WP.foerderung.klima} %) sinkt voraussichtlich ab {WP.klimabonusEnde}.
                </h3>
                <p>Wer vorher den Antrag stellt, sichert sich den aktuellen Satz.</p>
              </div>
            ) : (
              <div className={base.bonusCard}>
                <span className={base.eyebrow}>Antrag vor Auftrag</span>
                <h3>Förderung gibt es nur, wenn der Antrag vor der Auftragsvergabe gestellt wird.</h3>
                <p>Wir achten darauf – damit Ihnen kein Euro verloren geht.</p>
              </div>
            )}
          </div>
        </section>

        {/* Absender */}
        <section className={base.section}>
          <div className={base.wrap}>
            <div className={`${base.card} ${base.about}`} style={{ boxShadow: "inset 0 0 0 2px var(--line)" }}>
              <span className={base.eyebrow}>Wer steckt dahinter?</span>
              <div className={base.aboutHead}>
                <span className={`${base.avatar} ${base.avatarLarge}`} aria-hidden="true">
                  DS
                </span>
                <div>
                  <h3>Daniel Schultes</h3>
                  <p>Energie- &amp; Versicherungsmakler, Pullenreuth</p>
                </div>
              </div>
              <p className={base.quote}>
                „Ich vermittle nur, was zu Ihrem Haus passt – und sage Ihnen ehrlich, wenn eine Wärmepumpe sich nicht lohnt. Sie sprechen mit mir persönlich, nicht mit einem
                Callcenter.“
              </p>
              <a href={ANGEBOT.telefonHref} className={base.phone}>
                📞 {ANGEBOT.telefon}
              </a>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className={`${base.section} ${base.peach}`}>
          <div className={`${base.wrap} ${base.faqWrap}`}>
            <h2 className={base.h2}>
              Häufige <span className={base.hlRed}>Fragen</span>
            </h2>
            <div className={base.faq}>
              {faqs.map((f, i) => (
                <div key={f.q} className={base.faqItem}>
                  <button type="button" aria-expanded={openFaq === i} onClick={() => setOpenFaq(openFaq === i ? -1 : i)}>
                    {f.q}
                    <span className={base.faqIcon} aria-hidden="true">
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
        <section ref={finalCta} className={`${base.section} ${base.darkBg}`} style={{ textAlign: "center" }}>
          <div className={base.wrap} style={{ maxWidth: 640 }}>
            <h2 className={base.h2}>
              In 60 Sekunden wissen Sie, <span className={base.hl}>was Ihnen zusteht.</span>
            </h2>
            <a href="#check" className={`${base.btn} ${styles.yellowBtn}`}>
              Förderung jetzt prüfen →
            </a>
            <a href={waLink(WA_TEXT)} target="_blank" rel="noopener" className={`${base.btn} ${base.btnWhatsapp}`} style={{ marginTop: 10 }}>
              Oder per WhatsApp anfragen
            </a>
            <p style={{ fontSize: 13, color: "#d8d0e4", marginTop: 12 }}>0 € · unverbindlich · jederzeit Nein sagen</p>
          </div>
        </section>
      </main>

      <footer className={base.footer}>
        <div className={`${base.wrap} ${base.footerInner}`}>
          <strong>einsparprofis.de</strong>
          <nav>
            <Link href="/">Haushalts-Check</Link>
            <a href="/impressum.html" target="_blank">
              Impressum
            </a>
            <a href="/datenschutz.html" target="_blank">
              Datenschutz
            </a>
            <a href={`mailto:${ANGEBOT.email}`}>Kontakt</a>
          </nav>
        </div>
      </footer>

      <a href={waLink(WA_TEXT)} target="_blank" rel="noopener" className={base.waFloat} aria-label="Per WhatsApp schreiben">
        <WhatsappIcon />
      </a>

      <div className={`${base.sticky} ${stickyVisible ? "" : base.hidden}`} aria-hidden={!stickyVisible}>
        <a href={waLink(WA_TEXT)} target="_blank" rel="noopener" className={base.stickyWa} aria-label="Per WhatsApp schreiben" tabIndex={stickyVisible ? 0 : -1}>
          <WhatsappIcon />
        </a>
        <a href="#check" className={base.btn} tabIndex={stickyVisible ? 0 : -1}>
          Förderung prüfen →
        </a>
      </div>
    </div>
  );
}
