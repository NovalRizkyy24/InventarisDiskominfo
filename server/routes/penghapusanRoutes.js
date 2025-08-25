const express = require('express');
const router = express.Router();
const {
    createPenghapusan,
    getAllPenghapusan,
    updateStatusPenghapusan,
    getPenghapusanById,
    getPenghapusanLogs
} = require('../controllers/penghapusanController');
const verifyToken = require('../middleware/verifyToken');

router.use(verifyToken);

router.route('/penghapusan')
    .post(createPenghapusan)
    .get(getAllPenghapusan);
    
router.get('/penghapusan/:id/logs', getPenghapusanLogs);

router.route('/penghapusan/:id') 
    .get(getPenghapusanById);
    
router.put('/penghapusan/:id/status', updateStatusPenghapusan);

module.exports = router;