// src/controllers/spkController.js
const { pool } = require('../config/db');

// 1. Ambil Daftar Periode (Bulan-Tahun)
exports.getSPKPeriods = async (req, res) => {
  try {
    const sql = `
      SELECT DISTINCT DATE_FORMAT(tanggal_mulai, '%Y-%m') as periode 
      FROM subkegiatan 
      WHERE tanggal_mulai IS NOT NULL 
      ORDER BY periode DESC
    `;
    const [rows] = await pool.query(sql);
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Gagal mengambil periode.' });
  }
};

// 2. Ambil Setting SPK per Periode (Termasuk Info Template)
exports.getSPKSetting = async (req, res) => {
  const { periode } = req.params;
  try {
    const sql = `
      SELECT s.*, t.nama_template 
      FROM spk_setting s
      LEFT JOIN master_template_spk t ON s.template_id = t.id
      WHERE s.periode = ?
    `;
    const [rows] = await pool.query(sql, [periode]);
    res.json(rows.length > 0 ? rows[0] : null);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Gagal mengambil setting surat.' });
  }
};

// 3. Simpan Setting SPK (Pejabat, Tanggal, Template ID)
exports.saveSPKSetting = async (req, res) => {
  const { 
    periode, 
    nomor_surat_format, 
    tanggal_surat, 
    nama_ppk, 
    nip_ppk, 
    jabatan_ppk, 
    komponen_honor,
    template_id 
  } = req.body;

  if (!periode) return res.status(400).json({ error: 'Periode wajib diisi.' });

  try {
    const sql = `
      INSERT INTO spk_setting 
      (periode, nomor_surat_format, tanggal_surat, nama_ppk, nip_ppk, jabatan_ppk, komponen_honor, template_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
      nomor_surat_format = VALUES(nomor_surat_format),
      tanggal_surat = VALUES(tanggal_surat),
      nama_ppk = VALUES(nama_ppk),
      nip_ppk = VALUES(nip_ppk),
      jabatan_ppk = VALUES(jabatan_ppk),
      komponen_honor = VALUES(komponen_honor),
      template_id = VALUES(template_id)
    `;
    
    const valTemplateId = template_id || null;

    await pool.query(sql, [
      periode, nomor_surat_format, tanggal_surat, nama_ppk, nip_ppk, jabatan_ppk, komponen_honor, valTemplateId
    ]);

    res.json({ message: 'Pengaturan surat berhasil disimpan.' });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Gagal menyimpan pengaturan.' });
  }
};

// 4. Ambil Daftar Mitra yang Bertugas di Periode Tersebut
exports.getMitraByPeriod = async (req, res) => {
  const { periode } = req.params;
  try {
    const sql = `
      SELECT DISTINCT 
        m.id, 
        m.nama_lengkap, 
        m.nik
      FROM mitra m
      JOIN kelompok_penugasan kp ON m.id = kp.id_mitra
      JOIN penugasan p ON kp.id_penugasan = p.id
      JOIN subkegiatan s ON p.id_subkegiatan = s.id
      WHERE DATE_FORMAT(s.tanggal_mulai, '%Y-%m') = ?
      ORDER BY m.nama_lengkap ASC
    `;
    const [rows] = await pool.query(sql, [periode]);
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Gagal mengambil daftar mitra.' });
  }
};

// 5. Ambil Data Lengkap untuk Cetak (Mitra + Tugas + Isi Template)
exports.getPrintData = async (req, res) => {
  const { periode, id_mitra } = req.params;

  try {
    // A. Ambil Data Mitra
    const [mitraRows] = await pool.query('SELECT * FROM mitra WHERE id = ?', [id_mitra]);
    if (mitraRows.length === 0) return res.status(404).json({ error: 'Mitra tidak ditemukan' });

    // B. Ambil Setting SPK & Template ID
    const [settingRows] = await pool.query('SELECT * FROM spk_setting WHERE periode = ?', [periode]);
    const setting = settingRows.length > 0 ? settingRows[0] : {};

    // C. Ambil Isi Template (Jika ada template_id)
    let templateContent = null;
    if (setting.template_id) {
        const [parts] = await pool.query('SELECT * FROM template_bagian_teks WHERE template_id = ?', [setting.template_id]);
        const [articles] = await pool.query('SELECT * FROM template_pasal WHERE template_id = ? ORDER BY urutan ASC', [setting.template_id]);
        
        const formattedParts = {};
        parts.forEach(p => formattedParts[p.jenis_bagian] = p.isi_teks);

        templateContent = { parts: formattedParts, articles: articles };
    }

    // D. Ambil Rincian Tugas & Honor
    // PERBAIKAN: Menambahkan LEFT JOIN jabatan_mitra jm
    const sqlTasks = `
      SELECT 
        s.nama_sub_kegiatan,
        k.nama_kegiatan,
        s.tanggal_mulai,
        s.tanggal_selesai,
        h.tarif AS harga_satuan,
        kp.volume_tugas AS target_volume,
        sat.nama_satuan,
        h.beban_anggaran,
        jm.nama_jabatan, 
        (h.tarif * kp.volume_tugas) AS total_honor
      FROM kelompok_penugasan kp
      JOIN penugasan p ON kp.id_penugasan = p.id
      JOIN subkegiatan s ON p.id_subkegiatan = s.id
      JOIN kegiatan k ON s.id_kegiatan = k.id
      LEFT JOIN honorarium h ON (h.id_subkegiatan = s.id AND h.kode_jabatan = kp.kode_jabatan)
      LEFT JOIN satuan_kegiatan sat ON h.id_satuan = sat.id
      LEFT JOIN jabatan_mitra jm ON kp.kode_jabatan = jm.kode_jabatan 
      WHERE kp.id_mitra = ? AND DATE_FORMAT(s.tanggal_mulai, '%Y-%m') = ?
    `;
    
    const [tasks] = await pool.query(sqlTasks, [id_mitra, periode]);

    res.json({
      mitra: mitraRows[0],
      setting: setting,
      tasks: tasks,
      template: templateContent
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Gagal mengambil data cetak.' });
  }
};