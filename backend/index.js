const express = require('express');
const router = express.Router();

// Impor file rute
const authRoutes = require('./auth.routes');
const itemRoutes = require('./item.routes');

// Gunakan rute-rute tersebut
// URL akan tetap /api/register, /api/login, /api/halo, /api/items
router.use('/', authRoutes);
router.use('/', itemRoutes);

module.exports = router;