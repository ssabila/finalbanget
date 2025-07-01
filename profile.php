<?php
require_once 'includes/auth.php';
require_once 'config/database.php';

$auth = new Auth();
$auth->requireAuth(); // Require authentication for this page

$user = $auth->getCurrentUser();
$database = new Database();
$db = $database->getConnection();

$message = '';
$messageType = '';

// Handle Lost & Found form submission
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['add_lost_found'])) {
    $data = [
        'title' => $_POST['title'] ?? '',
        'description' => $_POST['description'] ?? '',
        'type' => $_POST['type'] ?? '',
        'category_id' => $_POST['category_id'] ?? '',
        'location' => $_POST['location'] ?? '',
        'date_occurred' => $_POST['date_occurred'] ?? ''
    ];
    
    if (empty($data['title']) || empty($data['description']) || empty($data['type']) || 
        empty($data['category_id']) || empty($data['location']) || empty($data['date_occurred'])) {
        $message = 'Semua field wajib diisi';
        $messageType = 'error';
    } else {
        // Handle image upload
        $imagePath = null;
        if (isset($_FILES['lf_image']) && $_FILES['lf_image']['error'] === UPLOAD_ERR_OK) {
            $uploadDir = 'uploads/lost-found/';
            if (!is_dir($uploadDir)) {
                mkdir($uploadDir, 0755, true);
            }
            
            $fileExtension = strtolower(pathinfo($_FILES['lf_image']['name'], PATHINFO_EXTENSION));
            $allowedExtensions = ['jpg', 'jpeg', 'png', 'gif'];
            
            if (in_array($fileExtension, $allowedExtensions)) {
                $fileName = uniqid() . '.' . $fileExtension;
                $targetPath = $uploadDir . $fileName;
                
                if (move_uploaded_file($_FILES['lf_image']['tmp_name'], $targetPath)) {
                    $imagePath = $targetPath;
                }
            }
        }
        
        $insertQuery = "INSERT INTO lost_found_items (user_id, category_id, title, description, type, location, date_occurred, contact_info, image) 
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";
        $stmt = $db->prepare($insertQuery);
        
        if ($stmt->execute([$user['id'], $data['category_id'], $data['title'], $data['description'], 
                           $data['type'], $data['location'], $data['date_occurred'], $user['phone'], $imagePath])) {
            $message = 'Laporan berhasil ditambahkan!';
            $messageType = 'success';
        } else {
            $message = 'Gagal menambahkan laporan';
            $messageType = 'error';
        }
    }
}

// Handle Activity form submission
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['add_activity'])) {
    $data = [
        'title' => $_POST['title'] ?? '',
        'description' => $_POST['description'] ?? '',
        'category_id' => $_POST['category_id'] ?? '',
        'event_date' => $_POST['event_date'] ?? '',
        'event_time' => $_POST['event_time'] ?? '',
        'location' => $_POST['location'] ?? '',
        'organizer' => $_POST['organizer'] ?? ''
    ];
    
    if (empty($data['title']) || empty($data['description']) || empty($data['category_id']) || 
        empty($data['event_date']) || empty($data['event_time']) || empty($data['location']) || empty($data['organizer'])) {
        $message = 'Semua field wajib diisi';
        $messageType = 'error';
    } else {
        // Handle image upload
        $imagePath = null;
        if (isset($_FILES['act_image']) && $_FILES['act_image']['error'] === UPLOAD_ERR_OK) {
            $uploadDir = 'uploads/activities/';
            if (!is_dir($uploadDir)) {
                mkdir($uploadDir, 0755, true);
            }
            
            $fileExtension = strtolower(pathinfo($_FILES['act_image']['name'], PATHINFO_EXTENSION));
            $allowedExtensions = ['jpg', 'jpeg', 'png', 'gif'];
            
            if (in_array($fileExtension, $allowedExtensions)) {
                $fileName = uniqid() . '.' . $fileExtension;
                $targetPath = $uploadDir . $fileName;
                
                if (move_uploaded_file($_FILES['act_image']['tmp_name'], $targetPath)) {
                    $imagePath = $targetPath;
                }
            }
        }
        
        $insertQuery = "INSERT INTO activities (user_id, category_id, title, description, event_date, event_time, location, organizer, contact_info, image) 
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
        $stmt = $db->prepare($insertQuery);
        
        if ($stmt->execute([$user['id'], $data['category_id'], $data['title'], $data['description'], 
                           $data['event_date'], $data['event_time'], $data['location'], $data['organizer'], $user['phone'], $imagePath])) {
            $message = 'Kegiatan berhasil ditambahkan!';
            $messageType = 'success';
        } else {
            $message = 'Gagal menambahkan kegiatan';
            $messageType = 'error';
        }
    }
}

