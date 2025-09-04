const pool = require('../config/db');
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const imageToBase64 = (filePath) => {
    const imgPath = path.resolve(__dirname, '..', '..', 'client/public/img', filePath);
    if (fs.existsSync(imgPath)) {
        const file = fs.readFileSync(imgPath);
        return `data:image/png;base64,${Buffer.from(file).toString('base64')}`;
    }
    console.error(`File logo tidak ditemukan di: ${imgPath}`);
    return '';
};

const longDateFormatter = (date) => {
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    
    const dayName = days[date.getDay()];
    const day = date.getDate();
    const monthName = months[date.getMonth()];
    const year = date.getFullYear();

    const terbilang = (n) => {
        const angka = ["", "Satu", "Dua", "Tiga", "Empat", "Lima", "Enam", "Tujuh", "Delapan", "Sembilan", "Sepuluh", "Sebelas"];
        if (n < 12) return angka[n];
        if (n < 20) return terbilang(n - 10) + " Belas";
        if (n < 100) return terbilang(Math.floor(n / 10)) + " Puluh " + terbilang(n % 10);
        if (n < 200) return "Seratus " + terbilang(n - 100);
        if (n < 1000) return terbilang(Math.floor(n / 100)) + " Ratus " + terbilang(n % 100);
        if (n < 2000) return "Seribu " + terbilang(n - 1000);
        if (n < 1000000) return terbilang(Math.floor(n / 1000)) + " Ribu " + terbilang(n % 1000);
        return n.toString();
    };

    return `Pada hari ini, ${dayName} Tanggal ${terbilang(day)} Bulan ${monthName} Tahun ${terbilang(year)}`;
};


const createPeminjaman = async (req, res) => {
    const { tanggal_mulai_pinjam, tanggal_rencana_kembali, keperluan, jenis } = req.body;
    const barang_ids = JSON.parse(req.body.barang_ids); 
    const user_pengusul_id = req.user.id;
    
    let suratUrl = null;
    if (req.file) {
        suratUrl = req.file.path.replace(/\\/g, "/");
    }

    if (jenis === 'Eksternal' && !suratUrl) {
        return res.status(400).json({ message: 'Surat peminjaman wajib diunggah untuk peminjaman eksternal.' });
    }

    if (!Array.isArray(barang_ids) || barang_ids.length === 0 || !tanggal_mulai_pinjam || !tanggal_rencana_kembali || !jenis) {
        return res.status(400).json({ message: 'Data peminjaman tidak lengkap. Harap pilih minimal satu barang.' });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        
        const barangPlaceholders = barang_ids.map((_, index) => `$${index + 1}`).join(',');
        const barangStatusResult = await client.query(`SELECT id, status FROM barang WHERE id IN (${barangPlaceholders})`, barang_ids);

        if (barangStatusResult.rowCount !== barang_ids.length) {
            throw new Error('Satu atau lebih barang tidak ditemukan.');
        }

        const notAvailable = barangStatusResult.rows.filter(b => b.status !== 'Tersedia');
        if (notAvailable.length > 0) {
            throw new Error(`Barang dengan ID ${notAvailable.map(b => b.id).join(', ')} tidak tersedia.`);
        }

        const peminjamanQuery = `
            INSERT INTO peminjaman (nomor_usulan, user_peminjam_id, tanggal_mulai_pinjam, tanggal_rencana_kembali, keperluan, jenis, surat_peminjaman_url)
            VALUES (CONCAT('PMJ-', TO_CHAR(NOW(), 'YYYYMMDDHH24MISSMS')), $1, $2, $3, $4, $5, $6) RETURNING id;
        `;
        const peminjamanValues = [user_pengusul_id, tanggal_mulai_pinjam, tanggal_rencana_kembali, keperluan, jenis, suratUrl];
        const peminjamanResult = await client.query(peminjamanQuery, peminjamanValues);
        const peminjamanId = peminjamanResult.rows[0].id;

        for (const barang_id of barang_ids) {
            await client.query(
                'INSERT INTO peminjaman_detail (peminjaman_id, barang_id) VALUES ($1, $2)',
                [peminjamanId, barang_id]
            );
        }
        
        await client.query('COMMIT');
        res.status(201).json({ message: 'Permintaan peminjaman berhasil dibuat.', peminjaman: { id: peminjamanId } });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error saat membuat peminjaman:', error);
        res.status(500).json({ message: error.message || 'Terjadi kesalahan pada server' });
    } finally {
        client.release();
    }
};

