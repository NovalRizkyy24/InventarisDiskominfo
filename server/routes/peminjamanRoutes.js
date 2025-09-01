const express = require('express');
const router = express.Router();
const {
    createPeminjaman,
    getAllPeminjaman,
    updateStatusPeminjaman,
    getPeminjamanById,
    getPeminjamanByPeminjam,
    deletePeminjaman,
    savePihakKedua,
    downloadBeritaAcara,
    getPeminjamanLogs
} = require('../controllers/peminjamanController');
const verifyToken = require('../middleware/verifyToken');
const upload = require('../middleware/uploadSuratPeminjamanExternal'); 

router.use(verifyToken);

router.get('/peminjaman/saya', getPeminjamanByPeminjam);

router.route('/peminjaman')
    .post(upload.single('surat_peminjaman'), createPeminjaman)
    .get(getAllPeminjaman);
    
router.put('/peminjaman/:id/status', updateStatusPeminjaman);
router.put('/peminjaman/:id/pihak-kedua', savePihakKedua);
router.get('/peminjaman/:id/download-berita-acara', downloadBeritaAcara);
router.get('/peminjaman/:id/logs', getPeminjamanLogs);

router.route('/peminjaman/:id')
    .get(getPeminjamanById)
    .delete(deletePeminjaman);

module.exports = router;