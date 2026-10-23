"use client";

import { useEffect, useRef, useState } from "react";
import LeadForm from "./components/LeadForm";
import styles from "./landing.module.css";
import { ANGEBOT, eur, freiePlaetze, schaetzeErsparnis } from "./lib/angebot";

const belegtPct = Math.round((ANGEBOT.belegt / ANGEBOT.plaetze) * 100);

const steps = [
  { t: "Platz sichern", time: "1 Min.", d: "Name, PLZ, Handynummer. Das war's." },
  { t: "Rechnung zeigen", time: "2–5 Min.", d: "Foto hochladen oder kurz telefonieren – wie es Ihnen lieber ist." },
  { t: "Wir erledigen den Rest", time: "24 h", d: "Ergebnis per WhatsApp. Sie sagen Ja – wir kündigen, melden an, fertig." },
];

const objections = [
  { o: "Dafür habe ich keine Zeit.", s: "Ein Foto oder 5 Minuten am Telefon. Den Rest machen wir." },
  { o: "Da gibt es bestimmt einen Haken.", s: "Kein Vertrag mit uns, keine Kosten. Sie können jederzeit Nein sagen." },
  { o: "Am Ende spare ich doch nichts.", s: `Dann bekommen Sie einen ${ANGEBOT.betrag}-€-Gutschein.` },
  { o: "Das ist mir zu kompliziert.", s: "Wir kündigen, melden an und füllen alle Formulare aus." },
  { o: "Dann sitze ich ohne Strom da.", s: "Die Versorgung läuft beim Wechsel ohne Unterbrechung weiter." },
  { o: "Nächstes Jahr wird es wieder teurer.", s: "Der Preis-Wächter meldet sich vor jeder Erhöhung." },
];

const stack = [
  { n: "1", t: "Strom- & Gas-Check", d: "Wir vergleichen alle Tarife – nicht nur die Großen. Bonus- und Laufzeitfallen werden sichtbar.", v: "Wert 150 €" },
  { n: "2", t: "Versicherungs-Check", d: "Hausrat, Wohngebäude, Haftpflicht: derselbe Schutz, weniger Beitrag.", v: "Wert 150 €" },
  { n: "3", t: "Wechsel komplett", d: "Kündigung, Anmeldung, Zählerstände – alles von uns. Sie unterschreiben nur, wenn es passt.", v: "Wert 100 €" },
  { n: "+", t: "Bonus: Preis-Wächter 1 Jahr", d: "Wir melden uns vor jeder Preiserhöhung. Sie haben immer die Wahl.", v: "Wert 99 €", bonus: true },
  { n: "+", t: "Bonus: Empfehlungsprämie", d: `${ANGEBOT.praemie} € für jeden Haushalt, den Sie empfehlen und der einen Vertrag abschließt.`, v: `je ${ANGEBOT.praemie} €`, bonus: true },
];
const gesamtwert = 499 + ANGEBOT.praemie;

const faqs = [
  { q: "Was kostet mich das?", a: "0 €. Sie zahlen nichts – egal ob Sie wechseln oder nicht. Der neue Anbieter zahlt uns eine Vermittlungsprovision. Dadurch wird Ihr Tarif nicht teurer; wir verdienen nur, wenn Sie sparen." },
  { q: "Was ist, wenn Sie keine Ersparnis finden?", a: `Dann bekommen Sie einen ${ANGEBOT.betrag}-€-Gutschein. Ohne Diskussion. Voraussetzung: Sie zeigen uns Ihre aktuellen Rechnungen – nur so können wir seriös vergleichen.` },
  { q: "Muss ich mit Ihnen einen Vertrag unterschreiben?", a: "Nein. Sie schließen keinen Vertrag mit uns ab. Sie unterschreiben nur beim neuen Energieversorger oder Versicherer – und nur, wenn Ihnen das Angebot wirklich passt." },
  { q: "Bin ich während des Wechsels ohne Strom?", a: "Nein. Ihr alter Anbieter liefert bis zum letzten Tag, der neue ab dem ersten Tag. Keine Unterbrechung, keine Überraschungen." },
  { q: "Welche Versicherungen prüfen Sie?", a: "Hausrat, Wohngebäude und Privathaftpflicht. Wir vergleichen nur Angebote mit gleichem oder besserem Leistungsumfang – keine Abstriche bei der Sicherheit." },
  { q: "Wie funktioniert die Empfehlungsprämie?", a: `Sie empfehlen uns weiter. Schließt der Haushalt einen Vertrag ab, bekommen Sie ${ANGEBOT.praemie} €. Ohne Abschluss keine Prämie.` },
];

