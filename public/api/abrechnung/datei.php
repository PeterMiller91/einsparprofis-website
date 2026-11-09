<?php
require_once __DIR__ . '/config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    json_out(['error' => 'Method not allowed'], 405);
}

$payload = verify($_GET['t'] ?? null);
if (!$payload || empty($payload['p']) || !str_starts_with($payload['p'], 'abrechnungen/')) {
    http_response_code(403);
    header('Content-Type: text/plain; charset=utf-8');
    echo 'Link ungültig oder abgelaufen.';
    exit;
}

$uploadBase = realpath(UPLOAD_DIR) ?: UPLOAD_DIR;
$filePath   = UPLOAD_DIR . '/' . $payload['p'];
$realPath   = realpath($filePath);

if ($realPath === false || !str_starts_with($realPath, $uploadBase . DIRECTORY_SEPARATOR)) {
    http_response_code(403);
    header('Content-Type: text/plain; charset=utf-8');
    echo 'Zugriff verweigert.';
    exit;
}

if (!file_exists($realPath)) {
    http_response_code(404);
    header('Content-Type: text/plain; charset=utf-8');
    echo 'Datei nicht verfügbar.';
    exit;
}

$ext         = file_extension($payload['p']);
$contentType = ALLOWED_FORMATS[$ext] ?? 'application/octet-stream';
$fileName    = basename($payload['p']);

header('Content-Type: ' . $contentType);
header('Content-Disposition: attachment; filename="' . rawurlencode($fileName) . '"');
header('Content-Length: ' . filesize($realPath));
header('Cache-Control: no-store');

readfile($realPath);
exit;
