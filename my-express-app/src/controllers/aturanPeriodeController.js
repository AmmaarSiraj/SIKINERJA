// src/controllers/aturanPeriodeController.js
const { pool } = require('../config/db');

// GET: Ambil semua aturan (diurutkan dari periode terbaru)
exports.getAllAturan = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM aturan_periode ORDER BY periode DESC');
    res.json(rows);
  } catch (error) {
    console.error("Error getAllAturan:", error);
    res.status(500).json({ error: 'Gagal mengambil data aturan periode.' });
  }
};

// POST: Buat aturan baru
exports.createAturan = async (req, res) => {
  const { periode, batas_honor } = req.body;

  if (!periode || !batas_honor) {
    return res.status(400).json({ error: 'Periode dan Batas Honor wajib diisi.' });
  }

  try {
    const sql = 'INSERT INTO aturan_periode (periode, batas_honor) VALUES (?, ?)';
    const [result] = await pool.query(sql, [periode, batas_honor]);

    // Ambil data yang baru dibuat
    const [rows] = await pool.query('SELECT * FROM aturan_periode WHERE id = ?', [result.insertId]);
    
    res.status(201).json({
      message: 'Aturan periode berhasil dibuat.',
      data: rows[0]
    });

  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: `Aturan untuk periode ${periode} sudah ada. Silakan edit yang sudah ada.` });
    }
    console.error("Error createAturan:", error);
    res.status(500).json({ error: 'Gagal menyimpan aturan.' });
  }
};

// PUT: Update nominal batas honor
exports.updateAturan = async (req, res) => {
  const { id } = req.params;
  const { batas_honor } = req.body;

  if (!batas_honor) {
    return res.status(400).json({ error: 'Nominal batas honor wajib diisi.' });
  }

  try {
    const [result] = await pool.query('UPDATE aturan_periode SET batas_honor = ? WHERE id = ?', [batas_honor, id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Data aturan tidak ditemukan.' });
    }

    const [rows] = await pool.query('SELECT * FROM aturan_periode WHERE id = ?', [id]);
    res.json({
      message: 'Aturan berhasil diperbarui.',
      data: rows[0]
    });

  } catch (error) {
    console.error("Error updateAturan:", error);
    res.status(500).json({ error: 'Gagal mengupdate aturan.' });
  }
};

// DELETE: Hapus aturan
exports.deleteAturan = async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await pool.query('DELETE FROM aturan_periode WHERE id = ?', [id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Data aturan tidak ditemukan.' });
    }

    res.json({ message: 'Aturan periode berhasil dihapus.' });

  } catch (error) {
    console.error("Error deleteAturan:", error);
    res.status(500).json({ error: 'Gagal menghapus aturan.' });
  }
};