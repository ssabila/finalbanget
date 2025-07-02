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
    $user = $auth->requireAuth();
    
    $input = getJsonInput();
    if (!$input) {
        $input = $_POST;
    }
    
    $database = new Database();
    $db = $database->getConnection();
    
    // Validate input
    $updateFields = [];
    $updateValues = [];
    
    if (isset($input['first_name']) && !empty(trim($input['first_name']))) {
        $updateFields[] = 'first_name = ?';
        $updateValues[] = trim($input['first_name']);
    }
    
    if (isset($input['last_name']) && !empty(trim($input['last_name']))) {
        $updateFields[] = 'last_name = ?';
        $updateValues[] = trim($input['last_name']);
    }
    
    if (isset($input['email']) && !empty(trim($input['email']))) {
        // Validate email format
        if (!filter_var($input['email'], FILTER_VALIDATE_EMAIL)) {
            sendJsonResponse(['error' => 'Format email tidak valid'], 400);
        }
        
        // Check if email is already taken by another user
        $checkQuery = "SELECT id FROM users WHERE email = ? AND id != ?";
        $checkStmt = $db->prepare($checkQuery);
        $checkStmt->execute([trim($input['email']), $user['id']]);
        
        if ($checkStmt->fetch()) {
            sendJsonResponse(['error' => 'Email sudah digunakan pengguna lain'], 409);
        }
        
        $updateFields[] = 'email = ?';
        $updateValues[] = trim($input['email']);
    }
    
    if (isset($input['phone']) && !empty(trim($input['phone']))) {
        $updateFields[] = 'phone = ?';
        $updateValues[] = trim($input['phone']);
    }
    
    if (empty($updateFields)) {
        sendJsonResponse(['error' => 'Tidak ada data yang akan diupdate'], 400);
    }
    
    $updateValues[] = $user['id'];
    
    $updateQuery = "UPDATE users SET " . implode(', ', $updateFields) . " WHERE id = ?";
    $updateStmt = $db->prepare($updateQuery);
    
    if ($updateStmt->execute($updateValues)) {
        // Log activity
        $logQuery = "INSERT INTO activity_logs (user_id, action, table_name, record_id, description) VALUES (?, ?, ?, ?, ?)";
        $logStmt = $db->prepare($logQuery);
        $logStmt->execute([$user['id'], 'UPDATE', 'users', $user['id'], 'Profile updated']);
        
        sendJsonResponse([
            'success' => true,
            'message' => 'Profil berhasil diperbarui'
        ]);
    } else {
        sendJsonResponse(['error' => 'Gagal memperbarui profil'], 500);
    }
    
} catch (Exception $e) {
    error_log("Update profile error: " . $e->getMessage());
    sendJsonResponse(['error' => 'Terjadi kesalahan internal'], 500);
}
?>