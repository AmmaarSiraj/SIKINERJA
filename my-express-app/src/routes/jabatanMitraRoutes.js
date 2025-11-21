// src/routes/jabatanMitraRoutes.js
const express = require('express');
const router = express.Router();
const { getAllJabatan, createJabatan, deleteJabatan } = require('../controllers/jabatanMitraController');

router.get('/', getAllJabatan);
router.post('/', createJabatan);
router.delete('/:kode', deleteJabatan);

module.exports = router;