const express = require('express');
const router = express.Router();
const {
    createPeminjaman,
    getAllPeminjaman,
    updateStatusPeminjaman,
    getPeminjamanById,
    getPeminjamanByPeminjam,
    deletePeminjaman
} = require('../controllers/peminjamanController');
const verifyToken = require('../middleware/verifyToken');

router.use(verifyToken);

router.get('/peminjaman/saya', getPeminjamanByPeminjam);

router.route('/peminjaman')
    .post(createPeminjaman)
    .get(getAllPeminjaman);
    
router.put('/peminjaman/:id/status', updateStatusPeminjaman);

router.route('/peminjaman/:id')
    .get(getPeminjamanById)
    .delete(deletePeminjaman);

module.exports = router;