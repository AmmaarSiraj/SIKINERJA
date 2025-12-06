// src/controllers/pengajuanMitraController.js
const { pool } = require('../config/db');
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail', // Sesuaikan dengan provider email Anda (bisa SMTP custom)
  auth: {
    user: process.env.EMAIL_USER, // Pastikan variabel ini ada di .env
    pass: process.env.EMAIL_PASS, // Pastikan variabel ini ada di .env
  },
});

// POST /api/manajemen-mitra
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

// GET /api/manajemen-mitra/user/:id_user
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

exports.getAllPengajuan = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM pengajuan_mitra ORDER BY created_at DESC');
    res.status(200).json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Gagal mengambil data pengajuan.' });
  }
};

// [BARU] Ambil detail pengajuan by ID (untuk halaman Detail)
exports.getPengajuanById = async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.query('SELECT * FROM pengajuan_mitra WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Pengajuan tidak ditemukan.' });
    }
    res.status(200).json(rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Gagal mengambil detail pengajuan.' });
  }
};

// [BARU] Approve Pengajuan (Pindahkan ke tabel Mitra)
exports.approvePengajuan = async (req, res) => {
  const { id } = req.params;
  const { batas_honor_bulanan } = req.body;

  if (!batas_honor_bulanan) {
    return res.status(400).json({ error: 'Batas honor bulanan wajib diisi.' });
  }

  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    // 1. Ambil data pengajuan
    const [pengajuanRows] = await connection.query('SELECT * FROM pengajuan_mitra WHERE id = ?', [id]);
    if (pengajuanRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: 'Data pengajuan tidak ditemukan.' });
    }
    const data = pengajuanRows[0];

    if (data.status === 'approved') {
      await connection.rollback();
      return res.status(400).json({ error: 'Pengajuan ini sudah disetujui sebelumnya.' });
    }

    // 2. Masukkan ke tabel MITRA
    const insertSql = `
      INSERT INTO mitra (id_user, nama_lengkap, nik, alamat, no_hp, email, no_rekening, nama_bank, batas_honor_bulanan, id_jabatan)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
    `;
    
    await connection.query(insertSql, [
      data.id_user,
      data.nama_lengkap,
      data.nik,
      data.alamat,
      data.no_hp,
      data.email,
      data.no_rekening,
      data.nama_bank,
      batas_honor_bulanan
    ]);

    // 3. Update status di tabel pengajuan_mitra
    await connection.query('UPDATE pengajuan_mitra SET status = "approved" WHERE id = ?', [id]);

    // 4. Commit Transaksi Database (Data aman tersimpan)
    await connection.commit();

    // 5. KIRIM EMAIL NOTIFIKASI
    // Kita lakukan ini SETELAH commit agar jika email gagal, data mitra tetap tersimpan (atau bisa disesuaikan)
    try {
      const infoHonor = Number(batas_honor_bulanan).toLocaleString('id-ID');

      const mailOptions = {
        from: `"Admin SIKINERJA" <${process.env.EMAIL_USER}>`,
        to: data.email, // Email tujuan (mitra)
        subject: 'Selamat! Pengajuan Mitra Anda Disetujui',
        html: `
          <div style="font-family: Arial, sans-serif; color: #333;">
            <h2 style="color: #2e7d32;">Pernyataan Pengajuan Mitra Sukses</h2>
            <p>Halo <strong>${data.nama_lengkap}</strong>,</p>
            <p>Selamat! Pengajuan Anda untuk menjadi mitra kami telah disetujui.</p>
            
            <h3>Detail Mitra:</h3>
            <ul style="list-style-type: none; padding: 0;">
              <li><strong>Nama Lengkap:</strong> ${data.nama_lengkap}</li>
              <li><strong>NIK:</strong> ${data.nik}</li>
              <li><strong>Alamat:</strong> ${data.alamat}</li>
              <li><strong>No. HP:</strong> ${data.no_hp}</li>
              <li><strong>Email:</strong> ${data.email}</li>
              <li><strong>Bank:</strong> ${data.nama_bank} - ${data.no_rekening}</li>
            </ul>

            <div style="background-color: #f1f8e9; padding: 15px; border-radius: 5px; margin-top: 20px;">
              <h3 style="margin-top: 0;">Informasi Honorarium</h3>
              <p>Batas maksimum honor bulanan Anda ditetapkan sebesar:</p>
              <p style="font-size: 24px; font-weight: bold; color: #1b5e20;">Rp ${infoHonor}</p>
            </div>

            <p style="margin-top: 30px;">Silakan login ke aplikasi untuk melihat penugasan terbaru.</p>
            <p>Salam,<br>Tim Admin</p>
          </div>
        `
      };

      await transporter.sendMail(mailOptions);
      console.log(`Email notifikasi terkirim ke ${data.email}`);

    } catch (emailError) {
      // Jika email gagal, kita hanya log errornya, tidak membatalkan transaksi database
      console.error('Gagal mengirim email:', emailError);
    }

    res.status(200).json({ message: 'Pengajuan disetujui, data mitra dibuat, dan notifikasi email telah dikirim.' });

  } catch (error) {
    if (connection) await connection.rollback();
    
    if (error.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({ error: 'Gagal approve: NIK atau User ID sudah terdaftar di tabel Mitra.' });
    }
    console.error(error);
    res.status(500).json({ error: 'Terjadi kesalahan server.', details: error.message });
  } finally {
    if (connection) connection.release();
  }
};