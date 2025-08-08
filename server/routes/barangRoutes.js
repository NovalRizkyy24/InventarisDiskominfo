const express = require('express');
const router = express.Router();
const { 
    getAllBarang, 
    getBarangById, 
    createBarang, 
    updateBarang, 
    deleteBarang 
} = require('../controllers/barangController');
const verifyToken = require('../middleware/verifyToken');

// Semua rute barang dilindungi
router.use(verifyToken);

router.route('/barang')
    .get(getAllBarang)
    .post(createBarang);

router.route('/barang/:id')
    .get(getBarangById)
    .put(updateBarang)
    .delete(deleteBarang);

module.exports = router;