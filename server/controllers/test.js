// ... (kode di atas file)

// @desc    Create a new barang
// @route   POST /api/barang
// @access  Private (Hanya Admin atau Pengurus Barang)
const createBarang = async (req, res) => {
    const { 
        nama_barang, kode_barang, kategori_id, lokasi_id, merk, tipe, spesifikasi, 
        tanggal_perolehan, nilai_perolehan, sumber_dana
    } = req.body;
    
    const userRole = req.user.role;

    if (!nama_barang || !kode_barang || !tanggal_perolehan || !nilai_perolehan) {
        return res.status(400).json({ message: 'Field yang wajib diisi tidak boleh kosong.' });
    }

    // --- PERUBAHAN LOGIKA STATUS ---
    const initialStatus = userRole === 'Admin' ? 'Tersedia' : 'Menunggu Validasi';
    const successMessage = userRole === 'Admin' 
        ? 'Barang baru berhasil ditambahkan.' 
        : 'Barang baru berhasil ditambahkan dan menunggu validasi.';
    // --- AKHIR PERUBAHAN ---

    try {
        const query = `
            INSERT INTO barang (
                nama_barang, kode_barang, kategori_id, lokasi_id, merk, tipe, spesifikasi, 
                tanggal_perolehan, nilai_perolehan, sumber_dana, status
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            RETURNING *;
        `;
        const values = [
            nama_barang, kode_barang, kategori_id, lokasi_id, merk, tipe, spesifikasi,
            tanggal_perolehan, nilai_perolehan, sumber_dana, initialStatus
        ];
        
        const { rows } = await pool.query(query, values);
        res.status(201).json({ message: successMessage, barang: rows[0] });

    } catch (error) {
        // ... (error handling tetap sama)
    }
};

// ... (fungsi lainnya)

// --- FUNGSI BARU UNTUK VALIDASI ---
const validateBarang = async (req, res) => {
    const { id } = req.params;
    const { disetujui, catatan } = req.body; 
    const user_validator_id = req.user.id;

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const currentBarang = await client.query('SELECT status FROM barang WHERE id = $1 FOR UPDATE', [id]);
        if (currentBarang.rows.length === 0) {
            return res.status(404).json({ message: 'Barang tidak ditemukan' });
        }
        const status_sebelum = currentBarang.rows[0].status;

        if (status_sebelum !== 'Menunggu Validasi') {
            return res.status(400).json({ message: 'Barang ini tidak dalam status menunggu validasi.' });
        }

        const status_sesudah = disetujui ? 'Tersedia' : 'Ditolak'; 

        await client.query("UPDATE barang SET status = $1 WHERE id = $2", [status_sesudah, id]);
        
        // Catatan: Tipe data status_sebelum dan status_sesudah mungkin perlu di-cast jika log_validasi menggunakan ENUM yang berbeda
        const logQuery = `
            INSERT INTO log_validasi (barang_id, user_validator_id, status_sebelum, status_sesudah, catatan)
            VALUES ($1, $2, $3::text, $4::text, $5);
        `;
        await client.query(logQuery, [id, user_validator_id, status_sebelum, status_sesudah, catatan]);

        await client.query('COMMIT');
        res.json({ message: `Barang telah berhasil di-${disetujui ? 'validasi' : 'tolak'}.` });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error saat validasi barang:', error);
        res.status(500).json({ message: 'Terjadi kesalahan pada server' });
    } finally {
        client.release();
    }
};

const regenerateQrCode = async (req, res) => {
    // ... (kode regenerateQrCode tetap sama)
};

module.exports = {
  getAllBarang,
  getBarangById,
  createBarang,
  updateBarang,
  deleteBarang,
  validateBarang, // Ekspor fungsi baru
  regenerateQrCode,
};