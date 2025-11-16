const express = require('express');
const router = express.Router();
const {
    createMitra,
    getAllMitra,
    getMitraById,
    getMitraByUserId,
    updateMitra,
    deleteMitra
} = require('../controllers/mitraController');

// --- UBAH BAGIAN INI ---
// Hapus baris lama: const { protect, admin } = require('../midleware/authMiddleware');
// Ganti dengan ini:
const authMiddleware = require('../midleware/authMiddleware');
// ----------------------

// --- LALU TAMBAHKAN "authMiddleware." DI DEPAN protect & admin ---
router.post('/', authMiddleware.protect, authMiddleware.admin, createMitra);
router.get('/', authMiddleware.protect, authMiddleware.admin, getAllMitra);
router.get('/:id', authMiddleware.protect, getMitraById);
router.get('/user/:id_user', authMiddleware.protect, getMitraByUserId); 
router.put('/:id', authMiddleware.protect, authMiddleware.admin, updateMitra);
router.delete('/:id', authMiddleware.protect, authMiddleware.admin, deleteMitra);
router.get('/un/user/:id_user', getMitraByUserId);
// -----------------------------------------------------------------

module.exports = router;