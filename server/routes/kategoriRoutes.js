const express = require('express');
const router = express.Router();
const {
  getAllKategori,
  getKategoriById,
  createKategori,
  updateKategori,
  deleteKategori,
} = require('../controllers/kategoriController');
const verifyToken = require('../middleware/verifyToken');

// Semua rute kategori dilindungi
router.use(verifyToken);

router.route('/kategori')
  .get(getAllKategori)
  .post(createKategori);

router.route('/kategori/:id')
  .get(getKategoriById)
  .put(updateKategori)
  .delete(deleteKategori);

module.exports = router;