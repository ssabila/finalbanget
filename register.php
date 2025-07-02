<?php
require_once 'includes/auth.php';

$auth = new Auth();
$error = '';
$success = '';

// Redirect if already logged in
if ($auth->isLoggedIn()) {
    redirect('profile.php');
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = [
        'firstName' => $_POST['firstName'] ?? '',
        'lastName' => $_POST['lastName'] ?? '',
        'nim' => $_POST['nim'] ?? '',
        'email' => $_POST['email'] ?? '',
        'phone' => $_POST['phone'] ?? '',
        'password' => $_POST['password'] ?? '',
        'confirmPassword' => $_POST['confirmPassword'] ?? ''
    ];
    
    // Validation
    if (empty($data['firstName']) || empty($data['lastName']) || empty($data['nim']) || 
        empty($data['email']) || empty($data['phone']) || empty($data['password'])) {
        $error = 'Semua field wajib diisi';
    } elseif ($data['password'] !== $data['confirmPassword']) {
        $error = 'Konfirmasi password tidak cocok';
    } elseif (strlen($data['password']) < 6) {
        $error = 'Password minimal 6 karakter';
    } elseif (!filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
        $error = 'Format email tidak valid';
    } else {
        $result = $auth->register($data);
        if (isset($result['success'])) {
            $success = 'Registrasi berhasil! Silakan login.';
        } else {
            $error = $result['error'];
        }
    }
}
?>
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Daftar - E-Statmad</title>
    <link rel="stylesheet" href="assets/css/style.css">
    <link rel="stylesheet" href="assets/css/auth.css">
    <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
</head>
<body>
    <div class="auth-container">
        <div class="auth-card">
            <div class="auth-header">
                <img src="assets/images/logo.png" alt="E-Statmad Logo" class="auth-logo">
                <h1>Bergabung dengan E-Statmad</h1>
                <p>Buat akun baru untuk mengakses semua fitur</p>
            </div>
            
            <?php if ($error): ?>
                <div class="alert alert-error">
                    <i class="fas fa-exclamation-circle"></i>
                    <?= htmlspecialchars($error) ?>
                </div>
            <?php endif; ?>

            <?php if ($success): ?>
                <div class="alert alert-success">
                    <i class="fas fa-check-circle"></i>
                    <?= htmlspecialchars($success) ?>
                    <a href="login.php" class="btn-primary" style="margin-top: 10px; display: block; text-align: center;">Login Sekarang</a>
                </div>
            <?php endif; ?>
            
            <?php if (!$success): ?>
            <form class="auth-form" method="POST">
                <div class="form-group">
                    <label for="firstName">Nama Depan</label>
                    <div class="input-group">
                        <i class="fas fa-user"></i>
                        <input type="text" id="firstName" name="firstName" value="<?= htmlspecialchars($_POST['firstName'] ?? '') ?>" required>
                    </div>
                </div>
                <div class="form-group">
                    <label for="lastName">Nama Belakang</label>
                    <div class="input-group">
                        <i class="fas fa-user"></i>
                        <input type="text" id="lastName" name="lastName" value="<?= htmlspecialchars($_POST['lastName'] ?? '') ?>" required>
                    </div>
                </div>
                
                <div class="form-group">
                    <label for="nim">NIM</label>
                    <div class="input-group">
                        <i class="fas fa-id-card"></i>
                        <input type="text" id="nim" name="nim" value="<?= htmlspecialchars($_POST['nim'] ?? '') ?>" required>
                    </div>
                </div>
                
                <div class="form-group">
                    <label for="email">Email</label>
                    <div class="input-group">
                        <i class="fas fa-envelope"></i>
                        <input type="email" id="email" name="email" value="<?= htmlspecialchars($_POST['email'] ?? '') ?>" required>
                    </div>
                </div>
                
                <div class="form-group">
                    <label for="phone">Nomor WhatsApp</label>
                    <div class="input-group">
                        <i class="fas fa-phone"></i>
                        <input type="tel" id="phone" name="phone" value="<?= htmlspecialchars($_POST['phone'] ?? '') ?>" required>
                    </div>
                </div>
                <div class="form-group">
                    <label for="password">Kata Sandi</label>
                    <div class="input-group">
                        <i class="fas fa-lock"></i>
                        <input type="password" id="password" name="password" required>
                        <button type="button" class="toggle-password">
                            <i class="fas fa-eye"></i>
                        </button>
                    </div>
                </div>
                <div class="form-group">
                    <label for="confirmPassword">Konfirmasi Kata Sandi</label>
                    <div class="input-group">
                        <i class="fas fa-lock"></i>
                        <input type="password" id="confirmPassword" name="confirmPassword" required>
                        <button type="button" class="toggle-password">
                            <i class="fas fa-eye"></i>
                        </button>
                    </div>
                </div>

                <button type="submit" class="btn-primary btn-full">
                    <i class="fas fa-user-plus"></i>
                    Daftar
                </button>
            </form>
            <?php endif; ?>
            
            <div class="auth-footer">
                <p>Sudah punya akun? <a href="login.php">Masuk sekarang</a></p>
                <a href="index.php" class="back-home">
                    <i class="fas fa-arrow-left"></i>
                    Kembali ke Beranda
                </a>
            </div>
        </div>
        
        <div class="auth-background">
            <div class="bg-shape shape-1"></div>
            <div class="bg-shape shape-2"></div>
            <div class="bg-shape shape-3"></div>
        </div>
    </div>

    <script src="assets/js/main.js"></script>
    <script>
        // Toggle password visibility
        document.querySelectorAll('.toggle-password').forEach(button => {
            button.addEventListener('click', function() {
                const passwordInput = this.parentElement.querySelector('input');
                const icon = this.querySelector('i');
                
                if (passwordInput.type === 'password') {
                    passwordInput.type = 'text';
                    icon.classList.remove('fa-eye');
                    icon.classList.add('fa-eye-slash');
                } else {
                    passwordInput.type = 'password';
                    icon.classList.remove('fa-eye-slash');
                    icon.classList.add('fa-eye');
                }
            });
        });
    </script>
</body>
</html>
