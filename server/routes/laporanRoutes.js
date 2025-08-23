const express = require('express');
const router = express.Router();
const { 
    generateLaporanDaftarBarang,
    generateLaporanTransaksi
} = require('../controllers/laporanController');
const verifyToken = require('../middleware/verifyToken');

router.use(verifyToken);

router.get('/laporan/daftar-barang', generateLaporanDaftarBarang);

router.get('/laporan/transaksi', generateLaporanTransaksi);

module.exports = router;