const pool = require('../config/db');

/**
 * @desc    Get Admin Dashboard Summary
 * @route   GET /api/dashboard/admin-summary
 * @access  Private (Admin)
 */
const getAdminDashboardSummary = async (req, res) => {
    try {
        const totalUsersResult = await pool.query('SELECT COUNT(*) FROM users');
        const totalUsers = parseInt(totalUsersResult.rows[0].count, 10);
        const totalBarangResult = await pool.query("SELECT COUNT(*) FROM barang WHERE status NOT IN ('Tidak Aktif', 'Ditolak')");
        const totalBarang = parseInt(totalBarangResult.rows[0].count, 10);
        const barangDipinjamResult = await pool.query("SELECT COUNT(*) FROM barang WHERE status = 'Dipinjam'");
        const barangDipinjam = parseInt(barangDipinjamResult.rows[0].count, 10);
        const totalAsetResult = await pool.query("SELECT SUM(nilai_perolehan) FROM barang WHERE status NOT IN ('Tidak Aktif', 'Ditolak')");
        const totalAsetValue = parseFloat(totalAsetResult.rows[0].sum) || 0;
        const kategoriResult = await pool.query(`
            SELECT k.nama_kategori, COUNT(b.id) as jumlah
            FROM barang b
            JOIN kategori_barang k ON b.kategori_id = k.id
            WHERE b.status NOT IN ('Tidak Aktif', 'Ditolak')
            GROUP BY k.nama_kategori
            ORDER BY jumlah DESC;
        `);
        const komposisiKategori = kategoriResult.rows;
        const statusResult = await pool.query(`
            SELECT status, COUNT(id) as jumlah
            FROM barang
            WHERE status NOT IN ('Tidak Aktif', 'Ditolak')
            GROUP BY status
            ORDER BY status;
        `);
        const komposisiStatus = statusResult.rows;
        
        const aktivitasResult = await pool.query(`
            SELECT p.tanggal_pengajuan, u.nama as nama_peminjam, b.nama_barang
            FROM peminjaman p
            JOIN users u ON p.user_peminjam_id = u.id
            JOIN peminjaman_detail pd ON p.id = pd.peminjaman_id
            JOIN barang b ON pd.barang_id = b.id
            ORDER BY p.tanggal_pengajuan DESC, p.id DESC
            LIMIT 5;
        `);
        const aktivitasTerbaru = aktivitasResult.rows;

        res.json({
            totalUsers,
            totalBarang,
            barangDipinjam,
            totalAsetValue,
            komposisiKategori,
            komposisiStatus,
            aktivitasTerbaru
        });
    } catch (error) {
        console.error('Error saat mengambil ringkasan dashboard admin:', error);
        res.status(500).json({ message: 'Terjadi kesalahan pada server' });
    }
};

/**
 * @desc    Get Pengurus Barang Dashboard Summary
 * @route   GET /api/dashboard/pengurus-barang-summary
 * @access  Private (Pengurus Barang)
 */
const getPengurusBarangDashboardSummary = async (req, res) => {
    try {
        const peminjamanResult = await pool.query("SELECT COUNT(*) FROM peminjaman WHERE status = 'Diajukan'");
        const validasiPeminjaman = parseInt(peminjamanResult.rows[0].count, 10);
        const penghapusanResult = await pool.query("SELECT COUNT(*) FROM penghapusan WHERE status = 'Diajukan'");
        const validasiPenghapusan = parseInt(penghapusanResult.rows[0].count, 10);
        const barangResult = await pool.query("SELECT COUNT(*) FROM barang WHERE status = 'Menunggu Validasi'");
        const validasiBarang = parseInt(barangResult.rows[0].count, 10);
        const tugasQuery = `
            SELECT id, 'Peminjaman' as jenis, nomor_usulan as nomor, tanggal_pengajuan as tanggal FROM peminjaman WHERE status = 'Diajukan'
            UNION ALL
            SELECT id, 'Penghapusan' as jenis, nomor_usulan as nomor, tanggal_pengajuan as tanggal FROM penghapusan WHERE status = 'Diajukan'
            ORDER BY tanggal DESC
            LIMIT 5;
        `;
        const tugasResult = await pool.query(tugasQuery);
        const daftarTugas = tugasResult.rows;
        
        const totalBarangResult = await pool.query("SELECT COUNT(*) FROM barang WHERE status NOT IN ('Tidak Aktif', 'Ditolak')");
        const totalBarang = parseInt(totalBarangResult.rows[0].count, 10);
        const totalAsetResult = await pool.query("SELECT SUM(nilai_perolehan) FROM barang WHERE status NOT IN ('Tidak Aktif', 'Ditolak')");
        const totalAsetValue = parseFloat(totalAsetResult.rows[0].sum) || 0;

        res.json({
            validasiPeminjaman,
            validasiPenghapusan,
            validasiBarang,
            daftarTugas,
            totalBarang,
            totalAsetValue
        });

    } catch (error) {
        console.error('Error saat mengambil ringkasan dashboard Pengurus Barang:', error);
        res.status(500).json({ message: 'Terjadi kesalahan pada server' });
    }
};

