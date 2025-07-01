<?php
require_once 'includes/auth.php';
require_once 'config/database.php';

$auth = new Auth();
$user = $auth->getCurrentUser();
$message = '';
$messageType = '';

$database = new Database();
$db = $database->getConnection();

// Handle form submission
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['add_item'])) {
    if (!$auth->isLoggedIn()) {
        $message = 'Anda harus login terlebih dahulu';
        $messageType = 'error';
    } else {
        $data = [
            'title' => trim($_POST['title'] ?? ''),
            'description' => trim($_POST['description'] ?? ''),
            'type' => $_POST['type'] ?? '',
            'category_id' => $_POST['category_id'] ?? '',
            'location' => trim($_POST['location'] ?? ''),
            'date_occurred' => $_POST['date_occurred'] ?? ''
        ];
        
        if (empty($data['title']) || empty($data['description']) || empty($data['type']) || 
            empty($data['category_id']) || empty($data['location']) || empty($data['date_occurred'])) {
            $message = 'Semua field wajib diisi';
            $messageType = 'error';
        } else {
            // Handle image upload - TANPA RESIZE
            $imagePath = null;
            if (isset($_FILES['image']) && $_FILES['image']['error'] === UPLOAD_ERR_OK) {
                $uploadDir = 'uploads/lost-found/';
                
                // Buat direktori jika belum ada
                if (!is_dir($uploadDir)) {
                    mkdir($uploadDir, 0755, true);
                }
                
                $fileExtension = strtolower(pathinfo($_FILES['image']['name'], PATHINFO_EXTENSION));
                $allowedExtensions = ['jpg', 'jpeg', 'png', 'gif'];
                
                if (in_array($fileExtension, $allowedExtensions)) {
                    // Validasi ukuran file (max 5MB)
                    if ($_FILES['image']['size'] > 5 * 1024 * 1024) {
                        $message = 'Ukuran file terlalu besar! Maksimal 5MB.';
                        $messageType = 'error';
                    } else {
                        // Validasi adalah gambar yang valid
                        $imageInfo = getimagesize($_FILES['image']['tmp_name']);
                        if ($imageInfo === false) {
                            $message = 'File yang diupload bukan gambar yang valid.';
                            $messageType = 'error';
                        } else {
                            $fileName = uniqid() . '.' . $fileExtension;
                            $targetPath = $uploadDir . $fileName;
                            
                            // Upload file langsung tanpa resize
                            if (move_uploaded_file($_FILES['image']['tmp_name'], $targetPath)) {
                                $imagePath = $targetPath;
                            } else {
                                $message = 'Gagal mengupload file gambar.';
                                $messageType = 'error';
                            }
                        }
                    }
                } else {
                    $message = 'Format file tidak didukung. Hanya JPG, PNG, dan GIF yang diperbolehkan.';
                    $messageType = 'error';
                }
            }
            
            // Lanjutkan insert jika tidak ada error
            if (empty($message)) {
                try {
                    $insertQuery = "INSERT INTO lost_found_items (user_id, category_id, title, description, type, location, date_occurred, contact_info, image) 
                                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";
                    $stmt = $db->prepare($insertQuery);
                    
                    if ($stmt->execute([$user['id'], $data['category_id'], $data['title'], $data['description'], 
                                       $data['type'], $data['location'], $data['date_occurred'], $user['phone'], $imagePath])) {
                        $message = 'Laporan berhasil ditambahkan!';
                        $messageType = 'success';
                        
                        // Reset form data
                        $_POST = [];
                    } else {
                        $message = 'Gagal menambahkan laporan ke database.';
                        $messageType = 'error';
                        
                        // Hapus file jika insert gagal
                        if ($imagePath && file_exists($imagePath)) {
                            unlink($imagePath);
                        }
                    }
                } catch (Exception $e) {
                    $message = 'Terjadi kesalahan: ' . $e->getMessage();
                    $messageType = 'error';
                    
                    // Hapus file jika terjadi error
                    if ($imagePath && file_exists($imagePath)) {
                        unlink($imagePath);
                    }
                }
            }
        }
    }
}

