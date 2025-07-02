<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once '../config/database.php';
require_once '../includes/auth.php';

// Start session for authentication
if (session_status() == PHP_SESSION_NONE) {
    session_start();
}

try {
    $auth = new Auth();
    $user = $auth->getCurrentUser();
    
    // Check authentication
    if (!$user) {
        http_response_code(401);
        echo json_encode(['error' => 'Authentication required']);
        exit;
    }
    
    $database = new Database();
    $db = $database->getConnection();
    
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        // Handle avatar upload
        if (!isset($_FILES['avatar']) || $_FILES['avatar']['error'] !== UPLOAD_ERR_OK) {
            http_response_code(400);
            echo json_encode(['error' => 'No file uploaded or upload error']);
            exit;
        }
        
        $file = $_FILES['avatar'];
        
        // Validate file type
        $allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
        $fileType = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
        $mimeType = mime_content_type($file['tmp_name']);
        
        if (!in_array($fileType, ['jpg', 'jpeg', 'png', 'gif']) || 
            !in_array($mimeType, ['image/jpeg', 'image/png', 'image/gif'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Invalid file type. Only JPG, PNG, and GIF are allowed.']);
            exit;
        }
        
        // Validate file size (5MB max)
        if ($file['size'] > 5 * 1024 * 1024) {
            http_response_code(400);
            echo json_encode(['error' => 'File size too large. Maximum 5MB allowed.']);
            exit;
        }
        
        // Create upload directory
        $uploadDir = '../../uploads/avatars/';
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0755, true);
        }
        
        // Generate unique filename
        $fileName = $user['id'] . '_' . time() . '.' . $fileType;
        $targetPath = $uploadDir . $fileName;
        
        // Get current avatar to delete later
        $currentAvatarQuery = "SELECT avatar FROM users WHERE id = ?";
        $currentAvatarStmt = $db->prepare($currentAvatarQuery);
        $currentAvatarStmt->execute([$user['id']]);
        $currentAvatar = $currentAvatarStmt->fetchColumn();
        
        // Resize and save image
        if (resizeAndSaveImage($file['tmp_name'], $targetPath, $mimeType)) {
            // Update database
            $updateQuery = "UPDATE users SET avatar = ? WHERE id = ?";
            $updateStmt = $db->prepare($updateQuery);
            
            if ($updateStmt->execute([$fileName, $user['id']])) {
                // Delete old avatar if exists
                if ($currentAvatar && file_exists($uploadDir . $currentAvatar)) {
                    unlink($uploadDir . $currentAvatar);
                }
                
                // Update session
                $_SESSION['user_data']['avatar'] = $fileName;
                
                echo json_encode([
                    'success' => true,
                    'message' => 'Avatar uploaded successfully',
                    'avatar_url' => 'uploads/avatars/' . $fileName
                ]);
            } else {
                // Delete uploaded file if database update fails
                if (file_exists($targetPath)) {
                    unlink($targetPath);
                }
                http_response_code(500);
                echo json_encode(['error' => 'Failed to update database']);
            }
        } else {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to process image']);
        }
        
    } elseif ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
        // Handle avatar removal
        $currentAvatarQuery = "SELECT avatar FROM users WHERE id = ?";
        $currentAvatarStmt = $db->prepare($currentAvatarQuery);
        $currentAvatarStmt->execute([$user['id']]);
        $currentAvatar = $currentAvatarStmt->fetchColumn();
        
        // Update database
        $updateQuery = "UPDATE users SET avatar = NULL WHERE id = ?";
        $updateStmt = $db->prepare($updateQuery);
        
        if ($updateStmt->execute([$user['id']])) {
            // Delete avatar file if exists
            if ($currentAvatar) {
                $avatarPath = '../../uploads/avatars/' . $currentAvatar;
                if (file_exists($avatarPath)) {
                    unlink($avatarPath);
                }
            }
            
            // Update session
            unset($_SESSION['user_data']['avatar']);
            
            echo json_encode([
                'success' => true,
                'message' => 'Avatar removed successfully'
            ]);
        } else {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to remove avatar']);
        }
        
    } else {
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
    }
    
} catch (Exception $e) {
    error_log("Avatar API error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Internal server error']);
}

/**
 * Resize and save image as JPEG with proper dimensions
 */
function resizeAndSaveImage($sourcePath, $targetPath, $mimeType) {
    try {
        // Create image resource based on type
        switch ($mimeType) {
            case 'image/jpeg':
                $source = imagecreatefromjpeg($sourcePath);
                break;
            case 'image/png':
                $source = imagecreatefrompng($sourcePath);
                break;
            case 'image/gif':
                $source = imagecreatefromgif($sourcePath);
                break;
            default:
                return false;
        }
        
        if (!$source) {
            return false;
        }
        
        // Get original dimensions
        $originalWidth = imagesx($source);
        $originalHeight = imagesy($source);
        
        // Calculate new dimensions (square, 300x300)
        $newSize = 300;
        $size = min($originalWidth, $originalHeight);
        
        // Calculate crop coordinates for center crop
        $cropX = ($originalWidth - $size) / 2;
        $cropY = ($originalHeight - $size) / 2;
        
        // Create new image
        $resized = imagecreatetruecolor($newSize, $newSize);
        
        // Preserve transparency for PNG and GIF
        if ($mimeType === 'image/png' || $mimeType === 'image/gif') {
            imagealphablending($resized, false);
            imagesavealpha($resized, true);
            $transparent = imagecolorallocatealpha($resized, 255, 255, 255, 127);
            imagefill($resized, 0, 0, $transparent);
        }
        
        // Resize and crop image
        imagecopyresampled(
            $resized, $source,
            0, 0, $cropX, $cropY,
            $newSize, $newSize, $size, $size
        );
        
        // Save as JPEG with 85% quality
        $result = imagejpeg($resized, $targetPath, 85);
        
        // Clean up memory
        imagedestroy($source);
        imagedestroy($resized);
        
        return $result;
        
    } catch (Exception $e) {
        error_log("Image resize error: " . $e->getMessage());
        return false;
    }
}
?>