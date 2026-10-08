# Cookie-Banner – Einsparprofis Landingpage

Handoff für Claude Code. Baue den Banner **exakt** nach diesen Vorgaben in die bestehende Landingpage ein. Referenz-Design: `Einsparprofis Cookie-Banner.dc.html` (1a Desktop, 1b Mobile).

## Ziel & Regeln (DSGVO / TTDSG)
- Kein nicht-notwendiges Script (Statistik, Marketing) lädt **vor** der Einwilligung.
- „Alle akzeptieren“ und „Nur notwendige“ sind **gleich groß, gleiche Farbe, gleiche Ebene**. Kein Dark Pattern.
- Kein Vorab-Häkchen bei Statistik/Marketing.
- Auswahl jederzeit änderbar über Link „Cookie-Einstellungen“ im Footer.
- Banner blockiert die Seite nicht vollständig (Overlay ist nur optisch), Links zu Datenschutz und Impressum bleiben erreichbar.

## Farben
| Token | Hex | Verwendung |
|---|---|---|
| ink | `#1C1233` | Text, Primär-Buttons |
| cream | `#FFF7EA` | Button-Text, Seitenhintergrund |
| red | `#DB2C14` | Links, Toggle an |
| yellow | `#FFD60A` | Icon-Kreis, „Gespeichert“-Pill |
| white | `#FFFFFF` | Banner-Fläche |
| muted | `#4E4262` | Fließtext |
| divider | `#F0E6D6` | Trennlinien Kategorien |
| toggleOff | `#CFC4B4` | Toggle aus |
| handle | `#E3D8C6` | Griff Mobile-Sheet |
| overlay | `rgba(28,18,51,0.45)` | Abdunklung hinter Banner |

## Schriften
- Überschriften: **Bricolage Grotesque** 800, letter-spacing `-0.03em`
- Text/Buttons: **DM Sans** 400/500/700
```html
<link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,600;12..96,800&family=DM+Sans:wght@400;500;700&display=swap" rel="stylesheet">
```

## Texte (verbatim)
- **Headline:** Ihr 400-€-Check funktioniert auch ohne Werbe-Cookies.
- **Text Desktop:** Notwendige Cookies brauchen wir, damit Rechner und Formular funktionieren. Mit Ihrer Zustimmung messen wir zusätzlich, welche Werbung Sie zu uns gebracht hat. Sie können das jederzeit im Footer ändern. [Datenschutz] · [Impressum]
- **Text Mobile:** wie Desktop, ohne den Satz „Sie können das jederzeit im Footer ändern.“ und nur Link [Datenschutz]
- **Buttons:** „Alle akzeptieren“, „Nur notwendige“, „Einstellungen“
- **Einstellungen-Titel:** Cookie-Einstellungen
- **Einstellungen-Buttons:** „Auswahl speichern“, „Alle akzeptieren“

### Kategorien
| Name | Beschreibung | Standard |
|---|---|---|
| Notwendig · immer aktiv | Speichert Ihre Cookie-Auswahl und hält Rechner und Formular am Laufen. | an, nicht änderbar (Toggle opacity 0.55) |
| Statistik | Anonyme Messung, welche Seiten gelesen werden. Hilft uns, die Seite zu verbessern. | aus |
| Marketing | Zeigt uns, ob Sie über Flyer, Aufkleber oder Anzeige gekommen sind. | aus |

## Desktop (≥ 768 px)
**Banner:** `position:fixed; left:24px; right:24px; bottom:24px;` weiß, `border-radius:24px`, `box-shadow:0 24px 60px rgba(28,18,51,.35)`, `padding:28px 32px`, Flex-Zeile `gap:32px`, `align-items:center`.
1. Icon: 64×64 Kreis, gelb, Zeichen „%“ Bricolage 30px/800, `rotate(-6deg)`.
2. Textblock `flex:1`, `gap:6px`: Headline 26px · Text 16px/1.5 muted, Links rot 700.
3. Button-Spalte `width:260px`, `gap:10px`:
   - „Alle akzeptieren“ und „Nur notwendige“: `height:52px`, `border-radius:999px`, bg ink, Text cream 16px/700, kein Border.
   - „Einstellungen“: Text-Button 32px hoch, ink 15px/700, unterstrichen (`text-underline-offset:3px`).

