const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');

// URL akan menjadi /api/register
router.post('/register', authController.registerUser);

// URL akan menjadi /api/login
router.post('/login', authController.loginUser);

module.exports = router;