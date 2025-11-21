const express = require('express');
const router = express.Router();
const {
  createSubKegiatan,
  getSubKegiatanByKegiatanId,
  getSubKegiatanById,
  updateSubKegiatanStatus,
  deleteSubKegiatan,
  getAllSubKegiatan
} = require('../controllers/subKegiatanController');

// Endpoint yang kita butuhkan untuk halaman detail
router.get('/kegiatan/:id_kegiatan', getSubKegiatanByKegiatanId);
router.put('/:id/status', updateSubKegiatanStatus);

// Endpoint untuk admin (jika perlu)
router.post('/', createSubKegiatan);
router.delete('/:id', deleteSubKegiatan);
router.get('/:id', getSubKegiatanById);
router.get('/', getAllSubKegiatan);

module.exports = router;