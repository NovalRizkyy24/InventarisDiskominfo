const pool = require('../config/db');
const qrcode = require('qrcode');

// @desc    Get all barang with role-based visibility
// @route   GET /api/barang
// @access  Private
const getAllBarang = async (req, res) => {
  const userRole = req.user.role; 

  try {
    let queryText = `
      SELECT 
        b.id, 
        b.nama_barang, 
        b.kode_barang, 
        b.merk, 
        b.tipe,
        b.status,
        k.nama_kategori, 
        l.nama_lokasi, 
        u.nama as pemegang_barang 
      FROM barang b 
      LEFT JOIN kategori_barang k ON b.kategori_id = k.id 
      LEFT JOIN lokasi l ON b.lokasi_id = l.id 
      LEFT JOIN users u ON b.pemegang_barang_id = u.id
    `;

    const allowedRoles = ['Admin', 'Pengurus Barang', 'Penata Usaha Barang', 'Kepala Dinas'];
    if (!allowedRoles.includes(userRole)) {
      queryText += " WHERE b.status <> 'Tidak Aktif'";
    }
    
    queryText += ' ORDER BY b.id ASC';

    const { rows } = await pool.query(queryText);
    res.json(rows);
  } catch (error) {
    console.error('Error saat mengambil data barang:', error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server' });
  }
};

// @desc    Get single barang by ID
// @route   GET /api/barang/:id
// @access  Private
const getBarangById = async (req, res) => {
  const { id } = req.params;
  try {
    const query = `
      SELECT 
        b.*, 
        k.nama_kategori, 
        l.nama_lokasi, l.provinsi, l.kab_kota, l.kecamatan, l.kelurahan_desa, l.deskripsi,
        u.nama as pemegang_barang 
      FROM barang b 
      LEFT JOIN kategori_barang k ON b.kategori_id = k.id 
      LEFT JOIN lokasi l ON b.lokasi_id = l.id 
      LEFT JOIN users u ON b.pemegang_barang_id = u.id
      WHERE b.id = $1
    `;

    const { rows } = await pool.query(query, [id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Barang tidak ditemukan' });
    }
    res.json(rows[0]);
  } catch (error) {
    console.error('Error saat mengambil data barang:', error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server' });
  }
};


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

    const initialStatus = userRole === 'Admin' ? 'Tersedia' : 'Menunggu Validasi';
    const successMessage = userRole === 'Admin' 
        ? 'Barang baru berhasil ditambahkan.' 
        : 'Barang baru berhasil ditambahkan dan menunggu validasi.';

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
        console.error('Error saat membuat barang:', error);
        if (error.code === '23505') { 
            return res.status(409).json({ message: `Kode barang '${kode_barang}' sudah ada.` });
        }
        res.status(500).json({ message: 'Terjadi kesalahan pada server' });
    }
};



// @desc    Update a barang
// @route   PUT /api/barang/:id
// @access  Private
const updateBarang = async (req, res) => {
    const { id } = req.params;
    const {
        nama_barang, kode_barang, kategori_id, lokasi_id, merk, tipe, spesifikasi,
        tanggal_perolehan, nilai_perolehan, sumber_dana, status, pemegang_barang_id
    } = req.body;

    try {
        const query = `
            UPDATE barang SET 
                nama_barang = $1, kode_barang = $2, kategori_id = $3, lokasi_id = $4, merk = $5, 
                tipe = $6, spesifikasi = $7, tanggal_perolehan = $8, nilai_perolehan = $9, 
                sumber_dana = $10, status = $11, pemegang_barang_id = $12, updated_at = now()
            WHERE id = $13 RETURNING *;
        `;
        const values = [
            nama_barang, kode_barang, kategori_id, lokasi_id, merk, tipe, spesifikasi,
            tanggal_perolehan, nilai_perolehan, sumber_dana, status, pemegang_barang_id, id
        ];

        const { rows, rowCount } = await pool.query(query, values);
        if (rowCount === 0) {
            return res.status(404).json({ message: 'Barang tidak ditemukan' });
        }
        res.json({ message: 'Data barang berhasil diperbarui', barang: rows[0] });
    } catch (error) {
        console.error('Error saat memperbarui barang:', error);
        if (error.code === '23505') {
            return res.status(409).json({ message: `Kode barang '${kode_barang}' sudah digunakan.` });
        }
        res.status(500).json({ message: 'Terjadi kesalahan pada server' });
    }
};


// @desc    Delete a barang (Hard Delete)
// @route   DELETE /api/barang/:id
// @access  Private (Hanya Admin)
const deleteBarang = async (req, res) => {
  const { id } = req.params;
  try {
    const { rowCount } = await pool.query('DELETE FROM barang WHERE id = $1', [id]);
    if (rowCount === 0) {
      return res.status(404).json({ message: 'Barang tidak ditemukan' });
    }
    res.json({ message: 'Barang berhasil dihapus secara permanen' });
  } catch (error) {
    console.error('Error saat menghapus barang:', error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server' });
  }
};

const validateBarang = async (req, res) => {
    const { id } = req.params;
    const { disetujui, catatan } = req.body; 
    const user_validator_id = req.user.id;

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const currentBarang = await client.query('SELECT status FROM barang WHERE id = $1', [id]);
        if (currentBarang.rows.length === 0) {
            return res.status(404).json({ message: 'Barang tidak ditemukan' });
        }
        const status_sebelum = currentBarang.rows[0].status;

        if (status_sebelum !== 'Menunggu Validasi') {
            return res.status(400).json({ message: 'Barang ini tidak dalam status menunggu validasi.' });
        }

        const status_sesudah = disetujui ? 'Tersedia' : 'Ditolak'; 

        await client.query("UPDATE barang SET status = $1 WHERE id = $2", [status_sesudah, id]);
        
        const logQuery = `
            INSERT INTO log_validasi (barang_id, user_validator_id, status_sebelum, status_sesudah, catatan)
            VALUES ($1, $2, $3, $4, $5);
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
    const { id } = req.params;
    try {
        const barangUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/public/barang/${id}`;
        //const barangUrl = `${process.env.FRONTEND_URL || 'http://192.168.1.6:5173'}/public/barang/${id}`;

        const qrCodeDataUrl = await qrcode.toDataURL(barangUrl);

        const { rows, rowCount } = await pool.query(
            'UPDATE barang SET qr_code_url = $1 WHERE id = $2 RETURNING qr_code_url',
            [qrCodeDataUrl, id]
        );

        if (rowCount === 0) {
            return res.status(404).json({ message: 'Barang tidak ditemukan' });
        }

        res.json({ 
            message: 'QR Code berhasil dibuat ulang.',
            qr_code_url: rows[0].qr_code_url 
        });

    } catch (error) {
        console.error('Error saat membuat ulang QR code:', error);
        res.status(500).json({ message: 'Terjadi kesalahan pada server' });
    }
};

/**
 * @desc    Get validation logs for a specific barang
 * @route   GET /api/barang/:id/logs
 * @access  Private
 */
const getBarangLogs = async (req, res) => {
    const { id: barangId } = req.params;
    try {
        const query = `
            SELECT 
                log.waktu_validasi,
                log.status_sebelum,
                log.status_sesudah,
                log.catatan,
                u.nama AS nama_validator
            FROM log_validasi log
            JOIN users u ON log.user_validator_id = u.id
            WHERE log.barang_id = $1
            ORDER BY log.waktu_validasi ASC;
        `;
        const { rows } = await pool.query(query, [barangId]);
        res.json(rows);
    } catch (error) {
        console.error('Error saat mengambil log validasi barang:', error);
        res.status(500).json({ message: 'Terjadi kesalahan pada server' });
    }
};

const uploadFotoBarang = async (req, res) => {
    const { id } = req.params;
    
    if (!req.file) {
        return res.status(400).json({ message: 'Tidak ada file yang diunggah.' });
    }

    const fotoUrl = req.file.path.replace(/\\/g, "/");

    try {
        const result = await pool.query(
            'UPDATE barang SET foto_url = $1 WHERE id = $2 RETURNING foto_url',
            [fotoUrl, id]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Barang tidak ditemukan.' });
        }

        res.json({ 
            message: 'Foto berhasil diunggah.', 
            foto_url: result.rows[0].foto_url 
        });
    } catch (error) {
        console.error('Error saat unggah foto:', error);
        res.status(500).json({ message: 'Terjadi kesalahan pada server.' });
    }
};


module.exports = {
  getAllBarang,
  getBarangById,
  createBarang,
  updateBarang,
  deleteBarang,
  validateBarang,
  regenerateQrCode,
  getBarangLogs,
  uploadFotoBarang
};