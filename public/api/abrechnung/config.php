<?php
// Load local config first (created on server, never in git)
$localConfig = __DIR__ . '/config.local.php';
if (file_exists($localConfig)) {
    require_once $localConfig;
}

defined('SIGNING_SECRET')      || define('SIGNING_SECRET',      getenv('UPLOAD_SIGNING_SECRET') ?: '');
defined('UPLOAD_DIR')          || define('UPLOAD_DIR',          getenv('UPLOAD_DIR') ?: dirname(dirname(dirname(dirname(__FILE__)))) . '/uploads');
defined('TELEGRAM_BOT_TOKEN')  || define('TELEGRAM_BOT_TOKEN',  getenv('TELEGRAM_BOT_TOKEN') ?: '');
defined('TELEGRAM_CHAT_ID')    || define('TELEGRAM_CHAT_ID',    getenv('TELEGRAM_CHAT_ID') ?: '');
defined('GOOGLE_SHEETS_ID')    || define('GOOGLE_SHEETS_ID',    getenv('GOOGLE_SHEETS_ID') ?: '');
defined('GOOGLE_SHEETS_CREDS') || define('GOOGLE_SHEETS_CREDS', getenv('GOOGLE_SHEETS_CREDENTIALS') ?: '');

const MAX_FILE_SIZE = 20 * 1024 * 1024;
const MAX_FILES     = 10;
const SESSION_TTL   = 2 * 60 * 60 * 1000;
const DOWNLOAD_TTL  = 30 * 24 * 60 * 60 * 1000;

const ABRECHNUNG_TYPEN = [
    'strom'          => 'Strom',
    'gas'            => 'Gas',
    'hausrat'        => 'Hausrat',
    'wohngebaeude'   => 'Wohngebaeude',
    'haftpflicht'    => 'Haftpflicht',
    'sonstige'       => 'Sonstige',
];

const ALLOWED_FORMATS = [
    'pdf'  => 'application/pdf',
    'jpg'  => 'image/jpeg',
    'jpeg' => 'image/jpeg',
    'png'  => 'image/png',
    'webp' => 'image/webp',
    'heic' => 'image/heic',
    'heif' => 'image/heif',
];

function b64u_encode(string $data): string {
    return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
}

function b64u_decode(string $data): string {
    return base64_decode(strtr($data, '-_', '+/'));
}

function sign(array $payload, int $ttlMs): string {
    $secret = SIGNING_SECRET;
    $data   = b64u_encode(json_encode(array_merge($payload, ['exp' => intval(microtime(true) * 1000) + $ttlMs])));
    $sig    = b64u_encode(hash_hmac('sha256', $data, $secret, true));
    return "$data.$sig";
}

function verify(mixed $token): ?array {
    if (!is_string($token)) return null;
    $parts = explode('.', $token, 2);
    if (count($parts) !== 2) return null;
    [$data, $sig] = $parts;
    $expected = b64u_encode(hash_hmac('sha256', $data, SIGNING_SECRET, true));
    if (!hash_equals($expected, $sig)) return null;
    $payload = json_decode(b64u_decode($data), true);
    if (!isset($payload['exp']) || $payload['exp'] < intval(microtime(true) * 1000)) return null;
    return $payload;
}

function json_out(mixed $data, int $status = 200): never {
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

function file_extension(string $name): string {
    preg_match('/\.([a-z0-9]+)$/i', $name, $m);
    return isset($m[1]) ? strtolower($m[1]) : '';
}

function content_type_for(string $name): ?string {
    return ALLOWED_FORMATS[file_extension($name)] ?? null;
}

function is_name_valid(string $name): bool {
    return (bool) preg_match('/^[\pL][\pL\s\'\-\.]{1,49}$/u', trim($name));
}

function is_typ_valid(string $typ): bool {
    return array_key_exists($typ, ABRECHNUNG_TYPEN);
}

function format_bytes(int $bytes): string {
    if ($bytes >= 1024 * 1024) {
        return number_format($bytes / (1024 * 1024), 1, ',', '.') . ' MB';
    }
    return max(1, (int) round($bytes / 1024)) . ' KB';
}

/** Appends one consent record to UPLOAD_DIR/einwilligungen/YYYY-MM.jsonl. Returns false if it could not be written. */
function log_consent(string $formular, array $entry): bool {
    $dir = UPLOAD_DIR . '/einwilligungen';
    if (!is_dir($dir) && !@mkdir($dir, 0750, true)) {
        error_log('Consent log directory could not be created: ' . $dir);
        return false;
    }
    $entry += [
        'formular'   => $formular,
        'ip'         => $_SERVER['REMOTE_ADDR'] ?? '',
        'user_agent' => mb_substr($_SERVER['HTTP_USER_AGENT'] ?? '', 0, 300),
    ];
    $ok = file_put_contents($dir . '/' . date('Y-m') . '.jsonl', json_encode($entry, JSON_UNESCAPED_UNICODE) . "\n", FILE_APPEND | LOCK_EX) !== false;
    if (!$ok) error_log('Consent log could not be written to ' . $dir);
    return $ok;
}

// Service-account access token for Google Sheets (used by lead.php and waermepumpe-lead.php)
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
