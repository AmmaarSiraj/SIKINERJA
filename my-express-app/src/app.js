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
const pengajuanMitraRoutes = require('./routes/pengajuanMitraRoutes');
const jabatanMitraRoutes = require('./routes/jabatanMitraRoutes');
const satuanRoutes = require('./routes/satuanRoutes');
const aturanPeriodeRoutes = require('./routes/aturanPeriodeRoutes');
const spkRoutes = require('./routes/spkRoutes');
const transaksiRoutes = require('./routes/transaksiRoutes');
const spkTemplateRoutes = require('./routes/spkTemplateRoutes');

app.use('/api/users', userRoutes);
app.use('/api/kegiatan', kegiatanRoutes);
app.use('/api/mitra', mitraRoutes);
app.use('/api/subkegiatan', subKegiatanRoutes);
app.use('/api/penugasan', penugasanRoutes);
app.use('/api/kelompok-penugasan', kelompokPenugasanRoutes);
app.use('/api/honorarium', honorariumRoutes);
app.use('/api/manajemen-mitra', pengajuanMitraRoutes);
app.use('/api/jabatan-mitra', jabatanMitraRoutes);
app.use('/api/satuan', satuanRoutes);
app.use('/api/aturan-periode', aturanPeriodeRoutes);
app.use('/api/transaksi', transaksiRoutes);
app.use('/api/spk-templates', spkTemplateRoutes);
app.get('/', (req, res) => {
  res.json({ message: 'Backend is running 🚀' });
});
app.use('/api/spk', spkRoutes);

module.exports = app;
