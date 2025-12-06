// src/controllers/mitraController.js
const { pool } = require('../config/db');
const XLSX = require('xlsx');
const fs = require('fs');

// Helper untuk format response sukses standar
const sendResponse = (res, status, message, data = null) => {
    res.status(status).json({ message, data });
};

// --- 1. TAMBAH MITRA MANUAL ---
exports.createMitra = async (req, res) => {
    const {
        nama_lengkap, nik, sobat_id, alamat, 
        jenis_kelamin, pendidikan, pekerjaan, deskripsi_pekerjaan_lain,
        no_hp, email,
        tahun_daftar // <--- MENERIMA INPUT TAHUN DARI FRONTEND
    } = req.body;

    if (!nama_lengkap || !nik || !no_hp) {
        return res.status(400).json({ error: 'Nama Lengkap, NIK, dan No HP wajib diisi.' });
    }

    // LOGIKA DINAMIS: Pakai tahun inputan user, kalau kosong pakai tahun sekarang
    const currentYear = tahun_daftar ? String(tahun_daftar) : new Date().getFullYear().toString();

    let connection;

    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        // A. Cek Eksistensi Mitra (Profil)
        const [existingMitra] = await connection.query(
            'SELECT id FROM mitra WHERE nik = ?', 
            [nik]
        );

        let mitraId;

        if (existingMitra.length > 0) {
            // SKENARIO 1: Mitra Lama (Update Profil)
            mitraId = existingMitra[0].id;
            
            await connection.query(`
                UPDATE mitra SET 
                    nama_lengkap=?, sobat_id=?, alamat=?, jenis_kelamin=?, 
                    pendidikan=?, pekerjaan=?, deskripsi_pekerjaan_lain=?, no_hp=?, email=?
                WHERE id=?
            `, [
                nama_lengkap, sobat_id || null, alamat, jenis_kelamin, 
                pendidikan, pekerjaan, deskripsi_pekerjaan_lain, no_hp, email, 
                mitraId
            ]);

        } else {
            // SKENARIO 2: Mitra Baru (Insert Profil)
            const [insertResult] = await connection.query(`
                INSERT INTO mitra (
                    nama_lengkap, nik, sobat_id, alamat, 
                    jenis_kelamin, pendidikan, pekerjaan, deskripsi_pekerjaan_lain,
                    no_hp, email
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                nama_lengkap, nik, sobat_id || null, alamat, 
                jenis_kelamin || null, pendidikan || null, pekerjaan || null, 
                deskripsi_pekerjaan_lain || null, no_hp, email || null
            ]);
            mitraId = insertResult.insertId;
        }

        // B. Daftarkan ke Tahun Aktif
        const [cekTahun] = await connection.query(
            'SELECT id FROM tahun_aktif WHERE user_id = ? AND tahun = ?', 
            [mitraId, currentYear]
        );

        if (cekTahun.length > 0) {
            // Error khusus jika sudah terdaftar di tahun yang dipilih
            throw new Error('ALREADY_ACTIVE_THIS_YEAR');
        }

        // Insert ke tabel tahun_aktif
        await connection.query(
            'INSERT INTO tahun_aktif (user_id, tahun, status) VALUES (?, ?, ?)',
            [mitraId, currentYear, 'aktif']
        );

        await connection.commit();

        const statusMsg = existingMitra.length > 0 
            ? `Data profil diperbarui dan diaktifkan untuk tahun ${currentYear}.`
            : `Mitra baru berhasil ditambahkan untuk tahun ${currentYear}.`;

        sendResponse(res, 201, statusMsg, { id: mitraId });

    } catch (error) {
        if (connection) await connection.rollback();

        if (error.message === 'ALREADY_ACTIVE_THIS_YEAR') {
            return res.status(409).json({ error: `Mitra dengan NIK tersebut sudah terdaftar aktif untuk tahun ${currentYear}.` });
        }
        
        console.error("Create Mitra Error:", error);
        res.status(500).json({ error: 'Terjadi kesalahan server.', details: error.message });
    } finally {
        if (connection) connection.release();
    }
};

// --- 2. GET ALL MITRA ---
exports.getAllMitra = async (req, res) => {
    try {
        const sql = `
            SELECT m.*, 
            (SELECT GROUP_CONCAT(tahun ORDER BY tahun DESC SEPARATOR ', ') FROM tahun_aktif ta WHERE ta.user_id = m.id) as riwayat_tahun
            FROM mitra m 
            ORDER BY m.nama_lengkap ASC
        `;
        const [rows] = await pool.query(sql);
        res.status(200).json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};

// --- 3. GET MITRA BY ID ---
exports.getMitraById = async (req, res) => {
    const { id } = req.params;
    try {
        const [rows] = await pool.query('SELECT * FROM mitra WHERE id = ?', [id]);
        if (rows.length === 0) return res.status(404).json({ error: 'Mitra tidak ditemukan.' });
        
        const [tahunRows] = await pool.query('SELECT * FROM tahun_aktif WHERE user_id = ? ORDER BY tahun DESC', [id]);
        
        const data = rows[0];
        data.list_tahun_aktif = tahunRows;

        res.status(200).json(data);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};

// --- 4. UPDATE MITRA (Profil Saja) ---
exports.updateMitra = async (req, res) => {
    const { id } = req.params;
    const body = req.body;
    
    const allowedFields = ['nama_lengkap', 'nik', 'sobat_id', 'alamat', 'jenis_kelamin', 'pendidikan', 'pekerjaan', 'deskripsi_pekerjaan_lain', 'no_hp', 'email'];
    const updates = {};
    
    Object.keys(body).forEach(key => {
        if (allowedFields.includes(key) && body[key] !== undefined) {
            updates[key] = body[key];
        }
    });

    if (Object.keys(updates).length === 0) return res.status(400).json({ error: 'Tidak ada data update.' });

    try {
        const [result] = await pool.query('UPDATE mitra SET ? WHERE id = ?', [updates, id]);
        if (result.affectedRows === 0) return res.status(404).json({ error: 'Mitra tidak ditemukan.' });

        const [rows] = await pool.query('SELECT * FROM mitra WHERE id = ?', [id]);
        res.status(200).json(rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};

// --- 5. DELETE MITRA ---
exports.deleteMitra = async (req, res) => {
    const { id } = req.params;
    const { tahun } = req.query; // Ambil tahun dari query params

    let connection;
    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        // 1. Cek berapa banyak tahun aktif yang dimiliki mitra ini
        const [rows] = await connection.query(
            'SELECT count(*) as count FROM tahun_aktif WHERE user_id = ?', 
            [id]
        );
        const totalActiveYears = rows[0].count;

        // 2. Logika Penghapusan
        if (totalActiveYears > 1 && tahun) {
            // SKENARIO A: Aktif di banyak tahun -> Hapus hanya tahun yang dipilih
            await connection.query(
                'DELETE FROM tahun_aktif WHERE user_id = ? AND tahun = ?',
                [id, tahun]
            );
            await connection.commit();
            res.status(200).json({ message: `Status aktif mitra untuk tahun ${tahun} berhasil dihapus.` });

        } else {
            // SKENARIO B: Hanya aktif 1 tahun (atau tahun tidak spesifik) -> Hapus Permanen
            // Delete di tabel mitra akan men-trigger ON DELETE CASCADE ke tahun_aktif
            await connection.query('DELETE FROM mitra WHERE id = ?', [id]);
            await connection.commit();
            res.status(200).json({ message: 'Data mitra dihapus permanen dari database.' });
        }

    } catch (error) {
        if (connection) await connection.rollback();
        console.error(error);
        res.status(500).json({ error: error.message });
    } finally {
        if (connection) connection.release();
    }
};

// --- 6. IMPORT EXCEL (DINAMIS) ---
exports.importMitra = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'File Excel tidak ditemukan.' });
  }

  // Ambil tahun dari body (dikirim via FormData dari frontend)
  const { tahun_daftar } = req.body;
  
  // LOGIKA DINAMIS: Pakai input, kalau kosong pakai tahun sekarang
  const currentYear = tahun_daftar ? String(tahun_daftar) : new Date().getFullYear().toString();

  let connection;
  try {
    const workbook = XLSX.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: "" });

    if (data.length === 0) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ message: 'File Excel kosong.' });
    }

    connection = await pool.getConnection();
    
    let successCount = 0; 
    let skipCount = 0;    
    let failCount = 0;    
    let errors = [];

    for (const [index, row] of data.entries()) {
      const rowNumber = index + 2;
      const cleanRow = {};
      Object.keys(row).forEach(key => cleanRow[key.trim()] = row[key]);

      const nama = cleanRow['Nama Lengkap'] || cleanRow['Nama'];
      let nikRaw = cleanRow['NIK'];
      const nik = nikRaw ? String(nikRaw).trim().replace(/'/g, "") : ''; 

      if (!nama || !nik) {
          failCount++;
          errors.push(`Baris ${rowNumber}: Nama atau NIK kosong.`);
          continue;
      }

      try {
         // A. Cek Eksistensi Mitra (Profil)
         const [exist] = await connection.query('SELECT id FROM mitra WHERE nik = ?', [nik]);
         
         let mitraId;

         if (exist.length > 0) {
             // Mitra Lama -> Update Profil
             mitraId = exist[0].id;
             await connection.query(`
                UPDATE mitra SET 
                    nama_lengkap=?, sobat_id=?, alamat=?, no_hp=?, email=?, 
                    jenis_kelamin=?, pendidikan=?, pekerjaan=?, deskripsi_pekerjaan_lain=?
                WHERE id=?
             `, [
                nama,
                cleanRow['SOBAT ID'] ? String(cleanRow['SOBAT ID']) : null,
                cleanRow['Alamat Detail'] || '',
                cleanRow['No Telp'] || '',
                cleanRow['Email'] || '',
                cleanRow['Jenis Kelamin'] || '',
                cleanRow['Pendidikan'] || '',
                cleanRow['Pekerjaan'] || '',
                cleanRow['Deskripsi Pekerjaan Lain'] || '',
                mitraId
             ]);
         } else {
             // Mitra Baru -> Insert Profil
             const [insertRes] = await connection.query(`
                INSERT INTO mitra (
                    nama_lengkap, nik, sobat_id, alamat, 
                    jenis_kelamin, pendidikan, pekerjaan, deskripsi_pekerjaan_lain,
                    no_hp, email
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
             `, [
                nama,
                nik,
                cleanRow['SOBAT ID'] ? String(cleanRow['SOBAT ID']) : null,
                cleanRow['Alamat Detail'] || cleanRow['Alamat'] || '',
                cleanRow['Jenis Kelamin'] || '',
                cleanRow['Pendidikan'] || '',
                cleanRow['Pekerjaan'] || '',
                cleanRow['Deskripsi Pekerjaan Lain'] || '',
                cleanRow['No Telp'] || cleanRow['No HP'] || '',
                cleanRow['Email'] || ''
             ]);
             mitraId = insertRes.insertId;
         }

         // B. Cek & Insert Tahun Aktif (Sesuai currentYear yang dipilih)
         const [cekTahun] = await connection.query(
             'SELECT id FROM tahun_aktif WHERE user_id = ? AND tahun = ?', 
             [mitraId, currentYear]
         );

         if (cekTahun.length > 0) {
             skipCount++; 
         } else {
             await connection.query(
                 'INSERT INTO tahun_aktif (user_id, tahun, status) VALUES (?, ?, ?)',
                 [mitraId, currentYear, 'aktif']
             );
             successCount++;
         }

      } catch (rowError) {
         failCount++;
         console.error(`Error baris ${rowNumber}:`, rowError);
         errors.push(`Baris ${rowNumber} (${nama}): ${rowError.message}`);
      }
    }

    fs.unlinkSync(req.file.path);

    res.json({ 
        message: `Import Selesai (Tahun ${currentYear}).`,
        successCount, 
        skipCount,    
        failCount,
        errors
    });

  } catch (error) {
    console.error(error);
    if (connection) connection.release();
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path); 
    res.status(500).json({ message: 'Terjadi kesalahan fatal saat import.', details: error.message });
  } finally {
    if (connection) connection.release();
  }
};