// Get categories
try {
    $categoriesQuery = "SELECT * FROM categories WHERE type = 'lost_found' ORDER BY name ASC";
    $categoriesStmt = $db->prepare($categoriesQuery);
    $categoriesStmt->execute();
    $categories = $categoriesStmt->fetchAll();
} catch (Exception $e) {
    $categories = [];
    error_log("Error fetching categories: " . $e->getMessage());
}

// Get lost & found items with filters
$whereConditions = ['u.is_active = 1'];
$params = [];

if (isset($_GET['search']) && !empty(trim($_GET['search']))) {
    $search = '%' . trim($_GET['search']) . '%';
    $whereConditions[] = '(lf.title LIKE ? OR lf.description LIKE ? OR lf.location LIKE ?)';
    $params = array_merge($params, [$search, $search, $search]);
}

if (isset($_GET['category']) && !empty($_GET['category']) && is_numeric($_GET['category'])) {
    $whereConditions[] = 'lf.category_id = ?';
    $params[] = (int)$_GET['category'];
}

if (isset($_GET['type']) && !empty($_GET['type']) && in_array($_GET['type'], ['hilang', 'ditemukan'])) {
    $whereConditions[] = 'lf.type = ?';
    $params[] = $_GET['type'];
}

$whereClause = implode(' AND ', $whereConditions);

try {
    $itemsQuery = "SELECT lf.*, u.first_name, u.last_name, u.phone as user_phone, c.name as category_name,
                   CONCAT(u.first_name, ' ', u.last_name) as user_name
                   FROM lost_found_items lf
                   JOIN users u ON lf.user_id = u.id
                   JOIN categories c ON lf.category_id = c.id
                   WHERE $whereClause
                   ORDER BY lf.created_at DESC";

    $itemsStmt = $db->prepare($itemsQuery);
    $itemsStmt->execute($params);
    $items = $itemsStmt->fetchAll();
} catch (Exception $e) {
    $items = [];
    error_log("Error fetching items: " . $e->getMessage());
}

?>
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Lost & Found - E-Statmad</title>
    <link rel="stylesheet" href="assets/css/style.css">
    <link rel="stylesheet" href="assets/css/lost-found.css">
    <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
