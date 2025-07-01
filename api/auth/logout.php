<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once '../config/database.php';
require_once '../utils/auth.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendJsonResponse(['error' => 'Method not allowed'], 405);
}

try {
    $auth = new Auth();
    $user = $auth->getCurrentUser();
    
    if ($user) {
        // Get session token
        $token = isset($_COOKIE['session_token']) ? $_COOKIE['session_token'] : null;
        if (!$token) {
            $headers = getallheaders();
            if (isset($headers['Authorization']) && strpos($headers['Authorization'], 'Bearer ') === 0) {
                $token = substr($headers['Authorization'], 7);
            }
        }
        
        if ($token) {
            // Delete session from database
            $auth->deleteSession($token);
            
            // Log activity
            $database = new Database();
            $db = $database->getConnection();
            $logQuery = "INSERT INTO activity_logs (user_id, action, table_name, record_id, description) VALUES (?, ?, ?, ?, ?)";
            $logStmt = $db->prepare($logQuery);
            $logStmt->execute([$user['id'], 'LOGOUT', 'users', $user['id'], 'User logged out']);
        }
    }
    
    // Clear cookie
    setcookie('session_token', '', [
        'expires' => time() - 3600,
        'path' => '/',
        'httponly' => true,
        'secure' => false,
        'samesite' => 'Lax'
    ]);
    
    sendJsonResponse([
        'success' => true,
        'message' => 'Logout successful'
    ]);
    
} catch (Exception $e) {
    error_log("Logout error: " . $e->getMessage());
    sendJsonResponse(['error' => 'Internal server error'], 500);
}
?>
