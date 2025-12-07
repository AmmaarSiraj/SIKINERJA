// src/controllers/transaksiController.js
const { pool } = require('../config/db');

exports.getTransaksiMitra = async (req, res) => {
  const { tahun, bulan } = req.query;

  if (!tahun) {
    return res.status(400).json({ error: 'Filter Tahun wajib diisi.' });
  }

  try {
    // 1. Ambil Aturan Batas Honor Dasar (Bulanan) dari Database untuk Tahun Tersebut
    const [rule] = await pool.query(
      'SELECT batas_honor FROM aturan_periode WHERE periode = ? LIMIT 1', 
      [tahun]
    );
    const batasHonorDasar = rule.length > 0 ? Number(rule[0].batas_honor) : 0;

    // 2. Tentukan Limit Periode Berdasarkan Filter
    // Jika akumulasi setahun ('all' atau tidak ada bulan), limit dikali 12
    let limitPeriode = 0;
    if (!bulan || bulan === 'all') {
        limitPeriode = batasHonorDasar * 12;
    } else {
        limitPeriode = batasHonorDasar;
    }

    // 3. Query Transaksi (Join untuk menghitung total pendapatan sesuai filter)
    let sql = `
      SELECT 
        m.id, 
        m.nama_lengkap, 
        m.sobat_id,
        COALESCE(SUM(h.tarif * kp.volume_tugas), 0) AS total_pendapatan
      FROM mitra m
      JOIN kelompok_penugasan kp ON m.id = kp.id_mitra
      JOIN penugasan p ON kp.id_penugasan = p.id
      JOIN subkegiatan s ON p.id_subkegiatan = s.id
      JOIN honorarium h ON (h.id_subkegiatan = s.id AND h.kode_jabatan = kp.kode_jabatan)
      WHERE YEAR(s.tanggal_mulai) = ?
    `;

    const params = [tahun];

    // Tambahkan filter bulan jika user memilih bulan spesifik
    if (bulan && bulan !== 'all') {
      sql += ` AND MONTH(s.tanggal_mulai) = ?`;
      params.push(bulan);
    }

    sql += ` GROUP BY m.id ORDER BY total_pendapatan DESC, m.nama_lengkap ASC`;

    const [rows] = await pool.query(sql, params);

    // 4. Format Hasil untuk Frontend
    const result = rows.map(row => ({
      ...row,
      pendapatan_terfilter: Number(row.total_pendapatan),
      limit_periode: limitPeriode, // Mengirim limit yang sudah disesuaikan (x1 atau x12)
      status_aman: Number(row.total_pendapatan) <= limitPeriode
    }));

    res.json(result);

  } catch (error) {
    console.error("Error getTransaksiMitra:", error);
    res.status(500).json({ error: 'Gagal memuat data transaksi.' });
  }
};