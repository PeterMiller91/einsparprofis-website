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
