// src/routes/aturanPeriodeRoutes.js
const express = require('express');
const router = express.Router();
const {
  getAllAturan,
  createAturan,
  updateAturan,
  deleteAturan
} = require('../controllers/aturanPeriodeController');

// GET /api/aturan-periode
router.get('/', getAllAturan);

// POST /api/aturan-periode
router.post('/', createAturan);

// PUT /api/aturan-periode/:id
router.put('/:id', updateAturan);

// DELETE /api/aturan-periode/:id
router.delete('/:id', deleteAturan);

module.exports = router;