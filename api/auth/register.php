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
    $required = ['firstName', 'lastName', 'nim', 'email', 'phone', 'password', 'confirmPassword'];
    $missing = validateRequired($input, $required);
    if (!empty($missing)) {
        sendJsonResponse(['error' => 'Missing required fields: ' . implode(', ', $missing)], 400);
    }
    
    // Validate password confirmation
    if ($input['password'] !== $input['confirmPassword']) {
        sendJsonResponse(['error' => 'Password confirmation does not match'], 400);
    }
    
    // Validate password strength
    if (strlen($input['password']) < 6) {
        sendJsonResponse(['error' => 'Password must be at least 6 characters long'], 400);
    }
    
    // Validate email format
    if (!filter_var($input['email'], FILTER_VALIDATE_EMAIL)) {
        sendJsonResponse(['error' => 'Format email tidak valid.'], 400);
    }

    // Ekstrak domain dari email
    $email_domain = substr(strrchr($input['email'], "@"), 1);

    // Validasi domain
    if ($email_domain !== 'stis.ac.id' && $email_domain !== 'bps.go.id') {
        sendJsonResponse(['error' => 'Email harus berakhiran @stis.ac.id atau @bps.go.id.'], 400);
    }
    
    // Connect to database
    $database = new Database();
    $db = $database->getConnection();
    
    // Check if email or NIM already exists
    $checkQuery = "SELECT id FROM users WHERE email = ? OR nim = ?";
    $checkStmt = $db->prepare($checkQuery);
    $checkStmt->execute([$input['email'], $input['nim']]);
    
    if ($checkStmt->fetch()) {
        sendJsonResponse(['error' => 'Email or NIM already registered'], 409);
    }
    
    // Hash password
    $hashedPassword = password_hash($input['password'], PASSWORD_DEFAULT);
    
    // Insert new user
    $insertQuery = "INSERT INTO users (nim, first_name, last_name, email, phone, password) VALUES (?, ?, ?, ?, ?, ?)";
    $insertStmt = $db->prepare($insertQuery);
    $insertStmt->execute([
        $input['nim'],
        $input['firstName'],
        $input['lastName'],
        $input['email'],
        $input['phone'],
        $hashedPassword
    ]);
    
    $userId = $db->lastInsertId();
    
    // Log activity
    $logQuery = "INSERT INTO activity_logs (user_id, action, table_name, record_id, description) VALUES (?, ?, ?, ?, ?)";
    $logStmt = $db->prepare($logQuery);
    $logStmt->execute([$userId, 'REGISTER', 'users', $userId, 'New user registered']);
    
    sendJsonResponse([
        'success' => true,
        'message' => 'Registration successful',
        'user_id' => $userId
    ]);
    
} catch (Exception $e) {
    error_log("Registration error: " . $e->getMessage());
    sendJsonResponse(['error' => 'Internal server error'], 500);
}
?>
