const express = require('express');
const router = express.Router();
const {
    createPeminjaman,
    getAllPeminjaman,
    updateStatusPeminjaman,
    getPeminjamanById,
    getPeminjamanByPeminjam,
    deletePeminjaman,
    savePihakKedua,       // Pastikan ini diimpor
    downloadBeritaAcara
} = require('../controllers/peminjamanController');
const verifyToken = require('../middleware/verifyToken');

router.use(verifyToken);

router.get('/peminjaman/saya', getPeminjamanByPeminjam);

router.route('/peminjaman')
    .post(createPeminjaman)
    .get(getAllPeminjaman);
    
router.put('/peminjaman/:id/status', updateStatusPeminjaman);

// --- PASTIKAN BAGIAN INI SUDAH BENAR ---
// Rute untuk menyimpan data (Method: PUT)
router.put('/peminjaman/:id/pihak-kedua', savePihakKedua);

// Rute untuk download PDF (Method: GET)
router.get('/peminjaman/:id/download-berita-acara', downloadBeritaAcara);
// --- AKHIR PERBAIKAN ---

router.route('/peminjaman/:id')
    .get(getPeminjamanById)
    .delete(deletePeminjaman);

module.exports = router;