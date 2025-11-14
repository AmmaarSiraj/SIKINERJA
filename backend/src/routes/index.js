const express = require('express');
const router = express.Router();

// Impor file rute
// Pastikan nama file ini sesuai (authRoutes.js dan itemRoutes.js)
const authRoutes = require('./authRoutes');
const itemRoutes = require('./itemRoutes');

// Gunakan rute-rute tersebut
// app.js sudah menambahkan /api, jadi ini akan menjadi /api/register, /api/items, dll.
router.use('/', authRoutes);
router.use('/', itemRoutes);

module.exports = router;