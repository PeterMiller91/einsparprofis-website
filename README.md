# Einsparprofis – Website

Next.js als **statischer Export** (`output: "export"`) plus PHP-Endpunkte, gehostet bei **netcup** (Webhosting, Apache + PHP 8.5).

## Lokal entwickeln

```bash
npm ci
npm run dev   # http://localhost:3000
```

PHP-Endpunkte laufen lokal nicht mit `next dev`. Zum Testen z. B. `npx next build --webpack` und `out/` mit `php -S localhost:8000 -t out` ausliefern.

## Deployment (netcup)

1. Push auf `main` → GitHub Action **Deploy (netcup)** baut die Seite (`npx next build --webpack`) und legt `out/` in den Branch **`deploy`**.
2. netcup (Plesk → Git) zieht den Branch `deploy` nach `einsparprofis.de/httpdocs/out`. Ohne Webhook: in Plesk „Jetzt Pull ausführen“.
3. `httpdocs/.htaccess` (liegt nur auf dem Server) leitet alle Anfragen nach `out/`, sorgt für saubere URLs (`/waermepumpe` → `waermepumpe.html`) und für die PHP-API ohne Endung.

Regeln:

- Nie direkt im Branch `deploy` oder in `httpdocs/out` arbeiten – wird bei jedem Deploy überschrieben.
- Nur Funktionen, die als statischer Export laufen: keine API-Routes, Server Actions, Middleware/`proxy.ts`, dynamische Routen ohne `generateStaticParams`, keine Bildoptimierung über `next/image`. Serverlogik kommt als PHP nach `public/api/`.
- Neue PHP-Endpunkte unter `/api/…` sind ohne Endung nur erreichbar, wenn sie in `httpdocs/.htaccess` eingetragen sind – sonst mit `.php` aufrufen.

## Zugangsdaten

Liegen **nur auf dem Server** in `httpdocs/_private/config.php` (per `.htaccess` gesperrt, nicht im Repo – das Repo ist öffentlich): Telegram-Bot-Token und Chat-ID, Google-Sheets-ID und Servicekonto-JSON. Der Signier-Schlüssel für Upload-Links wird dort automatisch erzeugt. `public/api/abrechnung/config.php` lädt diese Datei.

## Abrechnungs-Upload (`/abrechnung-hochladen`)

Kunden laden Abrechnungen (PDF, JPG, PNG, WEBP, HEIC; max. 10 Dateien à 20 MB) hoch. Die Dateien landen auf dem Server in `httpdocs/_private/uploads/abrechnungen/JJJJ-MM/Nachname_Vorname_<Zeit>_<id>/` zusammen mit `_angaben.json`.

Dateinamen: `Nachname_Vorname_Art_JJJJ-MM-TT_HH-MM-SS.ext` (deutsche Zeit). Nach jedem Upload kommt eine Telegram-Nachricht mit Download-Links (30 Tage gültig).

Personalisierter Link, z. B. für WhatsApp: `/abrechnung-hochladen?vorname=Anna&nachname=Müller&src=whatsapp`

| Endpunkt | Zweck |
| --- | --- |
| `POST /api/abrechnung/session` | Prüft Formular und Dateiliste, vergibt Dateinamen und signierte Upload-Tickets |
| `POST /api/abrechnung/upload` | Nimmt eine Datei mit gültigem Ticket entgegen und speichert sie |
| `POST /api/abrechnung/complete` | Prüft die Dateien (Dateisignatur), speichert die Angaben und benachrichtigt per Telegram |
| `GET /api/abrechnung/datei?t=…` | Signierter Download-Link |

## Landingpages

| Adresse | Datei | Zielgruppe | Lead-Quelle (`src`) |
| --- | --- | --- | --- |
| `einsparprofis.de` | `app/page.tsx` | allgemein (Werbung, Social, Empfehlungen) | `allgemein` |
| `einsparprofis.de/gaststaette` | `app/gaststaette/page.tsx` | Aufsteller in Gaststätten | `gaststaette` |

- Ein `?src=…` in der URL überschreibt die Quelle, z. B. `einsparprofis.de/?src=facebook`. Die Quelle steht in der Telegram-Nachricht und in Google Sheets.
- Plätze, Frist und Beträge stehen zentral in `app/lib/angebot.ts`.
- Subdomain `gaststaette.einsparprofis.de`: `httpdocs/.htaccess` liefert dafür `/gaststaette` aus. Dafür muss die Subdomain in Plesk angelegt und auf denselben Dokumentenstamm gelegt werden.

## Wärmepumpen-Landingpage (`/waermepumpe`)

Lead-Seite für Wärmepumpen: Quiz mit 5 Fragen, danach die mögliche KfW-Förderung und ein Kontaktformular mit Telefon-Opt-in.

- **Zahlen** (Plätze, Garantie, Förderwerte, Klimabonus-Frist) stehen in `app/lib/waermepumpe.ts`. Förderwerte vor Kampagnen auf kfw.de/458 prüfen. `klimabonusEnde: null` blendet den Hinweis auf das Ende des Klimabonus aus.
- **Endpunkt:** `public/api/waermepumpe-lead.php` (`/api/waermepumpe-lead`):
  - prüft alle Angaben und die Telefon-Einwilligung,
  - schickt eine Telegram-Nachricht,
  - hängt eine Zeile an den Google-Sheets-Tab **`Waermepumpe`** an. Den Tab einmalig anlegen, Spalten: Zeit, Name, PLZ, Telefon, Rückruf, Heizung, Haustyp, Baujahr, Eigentum, Einkommen, Förderung, Telefon-Einwilligung, Weitergabe, Version, Quelle.
- **Einwilligungsnachweis (§ 7 UWG):** Jede Telefon-Einwilligung wird mit Wortlaut, Version, Zeit, IP und Browser in `UPLOAD_DIR/einwilligungen/JJJJ-MM.jsonl` protokolliert, außerhalb des Webroots.
- **Einwilligungstext ändern:** Den Text in `app/lib/waermepumpe.ts` **und** `public/api/waermepumpe-lead.php` identisch ändern und die Version (`wp-…`) in beiden Dateien erhöhen. Ältere Nachweise bleiben so eindeutig zuordenbar.
