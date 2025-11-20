// src/routes/laporanFormRoutes.js
const express = require('express');
const router = express.Router();
const {
  getFormByKegiatanId,
  saveFormSettings,
  getAllForms,
} = require('../controllers/laporanFormController');

// GET /api/laporan-form/kegiatan/:id_kegiatan
// Digunakan oleh Admin (saat mau edit) dan User (saat mau lapor)
router.get('/kegiatan/:id_kegiatan', getFormByKegiatanId);

// POST /api/laporan-form
// Digunakan oleh Admin untuk menyimpan/update struktur form
router.post('/', saveFormSettings);

router.get('/', getAllForms);

module.exports = router;