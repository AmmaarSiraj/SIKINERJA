// src/controllers/honorariumController.js
const { pool } = require('../config/db');

// Query JOIN Baru: Ditambahkan join ke tabel jabatan_mitra untuk mengambil nama jabatan
const selectQuery = `
  SELECT 
    h.id AS id_honorarium,
    h.tarif,
    h.id_subkegiatan,
    h.kode_jabatan,
    h.id_satuan,
    h.basis_volume,
    s.nama_sub_kegiatan,
    k.nama_kegiatan,
    sat.nama_satuan,
    sat.alias AS satuan_alias,
    jm.nama_jabatan
  FROM honorarium AS h
  JOIN subkegiatan AS s ON h.id_subkegiatan = s.id
  JOIN kegiatan AS k ON s.id_kegiatan = k.id
  JOIN satuan_kegiatan AS sat ON h.id_satuan = sat.id
  JOIN jabatan_mitra AS jm ON h.kode_jabatan = jm.kode_jabatan
`;

exports.getAllHonorarium = async (req, res) => {
  try {
    const [rows] = await pool.query(`${selectQuery} ORDER BY h.id DESC`);
    res.status(200).json(rows);
  } catch (error) {
    console.error("Error getAllHonorarium:", error);
    res.status(500).json({ error: error.message });
  }
};

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
    res.status(500).json({ error: error.message });
  }
};

// CREATE: Menambahkan Honor dengan Kode Jabatan
exports.createHonorarium = async (req, res) => {
  // Ambil kode_jabatan dari body
  const { id_subkegiatan, kode_jabatan, tarif, id_satuan, basis_volume } = req.body;

  // Validasi Input
  if (!id_subkegiatan || !kode_jabatan || !tarif || !id_satuan) {
    return res.status(400).json({ error: 'ID Sub Kegiatan, Kode Jabatan, Tarif, dan Satuan wajib diisi.' });
  }

  try {
    // Cek Duplikasi: Apakah jabatan ini sudah punya tarif di sub kegiatan yang sama?
    const [existing] = await pool.query(
      'SELECT id FROM honorarium WHERE id_subkegiatan = ? AND kode_jabatan = ?', 
      [id_subkegiatan, kode_jabatan]
    );
    
    if (existing.length > 0) {
        return res.status(400).json({ error: 'Jabatan ini sudah memiliki tarif honor di sub kegiatan tersebut.' });
    }

    // Insert Data
    const sql = `
      INSERT INTO honorarium (id_subkegiatan, kode_jabatan, tarif, id_satuan, basis_volume) 
      VALUES (?, ?, ?, ?, ?)
    `;
    const valVolume = basis_volume || 1; 
    
    const [result] = await pool.query(sql, [id_subkegiatan, kode_jabatan, tarif, id_satuan, valVolume]);

    // Kembalikan data yang baru dibuat
    const [rows] = await pool.query(`${selectQuery} WHERE h.id = ?`, [result.insertId]);
    res.status(201).json(rows[0]);

  } catch (error) {
    console.error(error);
    // Handle error FK constraint (misal kode_jabatan tidak ada di tabel master)
    if (error.code === 'ER_NO_REFERENCED_ROW_2') {
        return res.status(400).json({ error: 'Kode Jabatan tidak valid (tidak ditemukan di master jabatan).' });
    }
    res.status(500).json({ error: error.message });
  }
};

// UPDATE: Mengubah Honor
exports.updateHonorarium = async (req, res) => {
  const { id } = req.params;
  const { id_subkegiatan, kode_jabatan, tarif, id_satuan, basis_volume } = req.body;

  const updates = {};
  if (id_subkegiatan !== undefined) updates.id_subkegiatan = id_subkegiatan;
  if (kode_jabatan !== undefined) updates.kode_jabatan = kode_jabatan; // Update kode jabatan
  if (tarif !== undefined) updates.tarif = tarif;
  if (id_satuan !== undefined) updates.id_satuan = id_satuan;
  if (basis_volume !== undefined) updates.basis_volume = basis_volume;

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ error: 'Tidak ada data untuk diperbarui.' });
  }

  try {
    const [result] = await pool.query('UPDATE honorarium SET ? WHERE id = ?', [updates, id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Data honorarium tidak ditemukan.' });
    }
    
    const [rows] = await pool.query(`${selectQuery} WHERE h.id = ?`, [id]);
    res.status(200).json(rows[0]);

  } catch (error) {
    // Handle error duplicate entry jika update menyebabkan duplikasi kombinasi
    if (error.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({ error: 'Kombinasi Sub Kegiatan dan Jabatan ini sudah ada.' });
    }
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

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
    res.status(500).json({ error: error.message });
  }
};