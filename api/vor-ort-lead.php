<?php
// Door-to-door lead, filled in together with the customer on the advisor's phone (/vor-ort).
// Logs the phone consent as proof (incl. "captured on site"), sends Telegram and appends to Google Sheets.
require_once __DIR__ . '/abrechnung/config.php';

// Consent text shown in app/lib/waermepumpe.ts (VORORT_CONSENT) – logged verbatim, keep both in sync
const VO_CONSENT_VERSION = 'vo-2026-11a';
const VO_CONSENT         = 'Ja, ich möchte, dass die Einsparprofis (Daniel Schultes) mich zu meinem Spar-Check telefonisch und per WhatsApp unter der angegebenen Nummer kontaktieren. Diese Einwilligung kann ich jederzeit per E-Mail an kontakt@einsparprofis.de widerrufen.';
const VO_ERFASST_VON     = 'Daniel Schultes (vor Ort, gemeinsam mit dem Kunden)';

const VO_WP_OPTIONS = [
    'eigentum' => ['selbst' => 'Eigentümer, selbst bewohnt', 'vermietet' => 'Eigentümer, vermietet', 'mieter' => 'Mieter'],
    'haustyp'  => ['efh' => 'Einfamilienhaus', 'dhh' => 'Doppel-/Reihenhaus', 'zfh' => 'Zweifamilienhaus', 'mfh' => 'Mehrfamilienhaus'],
    'heizung'  => ['gas' => 'Gas', 'oel' => 'Öl', 'nachtspeicher' => 'Nachtspeicher', 'andere' => 'Anderes'],
    'alter'    => ['ja' => 'älter als 15 Jahre', 'nein' => 'jünger als 15 Jahre', 'unbekannt' => 'Alter unbekannt'],
];

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_out(['error' => 'Method not allowed'], 405);
}

$body = json_decode(file_get_contents('php://input'), true);
if (!is_array($body)) json_out(['error' => 'Ungültige Anfrage'], 400);

$vorname  = trim((string) ($body['vorname'] ?? ''));
$nachname = trim((string) ($body['nachname'] ?? ''));
$plz      = trim((string) ($body['plz'] ?? ''));
$tel      = trim((string) ($body['tel'] ?? ''));
$src      = mb_substr(preg_replace('/[^a-z0-9-]/', '', strtolower((string) ($body['src'] ?? 'd2d'))), 0, 40) ?: 'd2d';

if (!is_name_valid($vorname) || !is_name_valid($nachname)) json_out(['error' => 'Vor- und Nachname fehlen.'], 400);
if (!preg_match('/^[1-9]\d{4}$/', $plz)) json_out(['error' => 'PLZ ungültig (5 Ziffern).'], 400);
$digits = preg_replace('/\D/', '', $tel);
if (!str_starts_with($tel, '+49') || strlen($digits) < 11 || strlen($digits) > 13) {
    json_out(['error' => 'Telefonnummer ungültig (deutsche Nummer).'], 400);
}
if (($body['consent'] ?? false) !== true) json_out(['error' => 'Der Kunde muss der Kontaktaufnahme zustimmen.'], 400);
if (($body['consentVersion'] ?? '') !== VO_CONSENT_VERSION) json_out(['error' => 'Bitte Seite neu laden.'], 400);

// Optional heat-pump qualification
$wp = null;
if (is_array($body['wp'] ?? null)) {
    $wp = [];
    foreach (VO_WP_OPTIONS as $key => $options) {
        $value = (string) ($body['wp'][$key] ?? '');
        if (!array_key_exists($value, $options)) json_out(['error' => 'Bitte alle Wärmepumpen-Fragen beantworten.'], 400);
        $wp[$key] = $options[$value];
    }
    $wpPassend = ($body['wp']['eigentum'] ?? '') !== 'mieter' && in_array($body['wp']['heizung'] ?? '', ['gas', 'oel', 'nachtspeicher'], true);
}

$now       = new DateTimeImmutable('now', new DateTimeZone('Europe/Berlin'));
$timestamp = $now->format('d.m.Y H:i:s');
$name      = "$vorname $nachname";

