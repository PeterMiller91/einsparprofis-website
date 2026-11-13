<?php
require_once __DIR__ . '/config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_out(['error' => 'Method not allowed'], 405);
}

$ticket = verify($_POST['ticket'] ?? null);
if (!$ticket || empty($ticket['p'])) {
    json_out(['error' => 'Upload nicht autorisiert'], 403);
}

if (!isset($_FILES['file']) || $_FILES['file']['error'] !== UPLOAD_ERR_OK) {
    $code = $_FILES['file']['error'] ?? -1;
    json_out(['error' => $code === UPLOAD_ERR_INI_SIZE || $code === UPLOAD_ERR_FORM_SIZE ? 'Datei zu groß (max. 20 MB)' : 'Keine Datei erhalten'], 400);
}

if ($_FILES['file']['size'] > MAX_FILE_SIZE) {
    json_out(['error' => 'Datei zu groß (max. 20 MB)'], 413);
}

$pathname = $ticket['p'];

// Path traversal check
$uploadBase = realpath(UPLOAD_DIR) ?: UPLOAD_DIR;
$targetPath = realpath(UPLOAD_DIR . '/' . $pathname);
if ($targetPath !== false && strpos($targetPath, $uploadBase . DIRECTORY_SEPARATOR) !== 0) {
    json_out(['error' => 'Ungültiger Pfad'], 403);
}

$targetPath = UPLOAD_DIR . '/' . $pathname;
$targetDir  = dirname($targetPath);

if (!is_dir($targetDir) && !mkdir($targetDir, 0750, true)) {
    json_out(['error' => 'Verzeichnis konnte nicht erstellt werden'], 500);
}

if (!move_uploaded_file($_FILES['file']['tmp_name'], $targetPath)) {
    json_out(['error' => 'Upload fehlgeschlagen'], 500);
}

json_out(['success' => true]);
