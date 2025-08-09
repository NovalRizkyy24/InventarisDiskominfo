const pool = require('../config/db');

// @desc    Create a new penghapusan request
// @route   POST /api/penghapusan
// @access  Private
const createPenghapusan = async (req, res) => {
    const { barang_id, alasan_penghapusan } = req.body;
    const user_pengusul_id = req.user.id;

    if (!barang_id || !alasan_penghapusan) {
        return res.status(400).json({ message: 'Data penghapusan tidak lengkap.' });
    }

    try {
        const query = `
            INSERT INTO penghapusan (barang_id, user_pengusul_id, alasan_penghapusan)
            VALUES ($1, $2, $3) RETURNING *;
        `;
        const values = [barang_id, user_pengusul_id, alasan_penghapusan];
        const { rows } = await pool.query(query, values);
        res.status(201).json({ message: 'Usulan penghapusan berhasil dibuat.', penghapusan: rows[0] });
    } catch (error) {
        console.error('Error saat membuat usulan penghapusan:', error);
        res.status(500).json({ message: 'Terjadi kesalahan pada server' });
    }
};

// @desc    Get all penghapusan requests
// @route   GET /api/penghapusan
// @access  Private
const getAllPenghapusan = async (req, res) => {
    try {
        const query = `
            SELECT pn.*, b.nama_barang, b.kode_barang, u.nama as nama_pengusul
            FROM penghapusan pn
            JOIN barang b ON pn.barang_id = b.id
            JOIN users u ON pn.user_pengusul_id = u.id
            ORDER BY pn.tanggal_pengajuan DESC;
        `;
        const { rows } = await pool.query(query);
        res.json(rows);
    } catch (error) {
        console.error('Error mengambil data penghapusan:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Update status of a penghapusan request
// @route   PUT /api/penghapusan/:id/status
// @access  Private
const updateStatusPenghapusan = async (req, res) => {
    const { id } = req.params;
    const { status_baru, catatan } = req.body;
    const user_validator_id = req.user.id;
    const finalCatatan = catatan || null;

    const validStatuses = ['Divalidasi Pengurus Barang', 'Divalidasi Penatausahaan', 'Disetujui Kepala Dinas', 'Ditolak'];
    if (!validStatuses.includes(status_baru)) {
        return res.status(400).json({ message: 'Status baru tidak valid.' });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const currentData = await client.query('SELECT status, barang_id FROM penghapusan WHERE id = $1', [id]);
        if (currentData.rows.length === 0) throw new Error('NotFound');
        const { status: status_sebelum, barang_id } = currentData.rows[0];

        // FIX: Tambahkan ::status_transaksi untuk casting tipe data
        const updateQuery = `
            UPDATE penghapusan 
            SET status = $1::status_transaksi, 
                catatan_penolakan = CASE WHEN $1::status_transaksi = 'Ditolak' THEN $2 ELSE catatan_penolakan END
            WHERE id = $3;
        `;
        await client.query(updateQuery, [status_baru, finalCatatan, id]);
        
        if (status_baru === 'Disetujui Kepala Dinas') {
            await client.query("UPDATE barang SET status = 'Tidak Aktif' WHERE id = $1", [barang_id]);
        }

        // FIX: Lakukan casting tipe data di sini juga
        const logQuery = `
            INSERT INTO log_validasi (penghapusan_id, user_validator_id, status_sebelum, status_sesudah, catatan)
            VALUES ($1, $2, $3::status_transaksi, $4::status_transaksi, $5);
        `;
        await client.query(logQuery, [id, user_validator_id, status_sebelum, status_baru, finalCatatan]);

        await client.query('COMMIT');
        res.json({ message: `Status penghapusan berhasil diubah.` });

    } catch (error) {
        await client.query('ROLLBACK');
        if (error.message === 'NotFound') return res.status(404).json({ message: 'Usulan penghapusan tidak ditemukan.' });
        console.error('DATABASE ERROR:', error);
        res.status(500).json({ message: 'Terjadi kesalahan pada server' });
    } finally {
        client.release();
    }
};

const getPenghapusanById = async (req, res) => {
    const { id } = req.params;
    try {
        const query = `
            SELECT pn.*, b.nama_barang, b.kode_barang, u.nama as nama_pengusul
            FROM penghapusan pn
            JOIN barang b ON pn.barang_id = b.id
            JOIN users u ON pn.user_pengusul_id = u.id
            WHERE pn.id = $1;
        `;
        const { rows } = await pool.query(query, [id]);
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Usulan penghapusan tidak ditemukan' });
        }
        res.json(rows[0]);
    } catch (error) {
        console.error('Error mengambil detail penghapusan:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = {
    createPenghapusan,
    getAllPenghapusan,
    updateStatusPenghapusan,
    getPenghapusanById, 
};