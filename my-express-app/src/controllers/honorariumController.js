const { pool } = require('../config/db');

// Query JOIN Baru: Langsung ke subkegiatan dan satuan
const selectQuery = `
  SELECT 
    h.id AS id_honorarium,
    h.tarif,
    h.id_subkegiatan,
    h.id_satuan,
    h.basis_volume,
    s.nama_sub_kegiatan,
    k.nama_kegiatan,
    sat.nama_satuan,
    sat.alias AS satuan_alias
  FROM honorarium AS h
  JOIN subkegiatan AS s ON h.id_subkegiatan = s.id
  JOIN kegiatan AS k ON s.id_kegiatan = k.id
  JOIN satuan_kegiatan AS sat ON h.id_satuan = sat.id
`;

exports.getAllHonorarium = async (req, res) => {
  try {
    const [rows] = await pool.query(`${selectQuery} ORDER BY h.id DESC`);
    res.status(200).json(rows);
  } catch (error) {
    console.error("Error getAllHonorarium:", error); // Log error ke terminal
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

exports.createHonorarium = async (req, res) => {
  // Input sekarang menggunakan id_subkegiatan, id_satuan, basis_volume
  const { id_subkegiatan, tarif, id_satuan, basis_volume } = req.body;

  if (!id_subkegiatan || !tarif || !id_satuan) {
    return res.status(400).json({ error: 'ID Sub Kegiatan, Tarif, dan Satuan wajib diisi.' });
  }

  try {
    // Cek apakah sub kegiatan ini sudah punya tarif?
    const [existing] = await pool.query('SELECT id FROM honorarium WHERE id_subkegiatan = ?', [id_subkegiatan]);
    if (existing.length > 0) {
        return res.status(400).json({ error: 'Sub Kegiatan ini sudah memiliki tarif honorarium.' });
    }

    const sql = `INSERT INTO honorarium (id_subkegiatan, tarif, id_satuan, basis_volume) VALUES (?, ?, ?, ?)`;
    const valVolume = basis_volume || 1; 
    
    const [result] = await pool.query(sql, [id_subkegiatan, tarif, id_satuan, valVolume]);

    const [rows] = await pool.query(`${selectQuery} WHERE h.id = ?`, [result.insertId]);
    res.status(201).json(rows[0]);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

exports.updateHonorarium = async (req, res) => {
  const { id } = req.params;
  const { id_subkegiatan, tarif, id_satuan, basis_volume } = req.body;

  const updates = {};
  if (id_subkegiatan !== undefined) updates.id_subkegiatan = id_subkegiatan;
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