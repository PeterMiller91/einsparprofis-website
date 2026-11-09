<?php
require_once __DIR__ . '/../abrechnung/config.php';

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_out(['error' => 'Method not allowed'], 405);
}

$body = json_decode(file_get_contents('php://input'), true);
if (!$body) json_out(['error' => 'Ungültige Anfrage'], 400);

$name      = trim($body['name']     ?? '');
$plz       = trim($body['plz']      ?? '');
$tel       = trim($body['tel']      ?? '');
$schaetzung = $body['schaetzung']   ?? null;
$src        = $body['src']          ?? 'Website';
$consent    = $body['consent']      ?? false;

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

$timestamp = (new DateTimeImmutable())->setTimezone(new DateTimeZone('Europe/Berlin'))->format('d.m.Y H:i:s');

// Telegram
if (TELEGRAM_BOT_TOKEN && TELEGRAM_CHAT_ID) {
    $message = "🎯 <b>Neuer Lead!</b>\n\n"
        . "👤 <b>Name:</b> " . htmlspecialchars($name) . "\n"
        . "📍 <b>PLZ:</b> " . htmlspecialchars($plz) . "\n"
        . "📞 <b>Telefon:</b> " . htmlspecialchars($tel) . "\n"
        . "💰 <b>Schätzung:</b> " . htmlspecialchars($schaetzung ?: 'Nicht angegeben') . "\n"
        . "📊 <b>Quelle:</b> " . htmlspecialchars($src) . "\n"
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

function google_access_token(array $creds): ?string {
    $now    = time();
    $header  = b64u_encode(json_encode(['alg' => 'RS256', 'typ' => 'JWT']));
    $payload = b64u_encode(json_encode([
        'iss'   => $creds['client_email'],
        'scope' => 'https://www.googleapis.com/auth/spreadsheets',
        'aud'   => 'https://oauth2.googleapis.com/token',
        'iat'   => $now,
        'exp'   => $now + 3600,
    ]));
    $signingInput = "$header.$payload";
    $key = openssl_pkey_get_private($creds['private_key']);
    if (!$key) return null;
    openssl_sign($signingInput, $signature, $key, 'SHA256');
    $jwt = $signingInput . '.' . b64u_encode($signature);

    $ch = curl_init('https://oauth2.googleapis.com/token');
    curl_setopt_array($ch, [
        CURLOPT_POST           => true,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POSTFIELDS     => http_build_query(['grant_type' => 'urn:ietf:params:oauth:grant-type:jwt-bearer', 'assertion' => $jwt]),
        CURLOPT_TIMEOUT        => 10,
    ]);
    $response = curl_exec($ch);
    curl_close($ch);
    $data = json_decode($response, true);
    return $data['access_token'] ?? null;
}
