// src/app.js
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());

const userRoutes = require('./routes/userRoutes');
const kegiatanRoutes = require('./routes/kegiatanRoutes');
const mitraRoutes = require('./routes/mitraRoutes');
const subKegiatanRoutes = require('./routes/subKegiatanRoutes');
const penugasanRoutes = require('./routes/penugasanRoutes');
const kelompokPenugasanRoutes = require('./routes/kelompokPenugasanRoutes');
const honorariumRoutes = require('./routes/honorariumRoutes');

app.use('/api/users', userRoutes);
app.use('/api/kegiatan', kegiatanRoutes);
app.use('/api/mitra', mitraRoutes);
app.use('/api/subkegiatan', subKegiatanRoutes);
app.use('/api/penugasan', penugasanRoutes);
app.use('/api/kelompok-penugasan', kelompokPenugasanRoutes);
app.use('/api/honorarium', honorariumRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'Backend is running 🚀' });
});

module.exports = app;
