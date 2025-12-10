// src/controllers/spkTemplateController.js
const { pool } = require('../config/db');

// --- MASTER TEMPLATE ---

// 1. Ambil Semua Template
exports.getAllTemplates = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM master_template_spk ORDER BY created_at DESC');
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Gagal mengambil data template.' });
  }
};

// 2. Buat Template Baru (Hanya Header)
exports.createTemplate = async (req, res) => {
  const { nama_template } = req.body;
  if (!nama_template) return res.status(400).json({ error: 'Nama template wajib diisi.' });

  try {
    const [result] = await pool.query('INSERT INTO master_template_spk (nama_template) VALUES (?)', [nama_template]);
    res.status(201).json({ message: 'Template berhasil dibuat.', id: result.insertId });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Gagal membuat template.' });
  }
};

// 3. Ambil Detail Template Lengkap (Header + Bagian + Pasal)
exports.getTemplateDetail = async (req, res) => {
  const { id } = req.params;
  try {
    // A. Ambil Header
    const [master] = await pool.query('SELECT * FROM master_template_spk WHERE id = ?', [id]);
    if (master.length === 0) return res.status(404).json({ error: 'Template tidak ditemukan.' });

    // B. Ambil Bagian Teks (Pembuka, Pihak 1, dll)
    const [parts] = await pool.query('SELECT * FROM template_bagian_teks WHERE template_id = ?', [id]);
    
    // C. Ambil Pasal-Pasal
    const [articles] = await pool.query('SELECT * FROM template_pasal WHERE template_id = ? ORDER BY urutan ASC', [id]);

    // Format Response agar mudah dipakai Frontend
    const formattedParts = {};
    parts.forEach(p => formattedParts[p.jenis_bagian] = p.isi_teks);

    res.json({
      ...master[0],
      parts: formattedParts,
      articles: articles
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Gagal mengambil detail template.' });
  }
};

// 4. Simpan/Update Isi Template Lengkap
exports.saveTemplateContent = async (req, res) => {
  const { id } = req.params;
  const { parts, articles } = req.body; 
  // parts = { pembuka: "...", pihak_pertama: "..." }
  // articles = [ { nomor_pasal: 1, judul_pasal: "...", isi_pasal: "..." }, ... ]

  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    // A. Simpan Bagian Teks (Upsert: Update jika ada, Insert jika belum)
    if (parts) {
      for (const [jenis, isi] of Object.entries(parts)) {
        // Cek exist
        const [exist] = await connection.query(
          'SELECT id FROM template_bagian_teks WHERE template_id = ? AND jenis_bagian = ?', 
          [id, jenis]
        );
        
        if (exist.length > 0) {
          await connection.query(
            'UPDATE template_bagian_teks SET isi_teks = ? WHERE id = ?', 
            [isi, exist[0].id]
          );
        } else {
          await connection.query(
            'INSERT INTO template_bagian_teks (template_id, jenis_bagian, isi_teks) VALUES (?, ?, ?)',
            [id, jenis, isi]
          );
        }
      }
    }

    // B. Simpan Pasal-Pasal (Strategi: Hapus Semua -> Insert Ulang agar urutan rapi)
    if (articles && Array.isArray(articles)) {
      await connection.query('DELETE FROM template_pasal WHERE template_id = ?', [id]);
      
      if (articles.length > 0) {
        const sqlInsert = `INSERT INTO template_pasal (template_id, nomor_pasal, judul_pasal, isi_pasal, urutan) VALUES ?`;
        const values = articles.map((a, idx) => [
          id, a.nomor_pasal, a.judul_pasal, a.isi_pasal, idx + 1
        ]);
        await connection.query(sqlInsert, [values]);
      }
    }

    await connection.commit();
    res.json({ message: 'Konten template berhasil disimpan.' });

  } catch (error) {
    if (connection) await connection.rollback();
    console.error(error);
    res.status(500).json({ error: 'Gagal menyimpan konten template.' });
  } finally {
    if (connection) connection.release();
  }
};

// 5. Hapus Template
exports.deleteTemplate = async (req, res) => {
  const { id } = req.params;
  try {
    // Karena ON DELETE CASCADE di database, cukup hapus induknya
    await pool.query('DELETE FROM master_template_spk WHERE id = ?', [id]);
    res.json({ message: 'Template berhasil dihapus.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Gagal menghapus template.' });
  }
};