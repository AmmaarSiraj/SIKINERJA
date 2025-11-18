// src/controllers/pengajuanMitraController.js
const { pool } = require('../config/db');

// POST /api/pengajuan-mitra
// Membuat pengajuan baru
exports.createPengajuan = async (req, res) => {
  // Ambil semua data dari body
  const {
    id_user,
    nama_lengkap,
    nik,
    alamat,
    no_hp,
    email,
    no_rekening,
    nama_bank,
  } = req.body;

  // Validasi dasar
  if (
    !id_user ||
    !nama_lengkap ||
    !nik ||
    !alamat ||
    !no_hp ||
    !email ||
    !no_rekening ||
    !nama_bank
  ) {
    return res
      .status(400)
      .json({ error: 'Semua field wajib diisi.' });
  }

  // Pengecekan req.user.id dihapus karena authMiddleware tidak digunakan

  try {
    const sql = `
      INSERT INTO pengajuan_mitra 
      (id_user, nama_lengkap, nik, alamat, no_hp, email, no_rekening, nama_bank, status) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')
    `;

    const [result] = await pool.query(sql, [
      id_user,
      nama_lengkap,
      nik,
      alamat,
      no_hp,
      email,
      no_rekening,
      nama_bank,
    ]);

    // Ambil data yang baru dibuat untuk dikirim balik
    const [rows] = await pool.query(
      'SELECT * FROM pengajuan_mitra WHERE id = ?',
      [result.insertId]
    );
    res.status(201).json({
      message: 'Pengajuan berhasil terkirim dan sedang ditinjau.',
      data: rows[0],
    });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        error:
          'Data duplikat. Anda sudah pernah mengajukan (cek NIK, Email, atau User ID).',
        details: error.message,
      });
    }
    console.error(error);
    res.status(500).json({
      error: 'Terjadi kesalahan pada server.',
      details: error.message,
    });
  }
};

// GET /api/pengajuan-mitra/user/:id_user
// Cek status pengajuan user
exports.getPengajuanByUserId = async (req, res) => {
  const { id_user } = req.params;

  // Pengecekan req.user.id dihapus

  try {
    const [rows] = await pool.query(
      'SELECT * FROM pengajuan_mitra WHERE id_user = ?',
      [id_user]
    );

    if (rows.length === 0) {
      return res
        .status(404)
        .json({ message: 'Belum ada pengajuan untuk user ini.' });
    }
    // Kirim data pengajuan yang ditemukan
    res.status(200).json(rows[0]);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ error: 'Terjadi kesalahan pada server.', details: error.message });
  }
};