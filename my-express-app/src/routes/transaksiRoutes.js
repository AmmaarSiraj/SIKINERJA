// src/routes/transaksiRoutes.js
const express = require('express');
const router = express.Router();
const { getTransaksiMitra } = require('../controllers/transaksiController');
const authMiddleware = require('../midleware/authMiddleware');

// Endpoint: /api/transaksi
router.get('/', authMiddleware.protect, getTransaksiMitra);

module.exports = router;