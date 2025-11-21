const { pool } = require('../config/db');

// Query JOIN Terbaru:
// 1. Menggunakan p.id_subkegiatan (bukan p.id_kegiatan)
// 2. Join ke users untuk pengawas (bukan ke mitra)
const selectDetailQuery = `
  SELECT 
    p.id AS id_penugasan,
    p.jumlah_max_mitra,
    p.created_at AS penugasan_created_at,
    s.id AS id_subkegiatan,
    s.nama_sub_kegiatan,
    k.id AS id_kegiatan,
    k.nama_kegiatan,
    u.id AS id_pengawas,
    u.username AS nama_pengawas,
    u.email AS email_pengawas,
    u.role AS role_pengawas
  FROM penugasan AS p
  JOIN subkegiatan AS s ON p.id_subkegiatan = s.id
  JOIN kegiatan AS k ON s.id_kegiatan = k.id
  JOIN users AS u ON p.id_pengawas = u.id
`;

exports.createPenugasan = async (req, res) => {
  const { id_subkegiatan, id_pengawas, jumlah_max_mitra } = req.body;

  if (!id_subkegiatan || !id_pengawas) {
    return res.status(400).json({ error: 'ID Sub-Kegiatan dan ID Pengawas wajib diisi.' });
  }

  try {
    const sql = `
      INSERT INTO penugasan (id_subkegiatan, id_pengawas, jumlah_max_mitra) 
      VALUES (?, ?, ?)
    `;
    const [result] = await pool.query(sql, [
      id_subkegiatan,
      id_pengawas,
      jumlah_max_mitra || 1, 
    ]);

    const [rows] = await pool.query(`${selectDetailQuery} WHERE p.id = ?`, [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Terjadi kesalahan pada server.', details: error.message });
  }
};

exports.getAllPenugasan = async (req, res) => {
  try {
    const [rows] = await pool.query(`${selectDetailQuery} ORDER BY p.created_at DESC`);
    res.status(200).json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Terjadi kesalahan pada server.', details: error.message });
  }
};

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

exports.getAnggotaByPenugasanId = async (req, res) => {
  const { id } = req.params; // id penugasan
  try {
    // UPDATE QUERY: Join ke tabel jabatan & jabatan_mitra
    const sql = `
      SELECT 
        m.id AS id_mitra, 
        m.nama_lengkap, 
        m.nik, 
        m.no_hp,
        kp.id AS id_kelompok,
        kp.created_at AS bergabung_sejak,
        IFNULL(jm.nama_jabatan, 'Belum ditentukan') AS nama_jabatan
      FROM kelompok_penugasan AS kp
      JOIN mitra AS m ON kp.id_mitra = m.id
      -- Join ke tabel jabatan untuk cari kode jabatannya
      LEFT JOIN jabatan j ON (j.id_mitra = m.id AND j.id_penugasan = kp.id_penugasan)
      -- Join ke tabel master jabatan_mitra untuk ambil nama jabatannya
      LEFT JOIN jabatan_mitra jm ON j.kode_jabatan = jm.kode_jabatan
      WHERE kp.id_penugasan = ?
      ORDER BY m.nama_lengkap ASC
    `;
    const [rows] = await pool.query(sql, [id]);
    
    res.status(200).json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Terjadi kesalahan pada server.', details: error.message });
  }
};

exports.updatePenugasan = async (req, res) => {
  const { id } = req.params;
  const { id_subkegiatan, id_pengawas, jumlah_max_mitra } = req.body;

  const updates = {};
  if (id_subkegiatan) updates.id_subkegiatan = id_subkegiatan;
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

exports.deletePenugasan = async (req, res) => {
  const { id } = req.params;
  try {
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