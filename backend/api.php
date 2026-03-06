<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=utf-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$type = $_GET['type'] ?? '';
$allowedTypes = ['records', 'places', 'tournaments', 'opponents'];

if (!in_array($type, $allowedTypes)) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid type']);
    exit();
}

$file = $type . '.json';
$data = file_exists($file) ? json_decode(file_get_contents($file), true) ?? [] : [];
$method = $_SERVER['REQUEST_METHOD'];

// GET
if ($method === 'GET') {
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit();
}

$input = json_decode(file_get_contents('php://input'), true);

// POST
if ($method === 'POST') {
    $input['id'] = count($data) > 0 ? max(array_column($data, 'id')) + 1 : 1;
    $data[] = $input;
    file_put_contents($file, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
    echo json_encode($input, JSON_UNESCAPED_UNICODE);
    exit();
}

// PUT
if ($method === 'PUT') {
    $id = $input['id'] ?? null;
    foreach ($data as $key => $row) {
        if ($row['id'] == $id) {
            $data[$key] = array_merge($row, $input);
            file_put_contents($file, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
            echo json_encode($data[$key], JSON_UNESCAPED_UNICODE);
            exit();
        }
    }
    http_response_code(404);
    exit();
}

// DELETE
if ($method === 'DELETE') {
    $id = $_GET['id'] ?? null;
    $data = array_values(array_filter($data, fn($row) => $row['id'] != $id));
    file_put_contents($file, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
    echo json_encode(['success' => true]);
    exit();
}
?>