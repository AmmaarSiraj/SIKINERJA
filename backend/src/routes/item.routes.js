const express = require('express');
const router = express.Router();
const itemController = require('../controllers/item.controller');

// URL akan menjadi /api/halo
router.get('/halo', itemController.getHalo);

// URL akan menjadi /api/items
router.get('/items', itemController.getItems);

module.exports = router;