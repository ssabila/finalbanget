<?php
require_once '../config/database.php';

class Auth {
    private $db;
    
    public function __construct() {
        $database = new Database();
        $this->db = $database->getConnection();
    }
    
    // Generate secure session token
    public function generateSessionToken() {
        return bin2hex(random_bytes(32));
    }
    
    // Create user session
    public function createSession($userId) {
        $token = $this->generateSessionToken();
        $expiresAt = date('Y-m-d H:i:s', strtotime('+7 days'));
        
        $query = "INSERT INTO user_sessions (user_id, session_token, expires_at) VALUES (?, ?, ?)";
        $stmt = $this->db->prepare($query);
        $stmt->execute([$userId, $token, $expiresAt]);
        
        return $token;
    }
    
    // Validate session token
    public function validateSession($token) {
        if (!$token) return false;
        
        $query = "SELECT us.*, u.* FROM user_sessions us 
                  JOIN users u ON us.user_id = u.id 
                  WHERE us.session_token = ? AND us.expires_at > NOW() AND u.is_active = 1";
        $stmt = $this->db->prepare($query);
        $stmt->execute([$token]);
        
        return $stmt->fetch();
    }
    
    // Delete session (logout)
    public function deleteSession($token) {
        $query = "DELETE FROM user_sessions WHERE session_token = ?";
        $stmt = $this->db->prepare($query);
        return $stmt->execute([$token]);
    }
    
    // Clean expired sessions
    public function cleanExpiredSessions() {
        $query = "DELETE FROM user_sessions WHERE expires_at < NOW()";
        $stmt = $this->db->prepare($query);
        return $stmt->execute();
    }
    
    // Get current user from session
    public function getCurrentUser() {
        $token = $this->getSessionToken();
        if (!$token) return null;
        
        $session = $this->validateSession($token);
        if (!$session) return null;
        
        return [
            'id' => $session['user_id'],
            'nim' => $session['nim'],
            'first_name' => $session['first_name'],
            'last_name' => $session['last_name'],
            'email' => $session['email'],
            'phone' => $session['phone'],
            'avatar' => $session['avatar']
        ];
    }
    
    // Get session token from cookie or header
    private function getSessionToken() {
        // Check Authorization header first
        $headers = getallheaders();
        if (isset($headers['Authorization'])) {
            $auth = $headers['Authorization'];
            if (strpos($auth, 'Bearer ') === 0) {
                return substr($auth, 7);
            }
        }
        
        // Check cookie
        return isset($_COOKIE['session_token']) ? $_COOKIE['session_token'] : null;
    }
    
    // Require authentication
    public function requireAuth() {
        $user = $this->getCurrentUser();
        if (!$user) {
            http_response_code(401);
            echo json_encode(['error' => 'Authentication required']);
            exit;
        }
        return $user;
    }
}

// Helper functions
function sendJsonResponse($data, $statusCode = 200) {
    http_response_code($statusCode);
    header('Content-Type: application/json');
    echo json_encode($data);
    exit;
}

function getJsonInput() {
    $input = file_get_contents('php://input');
    return json_decode($input, true);
}

function validateRequired($data, $fields) {
    $missing = [];
    foreach ($fields as $field) {
        if (!isset($data[$field]) || empty(trim($data[$field]))) {
            $missing[] = $field;
        }
    }
    return $missing;
}
?>
