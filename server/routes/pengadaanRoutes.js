const express = require('express');
const router = express.Router();
const {
    createPengadaan,
    getAllPengadaan,
    getPengadaanById,
    updateStatusPengadaan,
    getDetailForSurat
} = require('../controllers/pengadaanController');
const verifyToken = require('../middleware/verifyToken');

router.use(verifyToken);

router.route('/pengadaan')
    .post(createPengadaan)
    .get(getAllPengadaan);

router.route('/pengadaan/:id')
    .get(getPengadaanById);

router.put('/pengadaan/:id/status', updateStatusPengadaan);

router.get('/pengadaan/:id/data-surat', getDetailForSurat);

module.exports = router;