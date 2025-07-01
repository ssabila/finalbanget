<?php
require_once 'includes/auth.php';
require_once 'config/database.php';

$auth = new Auth();
$user = $auth->getCurrentUser();

// Get recent posts
$database = new Database();
$db = $database->getConnection();

// Get recent lost & found items
$lostFoundQuery = "SELECT lf.*, u.first_name, u.last_name, c.name as category_name
                    FROM lost_found_items lf
                    JOIN users u ON lf.user_id = u.id
                    JOIN categories c ON lf.category_id = c.id
                    WHERE u.is_active = 1
                    ORDER BY lf.created_at DESC LIMIT 6";
$lostFoundStmt = $db->prepare($lostFoundQuery);
$lostFoundStmt->execute();
$lostFoundItems = $lostFoundStmt->fetchAll();

// Get recent activities
$activitiesQuery = "SELECT a.*, u.first_name, u.last_name, c.name as category_name
                    FROM activities a
                    JOIN users u ON a.user_id = u.id
                    JOIN categories c ON a.category_id = c.id
                    WHERE a.is_active = 1 AND u.is_active = 1 AND a.event_date >= CURDATE()
                    ORDER BY a.event_date ASC LIMIT 6";
$activitiesStmt = $db->prepare($activitiesQuery);
$activitiesStmt->execute();
$activities = $activitiesStmt->fetchAll();
?>
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>E-Statmad - Electronic Bulletin Board</title>
    <link rel="stylesheet" href="assets/css/style.css">
    <link rel="stylesheet" href="assets/css/home.css">
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
                <a href="index.php" class="nav-link active">Beranda</a>
                <a href="lost-found.php" class="nav-link">Lost & Found</a>
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

    <!-- Hero Section -->
    <section class="hero">
        <div class="hero-content">
            <div>
                <h1>Selamat Datang di E-Statmad</h1>
                <p>Platform mading elektronik untuk mahasiswa POLSTAT STIS. Temukan barang hilang dan ikuti kegiatan kampus dengan mudah.</p>
                <div class="hero-buttons">
                    <a href="lost-found.php" class="btn-primary">
                        <i class="fas fa-search"></i>
                        Lost & Found
                    </a>
                    <a href="activities.php" class="btn-secondary">
                        <i class="fas fa-calendar"></i>
                        Kegiatan Mahasiswa
                    </a>
                </div>
            </div>
            <div class="hero-image">
                <div class="floating-cards">
                    <div class="card-float card-1">
                        <i class="fas fa-search"></i>
                        <span>Cari Barang</span>
                    </div>
                    <div class="card-float card-2">
                        <i class="fas fa-calendar"></i>
                        <span>Event Kampus</span>
                    </div>
                    <div class="card-float card-3">
                        <i class="fas fa-users"></i>
                        <span>Komunitas</span>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- Features Section -->
    <section class="features">
        <div class="container">
            <h2>Fitur Utama</h2>
            <div class="features-grid">
                <div class="feature-card">
                    <div class="feature-icon">
                        <i class="fas fa-search"></i>
                    </div>
                    <h3>Lost & Found</h3>
                    <p>Laporkan barang hilang atau temukan barang yang hilang dengan mudah. Sistem notifikasi otomatis untuk menghubungkan pemilik dan penemu.</p>
                    <a href="lost-found.php" class="feature-link">Jelajahi <i class="fas fa-arrow-right"></i></a>
                </div>
                <div class="feature-card">
                    <div class="feature-icon">
                        <i class="fas fa-calendar-alt"></i>
                    </div>
                    <h3>Kegiatan Mahasiswa</h3>
                    <p>Ikuti berbagai kegiatan kampus, seminar, workshop, dan acara menarik lainnya. Jangan sampai terlewat!</p>
                    <a href="activities.php" class="feature-link">Lihat Kegiatan <i class="fas fa-arrow-right"></i></a>
                </div>
                <div class="feature-card">
                    <div class="feature-icon">
                        <i class="fas fa-user-circle"></i>
                    </div>
                    <h3>Profil Personal</h3>
                    <p>Kelola laporan dan unggahan Anda. Pantau status laporan lost & found dan riwayat kegiatan yang diikuti.</p>
                    <a href="<?= $user ? 'profile.php' : 'login.php' ?>" class="feature-link"><?= $user ? 'Profil' : 'Masuk' ?> <i class="fas fa-arrow-right"></i></a>
                </div>
            </div>
        </div>
    </section>

    <!-- Recent Posts -->
    <section class="recent-posts">
        <div class="container">
            <h2>Postingan Terbaru</h2>
            <div class="slider-container">
                <div class="posts-slider">
                    <?php foreach ($lostFoundItems as $item): ?>
                        <div class="post-card" onclick="window.location.href='lost-found.php'">
                            <div class="post-image">
                                <i class="fas fa-search"></i>
                                <div class="post-type-badge lost-found">Lost & Found</div>
                            </div>
                            <div class="post-content">
                                <div class="post-category <?= $item['type'] ?>">
                                    <?= $item['type'] === 'hilang' ? 'Barang Hilang' : 'Barang Ditemukan' ?>
                                </div>
                                <h3 class="post-title"><?= htmlspecialchars($item['title']) ?></h3>
                                <div class="post-meta">
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
                                        <span><?= htmlspecialchars($item['first_name'] . ' ' . $item['last_name']) ?></span>
                                    </div>
                                </div>
                                <p class="post-description"><?= htmlspecialchars(substr($item['description'], 0, 100)) ?>...</p>
                            </div>
                        </div>
                    <?php endforeach; ?>
                    
                    <?php foreach ($activities as $activity): ?>
                        <div class="post-card" onclick="window.location.href='activities.php'">
                            <div class="post-image">
                                <i class="fas fa-calendar-alt"></i>
                                <div class="post-type-badge activity">Kegiatan</div>
                            </div>
                            <div class="post-content">
                                <div class="post-category activity">
                                    <?= htmlspecialchars($activity['category_name']) ?>
                                </div>
                                <h3 class="post-title"><?= htmlspecialchars($activity['title']) ?></h3>
                                <div class="post-meta">
                                    <div class="meta-item">
                                        <i class="fas fa-calendar"></i>
                                        <span><?= date('d M Y', strtotime($activity['event_date'])) ?></span>
                                    </div>
                                    <div class="meta-item">
                                        <i class="fas fa-map-marker-alt"></i>
                                        <span><?= htmlspecialchars($activity['location']) ?></span>
                                    </div>
                                    <div class="meta-item">
                                        <i class="fas fa-user"></i>
                                        <span><?= htmlspecialchars($activity['first_name'] . ' ' . $activity['last_name']) ?></span>
                                    </div>
                                </div>
                                <p class="post-description"><?= htmlspecialchars(substr($activity['description'], 0, 100)) ?>...</p>
                            </div>
                        </div>
                    <?php endforeach; ?>
                </div>
            </div>
            <div class="view-more">
                <a href="lost-found.php" class="btn-outline">Lihat Semua Lost & Found</a>
                <a href="activities.php" class="btn-outline">Lihat Semua Kegiatan</a>
            </div>
        </div>
    </section>

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
    <script>
        function showNotification(message, type) {
            const notification = document.createElement('div');
            notification.className = `notification notification-${type}`;
            notification.innerHTML = `
                <div class="notification-content">
                    <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
                    <span>${message}</span>
                    <button class="notification-close"><i class="fas fa-times"></i></button>
                </div>
            `;
            document.body.appendChild(notification);
            
            setTimeout(() => notification.remove(), 5000);
            notification.querySelector('.notification-close').onclick = () => notification.remove();
        }
    </script>
</body>
</html>
