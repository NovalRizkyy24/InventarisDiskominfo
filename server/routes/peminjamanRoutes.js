const express = require('express');
const router = express.Router();
const {
    createPeminjaman,
    getAllPeminjaman,
    updateStatusPeminjaman
} = require('../controllers/peminjamanController');
const verifyToken = require('../middleware/verifyToken');

router.use(verifyToken);

router.route('/peminjaman')
    .post(createPeminjaman)
    .get(getAllPeminjaman);
    
router.put('/peminjaman/:id/status', updateStatusPeminjaman);

module.exports = router;