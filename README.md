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

### Google Drive (optional, empfohlen)

Ist Google Drive verbunden, kopiert der Server jede Abrechnung nach der Prüfung in den Ordner
`Einsparprofis Abrechnungen/JJJJ-MM/<Upload>/` in deinem Google Drive und löscht sie danach im Vercel-Speicher.
Die Telegram-Nachricht enthält dann Drive-Links. Klappt die Übertragung nicht, bleiben die Dateien im Vercel-Speicher, und die Nachricht weist darauf hin.
Die Website nutzt nur die Berechtigung `drive.file` und sieht deshalb ausschließlich die Dateien, die sie selbst angelegt hat.

Einmalige Einrichtung:

1. [Google Cloud Console](https://console.cloud.google.com) → Projekt wählen (z. B. das von Google Sheets) → **APIs & Dienste → Bibliothek** → „Google Drive API“ aktivieren.
2. **Google Auth Platform → Branding**: App-Name (z. B. „Einsparprofis Upload“) und deine E-Mail eintragen. **Zielgruppe**: „Extern“, danach **App veröffentlichen** („In Produktion“). Im Testmodus läuft die Freigabe nach 7 Tagen ab.
3. **Clients → Client erstellen** → Typ „Webanwendung“ → autorisierte Weiterleitungs-URI: `https://einsparprofis.de/api/drive/callback`. Client-ID und Clientschlüssel kopieren.
4. In Vercel setzen: `GOOGLE_DRIVE_CLIENT_ID`, `GOOGLE_DRIVE_CLIENT_SECRET` und `DRIVE_SETUP_KEY` (ein selbst gewähltes, langes Passwort). Danach neu deployen.
5. `https://einsparprofis.de/api/drive/connect?key=<DRIVE_SETUP_KEY>` öffnen und mit deinem Google-Konto anmelden. Den Hinweis „Google hat diese App nicht überprüft“ mit „Erweitert → Weiter zu …“ bestätigen; das ist deine eigene App.
6. Den angezeigten Schlüssel als `GOOGLE_DRIVE_REFRESH_TOKEN` in Vercel eintragen und neu deployen. `DRIVE_SETUP_KEY` kannst du danach wieder löschen.


### API

| Route | Zweck |
| --- | --- |
| `POST /api/abrechnung/session` | Prüft Formular und Dateiliste, vergibt Dateinamen und signierte Upload-Tickets |
| `POST /api/abrechnung/upload` | Erstellt kurzlebige Client-Tokens für Vercel Blob (nur für signierte Pfade) |
| `POST /api/abrechnung/complete` | Prüft die Dateien (Dateisignatur), kopiert sie im Hintergrund nach Google Drive und benachrichtigt per Telegram |
| `GET /api/abrechnung/datei?t=…` | Signierter Download-Link → Weiterleitung auf eine 10 Minuten gültige Blob-URL (nur ohne Drive) |
| `GET /api/drive/connect?key=…` / `GET /api/drive/callback` | Einmalige Verbindung mit Google Drive |

## Landingpages

| Adresse | Datei | Zielgruppe | Lead-Quelle (`src`) |
| --- | --- | --- | --- |
| `einsparprofis.de` | `app/page.tsx` | allgemein (Werbung, Social, Empfehlungen) | `allgemein` |
| `gaststaette.einsparprofis.de` (auch `/gaststaette`) | `app/gaststaette/page.tsx` | Aufsteller in Gaststätten | `gaststaette` |

- Ein `?src=…` in der URL überschreibt die Quelle, z. B. `einsparprofis.de/?src=facebook`. Die Quelle steht in der Telegram-Nachricht und in Google Sheets.
- Plätze, Frist und Beträge für beide Seiten stehen zentral in `app/lib/angebot.ts`.
- Die Subdomain wird in `proxy.ts` auf `/gaststaette` umgeschrieben. Dafür in Vercel unter **Settings → Domains** `gaststaette.einsparprofis.de` hinzufügen und beim Domain-Anbieter einen CNAME-Eintrag `gaststaette` → `cname.vercel-dns.com` anlegen.
