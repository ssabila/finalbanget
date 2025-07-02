<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once '../config/database.php';
require_once '../utils/auth.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendJsonResponse(['error' => 'Method not allowed'], 405);
}

try {
    $database = new Database();
    $db = $database->getConnection();
    
    $type = isset($_GET['type']) ? $_GET['type'] : '';
    
    if (!empty($type) && !in_array($type, ['lost_found', 'activity'])) {
        sendJsonResponse(['error' => 'Invalid category type'], 400);
    }
    
    $query = "SELECT id, name, type FROM categories";
    $params = [];
    
    if (!empty($type)) {
        $query .= " WHERE type = ?";
        $params[] = $type;
    }
    
    $query .= " ORDER BY name ASC";
    
    $stmt = $db->prepare($query);
    $stmt->execute($params);
    $categories = $stmt->fetchAll();
    
    sendJsonResponse([
        'success' => true,
        'categories' => $categories
    ]);
    
} catch (Exception $e) {
    error_log("Categories error: " . $e->getMessage());
    sendJsonResponse(['error' => 'Internal server error'], 500);
}
?>