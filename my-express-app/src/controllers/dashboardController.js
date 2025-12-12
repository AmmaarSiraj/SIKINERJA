// src/controllers/dashboardController.js
const { pool } = require('../config/db');

exports.getDashboardStats = async (req, res) => {
  try {
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1; // JS Month is 0-indexed

    // 1. Kegiatan Aktif (Sub-kegiatan yang mulai bulan ini)
    // Logika: Tanggal mulai berada di bulan & tahun saat ini
    const sqlKegiatan = `
      SELECT COUNT(*) AS total
      FROM subkegiatan
      WHERE MONTH(tanggal_mulai) = ? AND YEAR(tanggal_mulai) = ?
    `;

    // 2. Total Mitra (Terdaftar di tahun ini)
    // Logika: Jumlah user_id di tabel tahun_aktif untuk tahun ini
    const sqlTotalMitra = `
      SELECT COUNT(DISTINCT user_id) AS total
      FROM tahun_aktif
      WHERE tahun = ?
    `;

    // 3. Mitra Aktif Bulan Ini (Yang punya tugas bulan ini)
    // Logika: Mitra yang ada di kelompok_penugasan -> penugasan -> subkegiatan bulan ini
    const sqlMitraAktif = `
      SELECT COUNT(DISTINCT kp.id_mitra) AS total
      FROM kelompok_penugasan kp
      JOIN penugasan p ON kp.id_penugasan = p.id
      JOIN subkegiatan s ON p.id_subkegiatan = s.id
      WHERE MONTH(s.tanggal_mulai) = ? AND YEAR(s.tanggal_mulai) = ?
    `;

    // Jalankan query secara paralel
    const [kegiatanRows] = await pool.query(sqlKegiatan, [currentMonth, currentYear]);
    const [totalMitraRows] = await pool.query(sqlTotalMitra, [currentYear]);
    const [mitraAktifRows] = await pool.query(sqlMitraAktif, [currentMonth, currentYear]);

    res.status(200).json({
      kegiatan_aktif: kegiatanRows[0].total,
      total_mitra: totalMitraRows[0].total,
      mitra_aktif: mitraAktifRows[0].total,
      periode: { month: currentMonth, year: currentYear }
    });

  } catch (error) {
    console.error("Dashboard Stats Error:", error);
    res.status(500).json({ error: 'Gagal memuat statistik dashboard.' });
  }
};