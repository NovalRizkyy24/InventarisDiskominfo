const pool = require('../config/db');

// @desc    Create a new peminjaman request
// @route   POST /api/peminjaman
// @access  Private
const createPeminjaman = async (req, res) => {
    const { barang_id, tanggal_mulai_pinjam, tanggal_rencana_kembali, keperluan } = req.body;
    const user_peminjam_id = req.user.id;

    if (!barang_id || !tanggal_mulai_pinjam || !tanggal_rencana_kembali) {
        return res.status(400).json({ message: 'Data peminjaman tidak lengkap.' });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        
        // Cek status barang
        const barangStatus = await client.query('SELECT status FROM barang WHERE id = $1', [barang_id]);
        if (barangStatus.rows.length === 0 || barangStatus.rows[0].status !== 'Tersedia') {
            throw new Error('NotAvailable');
        }

        const query = `
            INSERT INTO peminjaman (barang_id, user_peminjam_id, tanggal_mulai_pinjam, tanggal_rencana_kembali, keperluan)
            VALUES ($1, $2, $3, $4, $5) RETURNING *;
        `;
        const values = [barang_id, user_peminjam_id, tanggal_mulai_pinjam, tanggal_rencana_kembali, keperluan];
        const { rows } = await client.query(query, values);

        await client.query('COMMIT');
        res.status(201).json({ message: 'Permintaan peminjaman berhasil dibuat.', peminjaman: rows[0] });

    } catch (error) {
        await client.query('ROLLBACK');
        if (error.message === 'NotAvailable') {
            return res.status(409).json({ message: 'Barang tidak tersedia untuk dipinjam saat ini.' });
        }
        console.error('Error saat membuat peminjaman:', error);
        res.status(500).json({ message: 'Terjadi kesalahan pada server' });
    } finally {
        client.release();
    }
};

// @desc    Get all peminjaman requests
// @route   GET /api/peminjaman
// @access  Private
const getAllPeminjaman = async (req, res) => {
    try {
        const query = `
            SELECT p.*, b.nama_barang, b.kode_barang, u.nama as nama_peminjam
            FROM peminjaman p
            JOIN barang b ON p.barang_id = b.id
            JOIN users u ON p.user_peminjam_id = u.id
            ORDER BY p.tanggal_pengajuan DESC;
        `;
        const { rows } = await pool.query(query);
        res.json(rows);
    } catch (error) {
        console.error('Error mengambil data peminjaman:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Update status of a peminjaman request
// @route   PUT /api/peminjaman/:id/status
// @access  Private
const updateStatusPeminjaman = async (req, res) => {
    const { id } = req.params;
    const { status_baru, catatan } = req.body;
    const user_validator_id = req.user.id;

    const validStatuses = ['Divalidasi Pengurus Barang', 'Selesai', 'Ditolak'];
    if (!validStatuses.includes(status_baru)) {
        return res.status(400).json({ message: 'Status baru tidak valid.' });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const currentData = await client.query('SELECT status, barang_id FROM peminjaman WHERE id = $1', [id]);
        if (currentData.rows.length === 0) throw new Error('NotFound');
        
        const { status: status_sebelum, barang_id } = currentData.rows[0];

        // Jika disetujui, ubah status barang menjadi 'Dipinjam'
        if (status_baru === 'Selesai' && status_sebelum === 'Divalidasi Pengurus Barang') {
             await client.query("UPDATE peminjaman SET tanggal_aktual_kembali = NOW(), status = 'Selesai' WHERE id = $1", [id]);
             await client.query("UPDATE barang SET status = 'Tersedia' WHERE id = $1", [barang_id]);
        } else if (status_baru === 'Divalidasi Pengurus Barang' && status_sebelum === 'Diajukan'){
             await client.query("UPDATE peminjaman SET status = 'Divalidasi Pengurus Barang' WHERE id = $1", [id]);
             await client.query("UPDATE barang SET status = 'Dipinjam' WHERE id = $1", [barang_id]);
        } else {
             await client.query("UPDATE peminjaman SET status = $1, catatan_penolakan = CASE WHEN $1 = 'Ditolak' THEN $2 ELSE catatan_penolakan END WHERE id = $3", [status_baru, catatan, id]);
        }

        const logQuery = `
            INSERT INTO log_validasi (peminjaman_id, user_validator_id, status_sebelum, status_sesudah, catatan)
            VALUES ($1, $2, $3, $4, $5);
        `;
        await client.query(logQuery, [id, user_validator_id, status_sebelum, status_baru, catatan]);

        await client.query('COMMIT');
        res.json({ message: `Status peminjaman berhasil diubah.` });

    } catch (error) {
        await client.query('ROLLBACK');
        if (error.message === 'NotFound') return res.status(404).json({ message: 'Peminjaman tidak ditemukan.' });
        console.error('Error saat update status peminjaman:', error);
        res.status(500).json({ message: 'Terjadi kesalahan pada server' });
    } finally {
        client.release();
    }
};

module.exports = {
    createPeminjaman,
    getAllPeminjaman,
    updateStatusPeminjaman
};