const express = require('express');
const router = express.Router();
const {
    createPengadaan,
    getAllPengadaan,
    getPengadaanById,
    updateStatusPengadaan,
    downloadSuratPengadaan,
    getPengadaanByPengusul,
    getPengadaanLogs 
} = require('../controllers/pengadaanController');
const verifyToken = require('../middleware/verifyToken');

router.use(verifyToken);

router.route('/pengadaan')
    .post(createPengadaan)
    .get(getAllPengadaan);

router.get('/pengadaan/saya', getPengadaanByPengusul); 

router.route('/pengadaan/:id')
    .get(getPengadaanById);

router.put('/pengadaan/:id/status', updateStatusPengadaan);

router.get('/pengadaan/:id/download-surat', downloadSuratPengadaan);

router.get('/pengadaan/:id/logs', getPengadaanLogs);

module.exports = router;