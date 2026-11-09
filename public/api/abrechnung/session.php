<?php
require_once __DIR__ . '/config.php';

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_out(['error' => 'Method not allowed'], 405);
}

if (!SIGNING_SECRET) {
    error_log('UPLOAD_SIGNING_SECRET missing');
    json_out(['error' => 'Upload ist gerade nicht verfügbar.'], 503);
}

$body = json_decode(file_get_contents('php://input'), true);
if (!$body) json_out(['error' => 'Ungültige Anfrage'], 400);

$vorname = $body['vorname'] ?? '';
$nachname = $body['nachname'] ?? '';
$typen   = $body['typen']   ?? [];
$files   = $body['files']   ?? [];
$consent = $body['consent'] ?? false;
$firma   = $body['firma']   ?? '';
$src     = $body['src']     ?? 'website';

// Honeypot
if (is_string($firma) && trim($firma) !== '') json_out(['error' => 'Ungültige Anfrage'], 400);

if (!is_string($vorname) || !is_name_valid($vorname)) json_out(['error' => 'Vorname ungültig (mind. 2 Buchstaben)'], 400);
if (!is_string($nachname) || !is_name_valid($nachname)) json_out(['error' => 'Nachname ungültig (mind. 2 Buchstaben)'], 400);
if ($consent !== true) json_out(['error' => 'Bitte stimmen Sie der Datenverarbeitung zu'], 400);
if (!is_array($typen) || count($typen) === 0 || !array_reduce($typen, fn($ok, $t) => $ok && is_typ_valid($t), true)) {
    json_out(['error' => 'Bitte mindestens einen Typ der Abrechnung auswählen'], 400);
}
if (!is_array($files) || count($files) === 0) json_out(['error' => 'Bitte mindestens eine Datei auswählen'], 400);
if (count($files) > MAX_FILES) json_out(['error' => 'Maximal ' . MAX_FILES . ' Dateien pro Upload'], 400);

$selectedTypen = array_values(array_filter(array_keys(ABRECHNUNG_TYPEN), fn($t) => in_array($t, $typen, true)));

foreach ($files as $f) {
    if (!isset($f['name'], $f['size'], $f['typ'])) json_out(['error' => 'Ungültige Dateiangaben'], 400);
    if (!content_type_for($f['name'])) json_out(['error' => 'Dateiformat nicht erlaubt: ' . $f['name']], 400);
    if ($f['size'] <= 0 || $f['size'] > MAX_FILE_SIZE) json_out(['error' => 'Datei zu groß (max. 20 MB): ' . $f['name']], 400);
    if (!in_array($f['typ'], $selectedTypen, true)) json_out(['error' => 'Typ der Datei passt nicht zur Auswahl: ' . $f['name']], 400);
}

// Generate folder path with Berlin timestamp
$now = new DateTimeImmutable('now', new DateTimeZone('Europe/Berlin'));
$month  = $now->format('Y-m');
$day    = $now->format('Y-m-d');
$time   = $now->format('H-i-s');

function slug(string $s): string {
    $s = str_replace(['ä','ö','ü','Ä','Ö','Ü','ß'], ['ae','oe','ue','Ae','Oe','Ue','ss'], $s);
    $s = iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $s) ?: $s;
    $s = preg_replace('/[^A-Za-z0-9-]+/', '-', $s);
    return trim($s, '-');
}

$person = (slug(trim($nachname)) ?: 'Unbekannt') . '_' . (slug(trim($vorname)) ?: 'Unbekannt');
$id     = bin2hex(random_bytes(4));
$folder = "abrechnungen/$month/{$person}_{$day}_{$time}_{$id}";

// Count how many times each type appears
$totalPerTyp = array_count_values(array_column($files, 'typ'));
$perTyp      = [];
$sessionFiles  = [];
$responseFiles = [];

foreach ($files as $f) {
    $typFile = ABRECHNUNG_TYPEN[$f['typ']];
    $perTyp[$f['typ']] = ($perTyp[$f['typ']] ?? 0) + 1;
    $counter  = $totalPerTyp[$f['typ']] > 1 ? '_' . $perTyp[$f['typ']] : '';
    $ext      = file_extension($f['name']);
    $fileName = "{$person}_{$typFile}_{$day}_{$time}{$counter}.{$ext}";
    $pathname = "$folder/$fileName";
    $contentType = content_type_for($f['name']);

    $sessionFiles[]  = ['pathname' => $pathname, 'fileName' => $fileName, 'originalName' => substr($f['name'], 0, 200), 'typ' => $f['typ'], 'size' => (int)$f['size']];
    $responseFiles[] = ['pathname' => $pathname, 'fileName' => $fileName, 'contentType' => $contentType, 'ticket' => sign(['p' => $pathname, 't' => $contentType], SESSION_TTL)];
}

$session = [
    'id'       => $id,
    'folder'   => $folder,
    'vorname'  => trim($vorname),
    'nachname' => trim($nachname),
    'typen'    => $selectedTypen,
    'files'    => $sessionFiles,
    'createdAt' => (new DateTimeImmutable())->format('c'),
    'src'      => substr(is_string($src) ? $src : 'website', 0, 100),
];

json_out(['sessionToken' => sign($session, SESSION_TTL), 'files' => $responseFiles]);
