// src/routes/pengajuanMitraRoutes.js
const express = require('express');
const router = express.Router();
const {
  createPengajuan,
  getPengajuanByUserId,
} = require('../controllers/pengajuanMitraController');
// const authMiddleware = require('../midleware/authMiddleware'); // Dihapus

// User yang login (role apa saja) bisa membuat pengajuan
router.post('/', createPengajuan); // authMiddleware dihapus

// User yang login bisa mengecek status pengajuannya sendiri
router.get(
  '/user/:id_user',
  getPengajuanByUserId // authMiddleware dihapus
);

module.exports = router;