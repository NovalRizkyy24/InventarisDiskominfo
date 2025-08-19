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

const getPeminjamanById = async (req, res) => {
    const { id } = req.params;
    try {
        const query = `
            SELECT p.*, b.nama_barang, b.kode_barang, u.nama as nama_peminjam
            FROM peminjaman p
            JOIN barang b ON p.barang_id = b.id
            JOIN users u ON p.user_peminjam_id = u.id
            WHERE p.id = $1;
        `;
        const { rows } = await pool.query(query, [id]);
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Data peminjaman tidak ditemukan' });
        }
        res.json(rows[0]);
    } catch (error) {
        console.error('Error mengambil detail peminjaman:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

/**
 * @desc    Get all peminjaman requests by the logged-in user
 * @route   GET /api/peminjaman/saya
 * @access  Private
 */
const getPeminjamanByPeminjam = async (req, res) => {
    const user_peminjam_id = req.user.id;
    try {
        const query = `
            SELECT 
                p.id,
                p.status,
                p.tanggal_mulai_pinjam,
                p.tanggal_rencana_kembali,
                b.nama_barang, 
                u.nama AS nama_peminjam
            FROM peminjaman p
            JOIN barang b ON p.barang_id = b.id
            JOIN users u ON p.user_peminjam_id = u.id
            WHERE p.user_peminjam_id = $1
            ORDER BY p.tanggal_pengajuan DESC;
        `;
        const { rows } = await pool.query(query, [user_peminjam_id]);
        res.json(rows);
    } catch (error) {
        // Baris ini akan menampilkan error detail di konsol server Anda
        console.error('Error detail saat mengambil data peminjaman:', error); 
        res.status(500).json({ message: 'Terjadi kesalahan pada server' });
    }
};

/**
 * @desc    Delete a peminjaman request by its creator
 * @route   DELETE /api/peminjaman/:id
 * @access  Private (Hanya peminjam)
 */
const deletePeminjaman = async (req, res) => {
    const { id: peminjamanId } = req.params;
    const { id: userId } = req.user; // Ambil ID pengguna dari token

    try {
        // 1. Ambil data peminjaman untuk verifikasi
        const peminjamanQuery = await pool.query(
            'SELECT user_peminjam_id, status FROM peminjaman WHERE id = $1',
            [peminjamanId]
        );

        if (peminjamanQuery.rows.length === 0) {
            return res.status(404).json({ message: 'Peminjaman tidak ditemukan.' });
        }

        const peminjaman = peminjamanQuery.rows[0];

        // 2. Verifikasi: Hanya peminjam yang bisa menghapus
        if (peminjaman.user_peminjam_id !== userId) {
            return res.status(403).json({ message: 'Anda tidak memiliki izin untuk menghapus pengajuan ini.' });
        }

        // 3. Verifikasi: Hanya bisa dihapus jika status masih 'Diajukan'
        if (peminjaman.status !== 'Diajukan') {
            return res.status(400).json({ message: 'Pengajuan yang sudah diproses tidak dapat dihapus.' });
        }

        // 4. Lakukan penghapusan
        await pool.query('DELETE FROM peminjaman WHERE id = $1', [peminjamanId]);

        res.json({ message: 'Pengajuan peminjaman berhasil dihapus.' });

    } catch (error) {
        console.error('Error saat menghapus peminjaman:', error);
        res.status(500).json({ message: 'Terjadi kesalahan pada server.' });
    }
};

module.exports = {
    createPeminjaman,
    getAllPeminjaman,
    updateStatusPeminjaman,
    getPeminjamanById, 
    getPeminjamanByPeminjam,
    deletePeminjaman,
};