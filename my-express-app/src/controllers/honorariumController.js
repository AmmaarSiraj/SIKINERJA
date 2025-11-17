// src/controllers/honorariumController.js
const { pool } = require('../config/db');

// --- Query JOIN ---
// Query ini akan mengambil data honorarium dan menggabungkannya
// dengan tabel kegiatan atau subkegiatan untuk mendapatkan "nama"-nya.
// COALESCE akan memilih nama pertama yang tidak NULL (nama_kegiatan atau nama_sub_kegiatan)
// dan menampilkannya sebagai 'nama_pekerjaan'.
const selectQuery = `
  SELECT 
    h.id AS id_honorarium,
    h.tarif,
    k.id AS id_kegiatan,
    k.nama_kegiatan,
    s.id AS id_subkegiatan,
    s.nama_sub_kegiatan,
    COALESCE(k.nama_kegiatan, s.nama_sub_kegiatan, 'N/A') AS nama_pekerjaan
  FROM honorarium AS h
  LEFT JOIN kegiatan AS k ON h.id_kegiatan = k.id
  LEFT JOIN subkegiatan AS s ON h.id_subkegiatan = s.id
`;

// GET /api/honorarium
exports.getAllHonorarium = async (req, res) => {
  try {
    const [rows] = await pool.query(`${selectQuery} ORDER BY h.id DESC`);
    res.status(200).json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Terjadi kesalahan pada server.', details: error.message });
  }
};

// GET /api/honorarium/:id
exports.getHonorariumById = async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.query(`${selectQuery} WHERE h.id = ?`, [id]);
    if (!rows || rows.length === 0) {
      return res.status(404).json({ error: 'Data honorarium tidak ditemukan.' });
    }
    res.status(200).json(rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Terjadi kesalahan pada server.', details: error.message });
  }
};

// POST /api/honorarium
exports.createHonorarium = async (req, res) => {
  const { id_kegiatan, id_subkegiatan, tarif } = req.body;

  // 1. Validasi Input
  if (!tarif) {
    return res.status(400).json({ error: 'Tarif wajib diisi.' });
  }
  if (!id_kegiatan && !id_subkegiatan) {
    return res.status(400).json({ error: 'Harus memilih salah satu: ID Kegiatan atau ID Sub Kegiatan.' });
  }
  // Cek ini juga di API, meskipun sudah ada trigger di DB
  if (id_kegiatan && id_subkegiatan) {
    return res.status(400).json({ error: 'Tidak boleh mengisi id_kegiatan dan id_subkegiatan sekaligus.' });
  }

  try {
    const sql = `
      INSERT INTO honorarium (id_kegiatan, id_subkegiatan, tarif) 
      VALUES (?, ?, ?)
    `;
    
    // Kirim null jika salah satu ID tidak terdefinisi
    const [result] = await pool.query(sql, [
      id_kegiatan || null,
      id_subkegiatan || null,
      tarif
    ]);

    // Ambil data yang baru saja dibuat
    const [rows] = await pool.query(`${selectQuery} WHERE h.id = ?`, [result.insertId]);
    res.status(201).json(rows[0]);

  } catch (error) {
    // Menangkap error dari Trigger
    if (error.code === 'ER_SIGNAL_EXCEPTION') {
        return res.status(400).json({ error: error.sqlMessage });
    }
    console.error(error);
    res.status(500).json({ error: 'Terjadi kesalahan pada server.', details: error.message });
  }
};

// PUT /api/honorarium/:id
exports.updateHonorarium = async (req, res) => {
  const { id } = req.params;
  const { id_kegiatan, id_subkegiatan, tarif } = req.body;

  // Cek ini juga di API, meskipun sudah ada trigger di DB
  if (id_kegiatan && id_subkegiatan) {
    return res.status(400).json({ error: 'Tidak boleh mengisi id_kegiatan dan id_subkegiatan sekaligus.' });
  }

  const updates = {};
  if (tarif !== undefined) updates.tarif = tarif;
  
  // Logika update: Jika user mengirim id_kegiatan, 
  // kita harus pastikan id_subkegiatan di-set ke NULL, begitu pula sebaliknya.
  if (id_kegiatan !== undefined) {
    updates.id_kegiatan = id_kegiatan;
    updates.id_subkegiatan = null;
  } else if (id_subkegiatan !== undefined) {
    updates.id_subkegiatan = id_subkegiatan;
    updates.id_kegiatan = null;
  }
  
  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ error: 'Tidak ada data untuk diperbarui.' });
  }

  try {
    const [result] = await pool.query('UPDATE honorarium SET ? WHERE id = ?', [updates, id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Data honorarium tidak ditemukan.' });
    }
    
    // Ambil data yang baru saja di-update
    const [rows] = await pool.query(`${selectQuery} WHERE h.id = ?`, [id]);
    res.status(200).json(rows[0]);

  } catch (error) {
    // Menangkap error dari Trigger
    if (error.code === 'ER_SIGNAL_EXCEPTION') {
        return res.status(400).json({ error: error.sqlMessage });
    }
    console.error(error);
    res.status(500).json({ error: 'Terjadi kesalahan pada server.', details: error.message });
  }
};

// DELETE /api/honorarium/:id
exports.deleteHonorarium = async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await pool.query('DELETE FROM honorarium WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Data honorarium tidak ditemukan.' });
    }
    res.status(200).json({ message: 'Data honorarium berhasil dihapus.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Terjadi kesalahan pada server.', details: error.message });
  }
};