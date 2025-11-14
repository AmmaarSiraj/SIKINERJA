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
} = require('../controllers/userController');

const authMiddleware = require('../midleware/authMiddleware');

// Auth
router.post('/register', registerUser);
router.post('/login', loginUser);

// Protected routes (perlu JWT)
router.get('/', authMiddleware, getUsers);
router.get('/:id', authMiddleware, getUserById);
router.put('/:id', authMiddleware, updateUser);
router.delete('/:id', authMiddleware, deleteUser);

module.exports = router;
