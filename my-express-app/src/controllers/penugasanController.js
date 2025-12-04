// src/controllers/penugasanController.js
const { pool } = require('../config/db');
const XLSX = require('xlsx');
const fs = require('fs');

const selectDetailQuery = `
  SELECT 
    p.id AS id_penugasan,
    p.created_at AS penugasan_created_at,
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
  FROM penugasan AS p
  JOIN subkegiatan AS s ON p.id_subkegiatan = s.id
  JOIN kegiatan AS k ON s.id_kegiatan = k.id
  JOIN users AS u ON p.id_pengawas = u.id
`;

exports.createPenugasan = async (req, res) => {
  const { id_subkegiatan, id_pengawas, anggota } = req.body;

  if (!id_subkegiatan || !id_pengawas) {
    return res.status(400).json({ error: 'ID Sub-Kegiatan dan ID Pengawas wajib diisi.' });
  }

  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    // 1. Insert Header Penugasan
    const sqlPenugasan = `INSERT INTO penugasan (id_subkegiatan, id_pengawas) VALUES (?, ?)`;
    const [result] = await connection.query(sqlPenugasan, [id_subkegiatan, id_pengawas]);
    const newPenugasanId = result.insertId;

    // 2. Insert Anggota ke Kelompok Penugasan
    if (anggota && Array.isArray(anggota) && anggota.length > 0) {
      for (const item of anggota) {
        // PERUBAHAN DI SINI: Tambahkan volume_tugas
        const vol = item.volume_tugas ? parseInt(item.volume_tugas) : 0;
        
        await connection.query(
          `INSERT INTO kelompok_penugasan (id_penugasan, id_mitra, kode_jabatan, volume_tugas) VALUES (?, ?, ?, ?)`,
          [newPenugasanId, item.id_mitra, item.kode_jabatan || null, vol]
        );
      }
    }

    await connection.commit();

    const [rows] = await connection.query(`${selectDetailQuery} WHERE p.id = ?`, [newPenugasanId]);
    
    res.status(201).json({
      message: 'Penugasan berhasil dibuat beserta anggota tim.',
      data: rows[0]
    });

  } catch (error) {
    if (connection) await connection.rollback();
    console.error("Create Penugasan Error:", error);
    res.status(500).json({ error: 'Terjadi kesalahan pada server.', details: error.message });
  } finally {
    if (connection) connection.release();
  }
};

exports.getAllPenugasan = async (req, res) => {
  try {
    const [rows] = await pool.query(`${selectDetailQuery} ORDER BY p.created_at DESC`);
    res.status(200).json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Terjadi kesalahan pada server.', details: error.message });
  }
};

exports.getPenugasanById = async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.query(`${selectDetailQuery} WHERE p.id = ?`, [id]);
    if (!rows || rows.length === 0) {
      return res.status(404).json({ error: 'Penugasan tidak ditemukan.' });
    }
    res.status(200).json(rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Terjadi kesalahan pada server.', details: error.message });
  }
};

exports.getAnggotaByPenugasanId = async (req, res) => {
  const { id } = req.params; 
  try {
    // PERUBAHAN DI SINI: 
    // 1. Select kp.volume_tugas
    // 2. Hitung total_honor = tarif * volume_tugas
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
      FROM kelompok_penugasan AS kp
      JOIN mitra AS m ON kp.id_mitra = m.id
      JOIN penugasan AS p ON kp.id_penugasan = p.id
      LEFT JOIN jabatan_mitra jm ON kp.kode_jabatan = jm.kode_jabatan
      LEFT JOIN honorarium h ON (h.id_subkegiatan = p.id_subkegiatan AND h.kode_jabatan = kp.kode_jabatan)
      WHERE kp.id_penugasan = ?
      ORDER BY m.nama_lengkap ASC
    `;
    const [rows] = await pool.query(sql, [id]);
    res.status(200).json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Terjadi kesalahan pada server.', details: error.message });
  }
};

exports.updatePenugasan = async (req, res) => {
  const { id } = req.params;
  const { id_subkegiatan, id_pengawas } = req.body;

  const updates = {};
  if (id_subkegiatan) updates.id_subkegiatan = id_subkegiatan;
  if (id_pengawas) updates.id_pengawas = id_pengawas;

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ error: 'Tidak ada data untuk diperbarui.' });
  }

  try {
    const [result] = await pool.query('UPDATE penugasan SET ? WHERE id = ?', [updates, id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Penugasan tidak ditemukan.' });
    }
    const [rows] = await pool.query(`${selectDetailQuery} WHERE p.id = ?`, [id]);
    res.status(200).json(rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Terjadi kesalahan pada server.', details: error.message });
  }
};

exports.deletePenugasan = async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await pool.query('DELETE FROM penugasan WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Penugasan tidak ditemukan.' });
    }
    res.status(200).json({ message: 'Penugasan berhasil dihapus.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Terjadi kesalahan pada server.', details: error.message });
  }
};

exports.importPenugasan = async (req, res) => {
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
      
      // PERUBAHAN DI SINI: Baca kolom volume/target dari Excel
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

        const [penugasanRows] = await connection.query(
          'SELECT id FROM penugasan WHERE id_subkegiatan = ? LIMIT 1', 
          [idSubKegiatan]
        );

        let idPenugasan;
        if (penugasanRows.length > 0) {
          idPenugasan = penugasanRows[0].id;
        } else {
          // Validasi Sub Kegiatan
          const [subRows] = await connection.query('SELECT id FROM subkegiatan WHERE id = ?', [idSubKegiatan]);
          if (subRows.length === 0) {
            throw new Error(`ID Sub Kegiatan '${idSubKegiatan}' tidak valid.`);
          }

          const [newP] = await connection.query(
            'INSERT INTO penugasan (id_subkegiatan, id_pengawas) VALUES (?, ?)', 
            [idSubKegiatan, idPengawas]
          );
          idPenugasan = newP.insertId;
        }

        // Cek Duplikasi di Kelompok
        const [cekKelompok] = await connection.query(
          'SELECT id FROM kelompok_penugasan WHERE id_penugasan = ? AND id_mitra = ?',
          [idPenugasan, idMitra]
        );

        if (cekKelompok.length === 0) {
          // Insert Baru dengan Volume
          await connection.query(
            'INSERT INTO kelompok_penugasan (id_penugasan, id_mitra, kode_jabatan, volume_tugas) VALUES (?, ?, ?, ?)',
            [idPenugasan, idMitra, kodeJabatan || null, vol]
          );
        } else {
          // Update Data Existing
          const updates = [];
          const params = [];
          
          if (kodeJabatan) {
              updates.push('kode_jabatan = ?');
              params.push(kodeJabatan);
          }
          if (vol > 0) { // Update volume hanya jika di excel diisi > 0
              updates.push('volume_tugas = ?');
              params.push(vol);
          }

          if (updates.length > 0) {
              params.push(cekKelompok[0].id);
              await connection.query(
                 `UPDATE kelompok_penugasan SET ${updates.join(', ')} WHERE id = ?`,
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
        message: 'Proses import selesai.',
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