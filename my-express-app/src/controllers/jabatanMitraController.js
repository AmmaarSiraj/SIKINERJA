// src/controllers/jabatanMitraController.js
const { pool } = require('../config/db');

// GET Semua Jabatan (bisa difilter by id_subkegiatan via query params)
exports.getAllJabatan = async (req, res) => {
  const { id_subkegiatan } = req.query;
  try {
    let sql = 'SELECT * FROM jabatan_mitra';
    const params = [];

    if (id_subkegiatan) {
      sql += ' WHERE id_subkegiatan = ?';
      params.push(id_subkegiatan);
    }

    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server Error' });
  }
};

// Buat Jabatan Baru
exports.createJabatan = async (req, res) => {
  const { kode_jabatan, nama_jabatan, id_subkegiatan } = req.body;
  
  if (!kode_jabatan || !nama_jabatan || !id_subkegiatan) {
    return res.status(400).json({ error: 'Semua field wajib diisi' });
  }

  try {
    const sql = 'INSERT INTO jabatan_mitra (kode_jabatan, nama_jabatan, id_subkegiatan) VALUES (?, ?, ?)';
    await pool.query(sql, [kode_jabatan, nama_jabatan, id_subkegiatan]);
    
    res.status(201).json({ 
      message: 'Jabatan berhasil dibuat', 
      data: { kode_jabatan, nama_jabatan, id_subkegiatan } 
    });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') return res.status(400).json({ error: 'Kode Jabatan sudah ada' });
    console.error(error);
    res.status(500).json({ error: 'Server Error' });
  }
};

// Hapus Jabatan
exports.deleteJabatan = async (req, res) => {
  const { kode } = req.params;
  try {
    await pool.query('DELETE FROM jabatan_mitra WHERE kode_jabatan = ?', [kode]);
    res.json({ message: 'Jabatan berhasil dihapus' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server Error' });
  }
};