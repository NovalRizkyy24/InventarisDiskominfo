const pool = require('../config/db');
const puppeteer = require('puppeteer'); 

/**
 * @desc    Generate Laporan Daftar Barang (Buku Inventaris)
 * @route   GET /api/laporan/daftar-barang
 * @access  Private
 */
const generateLaporanDaftarBarang = async (req, res) => {
    const { status, kategori_id, tanggal_mulai, tanggal_akhir } = req.query;

    try {
        let queryText = `
            SELECT 
                b.kode_barang, b.nama_barang, k.nama_kategori, b.merk, b.tipe,
                b.tanggal_perolehan, b.nilai_perolehan, b.status, l.nama_lokasi
            FROM barang b
            LEFT JOIN kategori_barang k ON b.kategori_id = k.id
            LEFT JOIN lokasi l ON b.lokasi_id = l.id
            WHERE 1=1
        `;
        const queryParams = [];

        if (status) {
            queryParams.push(status);
            queryText += ` AND b.status = $${queryParams.length}`;
        }
        if (kategori_id) {
            queryParams.push(kategori_id);
            queryText += ` AND b.kategori_id = $${queryParams.length}`;
        }
        if (tanggal_mulai && tanggal_akhir) {
            queryParams.push(tanggal_mulai, tanggal_akhir);
            queryText += ` AND b.tanggal_perolehan BETWEEN $${queryParams.length - 1} AND $${queryParams.length}`;
        }
        queryText += ' ORDER BY b.tanggal_perolehan ASC;';

        const { rows } = await pool.query(queryText, queryParams);
        
        res.json(rows);

    } catch (error) {
        console.error('Error saat membuat laporan daftar barang:', error);
        res.status(500).json({ message: 'Terjadi kesalahan pada server' });
    }
};

const generateLaporanTransaksi = async (req, res) => {
    res.json({ message: 'Endpoint untuk laporan transaksi belum diimplementasikan.' });
};


module.exports = {
    generateLaporanDaftarBarang,
    generateLaporanTransaksi
};