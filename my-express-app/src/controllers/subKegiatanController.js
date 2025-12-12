// src/controllers/subKegiatanController.js
const { pool } = require('../config/db');
const XLSX = require('xlsx');
const fs = require('fs');

// Create Sub Kegiatan
exports.createSubKegiatan = async (req, res) => {
  const { 
    mode_kegiatan,       
    id_kegiatan,         
    nama_kegiatan_baru,  
    deskripsi_kegiatan,  
    
    // Field Sub Kegiatan (Periode, Open/Close Req DIHAPUS)
    nama_sub_kegiatan, 
    deskripsi, 
    tanggal_mulai, 
    tanggal_selesai
  } = req.body;

  if (!nama_sub_kegiatan) {
    return res.status(400).json({ message: 'Nama Sub Kegiatan wajib diisi' });
  }
  
  // Tanggal Mulai Wajib diisi karena sekarang jadi acuan Periode/Tahun
  if (!tanggal_mulai) {
    return res.status(400).json({ message: 'Tanggal Mulai wajib diisi sebagai acuan periode anggaran.' });
  }

  if (mode_kegiatan === 'existing' && !id_kegiatan) {
    return res.status(400).json({ message: 'Silakan pilih Kegiatan dari dropdown.' });
  }
  if (mode_kegiatan === 'new' && !nama_kegiatan_baru) {
    return res.status(400).json({ message: 'Nama Kegiatan Baru wajib diisi.' });
  }

  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    let finalIdKegiatan = id_kegiatan;

    if (mode_kegiatan === 'new') {
        const sqlKegiatan = `INSERT INTO kegiatan (nama_kegiatan, deskripsi) VALUES (?, ?)`;
        const [kegResult] = await connection.query(sqlKegiatan, [
            nama_kegiatan_baru, 
            deskripsi_kegiatan || null
        ]);
        finalIdKegiatan = kegResult.insertId;
    }

    const sqlSub = `
      INSERT INTO subkegiatan 
      (id_kegiatan, nama_sub_kegiatan, deskripsi, tanggal_mulai, tanggal_selesai) 
      VALUES (?, ?, ?, ?, ?)
    `;
    
    await connection.query(sqlSub, [
        finalIdKegiatan, 
        nama_sub_kegiatan, 
        deskripsi, 
        tanggal_mulai, 
        tanggal_selesai || null
    ]);

    await connection.commit();

    const [rows] = await pool.query(
        'SELECT * FROM subkegiatan WHERE id_kegiatan = ? AND nama_sub_kegiatan = ? ORDER BY created_at DESC LIMIT 1', 
        [finalIdKegiatan, nama_sub_kegiatan]
    );

    res.status(201).json({
      message: 'Sub Kegiatan berhasil dibuat',
      data: rows[0],
      id_kegiatan_parent: finalIdKegiatan 
    });

  } catch (err) {
    if (connection) await connection.rollback();
    console.error(err);
    res.status(500).json({ message: 'Gagal menyimpan data', error: err.message });
  } finally {
    if (connection) connection.release();
  }
};