export default function Home() {
  const [strom, setStrom] = useState(90);
  const [gas, setGas] = useState(110);
  const [vers, setVers] = useState(600);
  const [openFaq, setOpenFaq] = useState(0);
  const [showAllObjections, setShowAllObjections] = useState(false);
  const [stickyVisible, setStickyVisible] = useState(false);

  const heroCta = useRef<HTMLDivElement>(null);
  const formSection = useRef<HTMLElement>(null);

  const sparText = eur(schaetzeErsparnis(strom, gas, vers));

  // Sticky CTA on phones: visible once the hero buttons are scrolled away, hidden while the form is on screen
  useEffect(() => {
    const visible = { hero: true, form: false };
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.target === heroCta.current) visible.hero = entry.isIntersecting;
        if (entry.target === formSection.current) visible.form = entry.isIntersecting;
      }
      setStickyVisible(!visible.hero && !visible.form);
    });
    if (heroCta.current) observer.observe(heroCta.current);
    if (formSection.current) observer.observe(formSection.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div className={styles.page}>
      <div className={styles.banner}>
        <span>
          ⚠️ Nur noch {freiePlaetze} von {ANGEBOT.plaetze} Checks im {ANGEBOT.monat} frei
        </span>
        <span>🎁 Preis-Wächter gratis – nur bis {ANGEBOT.frist}</span>
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
          <a href="#rechner">Rechner</a>
          <a href="#ablauf">Ablauf</a>
          <a href="#angebot">Angebot</a>
          <a href="#faq">Fragen</a>
        </nav>
        <a href="#start" className={styles.headerCta}>
          Check sichern
        </a>
      </header>

      <main>
        {/* Hero */}
        <section className={`${styles.wrap} ${styles.hero}`}>
          <div>
            <span className={styles.pill}>Für jeden Haushalt in Deutschland</span>
            <h1 className={styles.h1}>
              <span className={styles.hl}>Ø 400 € im Jahr</span> weniger für Strom, Gas &amp; Versicherungen
            </h1>
            <p className={`${styles.lead} ${styles.heroText}`}>
              Der kostenlose Haushalts-Check der Einsparprofis: Foto Ihrer Rechnung schicken oder 5 Minuten telefonieren. Wir vergleichen, kündigen und wechseln für Sie.{" "}
              <b>Keine Ersparnis? {ANGEBOT.betrag}-€-Gutschein.</b>
            </p>
            <div className={styles.heroCtas} ref={heroCta}>
              <a href="#start" className={styles.btn}>
                Kostenlos prüfen lassen →
              </a>
              <div className={styles.heroLinks}>
                <a href="#rechner" className={styles.textLink}>
                  Erst Ersparnis berechnen
                </a>
              </div>
            </div>
            <ul className={styles.checks}>
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

          <div className={styles.heroAside}>
            <div className={`${styles.card} ${styles.shadowCard} ${styles.stackCard}`}>
              <span className={styles.eyebrow}>Ihr Haushalts-Check</span>
              {["Strom- & Gas-Check", "Versicherungs-Check", "Wechsel-Service", "Preis-Wächter 1 Jahr"].map((t) => (
                <div key={t} className={styles.stackRow}>
                  <span className={styles.stackIcon}>✓</span>
                  <h3>{t}</h3>
                  <span className={styles.stackValue}>0,00 €</span>
                </div>
              ))}
              <div className={styles.stackTotal}>
                <span>
                  Keine Ersparnis?
                  <br />
                  <b>Gutschein aufs Haus</b>
                </span>
                <span className={styles.price}>
                  <small>Für Sie</small>
                  <strong>{ANGEBOT.betrag} €</strong>
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Spar-Rechner */}
        <section id="rechner" className={`${styles.section} ${styles.peach}`}>
          <div className={`${styles.wrap} ${styles.split}`}>
            <div>
              <span className={styles.eyebrow}>Spar-Rechner</span>
              <h2 className={styles.h2}>
                Wie viel ist es <span className={styles.hl}>bei Ihnen?</span>
              </h2>
              <p className={styles.lead} style={{ marginBottom: 20 }}>
                Schieben Sie die Regler auf Ihre aktuellen Kosten. Den genauen Betrag ermitteln wir anhand Ihrer Rechnungen.
              </p>
            </div>
            <div className={`${styles.card} ${styles.calc}`}>
              <label className={styles.slider}>
                <span>
                  Strom pro Monat <b>{eur(strom)}</b>
                </span>
                <input type="range" min={30} max={250} step={5} value={strom} onChange={(e) => setStrom(Number(e.target.value))} />
              </label>
              <label className={styles.slider}>
                <span>
                  Gas pro Monat <b>{eur(gas)}</b>
                </span>
                <input type="range" min={0} max={300} step={5} value={gas} onChange={(e) => setGas(Number(e.target.value))} />
              </label>
              <label className={styles.slider}>
                <span>
                  Versicherungen pro Jahr <b>{eur(vers)}</b>
                </span>
                <input type="range" min={0} max={1500} step={50} value={vers} onChange={(e) => setVers(Number(e.target.value))} />
              </label>
              <div className={styles.result} aria-live="polite">
                <span>
                  <b>Mögliche Ersparnis</b>
                  <small>pro Jahr, unverbindlich</small>
                </span>
                <span className={styles.resultValue}>{sparText}</span>
              </div>
              <a href="#start" className={`${styles.btn} ${styles.btnDark}`}>
                Diese Ersparnis sichern →
              </a>
            </div>
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
              Jetzt Platz sichern →
            </a>
          </div>
        </section>

        {/* Einwände */}
        <section className={styles.section}>
          <div className={styles.wrap}>
            <span className={styles.eyebrow}>Klingt gut – aber …</span>
            <h2 className={styles.h2}>Alle Einwände – geklärt.</h2>
            <div className={styles.objections}>
              {(showAllObjections ? objections : objections.slice(0, 3)).map((p) => (
                <div key={p.o} className={`${styles.card} ${styles.objection}`}>
                  <s>„{p.o}“</s>
                  <b>{p.s}</b>
                </div>
              ))}
              {!showAllObjections && (
                <button type="button" className={styles.moreBtn} onClick={() => setShowAllObjections(true)}>
                  + {objections.length - 3} weitere anzeigen
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
              {stack.map((s) => (
                <div key={s.t} className={styles.stackRow}>
                  <span className={`${styles.stackIcon} ${s.bonus ? styles.stackIconBonus : ""}`}>{s.n}</span>
                  <div>
                    <h3>{s.t}</h3>
                    <p>{s.d}</p>
                  </div>
                  <span className={styles.stackValue}>{s.v}</span>
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
          </div>
        </section>

        {/* Garantie */}
        <section className={styles.section}>
          <div className={`${styles.wrap} ${styles.split}`}>
            <div className={styles.guarantee}>
              <div className={styles.guaranteeInner}>
                <small>Die Spar-oder-Gutschein-Garantie</small>
                <strong>{ANGEBOT.betrag} €</strong>
                <p>Finden wir bei Strom, Gas und Versicherungen keine Ersparnis, bekommen Sie einen {ANGEBOT.betrag}-€-Gutschein. Ohne Diskussion.</p>
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

        {/* Wer steckt dahinter */}
        <section className={`${styles.section} ${styles.peach}`}>
          <div className={styles.wrap}>
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
          </div>
        </section>

        {/* Knappheit & Bonus */}
        <section className={styles.section}>
          <div className={`${styles.wrap} ${styles.scarcity}`}>
            <div className={styles.card} style={{ boxShadow: "inset 0 0 0 2px var(--line)" }}>
              <span className={styles.eyebrow}>Warum ein Limit?</span>
              <h3>Nur {ANGEBOT.plaetze} Checks pro Monat – jeder wird persönlich gemacht.</h3>
              <div className={styles.bar} role="img" aria-label={`${ANGEBOT.belegt} von ${ANGEBOT.plaetze} Plätzen vergeben`}>
                <div style={{ width: `${belegtPct}%` }} />
              </div>
              <b style={{ display: "block", marginTop: 8, fontSize: 14 }}>
                {ANGEBOT.belegt} vergeben · noch {freiePlaetze} frei im {ANGEBOT.monat}
              </b>
            </div>
            <div className={styles.bonusCard}>
              <span className={styles.eyebrow}>Nur bis {ANGEBOT.frist}</span>
              <h3>Preis-Wächter 1 Jahr gratis (Wert 99 €)</h3>
              <p>Wer bis {ANGEBOT.frist} startet, bekommt ihn dazu. Danach gibt es den Check ohne diesen Bonus.</p>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className={`${styles.section} ${styles.peach}`}>
          <div className={`${styles.wrap} ${styles.faqWrap}`}>
            <h2 className={styles.h2}>
              Wo ist der <span className={styles.hlRed}>Haken?</span>
            </h2>
            <div className={styles.faq}>
              {faqs.map((f, i) => (
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

        {/* Lead-Formular */}
        <section id="start" ref={formSection} className={styles.section}>
          <div className={`${styles.wrap} ${styles.formGrid}`}>
            <div>
              <h2 className={styles.h2}>
                Jetzt Check sichern&nbsp;– <span className={styles.hl}>Ø 400 € warten.</span>
              </h2>
              <ul className={styles.checks}>
                <li>Kündigungen schreiben wir – Sie unterschreiben nur beim neuen Anbieter</li>
                <li>Preis-Wächter 1 Jahr gratis – nur bis {ANGEBOT.frist}</li>
                <li>Keine Ersparnis? {ANGEBOT.betrag}-€-Gutschein</li>
                <li>+{ANGEBOT.praemie} € pro empfohlenem Haushalt</li>
              </ul>
            </div>
            <div className={`${styles.card} ${styles.shadowCard} ${styles.formCard}`}>
              <LeadForm schaetzung={sparText} defaultSrc="allgemein" />
            </div>
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
            <a href="/abrechnung-hochladen">Abrechnung hochladen</a>
            <a href="mailto:kontakt@einsparprofis.de">Kontakt</a>
          </nav>
        </div>
      </footer>

      <div className={`${styles.sticky} ${stickyVisible ? "" : styles.hidden}`} aria-hidden={!stickyVisible}>
        <span>
          Noch {freiePlaetze} Plätze
          <br />
          <em>0 € · 24 h</em>
        </span>
        <a href="#start" className={styles.btn} tabIndex={stickyVisible ? 0 : -1}>
          Kostenlos prüfen →
        </a>
      </div>
    </div>
  );
}
