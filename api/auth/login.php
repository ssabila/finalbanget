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
    // Get input data
    $input = getJsonInput();
    if (!$input) {
        $input = $_POST;
    }
    
    // Validate required fields
    $required = ['email', 'password'];
    $missing = validateRequired($input, $required);
    if (!empty($missing)) {
        sendJsonResponse(['error' => 'Missing required fields: ' . implode(', ', $missing)], 400);
    }
    
    $email = trim($input['email']);
    $password = $input['password'];
    
    // Connect to database
    $database = new Database();
    $db = $database->getConnection();
    
    // Find user by email or NIM
    $query = "SELECT * FROM users WHERE (email = ? OR nim = ?) AND is_active = 1";
    $stmt = $db->prepare($query);
    $stmt->execute([$email, $email]);
    $user = $stmt->fetch();
    
    if (!$user) {
        sendJsonResponse(['error' => 'Invalid credentials'], 401);
    }
    
    // Verify password
    if (!password_verify($password, $user['password'])) {
        sendJsonResponse(['error' => 'Invalid credentials'], 401);
    }
    
    // Create session
    $auth = new Auth();
    $sessionToken = $auth->createSession($user['id']);
    
    // Set cookie
    setcookie('session_token', $sessionToken, [
        'expires' => time() + (7 * 24 * 60 * 60), // 7 days
        'path' => '/',
        'httponly' => true,
        'secure' => false, // Set to true in production with HTTPS
        'samesite' => 'Lax'
    ]);
    
    // Log activity
    $logQuery = "INSERT INTO activity_logs (user_id, action, table_name, record_id, description) VALUES (?, ?, ?, ?, ?)";
    $logStmt = $db->prepare($logQuery);
    $logStmt->execute([$user['id'], 'LOGIN', 'users', $user['id'], 'User logged in']);
    
    // Return user data (without password)
    unset($user['password']);
    sendJsonResponse([
        'success' => true,
        'message' => 'Login successful',
        'user' => $user,
        'session_token' => $sessionToken
    ]);
    
} catch (Exception $e) {
    error_log("Login error: " . $e->getMessage());
    sendJsonResponse(['error' => 'Internal server error'], 500);
}
?>