// Get categories
$lostFoundCategoriesQuery = "SELECT * FROM categories WHERE type = 'lost_found'";
$lostFoundCategoriesStmt = $db->prepare($lostFoundCategoriesQuery);
$lostFoundCategoriesStmt->execute();
$lostFoundCategories = $lostFoundCategoriesStmt->fetchAll();

$activityCategoriesQuery = "SELECT * FROM categories WHERE type = 'activity'";
$activityCategoriesStmt = $db->prepare($activityCategoriesQuery);
$activityCategoriesStmt->execute();
$activityCategories = $activityCategoriesStmt->fetchAll();

// Get user's lost & found items
$lostFoundQuery = "SELECT lf.*, c.name as category_name
                   FROM lost_found_items lf
                   JOIN categories c ON lf.category_id = c.id
                   WHERE lf.user_id = ?
                   ORDER BY lf.created_at DESC";
$lostFoundStmt = $db->prepare($lostFoundQuery);
$lostFoundStmt->execute([$user['id']]);
$userLostFound = $lostFoundStmt->fetchAll();

// Get user's activities
$activitiesQuery = "SELECT a.*, c.name as category_name
                    FROM activities a
                    JOIN categories c ON a.category_id = c.id
                    WHERE a.user_id = ?
                    ORDER BY a.created_at DESC";
$activitiesStmt = $db->prepare($activitiesQuery);
$activitiesStmt->execute([$user['id']]);
$userActivities = $activitiesStmt->fetchAll();

// Calculate statistics
$totalLostFound = count($userLostFound);
$totalActivities = count($userActivities);
$resolvedItems = count(array_filter($userLostFound, function($item) {
    return $item['status'] === 'selesai';
}));

