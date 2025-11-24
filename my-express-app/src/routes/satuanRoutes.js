// src/routes/satuanRoutes.js
const express = require('express');
const router = express.Router();
const { getAllSatuan } = require('../controllers/satuanController');

// GET /api/satuan
router.get('/', getAllSatuan);

module.exports = router;