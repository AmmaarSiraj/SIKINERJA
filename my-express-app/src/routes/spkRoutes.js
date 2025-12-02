// src/routes/spkRoutes.js
const express = require('express');
const router = express.Router();
const {
  getSPKPeriods,
  getSPKSetting,
  saveSPKSetting,
  getMitraByPeriod,
  getPrintData
} = require('../controllers/spkController');

// Daftar endpoint
router.get('/periods', getSPKPeriods);               // List Periode
router.get('/setting/:periode', getSPKSetting);      // Ambil Config Surat
router.post('/setting', saveSPKSetting);             // Simpan Config Surat
router.get('/mitra/:periode', getMitraByPeriod);     // List Mitra di Periode itu
router.get('/print/:periode/:id_mitra', getPrintData); // Data detail untuk Print

module.exports = router;