?>
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Profil - E-Statmad</title>
    <link rel="stylesheet" href="assets/css/style.css">
    <link rel="stylesheet" href="assets/css/profile.css">
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
                <a href="lost-found.php" class="nav-link">Lost & Found</a>
                <a href="activities.php" class="nav-link">Kegiatan</a>
                <a href="about.php" class="nav-link">Tentang</a>
                <div class="nav-auth">
                    <a href="profile.php" class="btn-login active">
                        <i class="fas fa-user"></i>
                        <?= htmlspecialchars($user['first_name']) ?>
                    </a>
                    <a href="logout.php" class="btn-register">
                        <i class="fas fa-sign-out-alt"></i>
                        Keluar
                    </a>
                </div>
            </div>
            <div class="hamburger" id="hamburger">
                <span></span>
                <span></span>
                <span></span>
            </div>
        </div>
    </nav>

    <!-- Profile Header -->
    <section class="profile-header">
        <div class="container">
            <div class="profile-info">
                <div class="profile-avatar">
                    <img src="/placeholder.svg?height=120&width=120" alt="Profile Avatar">
                </div>
                <div class="profile-details">
                    <h1><?= htmlspecialchars($user['first_name'] . ' ' . $user['last_name']) ?></h1>
                    <p>NIM: <?= htmlspecialchars($user['nim']) ?></p>
                    <p><?= htmlspecialchars($user['email']) ?></p>
                </div>
            </div>
            <div class="profile-stats">
                <div class="stat-item">
                    <span class="stat-number"><?= $totalLostFound ?></span>
                    <span class="stat-label">Lost & Found</span>
                </div>
                <div class="stat-item">
                    <span class="stat-number"><?= $totalActivities ?></span>
                    <span class="stat-label">Kegiatan</span>
                </div>
                <div class="stat-item">
                    <span class="stat-number"><?= $resolvedItems ?></span>
                    <span class="stat-label">Terselesaikan</span>
                </div>
            </div>
        </div>
    </section>

    <!-- Profile Tabs -->
    <section class="profile-tabs">
        <div class="container">
            <div class="tab-navigation">
                <button class="tab-btn active" data-tab="lost-found">
                    <i class="fas fa-search"></i>
                    Lost & Found Saya
                </button>
                <button class="tab-btn" data-tab="activities">
                    <i class="fas fa-calendar"></i>
                    Kegiatan Saya
                </button>
            </div>

            <!-- Lost & Found Tab -->
            <div class="tab-content active" id="lost-found-tab">
                <div class="tab-header">
                    <h2>Laporan Lost & Found Saya</h2>
                    <button onclick="openModal('lost-found-modal')" class="btn-primary">
                        <i class="fas fa-plus"></i>
                        Tambah Laporan
                    </button>
                </div>
                <div class="items-grid">
                    <?php if (empty($userLostFound)): ?>
                        <div class="empty-state">
                            <i class="fas fa-search"></i>
                            <h3>Belum Ada Laporan</h3>
                            <p>Anda belum membuat laporan lost & found apapun</p>
                            <button onclick="openModal('lost-found-modal')" class="btn-primary">
                                <i class="fas fa-plus"></i>
                                Tambah Laporan
                            </button>
                        </div>
                    <?php else: ?>
                        <?php foreach ($userLostFound as $item): ?>
                            <div class="profile-item">
                                <div class="item-image">
                                    <?php if ($item['image']): ?>
                                        <img src="<?= htmlspecialchars($item['image']) ?>" alt="<?= htmlspecialchars($item['title']) ?>">
                                    <?php else: ?>
                                        <i class="fas fa-<?= $item['type'] === 'hilang' ? 'exclamation-triangle' : 'check-circle' ?>"></i>
                                    <?php endif; ?>
                                    <div class="item-status status-<?= $item['type'] ?>">
                                        <?= $item['type'] === 'hilang' ? 'Hilang' : 'Ditemukan' ?>
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
                                    </div>
                                    <p class="item-description"><?= htmlspecialchars(substr($item['description'], 0, 100)) ?>...</p>
                                </div>
                            </div>
                        <?php endforeach; ?>
                    <?php endif; ?>
                </div>
            </div>

            <!-- Activities Tab -->
            <div class="tab-content" id="activities-tab">
                <div class="tab-header">
                    <h2>Kegiatan yang Saya Buat</h2>
                    <button onclick="openModal('activity-modal')" class="btn-primary">
                        <i class="fas fa-plus"></i>
                        Tambah Kegiatan
                    </button>
                </div>
                <div class="items-grid">
                    <?php if (empty($userActivities)): ?>
                        <div class="empty-state">
                            <i class="fas fa-calendar-times"></i>
                            <h3>Belum Ada Kegiatan</h3>
                            <p>Anda belum membuat kegiatan apapun</p>
                            <button onclick="openModal('activity-modal')" class="btn-primary">
                                <i class="fas fa-plus"></i>
                                Tambah Kegiatan
                            </button>
                        </div>
                    <?php else: ?>
                        <?php foreach ($userActivities as $activity): ?>
                            <div class="profile-item">
                                <div class="item-image">
                                    <?php if ($activity['image']): ?>
                                        <img src="<?= htmlspecialchars($activity['image']) ?>" alt="<?= htmlspecialchars($activity['title']) ?>">
                                    <?php else: ?>
                                        <i class="fas fa-calendar-alt"></i>
                                    <?php endif; ?>
                                    <div class="item-status status-active">
                                        Aktif
                                    </div>
                                </div>
                                <div class="item-content">
                                    <div class="item-category">
                                        <?= htmlspecialchars($activity['category_name']) ?>
                                    </div>
                                    <h3 class="item-title"><?= htmlspecialchars($activity['title']) ?></h3>
                                    <div class="item-meta">
                                        <div class="meta-item">
                                            <i class="fas fa-calendar"></i>
                                            <span><?= date('d M Y', strtotime($activity['event_date'])) ?> <?= date('H:i', strtotime($activity['event_time'])) ?></span>
                                        </div>
                                        <div class="meta-item">
                                            <i class="fas fa-map-marker-alt"></i>
                                            <span><?= htmlspecialchars($activity['location']) ?></span>
                                        </div>
                                    </div>
                                    <p class="item-description"><?= htmlspecialchars(substr($activity['description'], 0, 100)) ?>...</p>
                                </div>
                            </div>
                        <?php endforeach; ?>
                    <?php endif; ?>
                </div>
            </div>
        </div>
    </section>

    <!-- Lost & Found Modal -->
    <div class="modal" id="lost-found-modal">
        <div class="modal-content">
            <div class="modal-header">
                <h2>Tambah Laporan Lost & Found</h2>
                <button onclick="closeModal('lost-found-modal')" class="close-modal">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <form class="modal-form" method="POST" enctype="multipart/form-data">
                <input type="hidden" name="add_lost_found" value="1">
                
                <div class="form-group">
                    <label for="lf_type">Jenis Laporan</label>
                    <select id="lf_type" name="type" required>
                        <option value="">Pilih jenis laporan</option>
                        <option value="hilang">Barang Hilang</option>
                        <option value="ditemukan">Barang Ditemukan</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label for="lf_title">Nama Barang</label>
                    <input type="text" id="lf_title" name="title" placeholder="Contoh: Laptop ASUS ROG" required>
                </div>
                
                <div class="form-group">
                    <label for="lf_category_id">Kategori</label>
                    <select id="lf_category_id" name="category_id" required>
                        <option value="">Pilih kategori</option>
                        <?php foreach ($lostFoundCategories as $category): ?>
                            <option value="<?= $category['id'] ?>"><?= htmlspecialchars($category['name']) ?></option>
                        <?php endforeach; ?>
                    </select>
                </div>
                
                <div class="form-group">
                    <label for="lf_description">Deskripsi</label>
                    <textarea id="lf_description" name="description" rows="4" placeholder="Jelaskan ciri-ciri barang secara detail..." required></textarea>
                </div>
                
                <div class="form-group">
                    <label for="lf_location">Lokasi</label>
                    <input type="text" id="lf_location" name="location" placeholder="Contoh: Perpustakaan Lantai 2" required>
                </div>
                
                <div class="form-group">
                    <label for="lf_date_occurred">Tanggal Kejadian</label>
                    <input type="date" id="lf_date_occurred" name="date_occurred" required>
                </div>
                
                <div class="form-group">
                    <label for="lf_image" class="optional">Foto Barang</label>
                    <input type="file" id="lf_image" name="lf_image" accept="image/*" onchange="previewImage(this, 'lf-preview')">
                    <div class="image-preview" id="lf-preview" style="display: none;">
                        <img id="lf-preview-img" src="/placeholder.svg" alt="Preview">
                        <br>
                        <button type="button" class="remove-image" onclick="removeImage('lf_image', 'lf-preview')">Hapus Foto</button>
                    </div>
                </div>
                
                <div class="form-actions">
                    <button type="button" onclick="closeModal('lost-found-modal')" class="btn-secondary">
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

    <!-- Activity Modal -->
    <div class="modal" id="activity-modal">
        <div class="modal-content">
            <div class="modal-header">
                <h2>Tambah Kegiatan</h2>
                <button onclick="closeModal('activity-modal')" class="close-modal">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <form class="modal-form" method="POST" enctype="multipart/form-data">
                <input type="hidden" name="add_activity" value="1">
                
                <div class="form-group">
                    <label for="act_title">Judul Kegiatan</label>
                    <input type="text" id="act_title" name="title" placeholder="Contoh: Workshop Python Programming" required>
                </div>
                
                <div class="form-group">
                    <label for="act_category_id">Kategori</label>
                    <select id="act_category_id" name="category_id" required>
                        <option value="">Pilih kategori</option>
                        <?php foreach ($activityCategories as $category): ?>
                            <option value="<?= $category['id'] ?>"><?= htmlspecialchars($category['name']) ?></option>
                        <?php endforeach; ?>
                    </select>
                </div>
                
                <div class="form-group">
                    <label for="act_description">Deskripsi</label>
                    <textarea id="act_description" name="description" rows="4" placeholder="Jelaskan detail kegiatan, materi yang akan dibahas, dan informasi penting lainnya..." required></textarea>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label for="act_event_date">Tanggal</label>
                        <input type="date" id="act_event_date" name="event_date" required>
                    </div>
                    <div class="form-group">
                        <label for="act_event_time">Waktu</label>
                        <input type="time" id="act_event_time" name="event_time" required>
                    </div>
                </div>
                
                <div class="form-group">
                    <label for="act_location">Lokasi</label>
                    <input type="text" id="act_location" name="location" placeholder="Contoh: Auditorium Utama STIS" required>
                </div>
                
                <div class="form-group">
                    <label for="act_organizer">Penyelenggara</label>
                    <input type="text" id="act_organizer" name="organizer" placeholder="Contoh: Himpunan Mahasiswa Statistika" required>
                </div>
                
                <div class="form-group">
                    <label for="act_image" class="optional">Poster/Gambar Kegiatan</label>
                    <input type="file" id="act_image" name="act_image" accept="image/*" onchange="previewImage(this, 'act-preview')">
                    <div class="image-preview" id="act-preview" style="display: none;">
                        <img id="act-preview-img" src="/placeholder.svg" alt="Preview">
                        <br>
                        <button type="button" class="remove-image" onclick="removeImage('act_image', 'act-preview')">Hapus Foto</button>
                    </div>
                </div>
                
                <div class="form-actions">
                    <button type="button" onclick="closeModal('activity-modal')" class="btn-secondary">
                        Batal
                    </button>
                    <button type="submit" class="btn-primary">
                        <i class="fas fa-plus"></i>
                        Tambah Kegiatan
                    </button>
                </div>
            </form>
        </div>
    </div>

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
    <script src="assets/js/profile.js"></script>
    <script>
        // Tab functionality
        document.querySelectorAll('.tab-btn').forEach(button => {
            button.addEventListener('click', () => {
                const targetTab = button.dataset.tab;
                
                // Update active tab button
                document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                
                // Update active tab content
                document.querySelectorAll('.tab-content').forEach(content => {
                    content.classList.remove('active');
                    if (content.id === `${targetTab}-tab`) {
                        content.classList.add('active');
                    }
                });
            });
        });
        
        // Modal functions
        function openModal(modalId) {
            document.getElementById(modalId).classList.add('active');
        }
        
        function closeModal(modalId) {
            document.getElementById(modalId).classList.remove('active');
        }
        
        function previewImage(input, previewId) {
            if (input.files && input.files[0]) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    const imgElement = document.querySelector(`#${previewId} img`);
                    imgElement.src = e.target.result;
                    document.getElementById(previewId).style.display = 'block';
                };
                reader.readAsDataURL(input.files[0]);
            }
        }
        
        function removeImage(inputId, previewId) {
            document.getElementById(inputId).value = '';
            document.getElementById(previewId).style.display = 'none';
        }
        
        // Close modal when clicking outside
        window.addEventListener('click', function(e) {
            if (e.target.classList.contains('modal')) {
                e.target.classList.remove('active');
            }
        });
    </script>
    <?php if ($message): ?>
        <?= $auth->showAlert($message, $messageType) ?>
    <?php endif; ?>
</body>
</html>
