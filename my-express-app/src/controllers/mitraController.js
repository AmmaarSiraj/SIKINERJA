const { pool } = require('../config/db');
const XLSX = require('xlsx');
const fs = require('fs');

// UPDATE: Query simpel tanpa JOIN karena tabel jabatan/user relasinya sudah diputus
const selectQuery = `SELECT * FROM mitra`;

exports.createMitra = async (req, res) => {
    const {
        nama_lengkap,
        nik,
        alamat,
        no_hp,
        email,
        no_rekening,
        nama_bank,
        batas_honor_bulanan
    } = req.body;

    if (!nama_lengkap || !nik || !alamat || !no_hp || !no_rekening || !nama_bank) {
        return res.status(400).json({ error: 'Data wajib tidak lengkap.' });
    }

    try {
        const sql = `
            INSERT INTO mitra (nama_lengkap, nik, alamat, no_hp, email, no_rekening, nama_bank, batas_honor_bulanan) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;
        
        const [result] = await pool.query(sql, [
            nama_lengkap,
            nik,
            alamat,
            no_hp,
            email,
            no_rekening,
            nama_bank,
            batas_honor_bulanan || 0.00
        ]);

        const [rows] = await pool.query(`${selectQuery} WHERE id = ?`, [result.insertId]);
        res.status(201).json(rows[0]);

    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') { 
            return res.status(409).json({ error: 'Mitra dengan NIK tersebut sudah terdaftar.', details: error.message });
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
        nama_lengkap, nik, alamat, no_hp, email, 
        no_rekening, nama_bank, batas_honor_bulanan
    } = req.body;

    const updates = {};
    if (nama_lengkap) updates.nama_lengkap = nama_lengkap;
    if (nik) updates.nik = nik;
    if (alamat) updates.alamat = alamat;
    if (no_hp) updates.no_hp = no_hp;
    if (email !== undefined) updates.email = email; 
    if (no_rekening) updates.no_rekening = no_rekening;
    if (nama_bank) updates.nama_bank = nama_bank;
    if (batas_honor_bulanan !== undefined) updates.batas_honor_bulanan = batas_honor_bulanan;

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

    console.log(`[IMPORT START] Membaca ${data.length} baris data...`);

    const connection = await pool.getConnection();
    // KITA HAPUS transaction global agar data yang sukses tetap masuk satu per satu
    // atau jika ingin partial success (yang sukses masuk, yang gagal dilewati)
    
    let successCount = 0;
    let failCount = 0;
    let skipCount = 0;
    let errors = [];

    for (const [index, row] of data.entries()) {
      const rowNumber = index + 2; // Baris di Excel (Header = 1)

      // 1. Normalisasi Header (Hapus spasi di nama kolom)
      const cleanRow = {};
      Object.keys(row).forEach(key => {
        cleanRow[key.trim()] = row[key];
      });

      const nama = cleanRow['Nama Lengkap'] || cleanRow['Nama'];
      const nikRaw = cleanRow['NIK'];
      const nik = nikRaw ? String(nikRaw).trim() : '';

      // Cek data kosong
      if (!nama || !nik) {
          console.log(`Row ${rowNumber}: SKIP (Nama/NIK kosong)`);
          skipCount++;
          continue; // Lanjut ke baris berikutnya
      }

      try {
         // 2. Cek Duplikasi NIK
         const [exist] = await connection.query('SELECT id FROM mitra WHERE nik = ?', [nik]);
         
         if (exist.length > 0) {
             console.log(`Row ${rowNumber}: SKIP (NIK ${nik} sudah ada)`);
             skipCount++;
             continue;
         }

         // 3. Insert Data
         // Gunakan try-catch DI SINI agar kalau gagal, loop tidak mati
         await connection.query(`
            INSERT INTO mitra 
            (nama_lengkap, nik, alamat, no_hp, email, nama_bank, no_rekening, batas_honor_bulanan)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
         `, [
           nama,
           nik,
           cleanRow['Alamat'] || '',
           cleanRow['No HP'] || cleanRow['Kontak'] || '',
           cleanRow['Email'] || '',
           cleanRow['Bank'] || '',
           cleanRow['No Rekening'] || cleanRow['Rekening'] || '',
           cleanRow['Batas Honor'] || cleanRow['Batas Honor Bulanan'] || 0
         ]);
         
         console.log(`Row ${rowNumber}: SUKSES - ${nama}`);
         successCount++;

      } catch (rowError) {
         // INI KUNCINYA: Tangkap error per baris, catat, dan biarkan loop lanjut
         console.error(`Row ${rowNumber}: GAGAL - ${rowError.message}`);
         failCount++;
         errors.push(`Baris ${rowNumber} (${nama}): ${rowError.message}`);
      }
    }

    connection.release();
    fs.unlinkSync(req.file.path);

    // Kirim laporan lengkap ke frontend
    res.json({ 
        message: `Proses Selesai. Sukses: ${successCount}, Gagal: ${failCount}, Skip: ${skipCount}`,
        details: errors // Frontend bisa menampilkan ini jika perlu
    });

  } catch (error) {
    console.error("[IMPORT FATAL ERROR]", error);
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path); 
    res.status(500).json({ message: 'Terjadi kesalahan fatal saat import.' });
  }
};