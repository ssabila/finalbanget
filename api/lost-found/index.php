<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once '../config/database.php';
require_once '../utils/auth.php';

try {
    $database = new Database();
    $db = $database->getConnection();
    
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        // Get lost & found items
        $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 50;
        $offset = isset($_GET['offset']) ? (int)$_GET['offset'] : 0;
        
        $query = "SELECT lf.*, u.first_name, u.last_name, u.phone as user_phone, c.name as category_name,
                  CONCAT(u.first_name, ' ', u.last_name) as user_name
                  FROM lost_found_items lf
                  JOIN users u ON lf.user_id = u.id
                  JOIN categories c ON lf.category_id = c.id
                  WHERE u.is_active = 1
                  ORDER BY lf.created_at DESC
                  LIMIT ? OFFSET ?";
        
        $stmt = $db->prepare($query);
        $stmt->execute([$limit, $offset]);
        $items = $stmt->fetchAll();
        
        sendJsonResponse($items);
        
    } elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
        // Create new lost & found item
        $auth = new Auth();
        $user = $auth->requireAuth();
        
        $input = getJsonInput();
        
        $required = ['title', 'description', 'type', 'category_id', 'location', 'date_occurred'];
        $missing = validateRequired($input, $required);
        if (!empty($missing)) {
            sendJsonResponse(['error' => 'Missing required fields: ' . implode(', ', $missing)], 400);
        }
        
        // Validate type
        if (!in_array($input['type'], ['hilang', 'ditemukan'])) {
            sendJsonResponse(['error' => 'Invalid type. Must be "hilang" or "ditemukan"'], 400);
        }
        
        $insertQuery = "INSERT INTO lost_found_items (user_id, category_id, title, description, type, location, date_occurred, contact_info, image) 
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";
        
        $stmt = $db->prepare($insertQuery);
        $stmt->execute([
            $user['id'],
            $input['category_id'],
            $input['title'],
            $input['description'],
            $input['type'],
            $input['location'],
            $input['date_occurred'],
            $user['phone'], // Use user's phone as contact info
            $input['image'] ?? null
        ]);
        
        $itemId = $db->lastInsertId();
        
        // Log activity
        $logQuery = "INSERT INTO activity_logs (user_id, action, table_name, record_id, description) VALUES (?, ?, ?, ?, ?)";
        $logStmt = $db->prepare($logQuery);
        $logStmt->execute([$user['id'], 'CREATE', 'lost_found_items', $itemId, 'Created lost & found item: ' . $input['title']]);
        
        sendJsonResponse([
            'success' => true,
            'message' => 'Item created successfully',
            'id' => $itemId
        ]);
        
    } else {
        sendJsonResponse(['error' => 'Method not allowed'], 405);
    }
    
} catch (Exception $e) {
    error_log("Lost & Found error: " . $e->getMessage());
    sendJsonResponse(['error' => 'Internal server error'], 500);
}
?>
