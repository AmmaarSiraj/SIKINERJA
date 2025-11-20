// src/controllers/laporanFormController.js
const { pool } = require('../config/db');

// GET: Ambil settingan form
exports.getFormByKegiatanId = async (req, res) => {
  const { id_kegiatan } = req.params;
  const { id_subkegiatan } = req.query; // Bisa 'sub1', 'sub2', atau 'ALL_SUB'

  try {
    let formData = null;

    // A. JIKA REQUEST UNTUK SUB KEGIATAN
    if (id_subkegiatan) {
      
      // 1. Cek apakah ada form SPESIFIK untuk sub kegiatan ini?
      const [specificForm] = await pool.query(
        'SELECT * FROM laporan_form WHERE id_kegiatan = ? AND id_subkegiatan = ?',
        [id_kegiatan, id_subkegiatan]
      );

      if (specificForm.length > 0) {
        formData = specificForm[0];
      } else {
        // 2. Jika TIDAK ADA form spesifik, cari form GENERAL ('ALL_SUB')
        // (Hanya lakukan ini jika request bukan eksplisit minta 'ALL_SUB' untuk diedit admin)
        if (id_subkegiatan !== 'ALL_SUB') {
          const [generalSubForm] = await pool.query(
            'SELECT * FROM laporan_form WHERE id_kegiatan = ? AND id_subkegiatan = ?',
            [id_kegiatan, 'ALL_SUB']
          );
          if (generalSubForm.length > 0) {
            formData = generalSubForm[0];
          }
        }
      }
    } 
    // B. JIKA REQUEST UNTUK KEGIATAN UTAMA
    else {
      const [mainForm] = await pool.query(
        'SELECT * FROM laporan_form WHERE id_kegiatan = ? AND id_subkegiatan IS NULL',
        [id_kegiatan]
      );
      if (mainForm.length > 0) formData = mainForm[0];
    }

    // C. JIKA FORM TIDAK DITEMUKAN
    if (!formData) {
      return res.status(200).json(null);
    }

    // D. AMBIL ITEM PERTANYAAN
    const [itemRows] = await pool.query(
      'SELECT * FROM laporan_form_items WHERE id_form = ? ORDER BY urutan ASC',
      [formData.id]
    );

    const result = {
      ...formData,
      items: itemRows
    };

    res.status(200).json(result);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Gagal mengambil template laporan.' });
  }
};

// POST: Simpan Settingan
exports.saveFormSettings = async (req, res) => {
  const { id_kegiatan, id_subkegiatan, judul_laporan, deskripsi_form, items } = req.body;

  if (!id_kegiatan || !judul_laporan) {
    return res.status(400).json({ error: 'ID Kegiatan dan Judul Laporan wajib diisi.' });
  }

  // Tentukan target ID Sub (bisa NULL, 'ALL_SUB', atau 'sub1')
  const targetSub = id_subkegiatan || null;

  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    // 1. Cek Existing Form
    let sqlCheck = 'SELECT id FROM laporan_form WHERE id_kegiatan = ? AND id_subkegiatan IS NULL';
    let paramsCheck = [id_kegiatan];

    if (targetSub) {
        sqlCheck = 'SELECT id FROM laporan_form WHERE id_kegiatan = ? AND id_subkegiatan = ?';
        paramsCheck = [id_kegiatan, targetSub];
    }

    const [existingForm] = await connection.query(sqlCheck, paramsCheck);

    let formId;

    if (existingForm.length > 0) {
      // UPDATE
      formId = existingForm[0].id;
      await connection.query(
        'UPDATE laporan_form SET judul_laporan = ?, deskripsi_form = ? WHERE id = ?',
        [judul_laporan, deskripsi_form, formId]
      );
    } else {
      // INSERT
      const [insertResult] = await connection.query(
        'INSERT INTO laporan_form (id_kegiatan, id_subkegiatan, judul_laporan, deskripsi_form) VALUES (?, ?, ?, ?)',
        [id_kegiatan, targetSub, judul_laporan, deskripsi_form]
      );
      formId = insertResult.insertId;
    }

    // 2. Reset Items
    await connection.query('DELETE FROM laporan_form_items WHERE id_form = ?', [formId]);

    if (items && items.length > 0) {
      const sqlItems = `INSERT INTO laporan_form_items (id_form, label, tipe_input, opsi_pilihan, wajib_diisi, urutan) VALUES ?`;
      const itemValues = items.map((item, index) => [
        formId, item.label, item.tipe_input, 
        item.tipe_input === 'select' ? item.opsi_pilihan : null, 
        item.wajib_diisi ? 1 : 0, index + 1 
      ]);
      await connection.query(sqlItems, [itemValues]);
    }

    await connection.commit();
    res.status(200).json({ message: 'Template berhasil disimpan.', data: { id: formId } });

  } catch (error) {
    if (connection) await connection.rollback();
    console.error("Save Error:", error);
    res.status(500).json({ error: 'Gagal menyimpan template.' });
  } finally {
    if (connection) connection.release();
  }
};

exports.getAllForms = async (req, res) => {
  try {
    // Query sedikit dimodifikasi untuk menangani 'ALL_SUB' agar tidak error saat join
    const sql = `
      SELECT 
        lf.id,
        lf.id_kegiatan,
        lf.id_subkegiatan,
        lf.judul_laporan,
        lf.deskripsi_form,
        lf.created_at,
        k.nama_kegiatan,
        s.nama_sub_kegiatan
      FROM laporan_form lf
      JOIN kegiatan k ON lf.id_kegiatan = k.id
      LEFT JOIN subkegiatan s ON lf.id_subkegiatan = s.id
      ORDER BY lf.created_at DESC
    `;
    const [rows] = await pool.query(sql);
    res.status(200).json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Gagal mengambil daftar form.' });
  }
};