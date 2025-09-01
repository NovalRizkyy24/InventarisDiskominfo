const pool = require('../config/db');
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const imageToBase64 = (filePath) => {
    const imgPath = path.resolve(__dirname, '../..', 'client/public/img', filePath);
    if (fs.existsSync(imgPath)) {
        const file = fs.readFileSync(imgPath);
        return `data:image/png;base64,${Buffer.from(file).toString('base64')}`;
    }
    console.error(`File logo tidak ditemukan di: ${imgPath}`);
    return '';
};


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
        'Menunggu Persetujuan',
        'Disetujui Kepala Dinas', 
        'Selesai', 
        'Ditolak'
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

        const detailQuery = `SELECT * FROM rencana_pengadaan_detail WHERE rencana_id = $1 AND disetujui = TRUE ORDER BY id ASC;`;
        const detailResult = await pool.query(detailQuery, [id]);
        data.details = detailResult.rows;

        const itemRows = data.details.map((item, index) => {
            const total = item.jumlah * item.harga_satuan;
            return `
                <tr>
                    <td style="border: 1px solid black; padding: 8px; text-align: center;">${index + 1}</td>
                    <td style="border: 1px solid black; padding: 8px;">${item.nama_barang_usulan}</td>
                    <td style="border: 1px solid black; padding: 8px;">${item.spesifikasi_usulan || '-'}</td>
                    <td style="border: 1px solid black; padding: 8px; text-align: center;">${item.jumlah} ${item.satuan}</td>
                    <td style="border: 1px solid black; padding: 8px; text-align: right;">Rp ${Number(item.harga_satuan).toLocaleString('id-ID')}</td>
                    <td style="border: 1px solid black; padding: 8px; text-align: right;">Rp ${total.toLocaleString('id-ID')}</td>
                </tr>
            `;
        }).join('');

        const logoBase64 = imageToBase64('Logo Kota Bandung.png');

        const htmlContent = `
            <html>
                <head>
                    <style>
                        body { font-family: 'Times New Roman', Times, serif; font-size: 12pt; line-height: 1.5; margin: 2.5cm; }
                        .header-table { width: 100%; border-bottom: 3px solid black; margin-bottom: 2em; }
                        .header-table td { vertical-align: middle; }
                        .logo { width: 70px; }
                        .header-text { text-align: center; }
                        .header-text h4, .header-text h5, .header-text p { margin: 0; }
                        .header-text h4 { font-size: 16pt; font-weight: bold; }
                        .header-text h5 { font-size: 14pt; font-weight: bold; }
                        .header-text p { font-size: 10pt; }
                        .title { text-align: center; margin-top: 1em; margin-bottom: 1.5em; }
                        .info-table { margin-bottom: 24px; }
                        .info-table td { padding: 2px 0; vertical-align: top; }
                        .item-table { width: 100%; border-collapse: collapse; margin-top: 1em; }
                        .item-table th, .item-table td { border: 1px solid black; padding: 6px; text-align: left; vertical-align: top; }
                        .item-table th { font-weight: bold; }
                        .signature-table { margin-top: 40px; }
                        .signature-table td { padding-top: 20px; text-align: center; }
                        p { text-align: justify; }
                    </style>
                </head>
                <body>
                    <table class="header-table">
                        <tr>
                            <td style="width:20%; text-align:center;"><img src="${logoBase64}" alt="Logo" class="logo" /></td>
                            <td style="width:80%;" class="header-text">
                                <h4>PEMERINTAH KOTA BANDUNG</h4>
                                <h5>DINAS KOMUNIKASI DAN INFORMATIKA</h5>
                                <p>Jl. Wastukencana No.2, Babakan Ciamis, Kota Bandung, Jawa Barat 40117</p>
                            </td>
                        </tr>
                    </table>
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
                                <th style="border: 1px solid black; padding: 8px;">Spesifikasi</th>
                                <th style="border: 1px solid black; padding: 8px;">Jumlah</th>
                                <th style="border: 1px solid black; padding: 8px;">Harga Satuan</th>
                                <th style="border: 1px solid black; padding: 8px;">Total</th>
                            </tr>
                        </thead>
                        <tbody>${itemRows}</tbody>
                    </table>

                    <table class="signature-table">
                        <tr>
                            <td></td>
                            <td style="width: 50%;">
                                Disetujui oleh:<br>
                                Kepala Dinas Komunikasi dan Informatika
                                <br><br><br><br><br>
                                <b><u>Y. Ahmad Brilyana, S.Sos, M.Si</u></b><br>
                                NIP. 197311271993031003
                            </td>
                        </tr>
                    </table>
                </body>
            </html>
        `;

        const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
        const page = await browser.newPage();
        await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
        const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true });
        await browser.close();

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

