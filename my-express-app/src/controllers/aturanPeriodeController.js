// src/controllers/aturanPeriodeController.js
const { pool } = require('../config/db');

// GET: Ambil semua aturan (Format Tahun)
exports.getAllAturan = async (req, res) => {
  try {
    // Perubahan: Menggunakan LEFT(periode, 4) untuk mengambil digit tahun saja
    // dan meng-aliaskannya menjadi 'tahun'
    const sql = `
      SELECT 
        id, 
        LEFT(periode, 4) as tahun, 
        batas_honor, 
        updated_at 
      FROM aturan_periode 
      ORDER BY periode DESC
    `;
    
    const [rows] = await pool.query(sql);
    res.json(rows);
  } catch (error) {
    console.error("Error getAllAturan:", error);
    res.status(500).json({ error: 'Gagal mengambil data aturan periode.' });
  }
};

// POST: Buat aturan baru (Menerima input 'tahun')
exports.createAturan = async (req, res) => {
  // Frontend bisa mengirim field 'tahun' atau 'periode'
  const { tahun, periode, batas_honor } = req.body;

  // Prioritaskan 'tahun', jika tidak ada gunakan 'periode'
  const valueTahun = tahun || periode;

  if (!valueTahun || !batas_honor) {
    return res.status(400).json({ error: 'Tahun dan Batas Honor wajib diisi.' });
  }

  // Validasi format tahun (harus 4 digit angka)
  if (!/^\d{4}$/.test(valueTahun)) {
    return res.status(400).json({ error: 'Format tahun harus 4 digit angka (contoh: 2025).' });
  }

  try {
    // Kita simpan valueTahun ke kolom 'periode' di database
    const sql = 'INSERT INTO aturan_periode (periode, batas_honor) VALUES (?, ?)';
    const [result] = await pool.query(sql, [valueTahun, batas_honor]);

    // Ambil data yang baru dibuat dengan format tahun yang konsisten
    const [rows] = await pool.query(
      'SELECT id, LEFT(periode, 4) as tahun, batas_honor, updated_at FROM aturan_periode WHERE id = ?', 
      [result.insertId]
    );
    
    res.status(201).json({
      message: 'Aturan periode tahunan berhasil dibuat.',
      data: rows[0]
    });

  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: `Aturan untuk tahun ${valueTahun} sudah ada. Silakan edit yang sudah ada.` });
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

    // Return data terupdate dengan format tahun
    const [rows] = await pool.query(
      'SELECT id, LEFT(periode, 4) as tahun, batas_honor, updated_at FROM aturan_periode WHERE id = ?', 
      [id]
    );

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