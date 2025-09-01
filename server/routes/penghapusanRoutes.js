const express = require('express');
const router = express.Router();
const {
    createPenghapusan,
    getAllPenghapusan,
    updateStatusPenghapusan,
    getPenghapusanById,
    getPenghapusanLogs,
    getPenghapusanByPengusul,
    downloadBeritaAcaraPenghapusan,
    uploadBeritaAcara,
    deleteBeritaAcara,
} = require('../controllers/penghapusanController');
const verifyToken = require('../middleware/verifyToken');
const uploadBukti = require('../middleware/uploadBuktiPenghapusan');

// Ubah nama variabel middleware di sini
const uploadBAMiddleware = require('../middleware/uploadBeritaAcaraPenghapusan');

router.use(verifyToken);

router.get('/penghapusan/saya', getPenghapusanByPengusul); 

router.route('/penghapusan')
    .post(uploadBukti.single('foto_kerusakan'), createPenghapusan)
    .get(getAllPenghapusan);
    
router.get('/penghapusan/:id/logs', getPenghapusanLogs);

router.get('/penghapusan/:id/download-berita-acara', downloadBeritaAcaraPenghapusan);

router.route('/penghapusan/:id') 
    .get(getPenghapusanById);
    
router.put('/penghapusan/:id/status', updateStatusPenghapusan);

router.put(
    '/penghapusan/:id/upload-ba',
    uploadBAMiddleware.single('berita_acara'), 
    uploadBeritaAcara 
);

router.delete('/penghapusan/:id/delete-ba', deleteBeritaAcara);

module.exports = router;