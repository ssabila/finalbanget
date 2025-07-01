-- Sample data for E-Statmad
USE estatmad;

-- Sample users (password: "password123")
INSERT INTO users (nim, first_name, last_name, email, phone, password) VALUES
('222212345', 'Ahmad', 'Rizki', 'ahmad.rizki@student.stis.ac.id', '081234567890', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),
('222212346', 'Sari', 'Dewi', 'sari.dewi@student.stis.ac.id', '081234567891', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),
('222212347', 'Budi', 'Santoso', 'budi.santoso@student.stis.ac.id', '081234567892', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),
('222212348', 'Maya', 'Putri', 'maya.putri@student.stis.ac.id', '081234567893', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),
('222212349', 'Andi', 'Pratama', 'andi.pratama@student.stis.ac.id', '081234567894', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi');

-- Sample lost and found items
INSERT INTO lost_found_items (user_id, category_id, title, description, type, location, date_occurred, contact_info) VALUES
(1, 1, 'Laptop ASUS ROG', 'Laptop gaming warna hitam, ada stiker di bagian belakang. Hilang di perpustakaan lantai 2.', 'hilang', 'Perpustakaan Lantai 2', '2024-01-15', '081234567890'),
(2, 2, 'Jam Tangan Casio', 'Jam tangan digital warna silver, tali karet hitam. Ditemukan di kantin.', 'ditemukan', 'Kantin Utama', '2024-01-16', '081234567891'),
(3, 4, 'Buku Statistika Dasar', 'Buku kuliah statistika dasar, sampul biru, ada nama di halaman pertama.', 'hilang', 'Ruang Kelas A201', '2024-01-17', '081234567892'),
(4, 1, 'Power Bank Xiaomi', 'Power bank 10000mAh warna putih, ada goresan kecil di bagian samping.', 'ditemukan', 'Lab Komputer', '2024-01-18', '081234567893'),
(5, 3, 'Jaket Hoodie Hitam', 'Jaket hoodie hitam ukuran L, merk Uniqlo, ada logo kecil di dada kiri.', 'hilang', 'Gedung Olahraga', '2024-01-19', '081234567894'),
(1, 2, 'Kacamata Minus', 'Kacamata frame hitam, lensa minus 2.5, ditemukan di mushola.', 'ditemukan', 'Mushola Kampus', '2024-01-20', '081234567890'),
(2, 5, 'Dompet Kulit Coklat', 'Dompet kulit coklat, berisi KTM dan uang. Hilang di area parkir.', 'hilang', 'Area Parkir Motor', '2024-01-21', '081234567891'),
(3, 1, 'Earphone Sony', 'Earphone in-ear warna putih, kabel agak kusut. Ditemukan di ruang tunggu.', 'ditemukan', 'Ruang Tunggu Dekan', '2024-01-22', '081234567892');

-- Sample activities
INSERT INTO activities (user_id, category_id, title, description, event_date, event_time, location, organizer, contact_info) VALUES
(1, 6, 'Seminar Data Science untuk Pemula', 'Seminar pengenalan data science dengan pembicara dari industri. Akan membahas tools dan teknik dasar dalam analisis data.', '2024-02-15', '09:00:00', 'Auditorium Utama', 'Himpunan Mahasiswa Statistika', '081234567890'),
(2, 7, 'Workshop Python Programming', 'Workshop hands-on belajar pemrograman Python dari dasar hingga intermediate. Peserta akan mendapat sertifikat.', '2024-02-20', '13:00:00', 'Lab Komputer 1', 'Tim IT STIS', '081234567891'),
(3, 8, 'Lomba Karya Tulis Ilmiah', 'Kompetisi penulisan karya ilmiah dengan tema "Statistika untuk Indonesia Maju". Hadiah total 10 juta rupiah.', '2024-03-01', '08:00:00', 'Gedung Rektorat', 'BEM STIS', '081234567892'),
(4, 9, 'Rapat Koordinasi OSIS', 'Rapat bulanan pengurus OSIS membahas program kerja semester genap dan persiapan acara wisuda.', '2024-02-10', '15:30:00', 'Ruang Rapat OSIS', 'OSIS STIS', '081234567893'),
(5, 10, 'Turnamen Futsal Antar Kelas', 'Kompetisi futsal untuk semua angkatan. Pendaftaran dibuka hingga 5 Februari 2024.', '2024-02-25', '07:00:00', 'Lapangan Futsal', 'UKM Olahraga', '081234567894'),
(1, 11, 'Pentas Seni Budaya Nusantara', 'Pertunjukan seni dan budaya dari berbagai daerah di Indonesia. Menampilkan tarian, musik, dan drama.', '2024-03-10', '19:00:00', 'Gedung Kesenian', 'UKM Seni Budaya', '081234567890'),
(2, 6, 'Webinar Karir di Era Digital', 'Diskusi tentang peluang karir di bidang teknologi dan digital dengan narasumber dari perusahaan ternama.', '2024-02-28', '14:00:00', 'Zoom Meeting', 'Career Center STIS', '081234567891'),
(3, 7, 'Workshop Design Thinking', 'Pelatihan metodologi design thinking untuk mengembangkan inovasi dan kreativitas dalam memecahkan masalah.', '2024-03-05', '10:00:00', 'Ruang Seminar', 'Innovation Hub', '081234567892');

-- Sample activity logs
INSERT INTO activity_logs (user_id, action, table_name, record_id, description) VALUES
(1, 'CREATE', 'lost_found_items', 1, 'Membuat laporan barang hilang: Laptop ASUS ROG'),
(2, 'CREATE', 'lost_found_items', 2, 'Membuat laporan barang ditemukan: Jam Tangan Casio'),
(1, 'CREATE', 'activities', 1, 'Membuat kegiatan: Seminar Data Science untuk Pemula'),
(3, 'UPDATE', 'lost_found_items', 1, 'Mengubah status laporan menjadi selesai'),
(2, 'CREATE', 'activities', 2, 'Membuat kegiatan: Workshop Python Programming');
