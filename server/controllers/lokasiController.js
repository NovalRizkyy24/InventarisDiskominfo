const pool = require('../config/db');

/**
 * @desc    Get all lokasi
 * @route   GET /api/lokasi
 * @access  Private
 */
const getAllLokasi = async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT * FROM lokasi ORDER BY id ASC');
        res.json(rows);
    } catch (error) {
        console.error('Error saat mengambil data lokasi:', error);
        res.status(500).json({ message: 'Terjadi kesalahan pada server' });
    }
};

/**
 * @desc    Get single lokasi by ID
 * @route   GET /api/lokasi/:id
 * @access  Private
 */
const getLokasiById = async (req, res) => {
    const { id } = req.params;
    try {
        const { rows } = await pool.query('SELECT * FROM lokasi WHERE id = $1', [id]);
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Lokasi tidak ditemukan' });
        }
        res.json(rows[0]);
    } catch (error) {
        console.error('Error saat mengambil data lokasi by ID:', error);
        res.status(500).json({ message: 'Terjadi kesalahan pada server' });
    }
};

/**
 * @desc    Create a new lokasi
 * @route   POST /api/lokasi
 * @access  Private
 */
const createLokasi = async (req, res) => {
    const { nama_lokasi, provinsi, kab_kota, kecamatan, kelurahan_desa, deskripsi } = req.body;
    if (!nama_lokasi) {
        return res.status(400).json({ message: 'Nama lokasi harus diisi.' });
    }
    try {
        const { rows } = await pool.query(
            'INSERT INTO lokasi (nama_lokasi, provinsi, kab_kota, kecamatan, kelurahan_desa, deskripsi) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [nama_lokasi.trim(), provinsi, kab_kota, kecamatan, kelurahan_desa, deskripsi]
        );
        res.status(201).json({ message: 'Lokasi berhasil dibuat', lokasi: rows[0] });
    } catch (error) {
        console.error('Error saat membuat lokasi:', error);
        res.status(500).json({ message: 'Terjadi kesalahan pada server' });
    }
};

/**
 * @desc    Update a lokasi
 * @route   PUT /api/lokasi/:id
 * @access  Private
 */
const updateLokasi = async (req, res) => {
    const { id } = req.params;
    const { nama_lokasi, provinsi, kab_kota, kecamatan, kelurahan_desa, deskripsi } = req.body;
    try {
        const { rows, rowCount } = await pool.query(
            'UPDATE lokasi SET nama_lokasi = $1, provinsi = $2, kab_kota = $3, kecamatan = $4, kelurahan_desa = $5, deskripsi = $6 WHERE id = $7 RETURNING *',
            [nama_lokasi.trim(), provinsi, kab_kota, kecamatan, kelurahan_desa, deskripsi, id]
        );
        if (rowCount === 0) {
            return res.status(404).json({ message: 'Lokasi tidak ditemukan' });
        }
        res.json({ message: 'Lokasi berhasil diperbarui', lokasi: rows[0] });
    } catch (error) {
        console.error('Error saat memperbarui lokasi:', error);
        res.status(500).json({ message: 'Terjadi kesalahan pada server' });
    }
};

/**
 * @desc    Delete a lokasi
 * @route   DELETE /api/lokasi/:id
 * @access  Private
 */
const deleteLokasi = async (req, res) => {
    const { id } = req.params;
    try {
        const { rowCount } = await pool.query('DELETE FROM lokasi WHERE id = $1', [id]);
        if (rowCount === 0) {
            return res.status(404).json({ message: 'Lokasi tidak ditemukan' });
        }
        res.json({ message: 'Lokasi berhasil dihapus' });
    } catch (error) {
        console.error('Error saat menghapus lokasi:', error);
        res.status(500).json({ message: 'Terjadi kesalahan pada server' });
    }
};

module.exports = {
    getAllLokasi,
    getLokasiById,
    createLokasi,
    updateLokasi,
    deleteLokasi,
};