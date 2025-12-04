// src/routes/kelompokPenugasanRoutes.js
const express = require('express');
const router = express.Router();
const {
  addMitraToPenugasan,
  removeMitraFromPenugasan,
  getAllKelompokPenugasan,
  updateKelompokPenugasan
} = require('../controllers/kelompokPenugasanController');
// const authMiddleware = require('../midleware/authMiddleware'); // Dihapus

// router.use(authMiddleware.protect, authMiddleware.admin); // Dihapus

// Menambah mitra ke penugasan
router.post('/', addMitraToPenugasan);

// Menghapus mitra dari penugasan (berdasarkan ID unik di tabel kelompok_penugasan)
router.delete('/:id', removeMitraFromPenugasan);

// Melihat semua daftar relasi (untuk admin dashboard)
router.get('/', getAllKelompokPenugasan);
router.put('/:id', updateKelompokPenugasan);

module.exports = router;