<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');
header('Access-Control-Allow-Headers: Content-Type');

require_once '../../config/database.php';

try {
    $database = new Database();
    $db = $database->getConnection();

    // Get search parameters
    $search = isset($_GET['search']) ? trim($_GET['search']) : '';
    $category = isset($_GET['category']) ? trim($_GET['category']) : '';
    $type = isset($_GET['type']) ? trim($_GET['type']) : '';

    // Build WHERE conditions
    $whereConditions = ['u.is_active = 1'];
    $params = [];

    if (!empty($search)) {
        $searchParam = '%' . $search . '%';
        $whereConditions[] = '(lf.title LIKE ? OR lf.description LIKE ? OR lf.location LIKE ?)';
        $params = array_merge($params, [$searchParam, $searchParam, $searchParam]);
    }

    if (!empty($category) && is_numeric($category)) {
        $whereConditions[] = 'lf.category_id = ?';
        $params[] = (int)$category;
    }

    if (!empty($type) && in_array($type, ['hilang', 'ditemukan'])) {
        $whereConditions[] = 'lf.type = ?';
        $params[] = $type;
    }

    $whereClause = implode(' AND ', $whereConditions);

    // Execute query
    $query = "SELECT lf.*, u.first_name, u.last_name, u.phone as user_phone, c.name as category_name,
              CONCAT(u.first_name, ' ', u.last_name) as user_name
              FROM lost_found_items lf
              JOIN users u ON lf.user_id = u.id
              JOIN categories c ON lf.category_id = c.id
              WHERE $whereClause
              ORDER BY lf.created_at DESC";

    $stmt = $db->prepare($query);
    $stmt->execute($params);
    $items = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Return JSON response
    echo json_encode($items);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'error' => 'Database error: ' . $e->getMessage()
    ]);
}
?>
