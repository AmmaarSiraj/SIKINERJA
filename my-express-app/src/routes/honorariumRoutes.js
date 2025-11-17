// src/routes/honorariumRoutes.js
const express = require('express');
const router = express.Router();
const {
  getAllHonorarium,
  getHonorariumById,
  createHonorarium,
  updateHonorarium,
  deleteHonorarium
} = require('../controllers/honorariumController');

// (Karena Anda meminta middleware-nya dihilangkan, kita tidak perlu auth)

// GET /api/honorarium/
router.get('/', getAllHonorarium);

// GET /api/honorarium/:id
router.get('/:id', getHonorariumById);

// POST /api/honorarium/
router.post('/', createHonorarium);

// PUT /api/honorarium/:id
router.put('/:id', updateHonorarium);

// DELETE /api/honorarium/:id
router.delete('/:id', deleteHonorarium);

module.exports = router;