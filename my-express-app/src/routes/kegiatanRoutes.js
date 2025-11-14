// src/routes/kegiatanRoutes.js
const express = require('express');
const router = express.Router();

const {
  createKegiatan,
  getAllKegiatan,
  getKegiatanById,
  updateKegiatan,
  deleteKegiatan,
} = require('../controllers/kegiatanController');

const authMiddleware = require('../midleware/authMiddleware');

// Semua route di bawah ini akan dilindungi oleh authMiddleware
// Memastikan hanya user yang login yang bisa mengakses
router.use(authMiddleware);

// CRUD Endpoints
router.post('/', createKegiatan);
router.get('/', getAllKegiatan);
router.get('/:id', getKegiatanById);
router.put('/:id', updateKegiatan);
router.delete('/:id', deleteKegiatan);

module.exports = router;