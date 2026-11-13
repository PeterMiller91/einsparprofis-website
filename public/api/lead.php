<?php
// Haushalts-Check lead: Telegram + Google Sheets + proof of consent
require_once __DIR__ . '/abrechnung/config.php';

// Consent text shown in app/lib/angebot.ts – logged verbatim, keep both in sync
const LEAD_CONSENT_VERSION = 'hc-2026-11';
const LEAD_CONSENT = 'Ich stimme zu, dass die Einsparprofis (Daniel Schultes) mich zu meinem Haushalts-Check telefonisch und per WhatsApp unter der angegebenen Nummer kontaktieren. Diese Einwilligung kann ich jederzeit per E-Mail an kontakt@einsparprofis.de widerrufen.';

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_out(['error' => 'Method not allowed'], 405);
}

$body = json_decode(file_get_contents('php://input'), true);
if (!is_array($body)) json_out(['error' => 'Ungültige Anfrage'], 400);

// Honeypot: only bots fill the hidden field – pretend success
if (trim((string) ($body['firma'] ?? '')) !== '') {
    json_out(['success' => true], 201);
}

$name      = trim($body['name']     ?? '');
$plz       = trim($body['plz']      ?? '');
$tel       = trim($body['tel']      ?? '');
$schaetzung = mb_substr((string) ($body['schaetzung'] ?? ''), 0, 80);
$src        = mb_substr((string) ($body['src'] ?? 'Website'), 0, 60);
$consent    = ($body['consent'] ?? false) === true;

if (!$name || !$plz || !$tel || !$consent) {
    json_out(['error' => 'Pflichtfelder erforderlich'], 400);
}

if (!preg_match('/^[1-9]\d{4}$/', $plz)) {
    json_out(['error' => 'PLZ ungültig (5 Ziffern, erste Ziffer nicht 0)'], 400);
}

$digits = preg_replace('/\D/', '', $tel);
if (str_starts_with($tel, '+49')) {
    $valid = strlen($digits) >= 11 && strlen($digits) <= 13;
} elseif (str_starts_with($tel, '0')) {
    $valid = strlen($digits) >= 10 && strlen($digits) <= 11;
} else {
    $valid = strlen($digits) >= 10 && strlen($digits) <= 13;
}
if (!$valid) json_out(['error' => 'Telefon ungültig (deutsche Nummer erforderlich)'], 400);

if (!preg_match('/^[\pL\s\-]{2,}/u', $name)) {
    json_out(['error' => 'Name ungültig (mind. 2 Buchstaben)'], 400);
}

if (($body['consentVersion'] ?? '') !== LEAD_CONSENT_VERSION) {
    json_out(['error' => 'Bitte laden Sie die Seite neu und senden Sie das Formular erneut.'], 400);
}

$now       = new DateTimeImmutable('now', new DateTimeZone('Europe/Berlin'));
$timestamp = $now->format('d.m.Y H:i:s');

// Proof of consent (UWG §7), stored outside the web root next to the uploads
$logged = log_consent('haushalts-check', [
    'zeit'         => $now->format(DATE_ATOM),
    'name'         => $name,
    'telefon'      => $tel,
    'plz'          => $plz,
    'quelle'       => $src,
    'version'      => LEAD_CONSENT_VERSION,
    'einwilligung' => LEAD_CONSENT,
]);

// Telegram
if (TELEGRAM_BOT_TOKEN && TELEGRAM_CHAT_ID) {
    $message = "🎯 <b>Neuer Lead!</b>\n\n"
        . "👤 <b>Name:</b> " . htmlspecialchars($name) . "\n"
        . "📍 <b>PLZ:</b> " . htmlspecialchars($plz) . "\n"
        . "📞 <b>Telefon:</b> " . htmlspecialchars($tel) . "\n"
        . "💰 <b>Schätzung:</b> " . htmlspecialchars($schaetzung ?: 'Nicht angegeben') . "\n"
        . "📊 <b>Quelle:</b> " . htmlspecialchars($src) . "\n"
        . "✅ Kontakt-Einwilligung erteilt (" . LEAD_CONSENT_VERSION . ")" . ($logged ? '' : ' ⚠️ Protokoll fehlgeschlagen') . "\n"
        . "⏰ <b>Zeit:</b> " . $timestamp;

    $ch = curl_init('https://api.telegram.org/bot' . TELEGRAM_BOT_TOKEN . '/sendMessage');
    curl_setopt_array($ch, [
        CURLOPT_POST           => true,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER     => ['Content-Type: application/json'],
        CURLOPT_POSTFIELDS     => json_encode(['chat_id' => TELEGRAM_CHAT_ID, 'text' => $message, 'parse_mode' => 'HTML']),
        CURLOPT_TIMEOUT        => 10,
    ]);
    $result = curl_exec($ch);
    if ($result === false) error_log('Telegram lead error: ' . curl_error($ch));
    curl_close($ch);
}

// Google Sheets
if (GOOGLE_SHEETS_ID && GOOGLE_SHEETS_CREDS) {
    try {
        $creds = json_decode(GOOGLE_SHEETS_CREDS, true);
        if ($creds && isset($creds['client_email'], $creds['private_key'])) {
            $token = google_access_token($creds);
            if ($token) {
                $range = urlencode('Sheet1!A:F');
                $url   = 'https://sheets.googleapis.com/v4/spreadsheets/' . GOOGLE_SHEETS_ID . '/values/' . $range . ':append?valueInputOption=USER_ENTERED';
                $ch    = curl_init($url);
                curl_setopt_array($ch, [
                    CURLOPT_POST           => true,
                    CURLOPT_RETURNTRANSFER => true,
                    CURLOPT_HTTPHEADER     => ['Content-Type: application/json', 'Authorization: Bearer ' . $token],
                    CURLOPT_POSTFIELDS     => json_encode(['values' => [[$name, $plz, $tel, $schaetzung ?: 'Nicht angegeben', $src, $timestamp]]]),
                    CURLOPT_TIMEOUT        => 10,
                ]);
                $result = curl_exec($ch);
                if ($result === false) error_log('Google Sheets error: ' . curl_error($ch));
                curl_close($ch);
            }
        }
    } catch (Throwable $e) {
        error_log('Google Sheets exception: ' . $e->getMessage());
    }
}

json_out(['success' => true, 'message' => 'Lead erfolgreich gespeichert'], 201);
