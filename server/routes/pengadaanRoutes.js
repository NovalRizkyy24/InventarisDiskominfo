const express = require('express');
const router = express.Router();
const {
    createPengadaan,
    getAllPengadaan,
    getPengadaanById,
    updateStatusPengadaan,
    downloadSuratPengadaan,
    getPengadaanByPengusul,
    getPengadaanLogs,
    deletePengadaan,
    validatePengadaanItems  
} = require('../controllers/pengadaanController');
const verifyToken = require('../middleware/verifyToken');

router.use(verifyToken);

router.route('/pengadaan')
    .post(createPengadaan)
    .get(getAllPengadaan);

router.get('/pengadaan/saya', getPengadaanByPengusul); 

router.put('/pengadaan/:id/validate-items', validatePengadaanItems);

router.route('/pengadaan/:id')
    .get(getPengadaanById)
    .delete(deletePengadaan);

router.put('/pengadaan/:id/status', updateStatusPengadaan);

router.get('/pengadaan/:id/download-surat', downloadSuratPengadaan);

router.get('/pengadaan/:id/logs', getPengadaanLogs);

module.exports = router;