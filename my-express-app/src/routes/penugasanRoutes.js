// src/routes/penugasanRoutes.js
const express = require('express');
const router = express.Router();
const {
  createPenugasan,
  getAllPenugasan,
  getPenugasanById,
  updatePenugasan,
  deletePenugasan,
  getAnggotaByPenugasanId
} = require('../controllers/penugasanController');
// const authMiddleware = require('../midleware/authMiddleware'); // Dihapus

// Rute untuk mengelola penugasan
router.post('/', createPenugasan);
router.put('/:id', updatePenugasan);
router.delete('/:id', deletePenugasan);

// Rute untuk melihat data penugasan
router.get('/', getAllPenugasan);
router.get('/:id', getPenugasanById);

// Rute untuk melihat siapa saja anggota/mitra dalam 1 penugasan
router.get('/:id/anggota', getAnggotaByPenugasanId);

module.exports = router;