<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, PUT, DELETE, OPTIONS');
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
        // Get specific item for editing
        if (!isset($_GET['id']) || !is_numeric($_GET['id'])) {
            sendJsonResponse(['error' => 'ID item tidak valid'], 400);
        }
        
        $itemId = (int)$_GET['id'];
        
        $query = "SELECT lf.*, c.name as category_name 
                  FROM lost_found_items lf 
                  JOIN categories c ON lf.category_id = c.id 
                  WHERE lf.id = ? AND lf.user_id = ?";
        $stmt = $db->prepare($query);
        $stmt->execute([$itemId, $user['id']]);
        $item = $stmt->fetch();
        
        if (!$item) {
            sendJsonResponse(['error' => 'Item tidak ditemukan atau bukan milik Anda'], 404);
        }
        
        sendJsonResponse([
            'success' => true,
            'item' => $item
        ]);
        
    } elseif ($_SERVER['REQUEST_METHOD'] === 'PUT') {
        // Update item
        $input = getJsonInput();
        
        if (!isset($input['id']) || !is_numeric($input['id'])) {
            sendJsonResponse(['error' => 'ID item tidak valid'], 400);
        }
        
        $itemId = (int)$input['id'];
        
        // Verify ownership
        $checkQuery = "SELECT id FROM lost_found_items WHERE id = ? AND user_id = ?";
        $checkStmt = $db->prepare($checkQuery);
        $checkStmt->execute([$itemId, $user['id']]);
        
        if (!$checkStmt->fetch()) {
            sendJsonResponse(['error' => 'Item tidak ditemukan atau bukan milik Anda'], 404);
        }
        
        // Validate required fields
        $required = ['title', 'description', 'type', 'category_id', 'location', 'date_occurred'];
        $missing = validateRequired($input, $required);
        if (!empty($missing)) {
            sendJsonResponse(['error' => 'Field yang diperlukan: ' . implode(', ', $missing)], 400);
        }
        
        // Validate type
        if (!in_array($input['type'], ['hilang', 'ditemukan'])) {
            sendJsonResponse(['error' => 'Tipe harus "hilang" atau "ditemukan"'], 400);
        }
        
        $updateQuery = "UPDATE lost_found_items 
                        SET title = ?, description = ?, type = ?, category_id = ?, 
                            location = ?, date_occurred = ?, status = ?
                        WHERE id = ? AND user_id = ?";
        
        $status = isset($input['status']) && in_array($input['status'], ['terbuka', 'selesai']) 
                 ? $input['status'] : 'terbuka';
        
        $stmt = $db->prepare($updateQuery);
        $result = $stmt->execute([
            $input['title'],
            $input['description'],
            $input['type'],
            $input['category_id'],
            $input['location'],
            $input['date_occurred'],
            $status,
            $itemId,
            $user['id']
        ]);
        
        if ($result) {
            // Log activity
            $logQuery = "INSERT INTO activity_logs (user_id, action, table_name, record_id, description) VALUES (?, ?, ?, ?, ?)";
            $logStmt = $db->prepare($logQuery);
            $logStmt->execute([$user['id'], 'UPDATE', 'lost_found_items', $itemId, 'Updated lost & found item: ' . $input['title']]);
            
            sendJsonResponse([
                'success' => true,
                'message' => 'Item berhasil diperbarui'
            ]);
        } else {
            sendJsonResponse(['error' => 'Gagal memperbarui item'], 500);
        }
        
    } elseif ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
        // Delete item
        $input = getJsonInput();
        
        if (!isset($input['id']) || !is_numeric($input['id'])) {
            sendJsonResponse(['error' => 'ID item tidak valid'], 400);
        }
        
        $itemId = (int)$input['id'];
        
        // Get item details before deletion (for logging and file cleanup)
        $itemQuery = "SELECT title, image FROM lost_found_items WHERE id = ? AND user_id = ?";
        $itemStmt = $db->prepare($itemQuery);
        $itemStmt->execute([$itemId, $user['id']]);
        $item = $itemStmt->fetch();
        
        if (!$item) {
            sendJsonResponse(['error' => 'Item tidak ditemukan atau bukan milik Anda'], 404);
        }
        
        // Delete from database
        $deleteQuery = "DELETE FROM lost_found_items WHERE id = ? AND user_id = ?";
        $deleteStmt = $db->prepare($deleteQuery);
        $result = $deleteStmt->execute([$itemId, $user['id']]);
        
        if ($result) {
            // Delete image file if exists
            if ($item['image'] && file_exists($item['image'])) {
                unlink($item['image']);
            }
            
            // Log activity
            $logQuery = "INSERT INTO activity_logs (user_id, action, table_name, record_id, description) VALUES (?, ?, ?, ?, ?)";
            $logStmt = $db->prepare($logQuery);
            $logStmt->execute([$user['id'], 'DELETE', 'lost_found_items', $itemId, 'Deleted lost & found item: ' . $item['title']]);
            
            sendJsonResponse([
                'success' => true,
                'message' => 'Item berhasil dihapus'
            ]);
        } else {
            sendJsonResponse(['error' => 'Gagal menghapus item'], 500);
        }
        
    } else {
        sendJsonResponse(['error' => 'Method tidak diizinkan'], 405);
    }
    
} catch (Exception $e) {
    error_log("Lost & Found management error: " . $e->getMessage());
    sendJsonResponse(['error' => 'Terjadi kesalahan internal'], 500);
}
?>