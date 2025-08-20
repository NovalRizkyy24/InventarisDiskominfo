const pool = require('../config/db');
const puppeteer = require('puppeteer'); 

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

/**
 * @desc    Save Pihak Kedua details for a peminjaman
 * @route   PUT /api/peminjaman/:id/pihak-kedua
 * @access  Private
 */
const savePihakKedua = async (req, res) => {
    const { id } = req.params;
    const { nama_pihak_kedua, nip_pihak_kedua, jabatan_pihak_kedua } = req.body;

    if (!nama_pihak_kedua || !nip_pihak_kedua || !jabatan_pihak_kedua) {
        return res.status(400).json({ message: 'Semua field Pihak Kedua wajib diisi.' });
    }

    try {
        const updateQuery = `
            UPDATE peminjaman 
            SET nama_pihak_kedua = $1, nip_pihak_kedua = $2, jabatan_pihak_kedua = $3
            WHERE id = $4 RETURNING *;
        `;
        const { rows } = await pool.query(updateQuery, [nama_pihak_kedua, nip_pihak_kedua, jabatan_pihak_kedua, id]);
        
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Data peminjaman tidak ditemukan.' });
        }

        res.json({ message: 'Data Pihak Kedua berhasil disimpan.', peminjaman: rows[0] });

    } catch (error) {
        console.error('Error saat menyimpan data Pihak Kedua:', error);
        res.status(500).json({ message: 'Terjadi kesalahan pada server.' });
    }
};


/**
 * @desc    Download Berita Acara Peminjaman (data from DB)
 * @route   GET /api/peminjaman/:id/download-berita-acara
 * @access  Private
 */