**Einstellungen:** Modal zentriert, `width:600px`, weiß, radius 24, padding 32, `gap:20px`.
- Kopf: Titel 28px Bricolage 800 + Schließen-Button 44×44 Kreis, `border:2px solid ink`, „×“ (zurück zum Banner).
- Kategorien: Zeilen `padding:16px 0`, `border-top:2px solid divider`; Name 17px/700, Beschreibung 14px/1.45 muted.
- Toggle: 56×32, radius 999, padding 4, Knopf 24×24 weiß; an = red + rechts, aus = toggleOff + links.
- Footer-Grid 2 Spalten `gap:10px`: „Auswahl speichern“ (weiß, `border:2px solid ink`) · „Alle akzeptieren“ (ink).

## Mobile (< 768 px)
**Bottom Sheet:** `position:fixed; left:0; right:0; bottom:0;` weiß, `border-radius:28px 28px 0 0`, `box-shadow:0 -12px 40px rgba(28,18,51,.3)`, `padding:14px 20px calc(34px + env(safe-area-inset-bottom))`, Spalte `gap:14px`.
1. Griff 40×5, radius 3, handle-Farbe, zentriert.
2. Zeile `gap:12px`: Icon 44×44 (Zeichen 22px) + Headline 22px/1.05.
3. Text 15px/1.5 muted.
4. Grid 2 Spalten `gap:10px`: „Nur notwendige“ · „Alle akzeptieren“ (beide 52px, ink, 15px/700).
5. „Einstellungen“ Text-Button 44px hoch.

**Einstellungen:** Sheet `top:90px` bis unten, gleiche Optik, padding `20px 20px 34px`, `gap:12px`. Titel 24px. Kategorienliste `flex:1; overflow:auto`. Darunter untereinander: „Alle akzeptieren“ (ink) und „Auswahl speichern“ (weiß, Border), je 52px.

Alle Touch-Ziele ≥ 44px.

## Verhalten
```js
// Speicherung
localStorage.setItem('ep_consent', JSON.stringify({
  v: 1, necessary: true, statistics: bool, marketing: bool, ts: Date.now()
}));
```
- Beim Laden: existiert `ep_consent` mit aktueller Version `v` → kein Banner, freigegebene Scripts laden. Sonst Banner zeigen.
- **Alle akzeptieren:** statistics=true, marketing=true → speichern, schließen, Scripts laden.
- **Nur notwendige:** beide false → speichern, schließen.
- **Auswahl speichern:** aktuelle Toggle-Werte speichern.
- **×** im Modal: zurück zur Banner-Ansicht, nichts speichern.
- Footer-Link „Cookie-Einstellungen“ öffnet direkt das Einstellungen-Modal mit den gespeicherten Werten.
- Scripts mit `<script type="text/plain" data-consent="statistics|marketing">` vormerken und nach Zustimmung aktivieren.
- Version `v` erhöhen, wenn Kategorien oder Tools sich ändern → Banner erscheint neu.
- Barrierefreiheit: `role="dialog"`, `aria-modal="true"` (Modal), `aria-labelledby` auf Headline, Toggles als `role="switch"` mit `aria-checked`, Fokus beim Öffnen auf ersten Button, ESC schließt Modal.
- Overlay: `position:fixed; inset:0;` overlay-Farbe hinter dem Banner.

## Vor Livegang klären
- Tatsächlich genutzte Tools (z. B. Analytics, Meta-Pixel) in den Kategorien und der Datenschutzerklärung eintragen.
- Texte rechtlich prüfen lassen.

## Prompt für Claude Code
> Baue den Cookie-Banner exakt nach `COOKIE_BANNER.md` in die Landingpage ein, als eigenständige Komponente ohne externe Consent-Library.
