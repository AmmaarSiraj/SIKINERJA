// src/controllers/jabatanMitraController.js
const { pool } = require('../config/db');

// GET Semua Jabatan
// Perubahan: Menghapus filter WHERE id_subkegiatan karena tabel sekarang bersifat global
exports.getAllJabatan = async (req, res) => {
  try {
    // Kita tambahkan ORDER BY agar tampilan di tabel frontend rapi (alfabetis)
    const sql = 'SELECT * FROM jabatan_mitra ORDER BY nama_jabatan ASC';
    const [rows] = await pool.query(sql);
    
    res.json(rows);
  } catch (error) {
    console.error("Error getAllJabatan:", error);
    res.status(500).json({ error: 'Terjadi kesalahan pada server saat mengambil data jabatan.' });
  }
};

// Buat Jabatan Baru
// Perubahan: Menghapus input id_subkegiatan dari body request dan query INSERT
exports.createJabatan = async (req, res) => {
  const { kode_jabatan, nama_jabatan } = req.body;
  
  // Validasi: Cukup Kode dan Nama saja
  if (!kode_jabatan || !nama_jabatan) {
    return res.status(400).json({ error: 'Kode Jabatan dan Nama Jabatan wajib diisi.' });
  }

  try {
    const sql = 'INSERT INTO jabatan_mitra (kode_jabatan, nama_jabatan) VALUES (?, ?)';
    await pool.query(sql, [kode_jabatan, nama_jabatan]);
    
    // Mengembalikan data yang baru dibuat agar frontend bisa langsung update state jika perlu
    res.status(201).json({ 
      message: 'Jabatan berhasil dibuat', 
      data: { kode_jabatan, nama_jabatan } 
    });

  } catch (error) {
    // Handle error jika Kode Jabatan sudah ada (Duplicate Entry)
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: `Kode Jabatan '${kode_jabatan}' sudah terdaftar. Gunakan kode lain.` });
    }
    console.error("Error createJabatan:", error);
    res.status(500).json({ error: 'Terjadi kesalahan pada server saat menyimpan jabatan.' });
  }
};

// Hapus Jabatan
// Tidak ada perubahan logika signifikan, tetap menggunakan parameter kode_jabatan
exports.deleteJabatan = async (req, res) => {
  const { kode } = req.params; // Mengambil dari URL /:kode
  
  try {
    const [result] = await pool.query('DELETE FROM jabatan_mitra WHERE kode_jabatan = ?', [kode]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Jabatan tidak ditemukan.' });
    }

    res.json({ message: 'Jabatan berhasil dihapus.' });

  } catch (error) {
    // Handle error jika jabatan sedang dipakai di tabel lain (Foreign Key Constraint)
    // Misal: Masih ada honorarium atau data historis yang menggunakan kode ini
    if (error.code === 'ER_ROW_IS_REFERENCED_2') {
        return res.status(400).json({ error: 'Jabatan tidak bisa dihapus karena sedang digunakan dalam data honorarium atau penugasan.' });
    }
    console.error("Error deleteJabatan:", error);
    res.status(500).json({ error: 'Terjadi kesalahan pada server saat menghapus jabatan.' });
  }
};