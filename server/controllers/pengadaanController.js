const pool = require('../config/db');

// @desc    Create a new pengadaan request
// @route   POST /api/pengadaan
// @access  Private
const createPengadaan = async (req, res) => {
    const { program, kegiatan, output, rekening_belanja, ppk_id, details } = req.body;
    const user_pengusul_id = req.user.id; 

    if (!program || !kegiatan || !output || !details || details.length === 0) {
        return res.status(400).json({ message: 'Data usulan tidak lengkap.' });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const usulanQuery = `
            INSERT INTO rencana_pengadaan (nomor_usulan, program, kegiatan, output, rekening_belanja, ppk_id, user_pengusul_id)
            VALUES (CONCAT('USL-', TO_CHAR(NOW(), 'YYYYMMDDHH24MISS')), $1, $2, $3, $4, $5, $6) RETURNING id;
        `;
        const usulanValues = [program, kegiatan, output, rekening_belanja, ppk_id, user_pengusul_id];
        const { rows } = await client.query(usulanQuery, usulanValues);
        const rencana_id = rows[0].id;

        for (const item of details) {
            const detailQuery = `
                INSERT INTO rencana_pengadaan_detail (rencana_id, nama_barang_usulan, jumlah, satuan, harga_satuan, spesifikasi_usulan)
                VALUES ($1, $2, $3, $4, $5, $6);
            `;
            const detailValues = [rencana_id, item.nama_barang_usulan, item.jumlah, item.satuan, item.harga_satuan, item.spesifikasi_usulan];
            await client.query(detailQuery, detailValues);
        }

        await client.query('COMMIT');
        res.status(201).json({ message: 'Usulan pengadaan berhasil dibuat.', id: rencana_id });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error saat membuat usulan pengadaan:', error);
        res.status(500).json({ message: 'Terjadi kesalahan pada server' });
    } finally {
        client.release();
    }
};

// @desc    Get all pengadaan requests
// @route   GET /api/pengadaan
// @access  Private
const getAllPengadaan = async (req, res) => {
    try {
        const query = `
            SELECT rp.*, u.nama as nama_pengusul, p.nama as nama_ppk 
            FROM rencana_pengadaan rp
            JOIN users u ON rp.user_pengusul_id = u.id
            LEFT JOIN users p ON rp.ppk_id = p.id
            ORDER BY rp.tanggal_usulan DESC;
        `;
        const { rows } = await pool.query(query);
        res.json(rows);
    } catch (error) {
        console.error('Error mengambil data pengadaan:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get pengadaan request by ID with details
// @route   GET /api/pengadaan/:id
// @access  Private
const getPengadaanById = async (req, res) => {
    const { id } = req.params;
    try {
        const pengadaanQuery = await pool.query('SELECT * FROM rencana_pengadaan WHERE id = $1', [id]);
        if (pengadaanQuery.rows.length === 0) {
            return res.status(404).json({ message: 'Usulan tidak ditemukan' });
        }

        const detailQuery = await pool.query('SELECT * FROM rencana_pengadaan_detail WHERE rencana_id = $1', [id]);
        
        const result = {
            ...pengadaanQuery.rows[0],
            details: detailQuery.rows
        };
        res.json(result);
    } catch (error) {
        console.error('Error mengambil detail pengadaan:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};


// @desc    Update status of a pengadaan request
// @route   PUT /api/pengadaan/:id/status
// @access  Private
const updateStatusPengadaan = async (req, res) => {
    const { id } = req.params;
    const { status_baru, catatan } = req.body;
    const user_validator_id = req.user.id;
    const finalCatatan = catatan || null;

    const validStatuses = [
        'Divalidasi Pengurus Barang', 'Divalidasi Penatausahaan',
        'Disetujui Kepala Dinas', 'Selesai', 'Ditolak'
    ];
    if (!validStatuses.includes(status_baru)) {
        return res.status(400).json({ message: 'Status baru tidak valid.' });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const currentData = await client.query('SELECT status FROM rencana_pengadaan WHERE id = $1', [id]);
        if (currentData.rows.length === 0) {
            throw new Error('NotFound');
        }
        const status_sebelum = currentData.rows[0].status;

        // FIX: Tambahkan ::status_transaksi untuk melakukan casting tipe data
        const updateQuery = `
            UPDATE rencana_pengadaan 
            SET status = $1::status_transaksi, 
                catatan_penolakan = CASE WHEN $1::status_transaksi = 'Ditolak' THEN $2 ELSE catatan_penolakan END 
            WHERE id = $3;
        `;
        await client.query(updateQuery, [status_baru, finalCatatan, id]);

        // FIX: Lakukan casting tipe data di sini juga
        const logQuery = `
            INSERT INTO log_validasi (rencana_pengadaan_id, user_validator_id, status_sebelum, status_sesudah, catatan)
            VALUES ($1, $2, $3::status_transaksi, $4::status_transaksi, $5);
        `;
        await client.query(logQuery, [id, user_validator_id, status_sebelum, status_baru, finalCatatan]);

        await client.query('COMMIT');
        res.json({ message: `Status usulan berhasil diubah menjadi "${status_baru}"` });

    } catch (error) {
        await client.query('ROLLBACK');
        if (error.message === 'NotFound') {
            return res.status(404).json({ message: 'Usulan tidak ditemukan.' });
        }
        console.error('DATABASE ERROR:', error);
        res.status(500).json({ message: 'Terjadi kesalahan pada server' });
    } finally {
        client.release();
    }
};

const getDetailForSurat = async (req, res) => {
    const { id } = req.params;
    try {
        const headerQuery = `
            SELECT rp.*, u_pengusul.nama AS nama_pengusul, u_ppk.nama AS nama_ppk
            FROM rencana_pengadaan rp
            JOIN users u_pengusul ON rp.user_pengusul_id = u_pengusul.id
            LEFT JOIN users u_ppk ON rp.ppk_id = u_ppk.id
            WHERE rp.id = $1;
        `;
        const headerResult = await pool.query(headerQuery, [id]);
        if (headerResult.rows.length === 0) {
            return res.status(404).json({ message: 'Data pengadaan tidak ditemukan.' });
        }
        const detailQuery = `SELECT * FROM rencana_pengadaan_detail WHERE rencana_id = $1 ORDER BY id ASC;`;
        const detailResult = await pool.query(detailQuery, [id]);
        const suratData = {
            ...headerResult.rows[0],
            details: detailResult.rows
        };
        res.json(suratData);
    } catch (error) {
        console.error('Error saat generate data surat:', error);
        res.status(500).json({ message: 'Terjadi kesalahan pada server' });
    }
};

module.exports = {
    createPengadaan,
    getAllPengadaan,
    getPengadaanById,
    updateStatusPengadaan,
    getDetailForSurat,
};