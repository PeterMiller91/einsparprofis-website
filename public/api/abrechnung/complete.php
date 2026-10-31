<?php
require_once __DIR__ . '/config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_out(['error' => 'Method not allowed'], 405);
}

$body = json_decode(file_get_contents('php://input'), true);
$session = verify($body['sessionToken'] ?? null);
if (!$session) {
    json_out(['error' => 'Upload-Sitzung abgelaufen. Bitte erneut hochladen.'], 400);
}

$uploadBase = UPLOAD_DIR;
$metaPath   = "$uploadBase/{$session['folder']}/_angaben.json";

// Idempotent: repeated call must not notify twice
if (file_exists($metaPath)) {
    json_out(['success' => true, 'files' => array_column($session['files'], 'fileName')]);
}

function read_header(string $path): ?string {
    $fh = @fopen($path, 'rb');
    if (!$fh) return null;
    $bytes = fread($fh, 12);
    fclose($fh);
    return $bytes ?: null;
}

function matches_magic_bytes(?string $bytes, string $pathname): bool {
    if ($bytes === null) return false;
    $ext = strtolower(pathinfo($pathname, PATHINFO_EXTENSION));
    switch ($ext) {
        case 'pdf':  return substr($bytes, 0, 5) === '%PDF-';
        case 'jpg':
        case 'jpeg': return ord($bytes[0]) === 0xFF && ord($bytes[1]) === 0xD8 && ord($bytes[2]) === 0xFF;
        case 'png':  return ord($bytes[0]) === 0x89 && substr($bytes, 1, 3) === 'PNG';
        case 'webp': return substr($bytes, 0, 4) === 'RIFF' && substr($bytes, 8, 4) === 'WEBP';
        case 'heic':
        case 'heif': return substr($bytes, 4, 4) === 'ftyp';
        default:     return false;
    }
}

$missing = [];
$invalid = [];

foreach ($session['files'] as $f) {
    $filePath = "$uploadBase/{$f['pathname']}";
    // Path traversal check
    if (!str_starts_with(realpath(dirname($filePath)) ?: '', realpath($uploadBase) ?: $uploadBase)) continue;

    if (!file_exists($filePath)) {
        $missing[] = $f['originalName'];
    } else {
        $header = read_header($filePath);
        if (!matches_magic_bytes($header, $f['pathname'])) {
            $invalid[] = $f['originalName'];
            @unlink($filePath);
        }
    }
}

if ($missing) json_out(['error' => 'Noch nicht hochgeladen: ' . implode(', ', $missing), 'missing' => $missing], 409);
if ($invalid) json_out(['error' => 'Datei beschädigt oder falsches Format: ' . implode(', ', $invalid), 'invalid' => $invalid], 422);

// Save metadata
$meta = array_merge($session, ['completedAt' => (new DateTimeImmutable())->format('c')]);
@mkdir(dirname($metaPath), 0750, true);
file_put_contents($metaPath, json_encode($meta, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));

// Telegram notification
if (TELEGRAM_BOT_TOKEN && TELEGRAM_CHAT_ID) {
    $protocol = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
    $origin   = $protocol . '://' . ($_SERVER['HTTP_HOST'] ?? 'einsparprofis.de');

    $fileLines = array_map(function($f) use ($origin) {
        $link = $origin . '/api/abrechnung/datei?t=' . sign(['p' => $f['pathname']], DOWNLOAD_TTL);
        return '📄 <a href="' . htmlspecialchars($link) . '">' . htmlspecialchars($f['fileName']) . '</a> (' . format_bytes($f['size']) . ')';
    }, $session['files']);

    $dt = new DateTimeImmutable($session['createdAt']);
    $dt = $dt->setTimezone(new DateTimeZone('Europe/Berlin'));

    $typenLabels = array_map(fn($t) => ABRECHNUNG_TYPEN[$t] ?? $t, $session['typen']);

    $message = "📥 <b>Neue Abrechnungen hochgeladen!</b>\n\n"
        . "👤 <b>Name:</b> " . htmlspecialchars($session['vorname']) . " " . htmlspecialchars($session['nachname']) . "\n"
        . "🧾 <b>Typ:</b> " . htmlspecialchars(implode(', ', $typenLabels)) . "\n"
        . "📊 <b>Quelle:</b> " . htmlspecialchars($session['src']) . "\n"
        . "⏰ <b>Zeit:</b> " . $dt->format('d.m.Y H:i:s') . "\n\n"
        . implode("\n", $fileLines) . "\n\n"
        . "<i>Links 30 Tage gültig · Ordner: " . htmlspecialchars($session['folder']) . "</i>";

    $ch = curl_init('https://api.telegram.org/bot' . TELEGRAM_BOT_TOKEN . '/sendMessage');
    curl_setopt_array($ch, [
        CURLOPT_POST           => true,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER     => ['Content-Type: application/json'],
        CURLOPT_POSTFIELDS     => json_encode(['chat_id' => TELEGRAM_CHAT_ID, 'text' => $message, 'parse_mode' => 'HTML', 'disable_web_page_preview' => true]),
        CURLOPT_TIMEOUT        => 10,
    ]);
    $result = curl_exec($ch);
    if ($result === false) error_log('Telegram error: ' . curl_error($ch));
    curl_close($ch);
}

json_out(['success' => true, 'files' => array_column($session['files'], 'fileName')], 201);
