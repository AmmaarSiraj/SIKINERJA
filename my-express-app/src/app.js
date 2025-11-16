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

app.use('/api/users', userRoutes);
app.use('/api/kegiatan', kegiatanRoutes);
app.use('/api/mitra', mitraRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'Backend is running 🚀' });
});

module.exports = app;
