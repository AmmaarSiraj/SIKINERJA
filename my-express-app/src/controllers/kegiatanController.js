// src/controllers/kegiatanController.js
const { pool } = require('../config/db');

// 1. Create Kegiatan (Disederhanakan)
const createKegiatan = async (req, res) => {
  const { 
    nama_kegiatan, 
    deskripsi,
    subkegiatans 
  } = req.body;
  
  // VALIDASI BARU: Hanya cek nama_kegiatan
  if (!nama_kegiatan) {
    return res.status(400).json({ message: 'Nama Kegiatan wajib diisi' });
  }

  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    // Insert Kegiatan (Hanya Nama & Deskripsi, tanpa tahun/tanggal)
    const sqlKegiatan = `
      INSERT INTO kegiatan (nama_kegiatan, deskripsi) 
      VALUES (?, ?)
    `;
    const [kegiatanResult] = await connection.query(sqlKegiatan, [
      nama_kegiatan, deskripsi || null
    ]);
    const newKegiatanId = kegiatanResult.insertId;

    // Insert Sub Kegiatan (Jika ada dikirim langsung, opsional)
    if (subkegiatans && subkegiatans.length > 0) {
      const sqlSub = `INSERT INTO subkegiatan (id_kegiatan, nama_sub_kegiatan, deskripsi) VALUES ?`;
      const subValues = subkegiatans.map(sub => [
        newKegiatanId, sub.nama_sub_kegiatan, sub.deskripsi
      ]);
      await connection.query(sqlSub, [subValues]);
    }

    await connection.commit();
    
    // Ambil data baru untuk respon
    const [rows] = await connection.query('SELECT * FROM kegiatan WHERE id = ?', [newKegiatanId]);
    res.status(201).json({
      message: 'Kegiatan berhasil dibuat',
      data: { kegiatan: rows[0] }
    });

  } catch (err) {
    if (connection) await connection.rollback();
    console.error(err);
    res.status(500).json({ message: 'Gagal menyimpan data' });
  } finally {
    if (connection) connection.release();
  }
};

// 2. Get All Kegiatan
const getAllKegiatan = async (req, res) => {
  try {
    const sql = `SELECT * FROM kegiatan ORDER BY created_at DESC`;
    const [rows] = await pool.query(sql);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// 3. Get Kegiatan By ID
const getKegiatanById = async (req, res) => {
  try {
    const { id } = req.params;
    const sql = `SELECT * FROM kegiatan WHERE id = ?`;
    const [rows] = await pool.query(sql, [id]);

    if (!rows || rows.length === 0) {
      return res.status(404).json({ message: 'Kegiatan tidak ditemukan' });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// 4. Update Kegiatan
// 4. Update Kegiatan (Disederhanakan)
const updateKegiatan = async (req, res) => {
  try {
    const { id } = req.params;
    const { nama_kegiatan, deskripsi } = req.body;

    const updateData = {};
    if (nama_kegiatan) updateData.nama_kegiatan = nama_kegiatan;
    if (deskripsi !== undefined) updateData.deskripsi = deskripsi;

    // Hapus logika update tahun/tanggal karena kolom sudah tidak ada

    if (Object.keys(updateData).length === 0) {
        return res.status(400).json({ message: 'Tidak ada data update' });
    }

    const [result] = await pool.query('UPDATE kegiatan SET ? WHERE id = ?', [updateData, id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Kegiatan tidak ditemukan' });
    }

    const [rows] = await pool.query('SELECT * FROM kegiatan WHERE id = ?', [id]);
    res.json({ message: 'Update berhasil', data: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// 5. Delete Kegiatan
const deleteKegiatan = async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await pool.query('DELETE FROM kegiatan WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Kegiatan tidak ditemukan' });
    }
    res.json({ message: 'Kegiatan berhasil dihapus' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  createKegiatan,
  getAllKegiatan,
  getKegiatanById,
  updateKegiatan,
  deleteKegiatan,
};