const downloadBeritaAcara = async (req, res) => {
    const { id } = req.params;
    try {
        // 1. Ambil data peminjaman yang sudah ada di database
        const query = `
            SELECT p.*, b.nama_barang, b.merk, b.tipe, b.nilai_perolehan
            FROM peminjaman p
            JOIN barang b ON p.barang_id = b.id
            WHERE p.id = $1;
        `;
        const { rows } = await pool.query(query, [id]);
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Data peminjaman tidak ditemukan.' });
        }
        const data = rows[0];

        // Validasi jika data pihak kedua belum disimpan
        if (!data.nama_pihak_kedua || !data.nip_pihak_kedua || !data.jabatan_pihak_kedua) {
            return res.status(400).json({ message: 'Data Pihak Kedua belum disimpan. Harap simpan terlebih dahulu.' });
        }

        // 2. Proses pembuatan PDF (Template HTML tidak berubah)
        const formatDate = (date) => new Date(date).toLocaleDateString('id-ID', {
            weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
        });
        const formatRupiah = (number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 2 }).format(number);
        const simpleDate = (date) => new Date(date).toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'});

        const htmlContent = `
        <html>
            <head>
                <style>
                    /* Margin di CSS diatur ke nilai yang lebih kecil */
                    body { font-family: 'Times New Roman', Times, serif; font-size: 12pt; margin: 0; } 
                    .page-container { padding: 1cm 1cm; } /* Kontrol padding di sini */
                    p { line-height: 1.5; text-align: justify; margin: 0; }
                    .header { text-align: center; font-weight: bold; }
                    .underline { text-decoration: underline; }
                    table { width: 100%; border-collapse: collapse; }
                    .info-table { margin-left: 20px; }
                    .info-table td { padding: 1px 0; vertical-align: top; line-height: 1.5; }
                    .item-table, .item-table th, .item-table td { border: 1px solid black; }
                    .item-table th, .item-table td { padding: 8px; text-align: center; }
                    .signature-table { margin-top: 30px; }
                    .signature-table td { text-align: center; width: 50%; }
                    .pasal { text-align: center; font-weight: bold; margin-top: 1.5em; margin-bottom: 1em; }
                </style>
            </head>
            <body>
                <div class="page-container">
                    <div class="header">
                        <p class="underline">BERITA ACARA PINJAM PAKAI BARANG MILIK DAERAH</p>
                        <p>Nomor: 027/BA-PinjamPakai/${data.id}/${new Date().getFullYear()}</p>
                    </div>
                    <br/>
                    <p>Pada hari ini, ${formatDate(new Date())}, yang bertanda tangan dibawah ini:</p>
                    
                    <table class="info-table" style="margin-top: 1em;">
                        <tr><td width="80px">Nama</td><td width="10px">:</td><td><b>Y. Ahmad Brilyana, S.Sos, M.Si</b></td></tr>
                        <tr><td>NIP</td><td>:</td><td>19731127 199303 1 003</td></tr>
                        <tr><td>Jabatan</td><td>:</td><td>Kepala Dinas Komunikasi dan Informatika</td></tr>
                        <tr><td colspan="3" style="padding-top: 5px;">Yang selanjutnya disebut <b>PIHAK PERTAMA</b>.</td></tr>
                        <tr><td colspan="3" style="height: 1em;">&nbsp;</td></tr>
                        <tr><td>Nama</td><td>:</td><td><b>${data.nama_pihak_kedua}</b></td></tr>
                        <tr><td>NIP</td><td>:</td><td>${data.nip_pihak_kedua}</td></tr>
                        <tr><td>Jabatan</td><td>:</td><td>${data.jabatan_pihak_kedua}</td></tr>
                        <tr><td colspan="3" style="padding-top: 5px;">Yang selanjutnya disebut <b>PIHAK KEDUA</b>.</td></tr>
                    </table>

                    <p class="pasal">Pasal 1</p>
                    <p>PIHAK PERTAMA telah menyerahkan (pinjam pakai) kepada PIHAK KEDUA Barang Inventaris Daerah sebagai berikut :</p>
                    
                    <table class="item-table" style="margin-top: 1em; margin-bottom: 1em;">
                        <thead>
                            <tr><th>No</th><th>Nama Barang</th><th>Jumlah</th><th>Harga</th><th>Keterangan</th></tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>1</td>
                                <td>${data.nama_barang}</td>
                                <td>1 Unit</td>
                                <td>${formatRupiah(data.nilai_perolehan)}</td>
                                <td>Merk/Tipe: ${data.merk || '-'} / ${data.tipe || '-'}</td>
                            </tr>
                        </tbody>
                    </table>

                    <p class="pasal">Pasal 2</p>
                    <p>Barang Inventaris dimaksud pada pasal 1 digunakan semata mata untuk menunjang kegiatan ${data.keperluan || 'Dinas'} dan diatur dengan ketentuan sebagai berikut :</p>
                    <ol style="padding-left: 20px; text-align: justify; margin: 0;">
                        <li>Dengan diserahkannya barang inventaris tersebut diatas, maka untuk segala sesuatunya yang berkenaan dengan segala biaya sarana dan prasarana fasilitas baik berupa kerusakan perbaikan serta kelengkapannya yang berkaitan dengan barang inventaris tersebut menjadi tanggung jawab PIHAK KEDUA.</li>
                        <li>Pemegang barang inventaris barang milik daerah wajib memilihara dan bertanggung jawab atas barang yang digunakan antara lain bila terjadi kerusakan atau hilang dan lain – lain menjadi tanggung jawab PIHAK KEDUA sesuai ketentuan peraturan yang berlaku.</li>
                        <li>Tidak dibenarkan untuk merubah, menambah / mengurangi segala fasilitas / perlengkapan yang terdapat di dalam barang inventaris tersebut.</li>
                    </ol>

                    <p class="pasal">Pasal 3</p>
                    <p>Hal hal yang belum diatur dalam berita acara ini akan diatur kemudian.</p>
                    <p style="margin-top: 1em;">Demikian berita acara pinjam pakai barang inventaris (Barang Milik Daerah) ini dibuat untuk dipergunakan sebagai mana mestinya.</p>
                    
                    <div style="width: 100%; overflow: hidden; margin-top: 30px;">
                        <div style="width: 40%; float: right; text-align: left;">
                            Bandung, ${simpleDate(new Date())}
                        </div>
                    </div>
                    
                    <table class="signature-table">
                        <tr>
                            <td>
                                <div>PIHAK PERTAMA,</div>
                                <div>Kepala Dinas Komunikasi dan Informatika</div>
                                <div style="height: 80px;"></div>
                                <div class="underline"><b>Y. Ahmad Brilyana, S.Sos, M.Si</b></div>
                                <div>NIP. 19731127 199303 1 003</div>
                            </td>
                            <td>
                                <div>PIHAK KEDUA,</div>
                                <div>${data.jabatan_pihak_kedua}</div>
                                <div style="height: 80px;"></div>
                                <div class="underline"><b>${data.nama_pihak_kedua}</b></div>
                                <div>NIP. ${data.nip_pihak_kedua}</div>
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
        const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true, margin: { top: '2.5cm', right: '2.5cm', bottom: '2.5cm', left: '2.5cm' } });
        await browser.close();

        res.set({
            'Content-Type': 'application/pdf',
            'Content-Length': pdfBuffer.length,
            'Content-Disposition': `attachment; filename="berita-acara-peminjaman-${data.id}.pdf"`
        });
        res.send(pdfBuffer);

    } catch (error) {
        console.error('Error saat membuat Berita Acara PDF:', error);
        res.status(500).json({ message: 'Gagal membuat Berita Acara PDF.' });
    }
};

module.exports = {
    createPeminjaman,
    getAllPeminjaman,
    updateStatusPeminjaman,
    getPeminjamanById, 
    getPeminjamanByPeminjam,
    deletePeminjaman,
    savePihakKedua,
    downloadBeritaAcara,
};