exports.getSubKegiatanByKegiatanId = async (req, res) => {
  try {
    const { id_kegiatan } = req.params;
    const sql = 'SELECT * FROM subkegiatan WHERE id_kegiatan = ? ORDER BY created_at ASC';
    const [rows] = await pool.query(sql, [id_kegiatan]);
    
    // Status rekrutmen dihapus karena kolom open_req hilang
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateSubKegiatanStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || (status !== 'pending' && status !== 'done')) {
      return res.status(400).json({ message: "Status tidak valid." });
    }

    const sql = 'UPDATE subkegiatan SET status = ? WHERE id = ?';
    const [result] = await pool.query(sql, [status, id]);

    if (result.affectedRows === 0) return res.status(404).json({ message: 'Sub Kegiatan tidak ditemukan' });

    const [rows] = await pool.query('SELECT * FROM subkegiatan WHERE id = ?', [id]);
    res.json({ message: 'Status berhasil diperbarui', data: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.deleteSubKegiatan = async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await pool.query('DELETE FROM subkegiatan WHERE id = ?', [id]);
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Sub Kegiatan tidak ditemukan' });
    res.json({ message: 'Sub Kegiatan berhasil dihapus' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getSubKegiatanById = async (req, res) => {
  try {
    const { id } = req.params;
    const sql = 'SELECT * FROM subkegiatan WHERE id = ?';
    const [rows] = await pool.query(sql, [id]);
    if (!rows || rows.length === 0) return res.status(404).json({ message: 'Sub Kegiatan tidak ditemukan' });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getAllSubKegiatan = async (req, res) => {
  try {
    // Menghapus 's.periode' dari select
    const sql = `
      SELECT 
        s.id, 
        s.id_kegiatan,
        s.nama_sub_kegiatan, 
        s.deskripsi, 
        s.tanggal_mulai,
        s.tanggal_selesai,
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

exports.updateSubKegiatanInfo = async (req, res) => {
  try {
    const { id } = req.params;
    // Hapus periode, open_req, close_req
    const { nama_sub_kegiatan, deskripsi, tanggal_mulai, tanggal_selesai } = req.body;
    
    const updates = {};
    if (nama_sub_kegiatan) updates.nama_sub_kegiatan = nama_sub_kegiatan;
    if (deskripsi !== undefined) updates.deskripsi = deskripsi;
    if (tanggal_mulai !== undefined) updates.tanggal_mulai = tanggal_mulai;
    if (tanggal_selesai !== undefined) updates.tanggal_selesai = tanggal_selesai;

    if (Object.keys(updates).length === 0) return res.status(400).json({ message: 'Tidak ada data update' });

    const [result] = await pool.query('UPDATE subkegiatan SET ? WHERE id = ?', [updates, id]);
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Sub Kegiatan tidak ditemukan' });
    
    res.json({ message: 'Info Sub Kegiatan berhasil diperbarui' });
  } catch(err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.importSubKegiatan = async (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'File tidak ditemukan.' });

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
    let createdKegiatanCount = 0;
    let errors = [];
    const kegiatanCache = {}; 

    for (const [index, row] of data.entries()) {
      const rowNum = index + 2;
      const cleanRow = {};
      Object.keys(row).forEach(key => cleanRow[key.trim().toLowerCase()] = row[key]);

      const namaKegiatan = cleanRow['nama_kegiatan'];
      const namaSub = cleanRow['nama_sub_kegiatan'];
      const deskripsi = cleanRow['deskripsi'] || '';
      
      const tglMulai = cleanRow['tanggal_mulai'] || null;
      const tglSelesai = cleanRow['tanggal_selesai'] || null;

      if (!namaKegiatan || !namaSub) {
        failCount++;
        errors.push(`Baris ${rowNum}: Nama Kegiatan atau Sub Kegiatan kosong.`);
        continue;
      }

      try {
        let idKegiatan = kegiatanCache[namaKegiatan];
        if (!idKegiatan) {
            const [existing] = await connection.query('SELECT id FROM kegiatan WHERE nama_kegiatan = ? LIMIT 1', [namaKegiatan]);
            if (existing.length > 0) {
                idKegiatan = existing[0].id;
            } else {
                const [newKeg] = await connection.query('INSERT INTO kegiatan (nama_kegiatan, deskripsi) VALUES (?, NULL)', [namaKegiatan]);
                idKegiatan = newKeg.insertId;
                createdKegiatanCount++;
            }
            kegiatanCache[namaKegiatan] = idKegiatan;
        }

        const [cekSub] = await connection.query(
            'SELECT id FROM subkegiatan WHERE id_kegiatan = ? AND nama_sub_kegiatan = ?',
            [idKegiatan, namaSub]
        );

        if (cekSub.length > 0) {
             await connection.query(
                `UPDATE subkegiatan SET deskripsi=?, tanggal_mulai=?, tanggal_selesai=? WHERE id=?`,
                [deskripsi, tglMulai, tglSelesai, cekSub[0].id]
            );
        } else {
            await connection.query(
                `INSERT INTO subkegiatan (id_kegiatan, nama_sub_kegiatan, deskripsi, tanggal_mulai, tanggal_selesai) VALUES (?, ?, ?, ?, ?)`,
                [idKegiatan, namaSub, deskripsi, tglMulai, tglSelesai]
            );
        }
        successCount++;
      } catch (rowErr) {
        failCount++;
        errors.push(`Baris ${rowNum}: ${rowErr.message}`);
      }
    }

    fs.unlinkSync(req.file.path);
    res.json({ message: 'Proses import selesai.', successCount, failCount, createdKegiatanCount, errors });

  } catch (error) {
    console.error(error);
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    res.status(500).json({ message: 'Terjadi kesalahan server.', details: error.message });
  } finally {
    if (connection) connection.release();
  }
};