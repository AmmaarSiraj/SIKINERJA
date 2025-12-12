// src/routes/dashboardRoutes.js
const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');

// PERBAIKAN DI SINI: Ubah 'verifyToken' menjadi 'protect'
const { protect } = require('../midleware/authMiddleware'); 

// Gunakan 'protect' di route
router.get('/stats', protect, dashboardController.getDashboardStats);

module.exports = router;