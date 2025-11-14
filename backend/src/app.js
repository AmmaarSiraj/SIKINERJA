const express = require('express');
const cors = require('cors');

// Impor router utama
const mainRouter = require('./routes/index');

const app = express();

// === Middleware ===
app.use(cors());
app.use(express.json()); // Menggantikan bodyParser.json()

// === Routes ===
// Semua rute sekarang akan memiliki prefix /api
app.use('/api', mainRouter);

// === Error Handling (Contoh) ===
// (Bisa ditambahkan nanti)

module.exports = app;