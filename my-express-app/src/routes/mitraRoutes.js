const express = require('express');
const router = express.Router();

// Import Controller
const {
    createMitra,
    getAllMitra,
    getMitraById,
    updateMitra,
    deleteMitra,
    importMitra,
} = require('../controllers/mitraController');

// Import Middleware Auth
const authMiddleware = require('../midleware/authMiddleware');

// Import Middleware Upload
const uploadMitra = require('../midleware/uploadMitra'); 

// --- DEFINISI RUTE ---

// Rute Import (Letakkan di atas)
router.post('/import', 
    authMiddleware.protect, 
    authMiddleware.admin, 
    uploadMitra.single('file'), 
    importMitra
);

// Rute CRUD Standar
router.post('/', authMiddleware.protect, createMitra);
router.get('/', authMiddleware.protect, getAllMitra);
router.get('/:id', authMiddleware.protect, getMitraById);
router.put('/:id', authMiddleware.protect, authMiddleware.admin, updateMitra);
router.delete('/:id', authMiddleware.protect, authMiddleware.admin, deleteMitra);

// CATATAN: Rute getMitraByUserId sudah DIHAPUS karena id_user sudah tidak ada di tabel mitra.

module.exports = router;