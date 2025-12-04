const { pool } = require('../config/db');
const XLSX = require('xlsx');
const fs = require('fs');

const selectQuery = `SELECT * FROM mitra`;

exports.createMitra = async (req, res) => {
    const {
        nama_lengkap,
        nik,
        sobat_id,
        alamat,
        jenis_kelamin,
        pendidikan,
        pekerjaan,
        deskripsi_pekerjaan_lain,
        no_hp,
        email
    } = req.body;

    // Validasi input wajib
    if (!nama_lengkap || !nik || !alamat || !no_hp) {
        return res.status(400).json({ error: 'Nama Lengkap, NIK, Alamat, dan No HP wajib diisi.' });
    }

    try {
        const sql = `
            INSERT INTO mitra (
                nama_lengkap, nik, sobat_id, alamat, 
                jenis_kelamin, pendidikan, pekerjaan, deskripsi_pekerjaan_lain,
                no_hp, email
            ) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        
        const [result] = await pool.query(sql, [
            nama_lengkap,
            nik,
            sobat_id || null,
            alamat,
            jenis_kelamin || null,
            pendidikan || null,
            pekerjaan || null,
            deskripsi_pekerjaan_lain || null,
            no_hp,
            email || null
        ]);

        const [rows] = await pool.query(`${selectQuery} WHERE id = ?`, [result.insertId]);
        res.status(201).json(rows[0]);

    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') { 
            return res.status(409).json({ error: 'Mitra dengan NIK atau ID Sobat tersebut sudah terdaftar.', details: error.message });
        }
        console.error(error);
        res.status(500).json({ error: 'Terjadi kesalahan pada server.', details: error.message });
    }
};

exports.getAllMitra = async (req, res) => {
    try {
        const [rows] = await pool.query(`${selectQuery} ORDER BY created_at DESC`);
        res.status(200).json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};

exports.getMitraById = async (req, res) => {
    const { id } = req.params;
    try {
        const [rows] = await pool.query(`${selectQuery} WHERE id = ?`, [id]);
        if (!rows || rows.length === 0) return res.status(404).json({ error: 'Mitra tidak ditemukan.' });
        res.status(200).json(rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};

exports.updateMitra = async (req, res) => {
    const { id } = req.params;
    const {
        nama_lengkap, nik, sobat_id, alamat, 
        jenis_kelamin, pendidikan, pekerjaan, deskripsi_pekerjaan_lain,
        no_hp, email
    } = req.body;

    const updates = {};
    if (nama_lengkap) updates.nama_lengkap = nama_lengkap;
    if (nik) updates.nik = nik;
    if (sobat_id) updates.sobat_id = sobat_id;
    if (alamat) updates.alamat = alamat;
    if (jenis_kelamin) updates.jenis_kelamin = jenis_kelamin;
    if (pendidikan) updates.pendidikan = pendidikan;
    if (pekerjaan) updates.pekerjaan = pekerjaan;
    if (deskripsi_pekerjaan_lain) updates.deskripsi_pekerjaan_lain = deskripsi_pekerjaan_lain;
    if (no_hp) updates.no_hp = no_hp;
    if (email !== undefined) updates.email = email; 

    if (Object.keys(updates).length === 0) return res.status(400).json({ error: 'Tidak ada data update.' });

    try {
        const [result] = await pool.query('UPDATE mitra SET ? WHERE id = ?', [updates, id]);
        if (result.affectedRows === 0) return res.status(404).json({ error: 'Mitra tidak ditemukan.' });

        const [rows] = await pool.query(`${selectQuery} WHERE id = ?`, [id]);
        res.status(200).json(rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};

exports.deleteMitra = async (req, res) => {
    const { id } = req.params;
    try {
        const [result] = await pool.query('DELETE FROM mitra WHERE id = ?', [id]);
        if (result.affectedRows === 0) return res.status(404).json({ error: 'Mitra tidak ditemukan.' });
        res.status(200).json({ message: 'Mitra berhasil dihapus.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};

exports.importMitra = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'File Excel tidak ditemukan.' });
  }

  try {
    const workbook = XLSX.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: "" });

    if (data.length === 0) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ message: 'File Excel kosong.' });
    }

    const connection = await pool.getConnection();
    
    let successCount = 0;
    let failCount = 0;
    let skipCount = 0;
    let errors = [];

    for (const [index, row] of data.entries()) {
      const rowNumber = index + 2;

      const cleanRow = {};
      Object.keys(row).forEach(key => {
        cleanRow[key.trim()] = row[key];
      });

      const nama = cleanRow['Nama Lengkap'] || cleanRow['Nama'];
      const nikRaw = cleanRow['NIK'];
      const nik = nikRaw ? String(nikRaw).trim() : '';

      if (!nama || !nik) {
          skipCount++;
          continue;
      }

      try {
         const sobatIdRaw = cleanRow['SOBAT ID'] ? String(cleanRow['SOBAT ID']).trim() : null;
         
         // Cek duplikasi berdasarkan NIK atau SOBAT ID
         const [exist] = await connection.query(
            'SELECT id FROM mitra WHERE nik = ? OR (sobat_id IS NOT NULL AND sobat_id = ?)', 
            [nik, sobatIdRaw]
         );
         
         if (exist.length > 0) {
             skipCount++;
             continue;
         }

         await connection.query(`
            INSERT INTO mitra (
                nama_lengkap, nik, sobat_id, alamat, 
                jenis_kelamin, pendidikan, pekerjaan, deskripsi_pekerjaan_lain,
                no_hp, email
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         `, [
           nama,
           nik,
           sobatIdRaw,
           cleanRow['Alamat Detail'] || cleanRow['Alamat'] || '',
           cleanRow['Jenis Kelamin'] || '',
           cleanRow['Pendidikan'] || '',
           cleanRow['Pekerjaan'] || '',
           cleanRow['Deskripsi Pekerjaan Lain'] || '',
           cleanRow['No Telp'] || cleanRow['No HP'] || '',
           cleanRow['Email'] || ''
         ]);
         
         successCount++;

      } catch (rowError) {
         failCount++;
         errors.push(`Baris ${rowNumber} (${nama}): ${rowError.message}`);
      }
    }

    connection.release();
    fs.unlinkSync(req.file.path);

    res.json({ 
        message: `Proses Selesai. Sukses: ${successCount}, Gagal: ${failCount}, Skip: ${skipCount}`,
        details: errors
    });

  } catch (error) {
    console.error(error);
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path); 
    res.status(500).json({ message: 'Terjadi kesalahan fatal saat import.' });
  }
};