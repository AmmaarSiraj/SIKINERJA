// src/routes/kelompokPerencanaanRoutes.js
const express = require('express');
const router = express.Router();
const {
  addMitraToPerencanaan,
  removeMitraFromPerencanaan,
  getAllKelompokPerencanaan,
  updateKelompokPerencanaan
} = require('../controllers/kelompokPerencanaanController');

// Menambah mitra ke perencanaan
router.post('/', addMitraToPerencanaan);

// Menghapus mitra dari perencanaan
router.delete('/:id', removeMitraFromPerencanaan);

// Melihat semua daftar relasi
router.get('/', getAllKelompokPerencanaan);

// Update data (jabatan/volume) di perencanaan
router.put('/:id', updateKelompokPerencanaan);

module.exports = router;