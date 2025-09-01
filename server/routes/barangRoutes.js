const express = require('express');
const router = express.Router();
const { 
    getAllBarang, 
    getBarangById, // Kita akan gunakan lagi fungsi ini
    createBarang, 
    updateBarang, 
    deleteBarang,
    validateBarang,
    regenerateQrCode,
    getBarangLogs, 
    uploadFotoBarang
} = require('../controllers/barangController');
const verifyToken = require('../middleware/verifyToken');
const uploadFoto = require('../middleware/uploadFoto');

router.get('/barang/public/:id', getBarangById);

router.use(verifyToken);

router.post('/barang/:id/upload-foto', uploadFoto.single('foto_barang'), uploadFotoBarang);

router.route('/barang')
    .get(getAllBarang)
    .post(createBarang);

router.put('/barang/:id/validate', validateBarang);

router.get('/barang/:id/logs', getBarangLogs);

router.route('/barang/:id')
    .get(getBarangById)
    .put(updateBarang)
    .delete(deleteBarang);

router.put('/barang/:id/regenerate-qr', regenerateQrCode);

module.exports = router;