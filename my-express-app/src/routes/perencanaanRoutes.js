// src/routes/perencanaanRoutes.js
const express = require('express');
const router = express.Router();

// 1. Import Controller Perencanaan
const {
  createPerencanaan,
  getAllPerencanaan,
  getPerencanaanById,
  updatePerencanaan,
  deletePerencanaan,
  getAnggotaByPerencanaanId,
  importPerencanaan 
} = require('../controllers/perencanaanController');

// 2. Import Middleware Upload
const uploadMitra = require('../midleware/uploadMitra'); 

// --- DEFINISI RUTE ---

// Rute Import
router.post('/import', 
    uploadMitra.single('file'), 
    importPerencanaan
);

// Rute CRUD Perencanaan
router.post('/', createPerencanaan);
router.put('/:id', updatePerencanaan);
router.delete('/:id', deletePerencanaan);

// Rute Lihat Data
router.get('/', getAllPerencanaan);
router.get('/:id', getPerencanaanById);
router.get('/:id/anggota', getAnggotaByPerencanaanId);

module.exports = router;