</head>
<body>
    <!-- Navigation -->
    <nav class="navbar">
        <div class="nav-container">
            <div class="nav-logo">
                <img src="assets/images/logo.png" alt="E-Statmad Logo">
            </div>
            <div class="nav-menu" id="nav-menu">
                <a href="index.php" class="nav-link">Beranda</a>
                <a href="lost-found.php" class="nav-link active">Lost & Found</a>
                <a href="activities.php" class="nav-link">Kegiatan</a>
                <a href="about.php" class="nav-link">Tentang</a>
                <div class="nav-auth">
                    <?php if ($user): ?>
                        <a href="profile.php" class="btn-login">
                            <i class="fas fa-user"></i>
                            <?= htmlspecialchars($user['first_name']) ?>
                        </a>
                        <a href="logout.php" class="btn-register">
                            <i class="fas fa-sign-out-alt"></i>
                            Keluar
                        </a>
                    <?php else: ?>
                        <a href="login.php" class="btn-login">Masuk</a>
                        <a href="register.php" class="btn-register">Daftar</a>
                    <?php endif; ?>
                </div>
            </div>
            <div class="hamburger" id="hamburger">
                <span></span>
                <span></span>
                <span></span>
            </div>
        </div>
    </nav>

    <!-- Header -->
    <section class="page-header">
        <div class="container">
            <h1><i class="fas fa-search"></i> Lost & Found</h1>
            <p>Temukan barang hilang atau laporkan barang yang Anda temukan</p>
        </div>
    </section>

    <!-- Filters -->
    <section class="filters">
        <div class="container">
            <form method="GET" class="filter-bar">
                <div class="search-box">
                    <i class="fas fa-search"></i>
                    <input type="text" name="search" placeholder="Cari barang..." value="<?= htmlspecialchars($_GET['search'] ?? '') ?>">
                </div>
                <div class="filter-options">
                    <select name="category">
                        <option value="">Semua Kategori</option>
                        <?php foreach ($categories as $category): ?>
                            <option value="<?= $category['id'] ?>" <?= (($_GET['category'] ?? '') == $category['id']) ? 'selected' : '' ?>>
                                <?= htmlspecialchars($category['name']) ?>
                            </option>
                        <?php endforeach; ?>
                    </select>
                    <select name="type">
                        <option value="">Semua Status</option>
                        <option value="hilang" <?= (($_GET['type'] ?? '') === 'hilang') ? 'selected' : '' ?>>Hilang</option>
                        <option value="ditemukan" <?= (($_GET['type'] ?? '') === 'ditemukan') ? 'selected' : '' ?>>Ditemukan</option>
                    </select>
                    <button type="submit" class="btn-primary">
                        <i class="fas fa-filter"></i>
                        Filter
                    </button>
                </div>
            </form>
        </div>
    </section>

    <!-- Lost & Found Grid -->
    <section class="lost-found-grid">
        <div class="container">
            <div class="grid-container">
                <?php if (empty($items)): ?>
                    <div class="empty-state">
                        <i class="fas fa-search"></i>
                        <h3>Tidak ada item ditemukan</h3>
                        <p>Belum ada laporan yang sesuai dengan filter Anda</p>
                    </div>
                <?php else: ?>
                    <?php foreach ($items as $item): ?>
                        <div class="lost-found-item" data-id="<?= $item['id'] ?>" onclick="showItemDetail(<?= $item['id'] ?>)">
                            <?php if ($user && $user['id'] == $item['user_id']): ?>
                                <div class="item-actions-overlay">
                                    <button class="action-btn edit-btn" onclick="event.stopPropagation(); editItem(<?= $item['id'] ?>, 'lost-found')" title="Edit">
                                        <i class="fas fa-edit"></i>
                                    </button>
                                    <button class="action-btn delete-btn" onclick="event.stopPropagation(); deleteItem(<?= $item['id'] ?>, 'lost-found')" title="Hapus">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </div>
                            <?php endif; ?>
                            
                            <?php 
                            // Cek apakah ada gambar dan file exists
                            $hasImage = !empty($item['image']) && file_exists($item['image']);
                            $imageClass = $hasImage ? 'has-image' : '';
                            
                            // Tentukan icon berdasarkan kategori
                            $iconMap = [
                                'elektronik' => 'laptop',
                                'aksesoris' => 'glasses', 
                                'pakaian' => 'tshirt',
                                'buku' => 'book',
                                'alat tulis' => 'pen',
                                'tas' => 'briefcase',
                                'sepatu' => 'shoe-prints',
                                'perhiasan' => 'gem',
                                'kendaraan' => 'car'
                            ];
                            
                            $categoryLower = strtolower($item['category_name']);
                            $icon = isset($iconMap[$categoryLower]) ? $iconMap[$categoryLower] : 'box';
                            ?>
                            
                            <div class="item-image <?= $imageClass ?>">
                                <?php if ($hasImage): ?>
                                    <!-- CSS akan mengatur ukuran gambar -->
                                    <img src="<?= htmlspecialchars($item['image']) ?>" 
                                         alt="<?= htmlspecialchars($item['title']) ?>" 
                                         loading="lazy"
                                         class="item-img"
                                         onerror="this.parentElement.classList.remove('has-image'); this.style.display='none';">
                                <?php else: ?>
                                    <i class="fas fa-<?= $icon ?> item-icon"></i>
                                <?php endif; ?>
                                
                                <div class="item-status status-<?= $item['type'] ?>">
                                    <?= $item['type'] === 'hilang' ? 'HILANG' : 'DITEMUKAN' ?>
                                </div>
                            </div>
                            
                            <div class="item-content">
                                <div class="item-category">
                                    <?= htmlspecialchars($item['category_name']) ?>
                                </div>
                                
                                <h3 class="item-title"><?= htmlspecialchars($item['title']) ?></h3>
                                
                                <div class="item-meta">
                                    <div class="meta-item">
                                        <i class="fas fa-calendar"></i>
                                        <span><?= date('d M Y', strtotime($item['date_occurred'])) ?></span>
                                    </div>
                                    <div class="meta-item">
                                        <i class="fas fa-map-marker-alt"></i>
                                        <span><?= htmlspecialchars($item['location']) ?></span>
                                    </div>
                                    <div class="meta-item">
                                        <i class="fas fa-user"></i>
                                        <span><?= htmlspecialchars($item['user_name']) ?></span>
                                    </div>
                                </div>
                                
                                <p class="item-description">
                                    <?= htmlspecialchars(strlen($item['description']) > 100 ? substr($item['description'], 0, 100) . '...' : $item['description']) ?>
                                </p>
                                
                                <div class="item-actions">
                                    <a href="https://wa.me/<?= preg_replace('/[^0-9]/', '', $item['contact_info']) ?>" 
                                       target="_blank" 
                                       class="contact-btn"
                                       onclick="event.stopPropagation();">
                                        <i class="fab fa-whatsapp"></i>
                                        Hubungi
                                    </a>
                                    <div class="item-owner">
                                        oleh <?= htmlspecialchars($item['user_name']) ?>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Hidden data untuk modal -->
                            <script type="application/json" class="item-data">
                                {
                                    "id": <?= $item['id'] ?>,
                                    "title": <?= json_encode($item['title']) ?>,
                                    "description": <?= json_encode($item['description']) ?>,
                                    "type": <?= json_encode($item['type']) ?>,
                                    "category_name": <?= json_encode($item['category_name']) ?>,
                                    "location": <?= json_encode($item['location']) ?>,
                                    "date_occurred": <?= json_encode($item['date_occurred']) ?>,
                                    "user_name": <?= json_encode($item['user_name']) ?>,
                                    "contact_info": <?= json_encode($item['contact_info']) ?>,
                                    "image": <?= json_encode($item['image'] ?? '') ?>,
                                    "created_at": <?= json_encode($item['created_at']) ?>
                                }
                            </script>
                        </div>
                    <?php endforeach; ?>
                <?php endif; ?>
            </div>
        </div>
    </section>

    <!-- Detail Modal -->
    <div class="modal" id="detail-modal">
        <div class="modal-content detail-modal-content">
            <div class="modal-header">
                <h2 id="detail-modal-title">Detail Barang</h2>
                <button onclick="closeModal('detail-modal')" class="close-modal">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="detail-modal-body" id="detail-modal-body">
                <!-- Content akan diisi oleh JavaScript -->
            </div>
        </div>
    </div>

    <!-- Add Button (only for logged in users) -->
    <?php if ($user): ?>
    <div class="add-button" onclick="openModal('add-modal')">
        <i class="fas fa-plus"></i>
    </div>

    <!-- Add Modal -->
    <div class="modal" id="add-modal">
        <div class="modal-content">
            <div class="modal-header">
                <h2>Tambah Laporan Lost & Found</h2>
                <button onclick="closeModal('add-modal')" class="close-modal">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <form class="modal-form" method="POST" enctype="multipart/form-data">
                <input type="hidden" name="add_item" value="1">
                
                <div class="form-group">
                    <label for="type">Jenis Laporan</label>
                    <select id="type" name="type" required>
                        <option value="">Pilih jenis laporan</option>
                        <option value="hilang">Barang Hilang</option>
                        <option value="ditemukan">Barang Ditemukan</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label for="title">Nama Barang</label>
                    <input type="text" id="title" name="title" placeholder="Contoh: Laptop ASUS ROG" required maxlength="255">
                </div>
                
                <div class="form-group">
                    <label for="category_id">Kategori</label>
                    <select id="category_id" name="category_id" required>
                        <option value="">Pilih kategori</option>
                        <?php foreach ($categories as $category): ?>
                            <option value="<?= $category['id'] ?>"><?= htmlspecialchars($category['name']) ?></option>
                        <?php endforeach; ?>
                    </select>
                </div>
                
                <div class="form-group">
                    <label for="description">Deskripsi</label>
                    <textarea id="description" name="description" rows="4" placeholder="Jelaskan ciri-ciri barang secara detail..." required maxlength="1000"></textarea>
                </div>
                
                <div class="form-group">
                    <label for="location">Lokasi</label>
                    <input type="text" id="location" name="location" placeholder="Contoh: Perpustakaan Lantai 2" required maxlength="255">
                </div>
                
                <div class="form-group">
                    <label for="date_occurred">Tanggal Kejadian</label>
                    <input type="date" id="date_occurred" name="date_occurred" required max="<?= date('Y-m-d') ?>">
                </div>
                
                <div class="form-group">
                    <label for="image" class="optional">Foto Barang</label>
                    <input type="file" id="image" name="image" accept="image/jpeg,image/jpg,image/png,image/gif" onchange="previewImage(this)">
                    <small>Format: JPG, PNG, GIF. Maksimal 5MB. Ukuran akan disesuaikan otomatis dengan CSS.</small>
                    <div class="image-preview" id="image-preview" style="display: none;">
                        <img id="preview-img" src="" alt="Preview" class="preview-image">
                        <br>
                        <button type="button" class="remove-image" onclick="removeImage()">Hapus Foto</button>
                    </div>
                </div>
                
                <div class="form-actions">
                    <button type="button" onclick="closeModal('add-modal')" class="btn-secondary">
                        Batal
                    </button>
                    <button type="submit" class="btn-primary">
                        <i class="fas fa-plus"></i>
                        Tambah Laporan
                    </button>
                </div>
            </form>
        </div>
    </div>
    <?php endif; ?>

    <!-- Footer -->
    <footer class="footer">
        <div class="footer-content">
            <div class="footer-section">
                <div class="footer-logo">
                    <img src="assets/images/logo.png" alt="E-Statmad Logo">
                    <p>Platform mading elektronik untuk mahasiswa POLSTAT STIS</p>
                </div>
            </div>
            <div class="footer-section">
                <h3>Menu</h3>
                <ul>
                    <li><a href="index.php">Beranda</a></li>
                    <li><a href="lost-found.php">Lost & Found</a></li>
                    <li><a href="activities.php">Kegiatan</a></li>
                    <li><a href="about.php">Tentang</a></li>
                </ul>
            </div>
            <div class="footer-section">
                <h3>Kontak</h3>
                <ul>
                    <li><i class="fas fa-envelope"></i> info@estatmad.ac.id</li>
                    <li><i class="fas fa-phone"></i> (021) 123-4567</li>
                    <li><i class="fas fa-map-marker-alt"></i> POLSTAT STIS, Jakarta</li>
                </ul>
            </div>
            <div class="footer-section">
                <h3>Ikuti Kami</h3>
                <div class="social-links">
                    <a href="#" class="social-link"><i class="fab fa-instagram"></i></a>
                    <a href="#" class="social-link"><i class="fab fa-twitter"></i></a>
                    <a href="#" class="social-link"><i class="fab fa-facebook"></i></a>
                    <a href="#" class="social-link"><i class="fab fa-youtube"></i></a>
                </div>
            </div>
        </div>
        <div class="footer-bottom">
            <p>&copy; 2024 E-Statmad. Semua hak dilindungi.</p>
        </div>
    </footer>

    <script src="assets/js/main.js"></script>
    <script src="assets/js/lost-found.js"></script>
    <script>
        function openModal(modalId) {
            document.getElementById(modalId).classList.add('active');
        }
        
        function closeModal(modalId) {
            document.getElementById(modalId).classList.remove('active');
        }
        
        function previewImage(input) {
            const preview = document.getElementById('image-preview')
            const previewImg = document.getElementById('preview-img')
            
            if (input.files && input.files[0]) {
                const file = input.files[0]
                
                // Validate file type
                const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif']
                if (!validTypes.includes(file.type)) {
                    alert('Hanya file gambar (JPG, PNG, GIF) yang diperbolehkan!')
                    input.value = ''
                    return
                }
                
                // Validate file size (max 5MB)
                const maxSize = 5 * 1024 * 1024 // 5MB
                if (file.size > maxSize) {
                    alert('Ukuran file terlalu besar! Maksimal 5MB.')
                    input.value = ''
                    return
                }
                
                const reader = new FileReader()
                reader.onload = function(e) {
                    previewImg.src = e.target.result
                    preview.style.display = 'block'
                }
                reader.readAsDataURL(file)
            }
        }
        
        function removeImage() {
            const input = document.getElementById('image')
            const preview = document.getElementById('image-preview')
            
            input.value = ''
            preview.style.display = 'none'
        }

        function showItemDetail(itemId) {
            const itemCard = document.querySelector(`[data-id="${itemId}"]`);
            if (!itemCard) return;
            
            const itemDataScript = itemCard.querySelector('.item-data');
            if (!itemDataScript) return;
            
            try {
                const itemData = JSON.parse(itemDataScript.textContent);
                
                // Format tanggal
                const formattedDate = new Date(itemData.date_occurred).toLocaleDateString("id-ID", {
                    weekday: "long",
                    day: "numeric", 
                    month: "long",
                    year: "numeric"
                });
                
                const formattedCreatedAt = new Date(itemData.created_at).toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "long", 
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit"
                });
                
                // Tentukan icon berdasarkan kategori
                const iconMap = {
                    'elektronik': 'laptop',
                    'aksesoris': 'glasses', 
                    'pakaian': 'tshirt',
                    'buku': 'book',
                    'alat tulis': 'pen',
                    'tas': 'briefcase',
                    'sepatu': 'shoe-prints',
                    'perhiasan': 'gem',
                    'kendaraan': 'car'
                };
                
                const categoryLower = itemData.category_name.toLowerCase();
                const icon = iconMap[categoryLower] || 'box';
                
                // Buat konten modal
                const modalBody = document.getElementById('detail-modal-body');
                const modalTitle = document.getElementById('detail-modal-title');
                
                modalTitle.textContent = itemData.title;
                
                modalBody.innerHTML = `
                    <div class="detail-content">
                        <div class="detail-image-section">
                            ${itemData.image && itemData.image.trim() !== '' ? `
                                <div class="detail-image-container">
                                    <img src="${itemData.image}" 
                                         alt="${itemData.title}" 
                                         class="detail-image-large"
                                         onerror="this.parentElement.innerHTML = '<div class=\\'detail-image-placeholder\\'><i class=\\'fas fa-${icon}\\' style=\\'font-size: 5rem; color: white;\\'></i></div>';">
                                </div>
                            ` : `
                                <div class="detail-image-container no-image">
                                    <div class="detail-image-placeholder">
                                        <i class="fas fa-${icon}" style="font-size: 5rem; color: white; text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);"></i>
                                    </div>
                                </div>
                            `}
                        </div>
                        
                        <div class="detail-info-section">
                            <div class="detail-category">
                                <span class="category-badge">${itemData.category_name}</span>
                                <span class="status-badge status-${itemData.type}">
                                    ${itemData.type === 'hilang' ? 'BARANG HILANG' : 'BARANG DITEMUKAN'}
                                </span>
                            </div>
                            
                            <h3 class="detail-title">${itemData.title}</h3>
                            
                            <div class="detail-meta">
                                <div class="meta-row">
                                    <i class="fas fa-calendar"></i>
                                    <span><strong>Tanggal Kejadian:</strong> ${formattedDate}</span>
                                </div>
                                <div class="meta-row">
                                    <i class="fas fa-map-marker-alt"></i>
                                    <span><strong>Lokasi:</strong> ${itemData.location}</span>
                                </div>
                                <div class="meta-row">
                                    <i class="fas fa-user"></i>
                                    <span><strong>Dilaporkan oleh:</strong> ${itemData.user_name}</span>
                                </div>
                                <div class="meta-row">
                                    <i class="fas fa-clock"></i>
                                    <span><strong>Tanggal Laporan:</strong> ${formattedCreatedAt}</span>
                                </div>
                            </div>
                            
                            <div class="detail-description">
                                <h4>Deskripsi:</h4>
                                <p>${itemData.description}</p>
                            </div>
                            
                            <div class="detail-actions">
                                <a href="https://wa.me/${itemData.contact_info.replace(/[^0-9]/g, '')}" 
                                   target="_blank" 
                                   class="contact-btn-large">
                                    <i class="fab fa-whatsapp"></i>
                                    Hubungi via WhatsApp
                                </a>
                                <button class="share-btn" onclick="shareItem('${itemData.title.replace(/'/g, "\\'")}', '${itemData.description.replace(/'/g, "\\'")}')">
                                    <i class="fas fa-share"></i>
                                    Bagikan
                                </button>
                            </div>
                        </div>
                    </div>
                `;
                
                // Tampilkan modal
                openModal('detail-modal');
            } catch (error) {
                console.error('Error parsing item data:', error);
                alert('Terjadi kesalahan saat menampilkan detail item.');
            }
        }
        
        function shareItem(title, description) {
            if (navigator.share) {
                navigator.share({
                    title: title,
                    text: description,
                    url: window.location.href,
                });
            } else {
                // Fallback - copy to clipboard
                const text = `${title}\n\n${description}\n\n${window.location.href}`;
                navigator.clipboard.writeText(text).then(() => {
                    alert("Link item berhasil disalin!");
                }).catch(() => {
                    // Fallback for older browsers
                    const textArea = document.createElement('textarea');
                    textArea.value = text;
                    document.body.appendChild(textArea);
                    textArea.select();
                    document.execCommand('copy');
                    document.body.removeChild(textArea);
                    alert("Link item berhasil disalin!");
                });
            }
        }
        
        // Close modal when clicking outside
        window.addEventListener('click', function(e) {
            if (e.target.classList.contains('modal')) {
                e.target.classList.remove('active');
            }
        });

        // Global functions for edit/delete
        function editItem(id, type) {
            console.log('Edit item:', id);
            // Implement edit functionality
            alert('Fitur edit akan segera tersedia!');
        }

        function deleteItem(id, type) {
            if (!confirm("Apakah Anda yakin ingin menghapus item ini?")) {
                return;
            }
            console.log('Delete item:', id);
            // Implement delete functionality
            alert('Fitur hapus akan segera tersedia!');
        }
    </script>
    <?php if ($message): ?>
        <script>
            document.addEventListener('DOMContentLoaded', function() {
                const alertType = '<?= $messageType ?>' === 'success' ? 'success' : 'error';
                const alertMessage = <?= json_encode($message) ?>;
                
                // Simple alert - replace with your preferred notification system
                if (alertType === 'success') {
                    alert('✅ ' + alertMessage);
                } else {
                    alert('❌ ' + alertMessage);
                }
            });
        </script>
    <?php endif; ?>
</body>
</html>