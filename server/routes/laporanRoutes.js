const express = require('express');
const router = express.Router();
const { 
    generateLaporanDaftarBarang,
    generateLaporanPeminjaman,
    generateLaporanPenghapusan,
    generateLaporanPengadaan,
    exportLaporan 
} = require('../controllers/laporanController');
const verifyToken = require('../middleware/verifyToken');

router.use(verifyToken);

router.get('/laporan/daftar-barang', generateLaporanDaftarBarang);
router.get('/laporan/peminjaman', generateLaporanPeminjaman);
router.get('/laporan/penghapusan', generateLaporanPenghapusan);
router.get('/laporan/pengadaan', generateLaporanPengadaan);
router.post('/laporan/export', exportLaporan);

module.exports = router;