/**
 * @desc    Get Penata Usaha Barang Dashboard Summary
 * @route   GET /api/dashboard/penata-usaha-summary
 * @access  Private (Penata Usaha Barang)
 */
const getPenataUsahaDashboardSummary = async (req, res) => {
    try {
        const barangResult = await pool.query("SELECT COUNT(*) FROM barang WHERE status = 'Menunggu Validasi'");
        const validasiBarang = parseInt(barangResult.rows[0].count, 10);
        const peminjamanResult = await pool.query("SELECT COUNT(*) FROM peminjaman WHERE status = 'Divalidasi Pengurus Barang'");
        const validasiPeminjaman = parseInt(peminjamanResult.rows[0].count, 10);
        const pengadaanResult = await pool.query("SELECT COUNT(*) FROM rencana_pengadaan WHERE status = 'Diajukan'");
        const validasiPengadaan = parseInt(pengadaanResult.rows[0].count, 10);
        const tugasQuery = `
            (SELECT id, 'Barang Baru' as jenis, nama_barang as nomor, created_at as tanggal FROM barang WHERE status = 'Menunggu Validasi' ORDER BY created_at DESC LIMIT 5)
            UNION ALL
            (SELECT id, 'Peminjaman' as jenis, nomor_usulan as nomor, tanggal_pengajuan as tanggal FROM peminjaman WHERE status = 'Divalidasi Pengurus Barang' ORDER BY tanggal_pengajuan DESC LIMIT 5)
            UNION ALL
            (SELECT id, 'Pengadaan' as jenis, nomor_usulan as nomor, tanggal_usulan as tanggal FROM rencana_pengadaan WHERE status = 'Diajukan' ORDER BY tanggal_usulan DESC LIMIT 5)
            ORDER BY tanggal DESC
            LIMIT 5;
        `;
        const tugasResult = await pool.query(tugasQuery);
        const daftarTugas = tugasResult.rows;

        const totalBarangResult = await pool.query("SELECT COUNT(*) FROM barang WHERE status NOT IN ('Tidak Aktif', 'Ditolak')");
        const totalBarang = parseInt(totalBarangResult.rows[0].count, 10);
        const totalAsetResult = await pool.query("SELECT SUM(nilai_perolehan) FROM barang WHERE status NOT IN ('Tidak Aktif', 'Ditolak')");
        const totalAsetValue = parseFloat(totalAsetResult.rows[0].sum) || 0;

        res.json({
            validasiBarang,
            validasiPeminjaman,
            validasiPengadaan,
            daftarTugas,
            totalBarang,
            totalAsetValue
        });

    } catch (error) {
        console.error('Error saat mengambil ringkasan dashboard Penata Usaha Barang:', error);
        res.status(500).json({ message: 'Terjadi kesalahan pada server' });
    }
};

/**
 * @desc    Get PPK Dashboard Summary
 * @route   GET /api/dashboard/ppk-summary
 * @access  Private (PPK)
 */
const getPpkDashboardSummary = async (req, res) => {
    const userId = req.user.id;
    try {
        const pengadaanResult = await pool.query('SELECT COUNT(*) FROM rencana_pengadaan WHERE user_pengusul_id = $1', [userId]);
        const totalPengadaan = parseInt(pengadaanResult.rows[0].count, 10);
        const peminjamanResult = await pool.query('SELECT COUNT(*) FROM peminjaman WHERE user_peminjam_id = $1', [userId]);
        const totalPeminjaman = parseInt(peminjamanResult.rows[0].count, 10);
        const prosesPengadaan = await pool.query("SELECT COUNT(*) FROM rencana_pengadaan WHERE user_pengusul_id = $1 AND status NOT IN ('Selesai', 'Ditolak')", [userId]);
        const prosesPeminjaman = await pool.query("SELECT COUNT(*) FROM peminjaman WHERE user_peminjam_id = $1 AND status NOT IN ('Selesai', 'Ditolak')", [userId]);
        const prosesPenghapusan = await pool.query("SELECT COUNT(*) FROM penghapusan WHERE user_pengusul_id = $1 AND status NOT IN ('Selesai', 'Ditolak')", [userId]);
        const usulanDiproses = parseInt(prosesPengadaan.rows[0].count, 10) + parseInt(prosesPeminjaman.rows[0].count, 10) + parseInt(prosesPenghapusan.rows[0].count, 10);
        const usulanQuery = `
            (SELECT id, 'Pengadaan' as jenis, nomor_usulan as nomor, tanggal_usulan as tanggal, status FROM rencana_pengadaan WHERE user_pengusul_id = $1 ORDER BY tanggal_usulan DESC LIMIT 3)
            UNION ALL
            (SELECT id, 'Peminjaman' as jenis, nomor_usulan as nomor, tanggal_pengajuan as tanggal, status FROM peminjaman WHERE user_peminjam_id = $1 ORDER BY tanggal_pengajuan DESC LIMIT 3)
            UNION ALL
            (SELECT id, 'Penghapusan' as jenis, nomor_usulan as nomor, tanggal_pengajuan as tanggal, status FROM penghapusan WHERE user_pengusul_id = $1 ORDER BY tanggal_pengajuan DESC LIMIT 3)
            ORDER BY tanggal DESC
            LIMIT 5;
        `;
        const usulanResult = await pool.query(usulanQuery, [userId]);
        const usulanTerbaru = usulanResult.rows;
        
        const totalBarangResult = await pool.query("SELECT COUNT(*) FROM barang WHERE status = 'Tersedia'");
        const totalBarang = parseInt(totalBarangResult.rows[0].count, 10);
        const totalAsetResult = await pool.query("SELECT SUM(nilai_perolehan) FROM barang WHERE status NOT IN ('Tidak Aktif', 'Ditolak')");
        const totalAsetValue = parseFloat(totalAsetResult.rows[0].sum) || 0;

        res.json({
            totalPengadaan,
            totalPeminjaman,
            usulanDiproses,
            usulanTerbaru,
            totalBarang,
            totalAsetValue
        });

    } catch (error) {
        console.error('Error saat mengambil ringkasan dashboard PPK:', error);
        res.status(500).json({ message: 'Terjadi kesalahan pada server' });
    }
};

