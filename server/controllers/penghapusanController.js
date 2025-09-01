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

const uploadedImageToBase64 = (filePath) => {
    if (!filePath) return '';
    const absolutePath = path.resolve(__dirname, '..', filePath);
    if (fs.existsSync(absolutePath)) {
        const file = fs.readFileSync(absolutePath);
        const ext = path.extname(filePath).toLowerCase();
        const mimeType = ext === '.png' ? 'image/png' : 'image/jpeg';
        return `data:${mimeType};base64,${Buffer.from(file).toString('base64')}`;
    }
    console.error(`File gambar tidak ditemukan di: ${absolutePath}`);
    return '';
};

/**
 * @desc    Create a new penghapusan request
 * @route   POST /api/penghapusan
 * @access  Private
 */
const createPenghapusan = async (req, res) => {
    const { barang_id, alasan_penghapusan } = req.body;
    const user_pengusul_id = req.user.id;

    let fotoUrl = null;
    if (req.file) {
        fotoUrl = req.file.path.replace(/\\/g, "/");
    }

    if (!barang_id || !alasan_penghapusan) {
        return res.status(400).json({ message: 'Data penghapusan tidak lengkap.' });
    }

    try {
        const query = `
            INSERT INTO penghapusan (nomor_usulan, barang_id, user_pengusul_id, alasan_penghapusan, foto_kerusakan_url)
            VALUES (CONCAT('PHS-', TO_CHAR(NOW(), 'YYYYMMDDHH24MISSMS')), $1, $2, $3, $4) RETURNING *;
        `;
        const values = [barang_id, user_pengusul_id, alasan_penghapusan, fotoUrl];
        const { rows } = await pool.query(query, values);
        res.status(201).json({ message: 'Usulan penghapusan berhasil dibuat.', penghapusan: rows[0] });
    } catch (error) {
        console.error('Error saat membuat usulan penghapusan:', error);
        res.status(500).json({ message: 'Terjadi kesalahan pada server' });
    }
};

/**
 * @desc    Get all penghapusan requests
 * @route   GET /api/penghapusan
 * @access  Private
 */
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

/**
 * @desc    Update status of a penghapusan request
 * @route   PUT /api/penghapusan/:id/status
 * @access  Private
 */
