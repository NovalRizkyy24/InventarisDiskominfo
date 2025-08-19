const pool = require('../config/db');
const puppeteer = require('puppeteer');

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

        const updateQuery = `
            UPDATE rencana_pengadaan 
            SET status = $1::status_transaksi, 
                catatan_penolakan = CASE WHEN $1::status_transaksi = 'Ditolak' THEN $2 ELSE catatan_penolakan END 
            WHERE id = $3;
        `;
        await client.query(updateQuery, [status_baru, finalCatatan, id]);

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

const downloadSuratPengadaan = async (req, res) => {
    const { id } = req.params;
    try {
        // 1. Ambil data (tidak ada perubahan di bagian ini)
        const headerQuery = `
            SELECT rp.*, u_pengusul.nama AS nama_pengusul, u_ppk.nama AS nama_ppk
            FROM rencana_pengadaan rp
            JOIN users u_pengusul ON rp.user_pengusul_id = u_pengusul.id
            LEFT JOIN users u_ppk ON rp.ppk_id = u_ppk.id
            WHERE rp.id = $1;
        `;
        const headerResult = await pool.query(headerQuery, [id]);
        if (headerResult.rows.length === 0) {
            return res.status(404).json({ message: 'Data tidak ditemukan.' });
        }
        const data = headerResult.rows[0];

        const detailQuery = `SELECT * FROM rencana_pengadaan_detail WHERE rencana_id = $1 ORDER BY id ASC;`;
        const detailResult = await pool.query(detailQuery, [id]);
        data.details = detailResult.rows;

        // 2. Buat konten HTML untuk PDF (PERUBAHAN DI SINI)
        const itemRows = data.details.map((item, index) => {
            const total = item.jumlah * item.harga_satuan;
            return `
                <tr>
                    <td style="border: 1px solid black; padding: 8px; text-align: center;">${index + 1}</td>
                    <td style="border: 1px solid black; padding: 8px;">${item.nama_barang_usulan}</td>
                    <td style="border: 1px solid black; padding: 8px; text-align: center;">${item.jumlah} ${item.satuan}</td>
                    <td style="border: 1px solid black; padding: 8px; text-align: right;">Rp ${Number(item.harga_satuan).toLocaleString('id-ID')}</td>
                    <td style="border: 1px solid black; padding: 8px; text-align: right;">Rp ${total.toLocaleString('id-ID')}</td>
                </tr>
            `;
        }).join('');

        const htmlContent = `
            <html>
                <head>
                    <style>
                        body { font-family: 'Times New Roman', Times, serif; font-size: 12px; margin: 40px; }
                        table { width: 100%; border-collapse: collapse; }
                        .text-center { text-align: center; }
                        .text-right { text-align: right; }
                        .font-bold { font-weight: bold; }
                        .info-table { margin-bottom: 24px; }
                        .info-table td { padding: 2px 0; vertical-align: top; }
                    </style>
                </head>
                <body>
                    <div class="text-center" style="border-bottom: 2px solid black; padding-bottom: 8px; margin-bottom: 24px;">
                        <h3>PEMERINTAH KOTA BANDUNG</h3>
                        <h4>DINAS KOMUNIKASI DAN INFORMATIKA</h4>
                        <p style="font-size: 10px;">Jl. Wastukencana No.2, Babakan Ciamis, Bandung</p>
                    </div>
                    <p class="text-right">Bandung, ${new Date(data.tanggal_usulan).toLocaleDateString('id-ID', { dateStyle: 'long' })}</p>
                    <p>Nomor: ${data.nomor_usulan}</p>
                    <p>Perihal: Usulan Rencana Pengadaan Barang</p>
                    <br/>
                    
                    <table class="info-table">
                        <tr>
                            <td width="100px">Program</td>
                            <td width="10px">:</td>
                            <td>${data.program}</td>
                        </tr>
                        <tr>
                            <td>Kegiatan</td>
                            <td>:</td>
                            <td>${data.kegiatan}</td>
                        </tr>
                        <tr>
                            <td>Output</td>
                            <td>:</td>
                            <td>${data.output}</td>
                        </tr>
                    </table>

                    <p>Dengan rincian barang sebagai berikut:</p>
                    <br/>
                    <table>
                        <thead>
                            <tr>
                                <th style="border: 1px solid black; padding: 8px;">No</th>
                                <th style="border: 1px solid black; padding: 8px;">Nama Barang</th>
                                <th style="border: 1px solid black; padding: 8px;">Jumlah</th>
                                <th style="border: 1px solid black; padding: 8px;">Harga Satuan</th>
                                <th style="border: 1px solid black; padding: 8px;">Total</th>
                            </tr>
                        </thead>
                        <tbody>${itemRows}</tbody>
                    </table>
                </body>
            </html>
        `;

        // 3. Gunakan Puppeteer (tidak ada perubahan di bagian ini)
        const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
        const page = await browser.newPage();
        await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
        const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true });
        await browser.close();

        // 4. Kirim PDF (tidak ada perubahan di bagian ini)
        res.set({
            'Content-Type': 'application/pdf',
            'Content-Length': pdfBuffer.length,
            'Content-Disposition': `attachment; filename="surat-pengadaan-${data.nomor_usulan}.pdf"`
        });
        res.send(pdfBuffer);

    } catch (error) {
        console.error('Error saat membuat PDF surat:', error);
        res.status(500).json({ message: 'Gagal membuat PDF surat.' });
    }
};

const getPengadaanByPengusul = async (req, res) => {
    // ID pengguna (PPK) diambil dari token JWT yang sudah terverifikasi
    const user_pengusul_id = req.user.id; 
    try {
        const query = `
            SELECT rp.*, u.nama as nama_pengusul, p.nama as nama_ppk 
            FROM rencana_pengadaan rp
            JOIN users u ON rp.user_pengusul_id = u.id
            LEFT JOIN users p ON rp.ppk_id = p.id
            WHERE rp.user_pengusul_id = $1
            ORDER BY rp.tanggal_usulan DESC;
        `;
        const { rows } = await pool.query(query, [user_pengusul_id]);
        res.json(rows);
    } catch (error) {
        console.error('Error mengambil data usulan by pengusul:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};


//@desc    Get validation logs for a specific pengadaan request
//route   GET /api/pengadaan/:id/logs
//access  Private
const getPengadaanLogs = async (req, res) => {
    const { id: pengadaanId } = req.params;
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
            WHERE log.rencana_pengadaan_id = $1
            ORDER BY log.waktu_validasi ASC;
        `;
        const { rows } = await pool.query(query, [pengadaanId]);
        res.json(rows);
    } catch (error) {
        console.error('Error saat mengambil log validasi pengadaan:', error);
        res.status(500).json({ message: 'Terjadi kesalahan pada server' });
    }
};

module.exports = {
    createPengadaan,
    getAllPengadaan,
    getPengadaanById,
    updateStatusPengadaan,
    downloadSuratPengadaan,
    getPengadaanByPengusul,
    getPengadaanLogs
};