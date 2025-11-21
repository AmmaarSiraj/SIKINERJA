const { pool } = require('../config/db');

// POST /api/subkegiatan
// (Untuk nanti jika Anda butuh form 'Tambah Sub Kegiatan')
exports.createSubKegiatan = async (req, res) => {
  try {
    const { id_kegiatan, nama_sub_kegiatan, deskripsi } = req.body;
    if (!id_kegiatan || !nama_sub_kegiatan) {
      return res.status(400).json({ message: 'ID Kegiatan and Nama Sub Kegiatan wajib diisi' });
    }

    const sql = 'INSERT INTO subkegiatan (id_kegiatan, nama_sub_kegiatan, deskripsi) VALUES (?, ?, ?)';
    const [result] = await pool.query(sql, [id_kegiatan, nama_sub_kegiatan, deskripsi]);

    // Ambil data yang baru dibuat menggunakan ID dari trigger (subX)
    // Perlu query tambahan karena trigger yang menangani ID
    const [rows] = await pool.query('SELECT * FROM subkegiatan WHERE id_kegiatan = ? AND nama_sub_kegiatan = ? ORDER BY created_at DESC LIMIT 1', [id_kegiatan, nama_sub_kegiatan]);

    res.status(201).json({
      message: 'Sub Kegiatan berhasil ditambahkan',
      data: rows[0],
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/subkegiatan/kegiatan/:id_kegiatan
// (Ini yang paling PENTING untuk halaman detail Anda)
exports.getSubKegiatanByKegiatanId = async (req, res) => {
  try {
    const { id_kegiatan } = req.params;
    const sql = 'SELECT * FROM subkegiatan WHERE id_kegiatan = ? ORDER BY created_at ASC';
    const [rows] = await pool.query(sql, [id_kegiatan]);
    
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// PUT /api/subkegiatan/:id/status
// (PENTING untuk tombol "Mark as Done")
exports.updateSubKegiatanStatus = async (req, res) => {
  try {
    const { id } = req.params; // Ini adalah ID subkegiatan (cth: "sub1")
    const { status } = req.body;

    if (!status || (status !== 'pending' && status !== 'done')) {
      return res.status(400).json({ message: "Status tidak valid. Gunakan 'pending' atau 'done'." });
    }

    const sql = 'UPDATE subkegiatan SET status = ? WHERE id = ?';
    const [result] = await pool.query(sql, [status, id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Sub Kegiatan tidak ditemukan' });
    }

    const [rows] = await pool.query('SELECT * FROM subkegiatan WHERE id = ?', [id]);
    res.json({
      message: 'Status Sub Kegiatan berhasil diperbarui',
      data: rows[0],
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// DELETE /api/subkegiatan/:id
// (Untuk nanti jika Anda butuh tombol delete)
exports.deleteSubKegiatan = async (req, res) => {
  try {
    const { id } = req.params; // ID subkegiatan
    const [result] = await pool.query('DELETE FROM subkegiatan WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Sub Kegiatan tidak ditemukan' });
    }
    res.json({ message: 'Sub Kegiatan berhasil dihapus' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getSubKegiatanById = async (req, res) => {
  try {
    const { id } = req.params;
    // Query langsung ke tabel subkegiatan
    const sql = 'SELECT * FROM subkegiatan WHERE id = ?';
    const [rows] = await pool.query(sql, [id]);

    if (!rows || rows.length === 0) {
      return res.status(404).json({ message: 'Sub Kegiatan tidak ditemukan' });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getAllSubKegiatan = async (req, res) => {
  try {
    const sql = `
      SELECT 
        s.id, 
        s.nama_sub_kegiatan, 
        s.deskripsi, 
        k.nama_kegiatan 
      FROM subkegiatan s
      JOIN kegiatan k ON s.id_kegiatan = k.id
      ORDER BY k.nama_kegiatan ASC, s.nama_sub_kegiatan ASC
    `;
    const [rows] = await pool.query(sql);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};