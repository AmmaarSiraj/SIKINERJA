// src/routes/userRoutes.js
const express = require('express');
const router = express.Router();
const {
  registerUser,
  loginUser,
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  importUsers,
} = require('../controllers/userController');
// Ubah cara import di sini:
const authMiddleware = require('../midleware/authMiddleware');
const uploadMitra = require('../midleware/uploadMitra');

router.post('/register', registerUser);
router.post('/login', loginUser);

// Gunakan authMiddleware.protect dan authMiddleware.admin
router.get('/', authMiddleware.protect, authMiddleware.admin, getUsers);
router.get('/:id', authMiddleware.protect, authMiddleware.admin, getUserById);
router.put('/:id', authMiddleware.protect, authMiddleware.admin, updateUser);
router.delete('/:id', authMiddleware.protect, authMiddleware.admin, deleteUser);
router.get('/un/:id', getUserById);
router.post('/import', 
  authMiddleware.protect, 
  authMiddleware.admin, 
  uploadMitra.single('file'), 
  importUsers
);

// Rute 'tes' ini dari file asli Anda, saya biarkan
router.get('/tes', (req, res) => {
  res.json({ message: 'rute tes user' });
});

module.exports = router;