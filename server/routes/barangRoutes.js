const express = require('express');
const router = express.Router();
const { 
    getAllBarang, 
    getBarangById, 
    createBarang, 
    updateBarang, 
    deleteBarang,
    validateBarang 
} = require('../controllers/barangController');
const verifyToken = require('../middleware/verifyToken');

// Semua rute barang dilindungi
router.use(verifyToken);

router.route('/barang')
    .get(getAllBarang)
    .post(createBarang);

router.put('/barang/:id/validate', validateBarang);

router.route('/barang/:id')
    .get(getBarangById)
    .put(updateBarang)
    .delete(deleteBarang);

module.exports = router;