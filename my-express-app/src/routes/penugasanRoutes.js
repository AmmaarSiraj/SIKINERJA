// src/routes/penugasanRoutes.js
const express = require('express');
const router = express.Router();

// 1. Import Controller
const {
  createPenugasan,
  getAllPenugasan,
  getPenugasanById,
  updatePenugasan,
  deletePenugasan,
  getAnggotaByPenugasanId,
  importPenugasan 
} = require('../controllers/penugasanController');

// 2. Import Middleware Upload (Tanpa Auth Middleware)
const uploadMitra = require('../midleware/uploadMitra'); 

// --- DEFINISI RUTE ---

// Rute Import (Tanpa Cek Login/Admin)
router.post('/import', 
    uploadMitra.single('file'), // Tetap butuh ini untuk membaca file excel/csv
    importPenugasan
);

// Rute CRUD Penugasan
router.post('/', createPenugasan);
router.put('/:id', updatePenugasan);
router.delete('/:id', deletePenugasan);

// Rute Lihat Data
router.get('/', getAllPenugasan);
router.get('/:id', getPenugasanById);
router.get('/:id/anggota', getAnggotaByPenugasanId);

module.exports = router;