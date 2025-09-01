const express = require('express');
const router = express.Router();
const { 
    getAdminDashboardSummary, 
    getPengurusBarangDashboardSummary, 
    getPenataUsahaDashboardSummary,
    getPpkDashboardSummary,
    getKepalaDinasDashboardSummary 
} = require('../controllers/dashboardController');
const verifyToken = require('../middleware/verifyToken');

router.use(verifyToken);

router.get('/dashboard/admin-summary', getAdminDashboardSummary);
router.get('/dashboard/pengurus-barang-summary', getPengurusBarangDashboardSummary);
router.get('/dashboard/penata-usaha-summary', getPenataUsahaDashboardSummary);
router.get('/dashboard/ppk-summary', getPpkDashboardSummary);
router.get('/dashboard/kepala-dinas-summary', getKepalaDinasDashboardSummary); 

module.exports = router;