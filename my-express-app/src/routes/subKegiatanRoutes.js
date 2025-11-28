const express = require('express');
const router = express.Router();
const {
  createSubKegiatan,
  getSubKegiatanByKegiatanId,
  getSubKegiatanById,
  updateSubKegiatanStatus,
  updateSubKegiatanInfo, // <--- 1. PASTIKAN INI DI-IMPORT
  deleteSubKegiatan,
  getAllSubKegiatan,
  importSubKegiatan
} = require('../controllers/subKegiatanController');

const uploadMitra = require('../midleware/uploadMitra');

// Endpoint yang kita butuhkan untuk halaman detail
router.get('/kegiatan/:id_kegiatan', getSubKegiatanByKegiatanId);
router.put('/:id/status', updateSubKegiatanStatus);

// --- TAMBAHKAN BARIS INI ---
router.put('/:id/info', updateSubKegiatanInfo); // <--- 2. DAFTARKAN ROUTE INI
// ---------------------------

// Endpoint untuk admin (jika perlu)
router.post('/', createSubKegiatan);
router.delete('/:id', deleteSubKegiatan);
router.get('/:id', getSubKegiatanById);
router.get('/', getAllSubKegiatan);

router.post('/import', 
    uploadMitra.single('file'), 
    importSubKegiatan
);

module.exports = router;