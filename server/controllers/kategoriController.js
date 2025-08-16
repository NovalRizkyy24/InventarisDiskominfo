const pool = require('../config/db');

// @desc    Get all kategori
// @route   GET /api/kategori
// @access  Private
const getAllKategori = async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM kategori_barang ORDER BY id ASC');
    res.json(rows);
  } catch (error) {
    console.error('Error saat mengambil data kategori:', error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server' });
  }
};

// @desc    Get single kategori by ID
// @route   GET /api/kategori/:id
// @access  Private
const getKategoriById = async (req, res) => {
  const { id } = req.params;
  try {
    const { rows } = await pool.query('SELECT * FROM kategori_barang WHERE id = $1', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Kategori tidak ditemukan' });
    }
    res.json(rows[0]);
  } catch (error) {
    console.error('Error saat mengambil data kategori:', error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server' });
  }
};

// @desc    Create a new kategori
// @route   POST /api/kategori
// @access  Private (Admin)
const createKategori = async (req, res) => {
  const { nama_kategori, kode_kategori } = req.body;
  if (!nama_kategori || !kode_kategori) {
    return res.status(400).json({ message: 'Nama dan kode kategori harus diisi.' });
  }
  try {
    const { rows } = await pool.query(
      'INSERT INTO kategori_barang (nama_kategori, kode_kategori) VALUES ($1, $2) RETURNING *',
      [nama_kategori, kode_kategori]
    );
    res.status(201).json({ message: 'Kategori berhasil dibuat', kategori: rows[0] });
  } catch (error) {
    console.error('Error saat membuat kategori:', error);
    if (error.code === '23505') {
      return res.status(409).json({ message: 'Nama atau kode kategori sudah ada.' });
    }
    res.status(500).json({ message: 'Terjadi kesalahan pada server' });
  }
};

// @desc    Update a kategori
// @route   PUT /api/kategori/:id
// @access  Private (Admin)
const updateKategori = async (req, res) => {
  const { id } = req.params;
  const { nama_kategori, kode_kategori } = req.body;
  try {
    const { rows, rowCount } = await pool.query(
      'UPDATE kategori_barang SET nama_kategori = $1, kode_kategori = $2 WHERE id = $3 RETURNING *',
      [nama_kategori, kode_kategori, id]
    );
    if (rowCount === 0) {
      return res.status(404).json({ message: 'Kategori tidak ditemukan' });
    }
    res.json({ message: 'Kategori berhasil diperbarui', kategori: rows[0] });
  } catch (error) {
    console.error('Error saat memperbarui kategori:', error);
    if (error.code === '23505') {
      return res.status(409).json({ message: 'Nama atau kode kategori sudah digunakan.' });
    }
    res.status(500).json({ message: 'Terjadi kesalahan pada server' });
  }
};

// @desc    Delete a kategori
// @route   DELETE /api/kategori/:id
// @access  Private (Admin)
const deleteKategori = async (req, res) => {
  const { id } = req.params;
  try {
    const { rowCount } = await pool.query('DELETE FROM kategori_barang WHERE id = $1', [id]);
    if (rowCount === 0) {
      return res.status(404).json({ message: 'Kategori tidak ditemukan' });
    }
    res.json({ message: 'Kategori berhasil dihapus' });
  } catch (error) {
    console.error('Error saat menghapus kategori:', error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server' });
  }
};

module.exports = {
  getAllKategori,
  getKategoriById,
  createKategori,
  updateKategori,
  deleteKategori,
};