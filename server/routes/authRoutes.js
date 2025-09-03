const express = require('express');
const router = express.Router();
const { loginUser, 
        getAllUsers, 
        deleteUser, 
        getUserById, 
        updateUser,
        createUser,
        getUsersByRole,
        logoutUser 
    } = require('../controllers/authController');
    
const verifyToken = require('../middleware/verifyToken'); 

router.post('/login', loginUser);
router.post('/logout', verifyToken, logoutUser);
router.get('/users', verifyToken, getAllUsers);
router.get('/users/role/:role', verifyToken, getUsersByRole);
router.delete('/users/:id', verifyToken, deleteUser);
router.get('/users/:id', verifyToken, getUserById);
router.put('/users/:id', verifyToken, updateUser);
router.post('/users', verifyToken, createUser);

module.exports = router;