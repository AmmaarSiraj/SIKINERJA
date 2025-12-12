// src/controllers/perencanaanController.js
const { pool } = require('../config/db');
const XLSX = require('xlsx');
const fs = require('fs');

const selectDetailQuery = `
  SELECT 
    p.id AS id_perencanaan,
    p.created_at AS perencanaan_created_at,
    s.id AS id_subkegiatan,
    s.nama_sub_kegiatan,
    s.tanggal_mulai,    
    s.tanggal_selesai,  
    k.id AS id_kegiatan,
    k.nama_kegiatan,
    u.id AS id_pengawas,
    u.username AS nama_pengawas,
    u.email AS email_pengawas,
    u.role AS role_pengawas
  FROM perencanaan AS p
  JOIN subkegiatan AS s ON p.id_subkegiatan = s.id
  JOIN kegiatan AS k ON s.id_kegiatan = k.id
  JOIN users AS u ON p.id_pengawas = u.id
`;

exports.createPerencanaan = async (req, res) => {
  const { id_subkegiatan, id_pengawas, anggota } = req.body;

  if (!id_subkegiatan || !id_pengawas) {
    return res.status(400).json({ error: 'ID Sub-Kegiatan dan ID Pengawas wajib diisi.' });
  }

  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    // 1. Insert Header Perencanaan
    const sqlPerencanaan = `INSERT INTO perencanaan (id_subkegiatan, id_pengawas) VALUES (?, ?)`;
    const [result] = await connection.query(sqlPerencanaan, [id_subkegiatan, id_pengawas]);
    const newPerencanaanId = result.insertId;

    // 2. Insert Anggota ke Kelompok Perencanaan
    if (anggota && Array.isArray(anggota) && anggota.length > 0) {
      for (const item of anggota) {
        const vol = item.volume_tugas ? parseInt(item.volume_tugas) : 0;
        
        await connection.query(
          `INSERT INTO kelompok_perencanaan (id_perencanaan, id_mitra, kode_jabatan, volume_tugas) VALUES (?, ?, ?, ?)`,
          [newPerencanaanId, item.id_mitra, item.kode_jabatan || null, vol]
        );
      }
    }

    await connection.commit();

    const [rows] = await connection.query(`${selectDetailQuery} WHERE p.id = ?`, [newPerencanaanId]);
    
    res.status(201).json({
      message: 'Perencanaan berhasil dibuat beserta anggota tim.',
      data: rows[0]
    });

  } catch (error) {
    if (connection) await connection.rollback();
    console.error("Create Perencanaan Error:", error);
    res.status(500).json({ error: 'Terjadi kesalahan pada server.', details: error.message });
  } finally {
    if (connection) connection.release();
  }
};

exports.getAllPerencanaan = async (req, res) => {
  try {
    const [rows] = await pool.query(`${selectDetailQuery} ORDER BY p.created_at DESC`);
    res.status(200).json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Terjadi kesalahan pada server.', details: error.message });
  }
};

exports.getPerencanaanById = async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.query(`${selectDetailQuery} WHERE p.id = ?`, [id]);
    if (!rows || rows.length === 0) {
      return res.status(404).json({ error: 'Perencanaan tidak ditemukan.' });
    }
    res.status(200).json(rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Terjadi kesalahan pada server.', details: error.message });
  }
};

exports.getAnggotaByPerencanaanId = async (req, res) => {
  const { id } = req.params; 
  try {
    const sql = `
      SELECT 
        m.id AS id_mitra, 
        m.nama_lengkap, 
        m.nik, 
        m.no_hp,
        kp.id AS id_kelompok,
        kp.created_at AS bergabung_sejak,
        kp.kode_jabatan,
        kp.volume_tugas,
        IFNULL(jm.nama_jabatan, 'Belum ditentukan') AS nama_jabatan,
        IFNULL(h.tarif, 0) AS harga_satuan,
        (IFNULL(h.tarif, 0) * kp.volume_tugas) AS total_honor
      FROM kelompok_perencanaan AS kp
      JOIN mitra AS m ON kp.id_mitra = m.id
      JOIN perencanaan AS p ON kp.id_perencanaan = p.id
      LEFT JOIN jabatan_mitra jm ON kp.kode_jabatan = jm.kode_jabatan
      LEFT JOIN honorarium h ON (h.id_subkegiatan = p.id_subkegiatan AND h.kode_jabatan = kp.kode_jabatan)
      WHERE kp.id_perencanaan = ?
      ORDER BY m.nama_lengkap ASC
    `;
    const [rows] = await pool.query(sql, [id]);
    res.status(200).json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Terjadi kesalahan pada server.', details: error.message });
  }
};

