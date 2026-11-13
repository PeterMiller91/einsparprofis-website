This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Abrechnungs-Upload (`/abrechnung-hochladen`)

Kunden laden ihre Abrechnungen (PDF, JPG, PNG, WEBP, HEIC; max. 10 Dateien à 20 MB) direkt aus dem Browser in einen **privaten Vercel Blob Store**. So greift das 4,5-MB-Limit der Vercel Functions nicht.

Dateinamen: `Nachname_Vorname_Art_JJJJ-MM-TT_HH-MM-SS.ext` (deutsche Zeit), abgelegt unter
`abrechnungen/JJJJ-MM/Nachname_Vorname_<Zeit>_<id>/` zusammen mit `_angaben.json` (Formulardaten).

Personalisierter Link, z. B. für WhatsApp: `/abrechnung-hochladen?vorname=Anna&nachname=Müller&src=whatsapp`

### Einrichtung auf Vercel

1. Vercel-Projekt → **Storage** → **Create** → **Blob** → Store mit dem Projekt verbinden. Dadurch wird `BLOB_READ_WRITE_TOKEN` gesetzt.
2. Optional: `UPLOAD_SIGNING_SECRET` (lange Zufallszeichenkette) setzen. Ohne diese Variable wird `BLOB_READ_WRITE_TOKEN` zum Signieren verwendet.
3. `TELEGRAM_BOT_TOKEN` und `TELEGRAM_CHAT_ID` (wie beim Lead-Formular): Nach jedem Upload kommt eine Nachricht mit Download-Links (30 Tage gültig).
4. Lokal testen: `vercel env pull .env.local`, danach `npm run dev`.

Die Dateien sind außerdem im Vercel-Dashboard unter **Storage → Blob** einsehbar.

### API

| Route | Zweck |
| --- | --- |
| `POST /api/abrechnung/session` | Prüft Formular und Dateiliste, vergibt Dateinamen und signierte Upload-Tickets |
| `POST /api/abrechnung/upload` | Erstellt kurzlebige Client-Tokens für Vercel Blob (nur für signierte Pfade) |
| `POST /api/abrechnung/complete` | Prüft die Dateien (Dateisignatur), speichert die Angaben und benachrichtigt per Telegram |
| `GET /api/abrechnung/datei?t=…` | Signierter Download-Link → Weiterleitung auf eine 10 Minuten gültige Blob-URL |

## Landingpages

| Adresse | Datei | Zielgruppe | Lead-Quelle (`src`) |
| --- | --- | --- | --- |
| `einsparprofis.de` | `app/page.tsx` | allgemein (Werbung, Social, Empfehlungen) | `allgemein` |
| `gaststaette.einsparprofis.de` (auch `/gaststaette`) | `app/gaststaette/page.tsx` | Aufsteller in Gaststätten | `gaststaette` |
| `einsparprofis.de/waermepumpe` | `app/waermepumpe/` | Hausbesitzer mit Gas- oder Ölheizung | `waermepumpe` |

Startseite und Gaststätten-Seite sind dieselbe Komponente (`app/components/HaushaltsLanding.tsx`) mit unterschiedlicher Ansprache.

### Lead-Funnel (`app/components/SparFunnel.tsx`)

1. Bereiche wählen (Strom, Gas, Versicherungen)
2. Kosten schätzen, die mögliche Ersparnis erscheint sofort
3. Kontaktdaten mit Einwilligung in Telefon- und WhatsApp-Kontakt
4. Bestätigung mit Rechnungs-Upload und WhatsApp-Button

- Der Lead geht an `public/api/lead.php`: Telegram, Google Sheets und Einwilligungsnachweis in `UPLOAD_DIR/einwilligungen/JJJJ-MM.jsonl`.
- Ein `?src=…` in der URL überschreibt die Quelle, z. B. `einsparprofis.de/?src=facebook`.
- **Zahlen und Kontaktdaten** stehen in `app/lib/angebot.ts`:
  - `belegt`: echte Zahl der vergebenen Checks im Monat oder `null`. Bei `null` zeigt die Seite keinen Zähler.
  - `frist` / `fristIso`: Frist für den Preis-Wächter-Bonus. Nach dem Datum verschwinden Bonus und Fristhinweise von selbst.
  - `whatsapp`, `telefon`, `email`.
- **Einwilligungstext ändern:** in `app/lib/angebot.ts` und `public/api/lead.php` identisch ändern und die Version (`hc-…`) in beiden Dateien erhöhen.
- Die FAQ stehen einmal in `app/lib/angebot.ts` und werden für die Seite und für die Suchmaschinen-Angaben (`StructuredData.tsx`) verwendet.

## Wärmepumpen-Landingpage (`/waermepumpe`)

Lead-Seite für Wärmepumpen: Quiz mit 5 Fragen, danach die mögliche KfW-Förderung und ein Kontaktformular mit Telefon-Opt-in.

- **Zahlen** (Plätze, Garantie, Förderwerte, Klimabonus-Frist) stehen in `app/lib/waermepumpe.ts`. Förderwerte vor Kampagnen auf kfw.de/458 prüfen. `klimabonusEnde: null` blendet den Hinweis auf das Ende des Klimabonus aus.
- **Endpunkt:** `public/api/waermepumpe-lead.php` (`/api/waermepumpe-lead`):
  - prüft alle Angaben und die Telefon-Einwilligung,
  - schickt eine Telegram-Nachricht,
  - hängt eine Zeile an den Google-Sheets-Tab **`Waermepumpe`** an. Den Tab einmalig anlegen, Spalten: Zeit, Name, PLZ, Telefon, Rückruf, Heizung, Haustyp, Baujahr, Eigentum, Einkommen, Förderung, Telefon-Einwilligung, Weitergabe, Version, Quelle.
- **Einwilligungsnachweis (§ 7 UWG):** Jede Telefon-Einwilligung wird mit Wortlaut, Version, Zeit, IP und Browser in `UPLOAD_DIR/einwilligungen/JJJJ-MM.jsonl` protokolliert, außerhalb des Webroots.
- **Einwilligungstext ändern:** Den Text in `app/lib/waermepumpe.ts` **und** `public/api/waermepumpe-lead.php` identisch ändern und die Version (`wp-…`) in beiden Dateien erhöhen. Ältere Nachweise bleiben so eindeutig zuordenbar.
