<?php
// Wärmepumpen-Lead: quiz answers + contact + phone opt-in.
// Sends Telegram, appends to the Google Sheets tab "Waermepumpe" and logs the consent as proof.
require_once __DIR__ . '/abrechnung/config.php';

// Consent text shown in app/lib/waermepumpe.ts – logged verbatim, keep both in sync.
// No transfer consent on the website: data is only passed on after explicit agreement in the phone call.
const WP_CONSENT_VERSION   = 'wp-2026-11c';
const WP_CONSENT_TELEFON   = 'Ja, ich möchte, dass die Einsparprofis (Daniel Schultes) mich zu meinem Wärmepumpen-Check telefonisch und per WhatsApp unter der angegebenen Nummer kontaktieren. Diese Einwilligung kann ich jederzeit per E-Mail an kontakt@einsparprofis.de widerrufen.';

const WP_OPTIONS = [
    'heizung'   => ['gas' => 'Gas', 'oel' => 'Öl', 'nachtspeicher' => 'Nachtspeicher / Strom', 'andere' => 'Anderes'],
    'haustyp'   => ['efh' => 'Einfamilienhaus', 'dhh' => 'Doppel-/Reihenhaus', 'zfh' => 'Zweifamilienhaus', 'mfh' => 'Mehrfamilienhaus'],
    'baujahr'   => ['vor1978' => 'vor 1978', '1978-1994' => '1978–1994', '1995-2009' => '1995–2009', 'ab2010' => 'ab 2010'],
    'eigentum'  => ['selbst' => 'Eigentümer, selbst bewohnt', 'vermietet' => 'Eigentümer, vermietet', 'mieter' => 'Mieter'],
    'einkommen' => ['ja' => 'unter Grenze', 'nein' => 'über Grenze', 'unbekannt' => 'weiß nicht'],
];
const WP_RUECKRUF = ['Egal', 'Vormittags', 'Nachmittags', 'Abends'];

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_out(['error' => 'Method not allowed'], 405);
}

$body = json_decode(file_get_contents('php://input'), true);
if (!is_array($body)) json_out(['error' => 'Ungültige Anfrage'], 400);

// Honeypot: only bots fill the hidden field – pretend success
if (trim((string) ($body['firma'] ?? '')) !== '') {
    json_out(['success' => true], 201);
}

$vorname  = trim((string) ($body['vorname'] ?? ''));
$nachname = trim((string) ($body['nachname'] ?? ''));
$plz      = trim((string) ($body['plz'] ?? ''));
$tel      = trim((string) ($body['tel'] ?? ''));
$rueckruf = (string) ($body['rueckruf'] ?? 'Egal');
$answers  = is_array($body['answers'] ?? null) ? $body['answers'] : [];
$foerderung = mb_substr((string) ($body['foerderung'] ?? ''), 0, 60);
$src      = mb_substr((string) ($body['src'] ?? 'waermepumpe'), 0, 60);

if (!is_name_valid($vorname) || !is_name_valid($nachname)) {
    json_out(['error' => 'Bitte Vor- und Nachnamen angeben (mind. 2 Buchstaben).'], 400);
}
if (!preg_match('/^[1-9]\d{4}$/', $plz)) {
    json_out(['error' => 'PLZ ungültig (5 Ziffern).'], 400);
}
$digits = preg_replace('/\D/', '', $tel);
if (!str_starts_with($tel, '+49') || strlen($digits) < 11 || strlen($digits) > 13) {
    json_out(['error' => 'Telefonnummer ungültig (deutsche Nummer erforderlich).'], 400);
}
if (($body['consentTelefon'] ?? false) !== true) {
    json_out(['error' => 'Ohne Ihre Einwilligung dürfen wir Sie nicht anrufen.'], 400);
}
if (($body['consentVersion'] ?? '') !== WP_CONSENT_VERSION) {
    json_out(['error' => 'Bitte laden Sie die Seite neu und senden Sie das Formular erneut.'], 400);
}
if (!in_array($rueckruf, WP_RUECKRUF, true)) $rueckruf = 'Egal';