const updateStatusPenghapusan = async (req, res) => {
    const { id } = req.params;
    const { status_baru, catatan } = req.body;
    const user_validator_id = req.user.id;
    const finalCatatan = catatan || null;

    const validStatuses = ['Divalidasi Pengurus Barang', 'Ditolak'];
    if (!validStatuses.includes(status_baru)) {
        return res.status(400).json({ message: 'Status baru tidak valid.' });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const currentData = await client.query('SELECT status FROM penghapusan WHERE id = $1', [id]);
        if (currentData.rows.length === 0) throw new Error('NotFound');
        const { status: status_sebelum } = currentData.rows[0];

        if (status_sebelum !== 'Diajukan') {
            return res.status(400).json({ message: 'Usulan ini sudah diproses.' });
        }

        const updateQuery = `
            UPDATE penghapusan 
            SET status = $1::status_transaksi, 
                catatan_penolakan = CASE WHEN $1::status_transaksi = 'Ditolak' THEN $2 ELSE catatan_penolakan END
            WHERE id = $3;
        `;
        await client.query(updateQuery, [status_baru, finalCatatan, id]);

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

/**
 * @desc    Get validation logs for a specific penghapusan request
 * @route   GET /api/penghapusan/:id/logs
 * @access  Private
 */
const getPenghapusanLogs = async (req, res) => {
    const { id: penghapusanId } = req.params;
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
            WHERE log.penghapusan_id = $1
            ORDER BY log.waktu_validasi ASC;
        `;
        const { rows } = await pool.query(query, [penghapusanId]);
        res.json(rows);
    } catch (error) {
        console.error('Error saat mengambil log validasi penghapusan:', error);
        res.status(500).json({ message: 'Terjadi kesalahan pada server' });
    }
};

/**
 * @desc    Get penghapusan requests by the proposer
 * @route   GET /api/penghapusan/saya
 * @access  Private
 */
const getPenghapusanByPengusul = async (req, res) => {
    const user_pengusul_id = req.user.id;
    try {
        const query = `
            SELECT 
                pn.id,
                pn.nomor_usulan, 
                pn.status,
                pn.tanggal_pengajuan,
                b.nama_barang
            FROM penghapusan pn
            JOIN barang b ON pn.barang_id = b.id
            WHERE pn.user_pengusul_id = $1
            ORDER BY pn.tanggal_pengajuan DESC;
        `;
        const { rows } = await pool.query(query, [user_pengusul_id]);
        res.json(rows);
    } catch (error) { 
        console.error('Error saat mengambil data penghapusan oleh pengusul:', error); 
        res.status(500).json({ message: 'Terjadi kesalahan pada server' });
    }
};

/**
 * @desc    Download Berita Acara Penghapusan Barang
 * @route   GET /api/penghapusan/:id/download-berita-acara
 * @access  Private
 */
const downloadBeritaAcaraPenghapusan = async (req, res) => {
    const { id } = req.params;
    try {
        const query = `
            SELECT 
                pn.id, pn.nomor_usulan, pn.tanggal_pengajuan, pn.alasan_penghapusan, pn.foto_kerusakan_url,
                b.nama_barang, b.kode_barang, b.merk, b.tipe, b.nilai_perolehan, b.tanggal_perolehan,
                u_pengusul.nama as nama_pengusul, u_pengusul.jabatan as jabatan_pengusul, u_pengusul.nip as nip_pengusul,
                (SELECT u.nama FROM log_validasi lv JOIN users u ON lv.user_validator_id = u.id WHERE lv.penghapusan_id = pn.id AND lv.status_sesudah = 'Divalidasi Pengurus Barang' LIMIT 1) as nama_pengurus,
                (SELECT u.nip FROM log_validasi lv JOIN users u ON lv.user_validator_id = u.id WHERE lv.penghapusan_id = pn.id AND lv.status_sesudah = 'Divalidasi Pengurus Barang' LIMIT 1) as nip_pengurus,
                (SELECT u.jabatan FROM log_validasi lv JOIN users u ON lv.user_validator_id = u.id WHERE lv.penghapusan_id = pn.id AND lv.status_sesudah = 'Divalidasi Pengurus Barang' LIMIT 1) as jabatan_pengurus
            FROM penghapusan pn
            JOIN barang b ON pn.barang_id = b.id
            JOIN users u_pengusul ON pn.user_pengusul_id = u_pengusul.id
            WHERE pn.id = $1;
        `;
        const { rows } = await pool.query(query, [id]);

        if (rows.length === 0) {
            return res.status(404).json({ message: 'Data penghapusan tidak ditemukan.' });
        }
        const data = rows[0];

        const simpleDate = (date) => new Date(date).toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'});
        const formatRupiah = (number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(number);
        const logoBase64 = imageToBase64('Logo Kota Bandung.png');
        const fotoKerusakanBase64 = uploadedImageToBase64(data.foto_kerusakan_url);

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
                .title .main-title { font-size: 14pt; font-weight: bold; text-decoration: underline; display: block; }
                .title .nomor { font-size: 12pt; display: block; margin-top: 0.3em; }
                .item-table { width: 100%; border-collapse: collapse; margin-top: 1em; }
                .item-table th, .item-table td { border: 1px solid black; padding: 6px; text-align: left; vertical-align: top; }
                .item-table th { font-weight: bold; width: 30%; }
                .signature-table { margin-top: 60px; width: 100%; }
                .signature-table td { text-align: center; width: 50%; vertical-align: top; }
                p { text-align: justify; }
                .damage-photo { max-width: 250px; height: auto; margin-top: 10px; border: 1px solid #ccc; padding: 5px; }
                .page-break { page-break-before: always; }
            </style>
        </head>
        <body>
            <div class="page-container">
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

                <div class="title">
                    <span class="main-title">BERITA ACARA PENGHAPUSAN BARANG MILIK DAERAH</span>
                    <span class="nomor">Nomor: ${data.nomor_usulan}</span>
                </div>

                <p>Pada hari ini, ${simpleDate(new Date())}, telah dilaksanakan penghapusan Barang Milik Daerah dari daftar inventaris Dinas Komunikasi dan Informatika Kota Bandung, dengan rincian sebagai berikut:</p>
                
                <table class="item-table">
                  <tr><th>Nama Barang</th><td>${data.nama_barang}</td></tr>
                  <tr><th>Kode Barang</th><td>${data.kode_barang}</td></tr>
                  <tr><th>Merk / Tipe</th><td>${data.merk || '-'} / ${data.tipe || '-'}</td></tr>
                  <tr><th>Tanggal Perolehan</th><td>${simpleDate(data.tanggal_perolehan)}</td></tr>
                  <tr><th>Nilai Perolehan</th><td>${formatRupiah(data.nilai_perolehan)}</td></tr>
                  <tr><th>Alasan Penghapusan</th><td>${data.alasan_penghapusan}</td></tr>
                  <tr>
                    <th>Foto Barang</th>
                    <td>
                      ${fotoKerusakanBase64 
                        ? `<img src="${fotoKerusakanBase64}" alt="Foto Kerusakan" class="damage-photo" />` 
                        : '<span>Tidak ada foto yang dilampirkan.</span>'
                      }
                    </td>
                  </tr>
                </table>

                <p style="margin-top: 1.5em;">Penghapusan ini dilakukan berdasarkan hasil validasi dan persetujuan dari pihak-pihak yang berwenang. Dengan dibuatnya berita acara ini, maka barang tersebut secara resmi tidak lagi tercatat dalam aset Dinas Komunikasi dan Informatika Kota Bandung.</p>

                <p style="margin-top: 1em;">Demikian Berita Acara ini dibuat untuk dapat dipergunakan sebagaimana mestinya.</p>
            </div>
            
            <div class="page-break">
                <table class="signature-table">
                    <tr>
                        <td>
                            <div>Yang Mengusulkan,</div>
                            <div>${data.jabatan_pengusul || 'Pengusul'}</div>
                            <div style="height:80px;"></div>
                            <div style="text-decoration: underline;"><b>${data.nama_pengusul}</b></div>
                            <div>NIP. ${data.nip_pengusul || '-'}</div>
                        </td>
                        <td>
                            <div>Mengetahui,</div>
                            <div>${data.jabatan_pengurus || 'Pengurus Barang'}</div>
                            <div style="height:80px;"></div>
                            <div style="text-decoration: underline;"><b>${data.nama_pengurus || '(Nama Pengurus Barang)'}</b></div>
                            <div>NIP. ${data.nip_pengurus || '-'}</div>
                        </td>
                    </tr>
                </table>
            </div>
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
            'Content-Disposition': `attachment; filename="berita-acara-penghapusan-${data.nomor_usulan}.pdf"`
        });
        res.send(pdfBuffer);

    } catch (error) {
        console.error('Error saat membuat Berita Acara PDF Penghapusan:', error);
        res.status(500).json({ message: 'Gagal membuat Berita Acara PDF.' });
    }
};

/**
 * @desc    Upload signed Berita Acara and finalize the process
 * @route   PUT /api/penghapusan/:id/upload-ba
 * @access  Private
 */
const uploadBeritaAcara = async (req, res) => {
    const { id } = req.params;
    
    if (!req.file) {
        return res.status(400).json({ message: 'Tidak ada file Berita Acara yang diunggah.' });
    }

    const beritaAcaraUrl = req.file.path.replace(/\\/g, "/");

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const updatePenghapusan = await client.query(
            'UPDATE penghapusan SET berita_acara_url = $1, status = $2 WHERE id = $3 RETURNING barang_id',
            [beritaAcaraUrl, 'Selesai', id]
        );

        if (updatePenghapusan.rowCount === 0) {
            throw new Error('NotFound');
        }

        const { barang_id } = updatePenghapusan.rows[0];

        await client.query(
            "UPDATE barang SET status = 'Tidak Aktif' WHERE id = $1",
            [barang_id]
        );

        await client.query('COMMIT');
        res.json({ message: 'Berita Acara berhasil diunggah dan proses penghapusan selesai.' });
    } catch (error) {
        await client.query('ROLLBACK');
        if (error.message === 'NotFound') {
            return res.status(404).json({ message: 'Usulan penghapusan tidak ditemukan.' });
        }
        console.error('Error saat unggah Berita Acara:', error);
        res.status(500).json({ message: 'Terjadi kesalahan pada server.' });
    } finally {
        client.release();
    }
};

/**
 * @desc    Delete the uploaded Berita Acara
 * @route   DELETE /api/penghapusan/:id/delete-ba
 * @access  Private
 */
const deleteBeritaAcara = async (req, res) => {
    const { id } = req.params;
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');

        const { rows } = await client.query(
            'SELECT berita_acara_url, barang_id FROM penghapusan WHERE id = $1',
            [id]
        );

        if (rows.length === 0 || !rows[0].berita_acara_url) {
            throw new Error('NotFound');
        }
        
        const { berita_acara_url, barang_id } = rows[0];

        const filePath = path.resolve(__dirname, '..', berita_acara_url);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        await client.query(
            "UPDATE penghapusan SET berita_acara_url = NULL, status = 'Divalidasi Pengurus Barang' WHERE id = $1",
            [id]
        );

        await client.query(
            "UPDATE barang SET status = 'Tersedia' WHERE id = $1",
            [barang_id]
        );
        
        await client.query('COMMIT');
        res.json({ message: 'Berita Acara berhasil dihapus. Silakan unggah ulang file yang benar.' });

    } catch (error) {
        await client.query('ROLLBACK');
        if (error.message === 'NotFound') {
            return res.status(404).json({ message: 'Berita Acara tidak ditemukan.' });
        }
        console.error('Error saat menghapus Berita Acara:', error);
        res.status(500).json({ message: 'Gagal menghapus Berita Acara.' });
    } finally {
        client.release();
    }
};

module.exports = {
    createPenghapusan,
    getAllPenghapusan,
    updateStatusPenghapusan,
    getPenghapusanById, 
    getPenghapusanLogs,
    getPenghapusanByPengusul,
    downloadBeritaAcaraPenghapusan,
    uploadBeritaAcara,
    deleteBeritaAcara,
};