const express = require('express');
const router = express.Router();
const {
  getAllLokasi,
  createLokasi,
  updateLokasi, 
  getLokasiById,  
} = require('../controllers/lokasiController');
const verifyToken = require('../middleware/verifyToken');

router.use(verifyToken);

router.route('/lokasi')
  .get(getAllLokasi)
  .post(createLokasi);

router.route('/lokasi/:id')
  .get(getLokasiById)
  .put(updateLokasi);

module.exports = router;