//@desc    Delete a pengadaan request by its creator
//route   DELETE /api/pengadaan/:id
//access  Private (Hanya pengusul)

const deletePengadaan = async (req, res) => {
    const { id: pengadaanId } = req.params;
    const { id: userId, role } = req.user;

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const usulanQuery = await client.query(
            'SELECT user_pengusul_id, status FROM rencana_pengadaan WHERE id = $1',
            [pengadaanId]
        );

        if (usulanQuery.rows.length === 0) {
            return res.status(404).json({ message: 'Usulan tidak ditemukan.' });
        }

        const usulan = usulanQuery.rows[0];

        if (usulan.user_pengusul_id !== userId) {
            return res.status(403).json({ message: 'Anda tidak memiliki izin untuk menghapus usulan ini.' });
        }

        if (usulan.status !== 'Diajukan') {
            return res.status(400).json({ message: 'Usulan yang sudah diproses tidak dapat dihapus.' });
        }

        await client.query('DELETE FROM rencana_pengadaan WHERE id = $1', [pengadaanId]);

        await client.query('COMMIT');
        res.json({ message: 'Usulan pengadaan berhasil dihapus.' });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error saat menghapus usulan pengadaan:', error);
        res.status(500).json({ message: 'Terjadi kesalahan pada server.' });
    } finally {
        client.release();
    }
};

const validatePengadaanItems = async (req, res) => {
    const { id: pengadaanId } = req.params;
    const { validatedItems } = req.body;
    const user_validator_id = req.user.id;
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        for (const detailId in validatedItems) {
            const isApproved = validatedItems[detailId];
            await client.query(
                'UPDATE rencana_pengadaan_detail SET disetujui = $1 WHERE id = $2 AND rencana_id = $3',
                [isApproved, detailId, pengadaanId]
            );
        }

        const currentData = await client.query('SELECT status FROM rencana_pengadaan WHERE id = $1', [pengadaanId]);
        const status_sebelum = currentData.rows[0].status;
        const status_sesudah = 'Menunggu Persetujuan';

        await client.query(
            "UPDATE rencana_pengadaan SET status = $1 WHERE id = $2",
            [status_sesudah, pengadaanId]
        );

        const logQuery = `
            INSERT INTO log_validasi (rencana_pengadaan_id, user_validator_id, status_sebelum, status_sesudah, catatan)
            VALUES ($1, $2, $3::status_transaksi, $4::status_transaksi, $5);
        `;
        await client.query(logQuery, [pengadaanId, user_validator_id, status_sebelum, status_sesudah, "Validasi item oleh Penatausahaan Barang."]);

        await client.query('COMMIT');
        res.json({ message: 'Validasi barang berhasil disimpan.' });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error saat validasi item pengadaan:', error);
        res.status(500).json({ message: 'Terjadi kesalahan pada server.' });
    } finally {
        client.release();
    }
};


module.exports = {
    createPengadaan,
    getAllPengadaan,
    getPengadaanById,
    updateStatusPengadaan,
    downloadSuratPengadaan,
    getPengadaanByPengusul,
    getPengadaanLogs,
    deletePengadaan,
    validatePengadaanItems
};