/**
 * @desc    Get Kepala Dinas Dashboard Summary
 * @route   GET /api/dashboard/kepala-dinas-summary
 * @access  Private (Kepala Dinas)
 */
const getKepalaDinasDashboardSummary = async (req, res) => {
    try {
        const totalAsetResult = await pool.query("SELECT SUM(nilai_perolehan) FROM barang WHERE status NOT IN ('Tidak Aktif', 'Ditolak')");
        const totalAsetValue = parseFloat(totalAsetResult.rows[0].sum) || 0;
        const barangBaruResult = await pool.query("SELECT COUNT(*) FROM barang WHERE tanggal_perolehan >= date_trunc('month', CURRENT_DATE)");
        const barangBaruBulanIni = parseInt(barangBaruResult.rows[0].count, 10);
        const pengadaanResult = await pool.query("SELECT COUNT(*) FROM rencana_pengadaan WHERE status = 'Menunggu Persetujuan'");
        const persetujuanPengadaan = parseInt(pengadaanResult.rows[0].count, 10);
        const penghapusanResult = await pool.query("SELECT COUNT(*) FROM penghapusan WHERE status = 'Divalidasi Penatausahaan'");
        const persetujuanPenghapusan = parseInt(penghapusanResult.rows[0].count, 10);
        const persetujuanQuery = `
            (SELECT id, 'Pengadaan' as jenis, nomor_usulan as nomor, tanggal_usulan as tanggal, status FROM rencana_pengadaan WHERE status = 'Menunggu Persetujuan' ORDER BY tanggal_usulan DESC LIMIT 3)
            UNION ALL
            (SELECT id, 'Penghapusan' as jenis, nomor_usulan as nomor, tanggal_pengajuan as tanggal, status FROM penghapusan WHERE status = 'Divalidasi Penatausahaan' ORDER BY tanggal_pengajuan DESC LIMIT 3)
            ORDER BY tanggal DESC
            LIMIT 5;
        `;
        const persetujuanResult = await pool.query(persetujuanQuery);
        const daftarPersetujuan = persetujuanResult.rows;
        const totalBarangResult = await pool.query("SELECT COUNT(*) FROM barang WHERE status NOT IN ('Tidak Aktif', 'Ditolak')");
        const totalBarang = parseInt(totalBarangResult.rows[0].count, 10);
        const kategoriResult = await pool.query(`
            SELECT k.nama_kategori, COUNT(b.id) as jumlah
            FROM barang b
            JOIN kategori_barang k ON b.kategori_id = k.id
            WHERE b.status NOT IN ('Tidak Aktif', 'Ditolak')
            GROUP BY k.nama_kategori
            ORDER BY jumlah DESC;
        `);
        const komposisiKategori = kategoriResult.rows;
        const statusResult = await pool.query(`
            SELECT status, COUNT(id) as jumlah
            FROM barang
            WHERE status NOT IN ('Tidak Aktif', 'Ditolak')
            GROUP BY status
            ORDER BY status;
        `);
        const komposisiStatus = statusResult.rows;

        res.json({
            totalAsetValue,
            barangBaruBulanIni,
            persetujuanPengadaan,
            persetujuanPenghapusan,
            daftarPersetujuan,
            totalBarang,
            komposisiKategori,
            komposisiStatus
        });
    } catch (error) {
        console.error('Error saat mengambil ringkasan dashboard Kepala Dinas:', error);
        res.status(500).json({ message: 'Terjadi kesalahan pada server' });
    }
};

module.exports = {
    getAdminDashboardSummary,
    getPengurusBarangDashboardSummary,
    getPenataUsahaDashboardSummary,
    getPpkDashboardSummary,
    getKepalaDinasDashboardSummary,
};