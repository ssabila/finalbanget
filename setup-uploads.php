<?php
/**
 * Setup script untuk membuat direktori uploads dan mengatur permissions
 * Jalankan sekali setelah install untuk memastikan direktori tersedia
 */

echo "Setting up upload directories...\n";

$directories = [
    'uploads',
    'uploads/avatars',
    'uploads/lost-found', 
    'uploads/activities'
];

$created = 0;
$errors = 0;

foreach ($directories as $dir) {
    if (!is_dir($dir)) {
        if (mkdir($dir, 0755, true)) {
            echo "✅ Created directory: $dir\n";
            $created++;
        } else {
            echo "❌ Failed to create directory: $dir\n";
            $errors++;
        }
    } else {
        echo "ℹ️  Directory already exists: $dir\n";
    }
    
    // Check permissions
    if (is_writable($dir)) {
        echo "✅ Directory is writable: $dir\n";
    } else {
        echo "⚠️  Directory is not writable: $dir\n";
        // Try to fix permissions
        if (chmod($dir, 0755)) {
            echo "✅ Fixed permissions for: $dir\n";
        } else {
            echo "❌ Could not fix permissions for: $dir\n";
            $errors++;
        }
    }
}

// Create .htaccess for security
$htaccessContent = 'Options -Indexes
<FilesMatch "\.(php|php3|php4|php5|phtml|pl|py|jsp|asp|sh|cgi)$">
    Order Allow,Deny
    Deny from all
</FilesMatch>
<FilesMatch "\.(jpg|jpeg|png|gif)$">
    Order Allow,Deny
    Allow from all
</FilesMatch>';

foreach (['uploads', 'uploads/avatars', 'uploads/lost-found', 'uploads/activities'] as $dir) {
    $htaccessPath = $dir . '/.htaccess';
    if (!file_exists($htaccessPath)) {
        if (file_put_contents($htaccessPath, $htaccessContent)) {
            echo "✅ Created .htaccess for security: $htaccessPath\n";
        } else {
            echo "❌ Failed to create .htaccess: $htaccessPath\n";
            $errors++;
        }
    }
}

// Create index.php files to prevent directory listing
$indexContent = '<?php
// Prevent directory access
header("HTTP/1.0 403 Forbidden");
exit("Access denied");
?>';

foreach (['uploads', 'uploads/avatars', 'uploads/lost-found', 'uploads/activities'] as $dir) {
    $indexPath = $dir . '/index.php';
    if (!file_exists($indexPath)) {
        if (file_put_contents($indexPath, $indexContent)) {
            echo "✅ Created index.php for security: $indexPath\n";
        } else {
            echo "❌ Failed to create index.php: $indexPath\n";
            $errors++;
        }
    }
}

echo "\n" . str_repeat("=", 50) . "\n";
echo "Setup completed!\n";
echo "Directories created: $created\n";
echo "Errors: $errors\n";

if ($errors === 0) {
    echo "✅ All upload directories are ready!\n";
} else {
    echo "⚠️  Some issues encountered. Please check permissions manually.\n";
    echo "Run: chmod -R 755 uploads/\n";
}

echo str_repeat("=", 50) . "\n";
?>