const getAllPeminjaman = async (req, res) => {
    const { status, jenis, search, startDate, endDate } = req.query;
    try {
        let queryText = `
            SELECT p.*, u.nama as nama_peminjam,
                   (SELECT STRING_AGG(b.nama_barang, ', ') 
                    FROM peminjaman_detail pd 
                    JOIN barang b ON pd.barang_id = b.id 
                    WHERE pd.peminjaman_id = p.id) as nama_barang
            FROM peminjaman p
            JOIN users u ON p.user_peminjam_id = u.id
        `;
        const queryParams = [];
        let whereClauses = [];

        if (status && status !== 'Semua') {
            queryParams.push(status);
            whereClauses.push(`p.status = $${queryParams.length}`);
        }
        if (jenis && jenis !== 'Semua') {
            queryParams.push(jenis);
            whereClauses.push(`p.jenis = $${queryParams.length}`);
        }
        if (search) {
            queryParams.push(`%${search}%`);
            whereClauses.push(`(p.nomor_usulan ILIKE $${queryParams.length} OR u.nama ILIKE $${queryParams.length})`);
        }
        if (startDate && endDate) {
            queryParams.push(startDate, endDate);
            whereClauses.push(`p.tanggal_pengajuan BETWEEN $${queryParams.length - 1} AND $${queryParams.length}`);
        }

        if (whereClauses.length > 0) {
            queryText += ` WHERE ${whereClauses.join(' AND ')}`;
        }

        queryText += ' ORDER BY p.tanggal_pengajuan DESC';

        const { rows } = await pool.query(queryText, queryParams);
        res.json(rows);
    } catch (error) {
        console.error('Error mengambil data peminjaman:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

const updateStatusPeminjaman = async (req, res) => {
    const { id } = req.params;
    const { status_baru, catatan } = req.body;
    const user_validator_id = req.user.id;
    const user_role = req.user.role;

    const validStatuses = ['Divalidasi Pengurus Barang', 'Divalidasi Penatausahaan', 'Selesai', 'Ditolak'];
    if (!validStatuses.includes(status_baru)) {
        return res.status(400).json({ message: 'Status baru tidak valid.' });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const currentData = await client.query('SELECT status, jenis FROM peminjaman WHERE id = $1', [id]);
        if (currentData.rows.length === 0) throw new Error('NotFound');
        
        const { status: status_sebelum, jenis } = currentData.rows[0];

        const barangIdsResult = await client.query('SELECT barang_id FROM peminjaman_detail WHERE peminjaman_id = $1', [id]);
        const barang_ids = barangIdsResult.rows.map(row => row.barang_id);

        if (status_baru === 'Divalidasi Pengurus Barang' && jenis === 'Internal' && status_sebelum === 'Diajukan' && user_role === 'Pengurus Barang') {
            await client.query("UPDATE peminjaman SET status = 'Divalidasi Pengurus Barang', validator_pengurus_barang_id = $1 WHERE id = $2", [user_validator_id, id]);
        
        } else if (status_baru === 'Divalidasi Penatausahaan' && jenis === 'Internal' && status_sebelum === 'Divalidasi Pengurus Barang' && user_role === 'Penata Usaha Barang') {
            await client.query("UPDATE peminjaman SET status = 'Divalidasi Penatausahaan' WHERE id = $1", [id]);
            if (barang_ids.length > 0) {
                await client.query("UPDATE barang SET status = 'Dipinjam' WHERE id = ANY($1)", [barang_ids]);
            }

        } else if (status_baru === 'Divalidasi Penatausahaan' && jenis === 'Eksternal' && status_sebelum === 'Diajukan' && user_role === 'Penata Usaha Barang') {
            await client.query("UPDATE peminjaman SET status = 'Divalidasi Penatausahaan' WHERE id = $1", [id]);
            if (barang_ids.length > 0) {
                await client.query("UPDATE barang SET status = 'Dipinjam' WHERE id = ANY($1)", [barang_ids]);
            }

        } else if (status_baru === 'Selesai' && status_sebelum === 'Divalidasi Penatausahaan') {
            await client.query("UPDATE peminjaman SET tanggal_aktual_kembali = NOW(), status = 'Selesai' WHERE id = $1", [id]);
            if (barang_ids.length > 0) {
                await client.query("UPDATE barang SET status = 'Tersedia' WHERE id = ANY($1)", [barang_ids]);
            }
        
        } else if (status_baru === 'Ditolak') {
            await client.query("UPDATE peminjaman SET status = 'Ditolak', catatan_penolakan = $1 WHERE id = $2", [catatan, id]);
            if (barang_ids.length > 0) {
                await client.query("UPDATE barang SET status = 'Tersedia' WHERE id = ANY($1)", [barang_ids]);
            }
        
        } else {
            throw new Error('InvalidStateChange');
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
        if (error.message === 'InvalidStateChange') return res.status(400).json({ message: 'Perubahan status tidak sesuai alur yang ditentukan.' });
        console.error('Error saat update status peminjaman:', error);
        res.status(500).json({ message: 'Terjadi kesalahan pada server' });
    } finally {
        client.release();
    }
};

const getPeminjamanById = async (req, res) => {
    const { id } = req.params;
    try {
        const peminjamanQuery = `
            SELECT p.*, 
                   u.nama as nama_peminjam, u.nip as nip_peminjam, u.jabatan as jabatan_peminjam
            FROM peminjaman p
            JOIN users u ON p.user_peminjam_id = u.id
            WHERE p.id = $1;
        `;
        const peminjamanResult = await pool.query(peminjamanQuery, [id]);

        if (peminjamanResult.rows.length === 0) {
            return res.status(404).json({ message: 'Data peminjaman tidak ditemukan' });
        }
        
        const peminjamanData = peminjamanResult.rows[0];

        const barangQuery = `
            SELECT b.id, b.nama_barang, b.kode_barang, b.merk, b.tipe, b.nilai_perolehan
            FROM peminjaman_detail pd
            JOIN barang b ON pd.barang_id = b.id
            WHERE pd.peminjaman_id = $1;
        `;
        const barangResult = await pool.query(barangQuery, [id]);
        
        peminjamanData.details = barangResult.rows;

        res.json(peminjamanData);
    } catch (error) {
        console.error('Error mengambil detail peminjaman:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

const getPeminjamanByPeminjam = async (req, res) => {
    const user_peminjam_id = req.user.id;
    try {
        const query = `
            SELECT 
                p.id,
                p.nomor_usulan,
                p.status,
                p.jenis,
                p.tanggal_mulai_pinjam,
                p.tanggal_rencana_kembali,
                u.nama AS nama_peminjam,
                (SELECT STRING_AGG(b.nama_barang, ', ') 
                 FROM peminjaman_detail pd 
                 JOIN barang b ON pd.barang_id = b.id 
                 WHERE pd.peminjaman_id = p.id) as nama_barang
            FROM peminjaman p
            JOIN users u ON p.user_peminjam_id = u.id
            WHERE p.user_peminjam_id = $1
            ORDER BY p.tanggal_pengajuan DESC;
        `;
        const { rows } = await pool.query(query, [user_peminjam_id]);
        res.json(rows);
    } catch (error) { 
        console.error('Error detail saat mengambil data peminjaman:', error); 
        res.status(500).json({ message: 'Terjadi kesalahan pada server' });
    }
};

const deletePeminjaman = async (req, res) => {
    const { id: peminjamanId } = req.params;
    const { id: userId } = req.user;

    try {
        const peminjamanQuery = await pool.query(
            'SELECT user_peminjam_id, status FROM peminjaman WHERE id = $1',
            [peminjamanId]
        );

        if (peminjamanQuery.rows.length === 0) {
            return res.status(404).json({ message: 'Peminjaman tidak ditemukan.' });
        }

        const peminjaman = peminjamanQuery.rows[0];

        if (peminjaman.user_peminjam_id !== userId) {
            return res.status(403).json({ message: 'Anda tidak memiliki izin untuk menghapus pengajuan ini.' });
        }

        if (peminjaman.status !== 'Diajukan') {
            return res.status(400).json({ message: 'Pengajuan yang sudah diproses tidak dapat dihapus.' });
        }

        await pool.query('DELETE FROM peminjaman WHERE id = $1', [peminjamanId]);

        res.json({ message: 'Pengajuan peminjaman berhasil dihapus.' });

    } catch (error) {
        console.error('Error saat menghapus peminjaman:', error);
        res.status(500).json({ message: 'Terjadi kesalahan pada server.' });
    }
};

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


const downloadBeritaAcara = async (req, res) => {
    const { id } = req.params;
    try {
        const query = `
            SELECT p.id, p.nomor_usulan, p.tanggal_pengajuan, p.keperluan, p.jenis,
                   p.nama_pihak_kedua, p.nip_pihak_kedua, p.jabatan_pihak_kedua,
                   u.nama as nama_peminjam, u.nip as nip_peminjam, u.jabatan as jabatan_peminjam,
                   validator.nama AS nama_validator, validator.nip AS nip_validator, validator.jabatan AS jabatan_validator
            FROM peminjaman p
            JOIN users u ON p.user_peminjam_id = u.id
            LEFT JOIN users validator ON p.validator_pengurus_barang_id = validator.id
            WHERE p.id = $1;
        `;
        const { rows } = await pool.query(query, [id]);
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Data peminjaman tidak ditemukan.' });
        }
        const data = rows[0];

        const barangQuery = await pool.query(`
            SELECT b.nama_barang, b.merk, b.tipe, b.nilai_perolehan
            FROM peminjaman_detail pd
            JOIN barang b ON pd.barang_id = b.id
            WHERE pd.peminjaman_id = $1
        `, [id]);
        const daftarBarang = barangQuery.rows;

        let pihakPertama = {};
        if (data.jenis === 'Internal') {
            pihakPertama = {
                nama: data.nama_validator || 'Belum Divalidasi',
                nip: data.nip_validator || '-',
                jabatan: data.jabatan_validator || 'Pengurus Barang'
            };
        } else { 
            pihakPertama = {
                nama: 'Y. Ahmad Brilyana, S.Sos, M.Si',
                nip: '19731127 199303 1 003',
                jabatan: 'Kepala Dinas Komunikasi dan Informatika'
            };
        }

        let pihakKedua = {};
        if (data.jenis === 'Internal') {
            pihakKedua = {
                nama: data.nama_peminjam,
                nip: data.nip_peminjam,
                jabatan: data.jabatan_peminjam
            };
        } else { 
            if (!data.nama_pihak_kedua || !data.nip_pihak_kedua || !data.jabatan_pihak_kedua) {
                return res.status(400).json({ message: 'Data Pihak Kedua (eksternal) belum disimpan.' });
            }
            pihakKedua = {
                nama: data.nama_pihak_kedua,
                nip: data.nip_pihak_kedua,
                jabatan: data.jabatan_pihak_kedua
            };
        }
        
        const simpleDate = (date) => new Date(date).toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'});
        const formatRupiah = (number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(number);
        const logoBase64 = imageToBase64('Logo Kota Bandung.png');

        const itemRows = daftarBarang.map((item, index) => `
            <tr>
                <td style="border: 1px solid black; padding: 5px; text-align: center;">${index + 1}</td>
                <td style="border: 1px solid black; padding: 5px;">${item.nama_barang}</td>
                <td style="border: 1px solid black; padding: 5px; text-align: center;">1 Unit</td>
                <td style="border: 1px solid black; padding: 5px; text-align: right;">${formatRupiah(item.nilai_perolehan)}</td>
                <td style="border: 1px solid black; padding: 5px;">Merk/Tipe: ${item.merk || '-'} / ${item.tipe || '-'}</td>
            </tr>
        `).join('');

        const htmlContent = `
        <html>
        <head>
            <style>
                @page { margin: 1.5cm 2.5cm; }
                body { font-family: 'Times New Roman', Times, serif; font-size: 12pt; line-height: 1.5; }
                p { margin: 0; text-align: justify; }
                .title { text-align: center; margin-top: 1em; margin-bottom: 1.5em; }
                .title .main-title { font-size: 14pt; font-weight: bold; text-decoration: underline; display: block; }
                .title .nomor { font-size: 12pt; display: block; margin-top: 0.3em; }
                .info-table { width: 100%; border-collapse: collapse; }
                .info-table td { padding: 2px 0; vertical-align: top; }
                .item-table { width: 100%; border-collapse: collapse; margin-top: 1em; }
                .item-table th, .item-table td { border: 1px solid black; padding: 5px; text-align: left; vertical-align: top; }
                .pasal { text-align: center; font-weight: bold; margin: 1.5em 0 1em; }
                .header-table { width: 100%; border-bottom: 3px solid black; margin-bottom: 2em; }
                .header-table td { vertical-align: middle; }
                .logo { width: 70px; }
                .header-text { text-align: center; }
                .header-text h4, .header-text h5, .header-text p { margin: 0; }
                .header-text h4 { font-size: 16pt; font-weight: bold; }
                .header-text h5 { font-size: 14pt; font-weight: bold; }
                .header-text p { font-size: 10pt; }
                .signature-table { margin-top: 60px; width: 100%; }
                .signature-table td { text-align: center; width: 50%; vertical-align: top; }
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
                    <span class="main-title">BERITA ACARA PINJAM PAKAI BARANG MILIK DAERAH</span>
                    <span class="nomor">Nomor: ${data.nomor_usulan}</span>
                </div>
                <p>${longDateFormatter(new Date(data.tanggal_pengajuan))}, yang bertanda tangan dibawah ini:</p>
                <table class="info-table" style="margin-top:1em; margin-left:20px;">
                    <tr><td width="80px">Nama</td><td width="10px">:</td><td>${pihakPertama.nama}</td></tr>
                    <tr><td>NIP</td><td>:</td><td>${pihakPertama.nip}</td></tr>
                    <tr><td>Jabatan</td><td>:</td><td>${pihakPertama.jabatan}</td></tr>
                    <tr><td colspan="3" style="padding-top:5px;">Yang selanjutnya disebut <b>PIHAK PERTAMA</b>.</td></tr>
                    <tr><td colspan="3" style="height:1em;"></td></tr>
                    <tr><td>Nama</td><td>:</td><td>${pihakKedua.nama || ''}</td></tr>
                    <tr><td>NIP</td><td>:</td><td>${pihakKedua.nip || ''}</td></tr>
                    <tr><td>Jabatan</td><td>:</td><td>${pihakKedua.jabatan || ''}</td></tr>
                    <tr><td colspan="3" style="padding-top:5px;">Yang selanjutnya disebut <b>PIHAK KEDUA</b>.</td></tr>
                </table>
                <p class="pasal">Pasal 1</p>
                <p>PIHAK PERTAMA telah menyerahkan (pinjam pakai) kepada PIHAK KEDUA Barang Inventaris Daerah sebagai berikut :</p>
                <table class="item-table" style="margin:1em 0;">
                    <thead>
                        <tr><th>No</th><th>Nama Barang</th><th>Jumlah</th><th>Harga</th><th>Keterangan</th></tr>
                    </thead>
                    <tbody>${itemRows}</tbody>
                </table>
                <p class="pasal">Pasal 2</p>
                <p>Barang Inventaris dimaksud pada pasal 1 digunakan semata mata untuk menunjang kegiatan ${data.keperluan || 'Dinas'} dan diatur dengan ketentuan sebagai berikut :</p>
                <ol style="margin-top:0.5em; padding-left:20px;">
                    <li>Segala biaya sarana, prasarana, kerusakan, perbaikan, serta kelengkapan barang inventaris tersebut menjadi tanggung jawab PIHAK KEDUA.</li>
                    <li>PIHAK KEDUA wajib memelihara dan bertanggung jawab atas barang inventaris yang digunakan, termasuk bila terjadi kerusakan atau hilang sesuai ketentuan yang berlaku.</li>
                    <li>Tidak dibenarkan untuk merubah, menambah, atau mengurangi fasilitas/perlengkapan yang terdapat pada barang inventaris tersebut.</li>
                </ol>
            </div>
            <div class="page-break">
                <p class="pasal">Pasal 3</p>
                <p>Hal-hal yang belum diatur dalam berita acara ini akan diatur kemudian.</p>
                <p style="margin-top:1em;">Demikian berita acara ini dibuat untuk dipergunakan sebagaimana mestinya.</p>
                <div style="margin-top:2cm; text-align:right;">Bandung, ${simpleDate(new Date())}</div>
                <table class="signature-table">
                    <tr>
                        <td>
                            <div>PIHAK PERTAMA,</div>
                            <div>${pihakPertama.jabatan}</div>
                            <div style="height:80px;"></div>
                            <div style="text-decoration: underline;"><b>${pihakPertama.nama}</b></div>
                            <div>NIP. ${pihakPertama.nip}</div>
                        </td>
                        <td>
                            <div>PIHAK KEDUA,</div>
                            <div>${pihakKedua.jabatan || ''}</div>
                            <div style="height:80px;"></div>
                            <div style="text-decoration: underline;"><b>${pihakKedua.nama || ''}</b></div>
                            <div>NIP. ${pihakKedua.nip || ''}</div>
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
            'Content-Disposition': `attachment; filename="berita-acara-peminjaman-${data.nomor_usulan}.pdf"`
        });
        res.send(pdfBuffer);

    } catch (error) {
        console.error('Error saat membuat Berita Acara PDF:', error);
        res.status(500).json({ message: 'Gagal membuat Berita Acara PDF.' });
    }
};

const getPeminjamanLogs = async (req, res) => {
    const { id: peminjamanId } = req.params;
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
            WHERE log.peminjaman_id = $1
            ORDER BY log.waktu_validasi ASC;
        `;
        const { rows } = await pool.query(query, [peminjamanId]);
        res.json(rows);
    } catch (error) {
        console.error('Error saat mengambil log validasi peminjaman:', error);
        res.status(500).json({ message: 'Terjadi kesalahan pada server' });
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
    getPeminjamanLogs,
};