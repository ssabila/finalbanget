<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, PUT, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once '../config/database.php';
require_once '../utils/auth.php';

try {
    $auth = new Auth();
    $user = $auth->requireAuth();
    
    $database = new Database();
    $db = $database->getConnection();
    
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        // Get user profile
        sendJsonResponse([
            'success' => true,
            'user' => $user
        ]);
        
    } elseif ($_SERVER['REQUEST_METHOD'] === 'PUT') {
        // Update user profile
        $input = getJsonInput();
        
        $updateFields = [];
        $updateValues = [];
        
        if (isset($input['first_name'])) {
            $updateFields[] = 'first_name = ?';
            $updateValues[] = $input['first_name'];
        }
        
        if (isset($input['last_name'])) {
            $updateFields[] = 'last_name = ?';
            $updateValues[] = $input['last_name'];
        }
        
        if (isset($input['email'])) {
            // Check if email is already taken by another user
            $checkQuery = "SELECT id FROM users WHERE email = ? AND id != ?";
            $checkStmt = $db->prepare($checkQuery);
            $checkStmt->execute([$input['email'], $user['id']]);
            
            if ($checkStmt->fetch()) {
                sendJsonResponse(['error' => 'Email already taken'], 409);
            }
            
            $updateFields[] = 'email = ?';
            $updateValues[] = $input['email'];
        }
        
        if (isset($input['phone'])) {
            $updateFields[] = 'phone = ?';
            $updateValues[] = $input['phone'];
        }
        
        if (empty($updateFields)) {
            sendJsonResponse(['error' => 'No fields to update'], 400);
        }
        
        $updateValues[] = $user['id'];
        
        $updateQuery = "UPDATE users SET " . implode(', ', $updateFields) . " WHERE id = ?";
        $updateStmt = $db->prepare($updateQuery);
        $updateStmt->execute($updateValues);
        
        // Log activity
        $logQuery = "INSERT INTO activity_logs (user_id, action, table_name, record_id, description) VALUES (?, ?, ?, ?, ?)";
        $logStmt = $db->prepare($logQuery);
        $logStmt->execute([$user['id'], 'UPDATE', 'users', $user['id'], 'Profile updated']);
        
        sendJsonResponse([
            'success' => true,
            'message' => 'Profile updated successfully'
        ]);
        
    } else {
        sendJsonResponse(['error' => 'Method not allowed'], 405);
    }
    
} catch (Exception $e) {
    error_log("Profile error: " . $e->getMessage());
    sendJsonResponse(['error' => 'Internal server error'], 500);
}
?>
