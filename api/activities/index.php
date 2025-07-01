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
        // Get activities
        $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 50;
        $offset = isset($_GET['offset']) ? (int)$_GET['offset'] : 0;
        
        $query = "SELECT a.*, u.first_name, u.last_name, u.phone as user_phone, c.name as category_name,
                  CONCAT(u.first_name, ' ', u.last_name) as user_name,
                  DATE_FORMAT(a.event_date, '%d %M %Y') as formatted_date,
                  TIME_FORMAT(a.event_time, '%H:%i') as formatted_time
                  FROM activities a
                  JOIN users u ON a.user_id = u.id
                  JOIN categories c ON a.category_id = c.id
                  WHERE a.is_active = 1 AND u.is_active = 1
                  ORDER BY a.event_date ASC, a.event_time ASC
                  LIMIT ? OFFSET ?";
        
        $stmt = $db->prepare($query);
        $stmt->execute([$limit, $offset]);
        $activities = $stmt->fetchAll();
        
        // Add category mapping for frontend
        foreach ($activities as &$activity) {
            $activity['category'] = strtolower(str_replace([' ', '&'], ['', ''], $activity['category_name']));
        }
        
        sendJsonResponse($activities);
        
    } elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
        // Create new activity
        $auth = new Auth();
        $user = $auth->requireAuth();
        
        $input = getJsonInput();
        
        $required = ['title', 'description', 'category_id', 'event_date', 'event_time', 'location', 'organizer'];
        $missing = validateRequired($input, $required);
        if (!empty($missing)) {
            sendJsonResponse(['error' => 'Missing required fields: ' . implode(', ', $missing)], 400);
        }
        
        $insertQuery = "INSERT INTO activities (user_id, category_id, title, description, event_date, event_time, location, organizer, contact_info, image) 
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
        
        $stmt = $db->prepare($insertQuery);
        $stmt->execute([
            $user['id'],
            $input['category_id'],
            $input['title'],
            $input['description'],
            $input['event_date'],
            $input['event_time'],
            $input['location'],
            $input['organizer'],
            $user['phone'], // Use user's phone as contact info
            $input['image'] ?? null
        ]);
        
        $activityId = $db->lastInsertId();
        
        // Log activity
        $logQuery = "INSERT INTO activity_logs (user_id, action, table_name, record_id, description) VALUES (?, ?, ?, ?, ?)";
        $logStmt = $db->prepare($logQuery);
        $logStmt->execute([$user['id'], 'CREATE', 'activities', $activityId, 'Created activity: ' . $input['title']]);
        
        sendJsonResponse([
            'success' => true,
            'message' => 'Activity created successfully',
            'id' => $activityId
        ]);
        
    } else {
        sendJsonResponse(['error' => 'Method not allowed'], 405);
    }
    
} catch (Exception $e) {
    error_log("Activities error: " . $e->getMessage());
    sendJsonResponse(['error' => 'Internal server error'], 500);
}
?>