// 1) Proof of consent (UWG §7) – outside the web root
$consentDir = UPLOAD_DIR . '/einwilligungen';
$logged = false;
if (is_dir($consentDir) || @mkdir($consentDir, 0750, true)) {
    $entry = [
        'zeit'       => $now->format(DATE_ATOM),
        'name'       => $name,
        'telefon'    => $tel,
        'plz'        => $plz,
        'quelle'     => $src,
        'erfasst_von'=> VO_ERFASST_VON,
        'version'    => VO_CONSENT_VERSION,
        'telefon_einwilligung' => VO_CONSENT,
        'weitergabe_einwilligung' => null,
        'ip'         => $_SERVER['REMOTE_ADDR'] ?? '',
        'user_agent' => mb_substr($_SERVER['HTTP_USER_AGENT'] ?? '', 0, 300),
    ];
    $logged = file_put_contents(
        $consentDir . '/' . $now->format('Y-m') . '.jsonl',
        json_encode($entry, JSON_UNESCAPED_UNICODE) . "\n",
        FILE_APPEND | LOCK_EX
    ) !== false;
}
if (!$logged) error_log('Vor-Ort: consent log could not be written to ' . $consentDir);

// 2) Telegram
if (TELEGRAM_BOT_TOKEN && TELEGRAM_CHAT_ID) {
    $h = fn(string $s) => htmlspecialchars($s, ENT_QUOTES, 'UTF-8');
    $message = "🚪 <b>Neuer Door2Door-Lead!</b>\n\n"
        . "👤 <b>Name:</b> " . $h($name) . "\n"
        . "📍 <b>PLZ:</b> " . $h($plz) . "\n"
        . "📞 <b>Telefon:</b> " . $h($tel) . "\n";
    if ($wp) {
        $message .= "\n" . ($wpPassend ? "🔥 <b>Wärmepumpen-Potenzial!</b>" : "➖ Wärmepumpe eher nicht passend") . "\n"
            . "🔑 " . $h($wp['eigentum']) . " · 🏠 " . $h($wp['haustyp']) . "\n"
            . "🔥 Heizung: " . $h($wp['heizung']) . ", " . $h($wp['alter']) . "\n";
    }
    $message .= "\n✅ Telefon-Einwilligung vom Kunden vor Ort erteilt (" . VO_CONSENT_VERSION . ")" . ($logged ? '' : ' ⚠️ Protokoll fehlgeschlagen') . "\n"
        . "⛔ Weitergabe an Partner: nur nach Zustimmung im Gespräch\n"
        . "📊 <b>Quelle:</b> " . $h($src) . "\n"
        . "⏰ <b>Zeit:</b> " . $timestamp;

    $ch = curl_init('https://api.telegram.org/bot' . TELEGRAM_BOT_TOKEN . '/sendMessage');
    curl_setopt_array($ch, [
        CURLOPT_POST           => true,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER     => ['Content-Type: application/json'],
        CURLOPT_POSTFIELDS     => json_encode(['chat_id' => TELEGRAM_CHAT_ID, 'text' => $message, 'parse_mode' => 'HTML']),
        CURLOPT_TIMEOUT        => 10,
    ]);
    if (curl_exec($ch) === false) error_log('Telegram vor-ort error: ' . curl_error($ch));
    curl_close($ch);
}

// 3) Google Sheets – same tab as the website leads (Sheet1: Name, PLZ, Telefon, Schätzung, Quelle, Zeit)
if (GOOGLE_SHEETS_ID && GOOGLE_SHEETS_CREDS) {
    try {
        $creds = json_decode(GOOGLE_SHEETS_CREDS, true);
        $token = ($creds && isset($creds['client_email'], $creds['private_key'])) ? google_access_token($creds) : null;
        if ($token) {
            $info = $wp ? ('WP: ' . ($wpPassend ? 'Potenzial' : 'eher nicht') . ' – ' . implode(', ', $wp)) : 'Door2Door';
            $url  = 'https://sheets.googleapis.com/v4/spreadsheets/' . GOOGLE_SHEETS_ID . '/values/' . urlencode('Sheet1!A:F') . ':append?valueInputOption=USER_ENTERED';
            $ch   = curl_init($url);
            curl_setopt_array($ch, [
                CURLOPT_POST           => true,
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_HTTPHEADER     => ['Content-Type: application/json', 'Authorization: Bearer ' . $token],
                CURLOPT_POSTFIELDS     => json_encode(['values' => [[$name, $plz, $tel, $info, $src, $timestamp]]]),
                CURLOPT_TIMEOUT        => 10,
            ]);
            if (curl_exec($ch) === false) error_log('Google Sheets vor-ort error: ' . curl_error($ch));
            curl_close($ch);
        }
    } catch (Throwable $e) {
        error_log('Google Sheets vor-ort exception: ' . $e->getMessage());
    }
}

json_out(['success' => true], 201);
