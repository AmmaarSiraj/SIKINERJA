// src/routes/pengajuanMitraRoutes.js
const express = require('express');
const router = express.Router();
const {
  createPengajuan,
  getPengajuanByUserId,
  getAllPengajuan,    
  getPengajuanById,   
  approvePengajuan
} = require('../controllers/pengajuanMitraController');

router.post('/', createPengajuan);
router.get('/user/:id_user', getPengajuanByUserId);

// Route BARU untuk Admin
router.get('/', getAllPengajuan);     
router.get('/:id', getPengajuanById);      
router.post('/:id/approve', approvePengajuan);

module.exports = router;