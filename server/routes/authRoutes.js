const express = require('express');
const router = express.Router();
const { loginUser, 
        getAllUsers, 
        deleteUser, 
        getUserById, 
        updateUser,
        createUser,
        getUsersByRole 
    } = require('../controllers/authController');
    
const verifyToken = require('../middleware/verifyToken'); // Impor middleware

router.post('/login', loginUser);

// Rute untuk mendapatkan semua pengguna (dilindungi)
router.get('/users', verifyToken, getAllUsers);

router.get('/users/role/:role', verifyToken, getUsersByRole);

// Rute untuk menghapus pengguna (dilindungi)
router.delete('/users/:id', verifyToken, deleteUser);

// Rute untuk mendapatkan satu pengguna berdasarkan ID (dilindungi)
router.get('/users/:id', verifyToken, getUserById);

// Rute untuk memperbarui pengguna (dilindungi)
router.put('/users/:id', verifyToken, updateUser);

// Rute untuk membuat pengguna baru (dilindungi)
router.post('/users', verifyToken, createUser);


module.exports = router;