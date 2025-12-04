// src/controllers/spkController.js
const { pool } = require('../config/db');

// GET: Ambil daftar periode yang memiliki aktivitas (untuk menu accordion)
exports.getSPKPeriods = async (req, res) => {
  try {
    const sql = `
      SELECT DISTINCT periode 
      FROM subkegiatan 
      WHERE periode IS NOT NULL AND periode != '' 
      ORDER BY periode DESC
    `;
    const [rows] = await pool.query(sql);
    res.json(rows);
  } catch (error) {
    console.error("Error getSPKPeriods:", error);
    res.status(500).json({ error: 'Gagal mengambil periode.' });
  }
};

// GET: Ambil Setting SPK berdasarkan Periode
exports.getSPKSetting = async (req, res) => {
  const { periode } = req.params;
  try {
    const [rows] = await pool.query('SELECT * FROM spk_setting WHERE periode = ?', [periode]);
    res.json(rows.length > 0 ? rows[0] : null);
  } catch (error) {
    console.error("Error getSPKSetting:", error);
    res.status(500).json({ error: 'Gagal mengambil setting surat.' });
  }
};

// POST: Simpan/Update Setting SPK
exports.saveSPKSetting = async (req, res) => {
  const { 
    periode, 
    nomor_surat_format, 
    tanggal_surat, 
    nama_ppk, 
    nip_ppk, 
    jabatan_ppk, 
    komponen_honor 
  } = req.body;

  if (!periode) return res.status(400).json({ error: 'Periode wajib diisi.' });

  try {
    const sql = `
      INSERT INTO spk_setting 
      (periode, nomor_surat_format, tanggal_surat, nama_ppk, nip_ppk, jabatan_ppk, komponen_honor)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
      nomor_surat_format = VALUES(nomor_surat_format),
      tanggal_surat = VALUES(tanggal_surat),
      nama_ppk = VALUES(nama_ppk),
      nip_ppk = VALUES(nip_ppk),
      jabatan_ppk = VALUES(jabatan_ppk),
      komponen_honor = VALUES(komponen_honor)
    `;
    
    await pool.query(sql, [
      periode, nomor_surat_format, tanggal_surat, nama_ppk, nip_ppk, jabatan_ppk, komponen_honor
    ]);

    res.json({ message: 'Pengaturan surat berhasil disimpan.' });

  } catch (error) {
    console.error("Error saveSPKSetting:", error);
    res.status(500).json({ error: 'Gagal menyimpan pengaturan.' });
  }
};

// GET: Ambil Daftar Mitra Kandidat SPK di Periode Tertentu
exports.getMitraByPeriod = async (req, res) => {
  const { periode } = req.params;
  try {
    // UPDATE: Menghapus m.no_rekening dan m.nama_bank dari query
    const sql = `
      SELECT DISTINCT 
        m.id, 
        m.nama_lengkap, 
        m.nik
      FROM mitra m
      JOIN kelompok_penugasan kp ON m.id = kp.id_mitra
      JOIN penugasan p ON kp.id_penugasan = p.id
      JOIN subkegiatan s ON p.id_subkegiatan = s.id
      WHERE s.periode = ?
      ORDER BY m.nama_lengkap ASC
    `;
    const [rows] = await pool.query(sql, [periode]);
    res.json(rows);
  } catch (error) {
    console.error("Error getMitraByPeriod:", error);
    res.status(500).json({ error: 'Gagal mengambil daftar mitra.' });
  }
};

// GET: Data Lengkap untuk Cetak (Preview)
exports.getPrintData = async (req, res) => {
  const { periode, id_mitra } = req.params;

  try {
    // 1. Ambil Data Mitra
    const [mitraRows] = await pool.query('SELECT * FROM mitra WHERE id = ?', [id_mitra]);
    if (mitraRows.length === 0) return res.status(404).json({ error: 'Mitra tidak ditemukan' });

    // 2. Ambil Setting Surat
    const [settingRows] = await pool.query('SELECT * FROM spk_setting WHERE periode = ?', [periode]);
    const setting = settingRows.length > 0 ? settingRows[0] : {};

    // 3. Ambil Rincian Tugas & Honor (Untuk Lampiran Tabel)
    // UPDATE: Menggunakan kp.volume_tugas dan perhitungan (h.tarif * kp.volume_tugas)
    const sqlTasks = `
      SELECT 
        s.nama_sub_kegiatan,
        k.nama_kegiatan,
        s.tanggal_mulai,
        s.tanggal_selesai,
        h.tarif AS harga_satuan,
        kp.volume_tugas AS target_volume,
        sat.nama_satuan,
        (h.tarif * kp.volume_tugas) AS total_honor
      FROM kelompok_penugasan kp
      JOIN penugasan p ON kp.id_penugasan = p.id
      JOIN subkegiatan s ON p.id_subkegiatan = s.id
      JOIN kegiatan k ON s.id_kegiatan = k.id
      LEFT JOIN honorarium h ON (h.id_subkegiatan = s.id AND h.kode_jabatan = kp.kode_jabatan)
      LEFT JOIN satuan_kegiatan sat ON h.id_satuan = sat.id
      WHERE kp.id_mitra = ? AND s.periode = ?
    `;
    
    const [tasks] = await pool.query(sqlTasks, [id_mitra, periode]);

    res.json({
      mitra: mitraRows[0],
      setting: setting,
      tasks: tasks
    });

  } catch (error) {
    console.error("Error getPrintData:", error);
    res.status(500).json({ error: 'Gagal mengambil data cetak.' });
  }
};