$labels = [];
foreach (WP_OPTIONS as $key => $options) {
    $value = (string) ($answers[$key] ?? '');
    if (!array_key_exists($value, $options)) {
        json_out(['error' => 'Bitte beantworten Sie alle Fragen.'], 400);
    }
    $labels[$key] = $options[$value];
}

$now        = new DateTimeImmutable('now', new DateTimeZone('Europe/Berlin'));
$timestamp  = $now->format('d.m.Y H:i:s');
$name       = "$vorname $nachname";

// 1) Proof of consent (UWG §7: phone advertising needs prior express consent).
//    Stored outside the web root next to the uploads; this must not fail silently.
$consentDir = UPLOAD_DIR . '/einwilligungen';
$logged = false;
if (is_dir($consentDir) || @mkdir($consentDir, 0750, true)) {
    $entry = [
        'zeit'       => $now->format(DATE_ATOM),
        'name'       => $name,
        'telefon'    => $tel,
        'plz'        => $plz,
        'quelle'     => $src,
        'version'    => WP_CONSENT_VERSION,
        'telefon_einwilligung' => WP_CONSENT_TELEFON,
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
if (!$logged) error_log('Waermepumpe: consent log could not be written to ' . $consentDir);

// 2) Telegram
if (TELEGRAM_BOT_TOKEN && TELEGRAM_CHAT_ID) {
    $h = fn(string $s) => htmlspecialchars($s, ENT_QUOTES, 'UTF-8');
    $message = "🔥 <b>Neuer Wärmepumpen-Lead!</b>\n\n"
        . "👤 <b>Name:</b> " . $h($name) . "\n"
        . "📍 <b>PLZ:</b> " . $h($plz) . "\n"
        . "📞 <b>Telefon:</b> " . $h($tel) . " (Rückruf: " . $h($rueckruf) . ")\n\n"
        . "🏠 " . $h($labels['haustyp']) . ", Baujahr " . $h($labels['baujahr']) . "\n"
        . "🔥 Heizung: " . $h($labels['heizung']) . "\n"
        . "🔑 " . $h($labels['eigentum']) . " · Einkommen " . $h($labels['einkommen']) . "\n"
        . "💶 <b>Mögliche Förderung:</b> " . $h($foerderung ?: '–') . "\n\n"
        . "✅ Telefon-Einwilligung erteilt (" . WP_CONSENT_VERSION . ")" . ($logged ? '' : ' ⚠️ Protokoll fehlgeschlagen') . "\n"
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
    if (curl_exec($ch) === false) error_log('Telegram waermepumpe error: ' . curl_error($ch));
    curl_close($ch);
}

// 3) Google Sheets – separate tab "Waermepumpe" (create it once in the sheet)
if (GOOGLE_SHEETS_ID && GOOGLE_SHEETS_CREDS) {
    try {
        $creds = json_decode(GOOGLE_SHEETS_CREDS, true);
        $token = ($creds && isset($creds['client_email'], $creds['private_key'])) ? google_access_token($creds) : null;
        if ($token) {
            $row = [$timestamp, $name, $plz, $tel, $rueckruf, $labels['heizung'], $labels['haustyp'], $labels['baujahr'],
                    $labels['eigentum'], $labels['einkommen'], $foerderung, 'ja', 'im Gespräch', WP_CONSENT_VERSION, $src];
            $url = 'https://sheets.googleapis.com/v4/spreadsheets/' . GOOGLE_SHEETS_ID . '/values/' . urlencode('Waermepumpe!A:O') . ':append?valueInputOption=USER_ENTERED';
            $ch  = curl_init($url);
            curl_setopt_array($ch, [
                CURLOPT_POST           => true,
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_HTTPHEADER     => ['Content-Type: application/json', 'Authorization: Bearer ' . $token],
                CURLOPT_POSTFIELDS     => json_encode(['values' => [$row]]),
                CURLOPT_TIMEOUT        => 10,
            ]);
            if (curl_exec($ch) === false) error_log('Google Sheets waermepumpe error: ' . curl_error($ch));
            curl_close($ch);
        }
    } catch (Throwable $e) {
        error_log('Google Sheets waermepumpe exception: ' . $e->getMessage());
    }
}

json_out(['success' => true], 201);
