const express = require('express');
const router = express.Router();
const {
  createKegiatan,
  getAllKegiatan,
  getKegiatanById,
  updateKegiatan,
  deleteKegiatan,
} = require('../controllers/kegiatanController');

// --- UBAH BAGIAN INI ---
// Hapus baris lama: const { protect, admin } = require('../midleware/authMiddleware');
// Ganti dengan ini:
// ----------------------

// --- LALU TAMBAHKAN "authMiddleware." DI DEPAN protect & admin ---
router.post('/',createKegiatan);
router.get('/', getAllKegiatan);
router.get('/:id', getKegiatanById);
router.put('/:id', updateKegiatan);
router.delete('/:id', deleteKegiatan);
// -----------------------------------------------------------------

module.exports = router;