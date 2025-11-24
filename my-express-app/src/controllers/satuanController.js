// src/controllers/satuanController.js
const { pool } = require('../config/db');

exports.getAllSatuan = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM satuan_kegiatan ORDER BY nama_satuan ASC');
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Gagal mengambil data satuan' });
  }
};