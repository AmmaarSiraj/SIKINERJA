const { pool } = require('../config/db');

const createKegiatan = async (req, res) => {
  // 1. Ambil data utama DAN array subkegiatans dari body
  const { 
    nama_kegiatan, 
    deskripsi, 
    tahun_anggaran, 
    tanggal_mulai, 
    tanggal_selesai, 
    subkegiatans // Ini adalah array baru (opsional)
  } = req.body;
  
  // 2. Validasi data utama
  if (!nama_kegiatan || !tahun_anggaran || !tanggal_mulai || !tanggal_selesai) {
    return res.status(400).json({ message: 'Nama kegiatan, tahun anggaran, tanggal mulai, dan tanggal selesai wajib diisi' });
  }

  // 3. Validasi data sub-kegiatan (jika ada)
  if (subkegiatans && subkegiatans.length > 0) {
    for (const sub of subkegiatans) {
      if (!sub.nama_sub_kegiatan) {
        return res.status(400).json({ message: 'Nama sub kegiatan tidak boleh kosong' });
      }
    }
  }

  // 4. Mulai Transaksi Database
  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    // 5. Insert 'kegiatan' utama
    const sqlKegiatan = `
      INSERT INTO kegiatan (nama_kegiatan, deskripsi, tahun_anggaran, tanggal_mulai, tanggal_selesai) 
      VALUES (?, ?, ?, ?, ?)
    `;
    const [kegiatanResult] = await connection.query(sqlKegiatan, [
      nama_kegiatan,
      deskripsi,
      tahun_anggaran,
      tanggal_mulai,
      tanggal_selesai,
    ]);
    
    const newKegiatanId = kegiatanResult.insertId; // Ambil ID dari 'kegiatan' yang baru saja dibuat

    // 6. Insert 'subkegiatan' (jika ada)
    if (subkegiatans && subkegiatans.length > 0) {
      // Kita gunakan query INSERT bulk
      const sqlSubKegiatan = `
        INSERT INTO subkegiatan (id_kegiatan, nama_sub_kegiatan, deskripsi) 
        VALUES ?
      `;
      
      // Format data untuk bulk insert: [[id, name, desc], [id, name, desc], ...]
      const subKegiatanValues = subkegiatans.map(sub => [
        newKegiatanId, // ID kegiatan yang sama untuk semua
        sub.nama_sub_kegiatan,
        sub.deskripsi
      ]);

      // Trigger 'sub1', 'sub2' di database Anda akan otomatis berjalan untuk setiap baris
      await connection.query(sqlSubKegiatan, [subKegiatanValues]);
    }

    // 7. Jika semua berhasil, commit transaksi
    await connection.commit();

    // 8. Ambil data yang baru dibuat untuk dikembalikan ke frontend
    const [kegiatanRows] = await connection.query('SELECT * FROM kegiatan WHERE id = ?', [newKegiatanId]);
    const [subKegiatanRows] = await connection.query('SELECT * FROM subkegiatan WHERE id_kegiatan = ?', [newKegiatanId]);

    res.status(201).json({
      message: 'Kegiatan dan Sub Kegiatan berhasil ditambahkan',
      data: {
        kegiatan: kegiatanRows[0],
        subkegiatans: subKegiatanRows
      }
    });

  } catch (err) {
    // 9. Jika ada error, batalkan semua (rollback)
    if (connection) await connection.rollback();
    console.error(err);
    return res.status(500).json({ message: 'Server error saat menyimpan data' });
  } finally {
    // 10. Selalu lepaskan koneksi
    if (connection) connection.release();
  }
};

const getAllKegiatan = async (req, res) => {
  try {
    // Query dimodifikasi untuk:
    // 1. Join ke tabel penugasan (untuk dapat id_penugasan & max mitra)
    // 2. Join ke kelompok_penugasan (untuk hitung jumlah yang sudah terisi)
    const sql = `
      SELECT 
        k.*,
        p.id AS id_penugasan,
        p.jumlah_max_mitra,
        COUNT(kp.id) AS jumlah_terisi
      FROM kegiatan k
      LEFT JOIN penugasan p ON k.id = p.id_kegiatan
      LEFT JOIN kelompok_penugasan kp ON p.id = kp.id_penugasan
      GROUP BY k.id
      ORDER BY k.created_at DESC
    `;

    const [rows] = await pool.query(sql);
    return res.json(rows);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

const getKegiatanById = async (req, res) => {
  try {
    const { id } = req.params;

    // Query UPDATE: Join ke penugasan & hitung jumlah_terisi
    const sql = `
      SELECT 
        k.*,
        p.id AS id_penugasan,
        p.jumlah_max_mitra,
        COUNT(kp.id) AS jumlah_terisi
      FROM kegiatan k
      LEFT JOIN penugasan p ON k.id = p.id_kegiatan
      LEFT JOIN kelompok_penugasan kp ON p.id = kp.id_penugasan
      WHERE k.id = ?
      GROUP BY k.id
    `;

    const [rows] = await pool.query(sql, [id]);

    if (!rows || rows.length === 0) {
      return res.status(404).json({ message: 'Kegiatan tidak ditemukan' });
    }

    return res.json(rows[0]);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

const updateKegiatan = async (req, res) => {
  try {
    const { id } = req.params;
    const { nama_kegiatan, deskripsi, tahun_anggaran, tanggal_mulai, tanggal_selesai } = req.body;

    const updateData = {};
    if (nama_kegiatan) updateData.nama_kegiatan = nama_kegiatan;
    if (deskripsi !== undefined) updateData.deskripsi = deskripsi;
    if (tahun_anggaran) updateData.tahun_anggaran = tahun_anggaran;
    if (tanggal_mulai) updateData.tanggal_mulai = tanggal_mulai;
    if (tanggal_selesai) updateData.tanggal_selesai = tanggal_selesai;

    if (Object.keys(updateData).length === 0) {
        return res.status(400).json({ message: 'Tidak ada data yang diperbarui' });
    }

    const [result] = await pool.query('UPDATE kegiatan SET ? WHERE id = ?', [updateData, id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Kegiatan tidak ditemukan' });
    }

    const [rows] = await pool.query('SELECT * FROM kegiatan WHERE id = ?', [id]);

    return res.json({
      message: 'Kegiatan updated successfully',
      data: rows[0],
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

const deleteKegiatan = async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await pool.query('DELETE FROM kegiatan WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Kegiatan tidak ditemukan' });
    }

    return res.json({ message: 'Kegiatan deleted successfully' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  createKegiatan,
  getAllKegiatan,
  getKegiatanById,
  updateKegiatan,
  deleteKegiatan,
};