exports.updatePerencanaan = async (req, res) => {
  const { id } = req.params;
  const { id_subkegiatan, id_pengawas } = req.body;

  const updates = {};
  if (id_subkegiatan) updates.id_subkegiatan = id_subkegiatan;
  if (id_pengawas) updates.id_pengawas = id_pengawas;

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ error: 'Tidak ada data untuk diperbarui.' });
  }

  try {
    const [result] = await pool.query('UPDATE perencanaan SET ? WHERE id = ?', [updates, id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Perencanaan tidak ditemukan.' });
    }
    const [rows] = await pool.query(`${selectDetailQuery} WHERE p.id = ?`, [id]);
    res.status(200).json(rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Terjadi kesalahan pada server.', details: error.message });
  }
};

exports.deletePerencanaan = async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await pool.query('DELETE FROM perencanaan WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Perencanaan tidak ditemukan.' });
    }
    res.status(200).json({ message: 'Perencanaan berhasil dihapus.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Terjadi kesalahan pada server.', details: error.message });
  }
};

exports.importPerencanaan = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'File tidak ditemukan.' });
  }

  let connection;
  try {
    const workbook = XLSX.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: "" });

    if (data.length === 0) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ message: 'File kosong.' });
    }

    connection = await pool.getConnection();

    let successCount = 0;
    let failCount = 0;
    let errors = [];

    const idPengawas = req.user ? req.user.id : 1; 

    for (const [index, row] of data.entries()) {
      const rowNum = index + 2;
      
      const cleanRow = {};
      Object.keys(row).forEach(key => cleanRow[key.trim().toLowerCase()] = row[key]);

      let nik = String(cleanRow['nik'] || '').replace(/'/g, '').trim();
      const idSubKegiatan = cleanRow['kegiatan_id'] || cleanRow['id_sub_kegiatan']; 
      const kodeJabatan = cleanRow['kode_jabatan'];
      const volumeInput = cleanRow['volume'] || cleanRow['target'] || cleanRow['volume_tugas'] || 0;
      const vol = parseInt(volumeInput);

      if (!nik || !idSubKegiatan) {
        failCount++;
        errors.push(`Baris ${rowNum}: NIK atau ID Sub Kegiatan kosong.`);
        continue;
      }

      try {
        const [mitraRows] = await connection.query('SELECT id FROM mitra WHERE nik = ?', [nik]);
        if (mitraRows.length === 0) {
          throw new Error(`NIK ${nik} tidak terdaftar di database Mitra.`);
        }
        const idMitra = mitraRows[0].id;

        const [perencanaanRows] = await connection.query(
          'SELECT id FROM perencanaan WHERE id_subkegiatan = ? LIMIT 1', 
          [idSubKegiatan]
        );

        let idPerencanaan;
        if (perencanaanRows.length > 0) {
          idPerencanaan = perencanaanRows[0].id;
        } else {
          // Validasi Sub Kegiatan
          const [subRows] = await connection.query('SELECT id FROM subkegiatan WHERE id = ?', [idSubKegiatan]);
          if (subRows.length === 0) {
            throw new Error(`ID Sub Kegiatan '${idSubKegiatan}' tidak valid.`);
          }

          const [newP] = await connection.query(
            'INSERT INTO perencanaan (id_subkegiatan, id_pengawas) VALUES (?, ?)', 
            [idSubKegiatan, idPengawas]
          );
          idPerencanaan = newP.insertId;
        }

        // Cek Duplikasi di Kelompok Perencanaan
        const [cekKelompok] = await connection.query(
          'SELECT id FROM kelompok_perencanaan WHERE id_perencanaan = ? AND id_mitra = ?',
          [idPerencanaan, idMitra]
        );

        if (cekKelompok.length === 0) {
          // Insert Baru dengan Volume
          await connection.query(
            'INSERT INTO kelompok_perencanaan (id_perencanaan, id_mitra, kode_jabatan, volume_tugas) VALUES (?, ?, ?, ?)',
            [idPerencanaan, idMitra, kodeJabatan || null, vol]
          );
        } else {
          // Update Data Existing
          const updates = [];
          const params = [];
          
          if (kodeJabatan) {
              updates.push('kode_jabatan = ?');
              params.push(kodeJabatan);
          }
          if (vol > 0) { 
              updates.push('volume_tugas = ?');
              params.push(vol);
          }

          if (updates.length > 0) {
              params.push(cekKelompok[0].id);
              await connection.query(
                 `UPDATE kelompok_perencanaan SET ${updates.join(', ')} WHERE id = ?`,
                 params
              );
          }
        }

        successCount++;

      } catch (rowErr) {
        failCount++;
        errors.push(`Baris ${rowNum} (${nik}): ${rowErr.message}`);
      }
    }

    fs.unlinkSync(req.file.path); 
    res.json({
        message: 'Proses import perencanaan selesai.',
        successCount,
        failCount,
        errors
    });

  } catch (error) {
    console.error(error);
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    res.status(500).json({ message: 'Terjadi kesalahan server saat import.', details: error.message });
  } finally {
    if (connection) connection.release();
  }
};