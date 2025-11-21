// src/routes/kegiatanRoutes.js
const express = require('express');
const router = express.Router();

// Import Controller
// Pastikan nama fungsi di sini SAMA PERSIS dengan yang ada di module.exports controller
const {
  createKegiatan,
  getAllKegiatan,
  getKegiatanById,
  updateKegiatan,
  deleteKegiatan,
} = require('../controllers/kegiatanController');

// --- DEFINISI RUTE (Tanpa Auth / Public Access) ---

// GET: Bisa diakses siapa saja (User & Admin)
router.get('/', getAllKegiatan);
router.get('/:id', getKegiatanById);

// POST/PUT/DELETE: 
// Jika Anda ingin ini Public juga, biarkan seperti ini. 
// Jika ingin dibatasi admin tapi tanpa token error, nanti bisa ditambahkan middleware.
router.post('/', createKegiatan);
router.put('/:id', updateKegiatan);
router.delete('/:id', deleteKegiatan);

module.exports = router;