// src/controllers/kegiatanController.js
const { pool } = require('../config/db');

// 1. Create Kegiatan
const createKegiatan = async (req, res) => {
  const { 
    nama_kegiatan, 
    deskripsi, 
    tahun_anggaran, 
    tanggal_mulai, 
    tanggal_selesai, 
    subkegiatans 
  } = req.body;
  
  if (!nama_kegiatan || !tahun_anggaran || !tanggal_mulai || !tanggal_selesai) {
    return res.status(400).json({ message: 'Data utama wajib diisi lengkap' });
  }

  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    // Insert Kegiatan
    const sqlKegiatan = `
      INSERT INTO kegiatan (nama_kegiatan, deskripsi, tahun_anggaran, tanggal_mulai, tanggal_selesai) 
      VALUES (?, ?, ?, ?, ?)
    `;
    const [kegiatanResult] = await connection.query(sqlKegiatan, [
      nama_kegiatan, deskripsi, tahun_anggaran, tanggal_mulai, tanggal_selesai
    ]);
    const newKegiatanId = kegiatanResult.insertId;

    // Insert Sub Kegiatan (Jika ada)
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

// 2. Get All Kegiatan (Diperbarui agar tidak crash dengan struktur DB baru)
const getAllKegiatan = async (req, res) => {
  try {
    // Kita ambil data kegiatan standar saja dulu agar aman
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
const updateKegiatan = async (req, res) => {
  try {
    const { id } = req.params;
    const { nama_kegiatan, deskripsi, tahun_anggaran, tanggal_mulai, tanggal_selesai } = req.body;

    const updateData = {};
    if (nama_kegiatan) updateData.nama_kegiatan = nama_kegiatan;
    if (deskripsi !== undefined) updateData.deskripsi = deskripsi;
    if (tahun_anggaran) updateData.tahun_anggaran = tahun_anggaran;
    if (tanggal_mulai) updateData.tanggal_mulai = tanggal_mulai;
    if (tanggal_selesai) updateData.tanggal_selesai = tanggal_selesai;

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

// PENTING: Export harus dalam objek seperti ini
module.exports = {
  createKegiatan,
  getAllKegiatan,
  getKegiatanById,
  updateKegiatan,
  deleteKegiatan,
};