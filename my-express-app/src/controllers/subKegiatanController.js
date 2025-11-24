const { pool } = require('../config/db');
const XLSX = require('xlsx');
const fs = require('fs');

const calculateRecruitmentStatus = (openDate, closeDate) => {
  if (!openDate || !closeDate) return 'undefined';

  const now = new Date();
  now.setHours(0, 0, 0, 0); 
  
  const start = new Date(openDate);
  const end = new Date(closeDate);

  if (now < start) return 'pending';
  if (now > end) return 'closed';
  return 'open';
};

exports.createSubKegiatan = async (req, res) => {
  // Ambil data dari body, perhatikan field tambahan untuk logika "baru/lama"
  const { 
    mode_kegiatan,       // 'existing' atau 'new'
    id_kegiatan,         // Diisi jika mode 'existing' (dari dropdown)
    nama_kegiatan_baru,  // Diisi jika mode 'new' (input text baru)
    deskripsi_kegiatan,  // Opsional untuk kegiatan baru
    
    // Data Sub Kegiatan
    nama_sub_kegiatan, 
    deskripsi, 
    periode, 
    tanggal_mulai, 
    tanggal_selesai, 
    open_req, 
    close_req 
  } = req.body;

  if (!nama_sub_kegiatan) {
    return res.status(400).json({ message: 'Nama Sub Kegiatan wajib diisi' });
  }

  // Validasi Logika Kegiatan
  if (mode_kegiatan === 'existing' && !id_kegiatan) {
    return res.status(400).json({ message: 'Silakan pilih Kegiatan dari dropdown.' });
  }
  if (mode_kegiatan === 'new' && !nama_kegiatan_baru) {
    return res.status(400).json({ message: 'Nama Kegiatan Baru wajib diisi.' });
  }

  let connection;
  try {
    // 1. Mulai Transaksi
    connection = await pool.getConnection();
    await connection.beginTransaction();

    let finalIdKegiatan = id_kegiatan;

    // 2. Cek Mode: Jika 'new', Buat Kegiatan dulu
    if (mode_kegiatan === 'new') {
        const sqlKegiatan = `INSERT INTO kegiatan (nama_kegiatan, deskripsi) VALUES (?, ?)`;
        const [kegResult] = await connection.query(sqlKegiatan, [
            nama_kegiatan_baru, 
            deskripsi_kegiatan || null
        ]);
        
        // Ambil ID dari kegiatan yang barusan dibuat
        finalIdKegiatan = kegResult.insertId;
    }

    // 3. Simpan Sub Kegiatan (menggunakan finalIdKegiatan)
    // ID Subkegiatan akan digenerate otomatis oleh Trigger di Database (sub1, sub2, dst)
    const sqlSub = `
      INSERT INTO subkegiatan 
      (id_kegiatan, nama_sub_kegiatan, deskripsi, periode, tanggal_mulai, tanggal_selesai, open_req, close_req) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    await connection.query(sqlSub, [
        finalIdKegiatan, 
        nama_sub_kegiatan, 
        deskripsi, 
        periode || null, 
        tanggal_mulai || null, 
        tanggal_selesai || null,
        open_req || null,
        close_req || null
    ]);

    // 4. Commit Transaksi (Simpan permanen)
    await connection.commit();

    // Ambil data terbaru untuk dikirim ke frontend
    const [rows] = await pool.query(
        'SELECT * FROM subkegiatan WHERE id_kegiatan = ? AND nama_sub_kegiatan = ? ORDER BY created_at DESC LIMIT 1', 
        [finalIdKegiatan, nama_sub_kegiatan]
    );

    res.status(201).json({
      message: mode_kegiatan === 'new' 
        ? 'Kegiatan Baru & Sub Kegiatan berhasil dibuat' 
        : 'Sub Kegiatan berhasil ditambahkan ke Kegiatan yang dipilih',
      data: rows[0],
      id_kegiatan_parent: finalIdKegiatan // Info tambahan buat frontend
    });

  } catch (err) {
    // Jika ada error, batalkan semua perubahan (termasuk kegiatan baru jika tadi dibuat)
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
    
    const results = rows.map(item => ({
        ...item,
        status_rekrutmen: calculateRecruitmentStatus(item.open_req, item.close_req)
    }));

    res.json(results);
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

exports.deleteSubKegiatan = async (req, res) => {
  try {
    const { id } = req.params;
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
    const sql = 'SELECT * FROM subkegiatan WHERE id = ?';
    const [rows] = await pool.query(sql, [id]);

    if (!rows || rows.length === 0) {
      return res.status(404).json({ message: 'Sub Kegiatan tidak ditemukan' });
    }

    const data = rows[0];
    data.status_rekrutmen = calculateRecruitmentStatus(data.open_req, data.close_req);

    res.json(data);
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

exports.updateSubKegiatanInfo = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
        nama_sub_kegiatan, deskripsi, periode, 
        tanggal_mulai, tanggal_selesai, 
        open_req, close_req
    } = req.body;
    
    const updates = {};
    if (nama_sub_kegiatan) updates.nama_sub_kegiatan = nama_sub_kegiatan;
    if (deskripsi !== undefined) updates.deskripsi = deskripsi;
    if (periode !== undefined) updates.periode = periode;
    if (tanggal_mulai !== undefined) updates.tanggal_mulai = tanggal_mulai;
    if (tanggal_selesai !== undefined) updates.tanggal_selesai = tanggal_selesai;
    if (open_req !== undefined) updates.open_req = open_req;
    if (close_req !== undefined) updates.close_req = close_req;

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
    let createdKegiatanCount = 0;
    let errors = [];

    console.log(`[IMPORT KEGIATAN] Memproses ${data.length} baris...`);

    // Cache sederhana untuk ID Kegiatan yang baru dibuat dalam sesi import ini
    // agar tidak query berulang-ulang untuk nama kegiatan yang sama di baris berbeda
    const kegiatanCache = {}; 

    for (const [index, row] of data.entries()) {
      const rowNum = index + 2;
      
      // Normalisasi Key
      const cleanRow = {};
      Object.keys(row).forEach(key => cleanRow[key.trim().toLowerCase()] = row[key]);

      // Ambil Data Utama
      const namaKegiatan = cleanRow['nama_kegiatan'];
      const namaSub = cleanRow['nama_sub_kegiatan'];
      
      // Data Pendukung Sub Kegiatan
      const deskripsi = cleanRow['deskripsi'] || '';
      const periode = cleanRow['periode'] || '';
      
      // Helper konversi tanggal Excel (jika format number/serial) atau String
      // Sederhananya kita asumsikan user input string 'YYYY-MM-DD' di CSV/Excel
      const tglMulai = cleanRow['tanggal_mulai'] || null;
      const tglSelesai = cleanRow['tanggal_selesai'] || null;
      const openReq = cleanRow['open_req'] || null;
      const closeReq = cleanRow['close_req'] || null;

      if (!namaKegiatan || !namaSub) {
        failCount++;
        errors.push(`Baris ${rowNum}: Nama Kegiatan atau Nama Sub Kegiatan kosong.`);
        continue;
      }

      try {
        let idKegiatan = kegiatanCache[namaKegiatan];

        // 1. Jika belum ada di cache, cari di DB
        if (!idKegiatan) {
            const [existing] = await connection.query(
                'SELECT id FROM kegiatan WHERE nama_kegiatan = ? LIMIT 1', 
                [namaKegiatan]
            );

            if (existing.length > 0) {
                idKegiatan = existing[0].id;
            } else {
                // 2. Jika tidak ada di DB, BUAT BARU
                const [newKeg] = await connection.query(
                    'INSERT INTO kegiatan (nama_kegiatan, deskripsi) VALUES (?, NULL)',
                    [namaKegiatan]
                );
                idKegiatan = newKeg.insertId;
                createdKegiatanCount++;
            }
            // Simpan ke cache
            kegiatanCache[namaKegiatan] = idKegiatan;
        }

        // 3. Insert Sub Kegiatan
        // Cek duplikasi sub kegiatan di kegiatan yang sama (opsional, biar gak double)
        const [cekSub] = await connection.query(
            'SELECT id FROM subkegiatan WHERE id_kegiatan = ? AND nama_sub_kegiatan = ?',
            [idKegiatan, namaSub]
        );

        if (cekSub.length > 0) {
            // Skip atau Update? Di sini kita skip saja
            // failCount++;
            // errors.push(`Baris ${rowNum}: Sub kegiatan sudah ada.`);
            // continue;
            
            // ATAU: Update data yang ada
             await connection.query(
                `UPDATE subkegiatan SET deskripsi=?, periode=?, tanggal_mulai=?, tanggal_selesai=?, open_req=?, close_req=? WHERE id=?`,
                [deskripsi, periode, tglMulai, tglSelesai, openReq, closeReq, cekSub[0].id]
            );
        } else {
            // Insert Baru
            await connection.query(
                `INSERT INTO subkegiatan 
                 (id_kegiatan, nama_sub_kegiatan, deskripsi, periode, tanggal_mulai, tanggal_selesai, open_req, close_req) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [idKegiatan, namaSub, deskripsi, periode, tglMulai, tglSelesai, openReq, closeReq]
            );
        }

        successCount++;

      } catch (rowErr) {
        failCount++;
        errors.push(`Baris ${rowNum} (${namaKegiatan}): ${rowErr.message}`);
      }
    }

    fs.unlinkSync(req.file.path);
    res.json({
        message: 'Proses import selesai.',
        successCount,
        failCount,
        createdKegiatanCount, // Info tambahan: berapa kegiatan baru dibuat
        errors
    });

  } catch (error) {
    console.error(error);
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    res.status(500).json({ message: 'Terjadi kesalahan server.', details: error.message });
  } finally {
    if (connection) connection.release();
  }
};