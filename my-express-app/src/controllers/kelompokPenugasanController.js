// src/controllers/kelompokPenugasanController.js
const { pool } = require('../config/db');

// Menambahkan mitra ke dalam penugasan
exports.addMitraToPenugasan = async (req, res) => {
  const { id_penugasan, id_mitra } = req.body;

  if (!id_penugasan || !id_mitra) {
    return res.status(400).json({ error: 'ID Penugasan dan ID Mitra wajib diisi.' });
  }

  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    // 1. Cek dulu kapasitas maksimum penugasan
    const [penugasanRows] = await connection.query(
      'SELECT jumlah_max_mitra FROM penugasan WHERE id = ?',
      [id_penugasan]
    );

    if (penugasanRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: 'Penugasan tidak ditemukan.' });
    }
    const maxMitra = penugasanRows[0].jumlah_max_mitra;

    // 2. Hitung jumlah mitra yang sudah ada
    const [countRows] = await connection.query(
      'SELECT COUNT(*) AS jumlah_sekarang FROM kelompok_penugasan WHERE id_penugasan = ?',
      [id_penugasan]
    );
    const jumlahSekarang = countRows[0].jumlah_sekarang;

    // 3. Bandingkan
    if (jumlahSekarang >= maxMitra) {
      await connection.rollback();
      return res.status(409).json({ error: 'Gagal menambahkan. Jumlah maksimal mitra untuk penugasan ini telah tercapai.' });
    }

    // 4. Jika masih ada slot, masukkan mitra
    const sql = 'INSERT INTO kelompok_penugasan (id_penugasan, id_mitra) VALUES (?, ?)';
    const [result] = await connection.query(sql, [id_penugasan, id_mitra]);
    
    // 5. Commit transaksi
    await connection.commit();

    // Ambil data yang baru dibuat untuk dikirim balik
    const [newRows] = await connection.query(
      'SELECT * FROM kelompok_penugasan WHERE id = ?',
       [result.insertId]
    );
    
    res.status(201).json({
      message: 'Mitra berhasil ditambahkan ke penugasan',
      data: newRows[0],
    });

  } catch (error) {
    if (connection) await connection.rollback();

    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Mitra ini sudah ada di dalam penugasan tersebut.' });
    }
    console.error(error);
    res.status(500).json({ error: 'Terjadi kesalahan pada server.', details: error.message });
  } finally {
    if (connection) connection.release();
  }
};

// Menghapus mitra dari penugasan (berdasarkan ID tabel kelompok_penugasan)
exports.removeMitraFromPenugasan = async (req, res) => {
  const { id } = req.params; // Ini adalah 'id' dari tabel 'kelompok_penugasan'

  try {
    const [result] = await pool.query('DELETE FROM kelompok_penugasan WHERE id = ?', [id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Data keanggotaan tidak ditemukan.' });
    }
    
    res.status(200).json({ message: 'Mitra berhasil dihapus dari penugasan.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Terjadi kesalahan pada server.', details: error.message });
  }
};

// (Opsional) Mendapatkan semua data relasi
exports.getAllKelompokPenugasan = async (req, res) => {
  try {
    const sql = `
        SELECT 
          kp.id AS id_kelompok,
          p.id AS id_penugasan,
          k.nama_kegiatan,
          m.id AS id_mitra,
          m.nama_lengkap AS nama_mitra
        FROM kelompok_penugasan AS kp
        JOIN penugasan AS p ON kp.id_penugasan = p.id
        JOIN kegiatan AS k ON p.id_kegiatan = k.id
        JOIN mitra AS m ON kp.id_mitra = m.id
        ORDER BY kp.created_at DESC
    `;
    const [rows] = await pool.query(sql);
    res.status(200).json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Terjadi kesalahan pada server.', details: error.message });
  }
};