const pool = require('../config/db');

// @desc    Get all barang with role-based visibility
// @route   GET /api/barang
// @access  Private
const getAllBarang = async (req, res) => {
  const userRole = req.user.role; // Ambil role dari token JWT

  try {
    let queryText = 'SELECT b.*, k.nama_kategori, l.nama_lokasi, u.nama as pemegang_barang FROM barang b LEFT JOIN kategori_barang k ON b.kategori_id = k.id LEFT JOIN lokasi l ON b.lokasi_id = l.id LEFT JOIN users u ON b.pemegang_barang_id = u.id';

    // Logika bisnis: Hanya peran tertentu yang bisa melihat barang 'Tidak Aktif'
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
    const { rows } = await pool.query('SELECT * FROM barang WHERE id = $1', [id]);
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
        tanggal_perolehan, nilai_perolehan, sumber_dana, status 
    } = req.body;

    if (!nama_barang || !kode_barang || !tanggal_perolehan || !nilai_perolehan) {
        return res.status(400).json({ message: 'Field yang wajib diisi tidak boleh kosong.' });
    }

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
            tanggal_perolehan, nilai_perolehan, sumber_dana, status || 'Tersedia'
        ];
        const { rows } = await pool.query(query, values);
        res.status(201).json({ message: 'Barang baru berhasil ditambahkan', barang: rows[0] });
    } catch (error) {
        console.error('Error saat membuat barang:', error);
        if (error.code === '23505') { // Unique violation
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

module.exports = {
  getAllBarang,
  getBarangById,
  createBarang,
  updateBarang,
  deleteBarang,
};