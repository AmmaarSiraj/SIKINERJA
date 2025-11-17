// src/controllers/penugasanController.js
const { pool } = require('../config/db');

// Query JOIN untuk mengambil data secara mendetail
const selectDetailQuery = `
  SELECT 
    p.id AS id_penugasan,
    p.jumlah_max_mitra,
    p.created_at AS penugasan_created_at,
    k.id AS id_kegiatan,
    k.nama_kegiatan,
    m.id AS id_pengawas,
    m.nama_lengkap AS nama_pengawas,
    j.jabatan AS jabatan_pengawas
  FROM penugasan AS p
  JOIN kegiatan AS k ON p.id_kegiatan = k.id
  JOIN mitra AS m ON p.id_pengawas = m.id
  JOIN jabatan AS j ON m.id_jabatan = j.id
`;

// Membuat penugasan baru
exports.createPenugasan = async (req, res) => {
  const { id_kegiatan, id_pengawas, jumlah_max_mitra } = req.body;

  if (!id_kegiatan || !id_pengawas) {
    return res.status(400).json({ error: 'ID Kegiatan dan ID Pengawas wajib diisi.' });
  }

  try {
    const sql = `
      INSERT INTO penugasan (id_kegiatan, id_pengawas, jumlah_max_mitra) 
      VALUES (?, ?, ?)
    `;
    const [result] = await pool.query(sql, [
      id_kegiatan,
      id_pengawas,
      jumlah_max_mitra || 1, // Default 1 jika tidak diset
    ]);

    const [rows] = await pool.query(`${selectDetailQuery} WHERE p.id = ?`, [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Terjadi kesalahan pada server.', details: error.message });
  }
};

// Mendapatkan semua penugasan
exports.getAllPenugasan = async (req, res) => {
  try {
    const [rows] = await pool.query(`${selectDetailQuery} ORDER BY p.created_at DESC`);
    res.status(200).json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Terjadi kesalahan pada server.', details: error.message });
  }
};

// Mendapatkan satu penugasan berdasarkan ID
exports.getPenugasanById = async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.query(`${selectDetailQuery} WHERE p.id = ?`, [id]);
    if (!rows || rows.length === 0) {
      return res.status(404).json({ error: 'Penugasan tidak ditemukan.' });
    }
    res.status(200).json(rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Terjadi kesalahan pada server.', details: error.message });
  }
};

// Mendapatkan semua mitra (anggota) dalam satu penugasan
exports.getAnggotaByPenugasanId = async (req, res) => {
  const { id } = req.params; // Ini adalah id_penugasan
  try {
    const sql = `
      SELECT 
        m.id AS id_mitra, 
        m.nama_lengkap, 
        m.nik, 
        m.no_hp,
        j.jabatan,
        kp.id AS id_kelompok,
        kp.created_at AS bergabung_sejak
      FROM kelompok_penugasan AS kp
      JOIN mitra AS m ON kp.id_mitra = m.id
      JOIN jabatan AS j ON m.id_jabatan = j.id
      WHERE kp.id_penugasan = ?
      ORDER BY m.nama_lengkap ASC
    `;
    const [rows] = await pool.query(sql, [id]);
    
    // Tidak error jika tidak ada anggota, kembalikan array kosong
    res.status(200).json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Terjadi kesalahan pada server.', details: error.message });
  }
};


// Update penugasan
exports.updatePenugasan = async (req, res) => {
  const { id } = req.params;
  const { id_kegiatan, id_pengawas, jumlah_max_mitra } = req.body;

  const updates = {};
  if (id_kegiatan) updates.id_kegiatan = id_kegiatan;
  if (id_pengawas) updates.id_pengawas = id_pengawas;
  if (jumlah_max_mitra !== undefined) updates.jumlah_max_mitra = jumlah_max_mitra;

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ error: 'Tidak ada data untuk diperbarui.' });
  }

  try {
    const [result] = await pool.query('UPDATE penugasan SET ? WHERE id = ?', [updates, id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Penugasan tidak ditemukan.' });
    }
    const [rows] = await pool.query(`${selectDetailQuery} WHERE p.id = ?`, [id]);
    res.status(200).json(rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Terjadi kesalahan pada server.', details: error.message });
  }
};

// Menghapus penugasan
exports.deletePenugasan = async (req, res) => {
  const { id } = req.params;
  try {
    // Karena ada ON DELETE CASCADE, menghapus penugasan akan otomatis
    // menghapus data di 'kelompok_penugasan' yang terkait.
    const [result] = await pool.query('DELETE FROM penugasan WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Penugasan tidak ditemukan.' });
    }
    res.status(200).json({ message: 'Penugasan berhasil dihapus.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Terjadi kesalahan pada server.', details: error.message });
  }
};