const express = require('express');
const router = express.Router();
const {
    createPenghapusan,
    getAllPenghapusan,
    updateStatusPenghapusan
} = require('../controllers/penghapusanController');
const verifyToken = require('../middleware/verifyToken');

router.use(verifyToken);

router.route('/penghapusan')
    .post(createPenghapusan)
    .get(getAllPenghapusan);
    
router.put('/penghapusan/:id/status', updateStatusPenghapusan);

module.exports = router;