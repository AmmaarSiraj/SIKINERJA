const { pool } = require('../config/db');
const XLSX = require('xlsx'); 
const fs = require('fs');

// Query JOIN Terbaru:
// 1. Menggunakan p.id_subkegiatan (bukan p.id_kegiatan)
// 2. Join ke users untuk pengawas (bukan ke mitra)
const selectDetailQuery = `
  SELECT 
    p.id AS id_penugasan,
    p.jumlah_max_mitra,
    p.created_at AS penugasan_created_at,
    s.id AS id_subkegiatan,
    s.nama_sub_kegiatan,
    s.tanggal_mulai,    -- Tambahan Baru
    s.tanggal_selesai,  -- Tambahan Baru
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
  const { id_subkegiatan, id_pengawas, jumlah_max_mitra } = req.body;

  if (!id_subkegiatan || !id_pengawas) {
    return res.status(400).json({ error: 'ID Sub-Kegiatan dan ID Pengawas wajib diisi.' });
  }

  try {
    const sql = `
      INSERT INTO penugasan (id_subkegiatan, id_pengawas, jumlah_max_mitra) 
      VALUES (?, ?, ?)
    `;
    const [result] = await pool.query(sql, [
      id_subkegiatan,
      id_pengawas,
      jumlah_max_mitra || 1, 
    ]);

    const [rows] = await pool.query(`${selectDetailQuery} WHERE p.id = ?`, [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Terjadi kesalahan pada server.', details: error.message });
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
  const { id } = req.params; // id penugasan
  try {
    // UPDATE QUERY: Join ke tabel jabatan & jabatan_mitra
    const sql = `
      SELECT 
        m.id AS id_mitra, 
        m.nama_lengkap, 
        m.nik, 
        m.no_hp,
        kp.id AS id_kelompok,
        kp.created_at AS bergabung_sejak,
        IFNULL(jm.nama_jabatan, 'Belum ditentukan') AS nama_jabatan
      FROM kelompok_penugasan AS kp
      JOIN mitra AS m ON kp.id_mitra = m.id
      -- Join ke tabel jabatan untuk cari kode jabatannya
      LEFT JOIN jabatan j ON (j.id_mitra = m.id AND j.id_penugasan = kp.id_penugasan)
      -- Join ke tabel master jabatan_mitra untuk ambil nama jabatannya
      LEFT JOIN jabatan_mitra jm ON j.kode_jabatan = jm.kode_jabatan
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
  const { id_subkegiatan, id_pengawas, jumlah_max_mitra } = req.body;

  const updates = {};
  if (id_subkegiatan) updates.id_subkegiatan = id_subkegiatan;
  if (id_pengawas) updates.id_pengawas = id_pengawas;
  if (jumlah_max_mitra !== undefined) updates.jumlah_max_mitra = jumlah_max_mitra;

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
    // 1. Baca File Excel/CSV
    const workbook = XLSX.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: "" });

    if (data.length === 0) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ message: 'File kosong.' });
    }

    // 2. Setup Transaksi Database
    // Kita gunakan logic per baris agar jika 1 gagal, yang lain tetap masuk (Partial Success)
    // Tapi kita butuh connection untuk query yang efisien
    connection = await pool.getConnection();

    let successCount = 0;
    let failCount = 0;
    let errors = [];

    // Ambil ID User yang sedang login (Admin) untuk jadi default pengawas
    // Asumsi req.user ada (karena lewat authMiddleware)
    const idPengawas = req.user ? req.user.id : 1; 

    console.log(`[IMPORT PENUGASAN] Memproses ${data.length} baris...`);

    for (const [index, row] of data.entries()) {
      const rowNum = index + 2; // Baris Excel (Header=1)
      
      // Normalisasi Key (Lowercase & Trim)
      const cleanRow = {};
      Object.keys(row).forEach(key => cleanRow[key.trim().toLowerCase()] = row[key]);

      // Ambil Kolom (sesuai template CSV frontend)
      // CSV: nik, kegiatan_id, nama_kegiatan_ref, kode_jabatan
      let nik = String(cleanRow['nik'] || '').replace(/'/g, '').trim(); // Hapus tanda petik jika ada
      const idSubKegiatan = cleanRow['kegiatan_id'] || cleanRow['id_sub_kegiatan']; 
      const kodeJabatan = cleanRow['kode_jabatan'];

      if (!nik || !idSubKegiatan) {
        failCount++;
        errors.push(`Baris ${rowNum}: NIK atau ID Sub Kegiatan kosong.`);
        continue;
      }

      try {
        // A. Cari ID Mitra berdasarkan NIK
        const [mitraRows] = await connection.query('SELECT id, nama_lengkap FROM mitra WHERE nik = ?', [nik]);
        if (mitraRows.length === 0) {
          throw new Error(`NIK ${nik} tidak terdaftar di database Mitra.`);
        }
        const idMitra = mitraRows[0].id;
        const namaMitra = mitraRows[0].nama_lengkap;

        // B. Cek/Buat Penugasan untuk Sub Kegiatan ini
        // Cek dulu apakah sudah ada penugasan untuk subkegiatan ini?
        const [penugasanRows] = await connection.query(
          'SELECT id FROM penugasan WHERE id_subkegiatan = ? LIMIT 1', 
          [idSubKegiatan]
        );

        let idPenugasan;
        if (penugasanRows.length > 0) {
          idPenugasan = penugasanRows[0].id;
        } else {
          // Buat Penugasan Baru jika belum ada
          // Cek validitas sub kegiatan dulu
          const [subRows] = await connection.query('SELECT id FROM subkegiatan WHERE id = ?', [idSubKegiatan]);
          if (subRows.length === 0) {
            throw new Error(`ID Sub Kegiatan '${idSubKegiatan}' tidak valid.`);
          }

          const [newP] = await connection.query(
            'INSERT INTO penugasan (id_subkegiatan, id_pengawas, jumlah_max_mitra) VALUES (?, ?, 50)', // Default kuota 50
            [idSubKegiatan, idPengawas]
          );
          idPenugasan = newP.insertId;
        }

        // C. Masukkan ke Kelompok Penugasan (Cek duplikasi)
        const [cekKelompok] = await connection.query(
          'SELECT id FROM kelompok_penugasan WHERE id_penugasan = ? AND id_mitra = ?',
          [idPenugasan, idMitra]
        );

        if (cekKelompok.length > 0) {
          // Sudah ada, kita update jabatannya saja jika ada kolom jabatan
          // Tapi jabatan ada di tabel terpisah 'jabatan'.
        } else {
          await connection.query(
            'INSERT INTO kelompok_penugasan (id_penugasan, id_mitra) VALUES (?, ?)',
            [idPenugasan, idMitra]
          );
        }

        // D. Simpan Jabatan (Jika ada kode_jabatan)
        if (kodeJabatan) {
            // Cek apakah jabatan ini valid di master jabatan_mitra? (Opsional, agar aman)
            // Simpan/Update jabatan di tabel 'jabatan'
            // Tabel 'jabatan': id, kode_jabatan, id_penugasan, id_mitra
            
            // Cek existing
            const [cekJab] = await connection.query(
                'SELECT id FROM jabatan WHERE id_penugasan = ? AND id_mitra = ?',
                [idPenugasan, idMitra]
            );

            if (cekJab.length > 0) {
                await connection.query(
                    'UPDATE jabatan SET kode_jabatan = ? WHERE id = ?',
                    [kodeJabatan, cekJab[0].id]
                );
            } else {
                await connection.query(
                    'INSERT INTO jabatan (kode_jabatan, id_penugasan, id_mitra) VALUES (?, ?, ?)',
                    [kodeJabatan, idPenugasan, idMitra]
                );
            }
        }

        successCount++;

      } catch (rowErr) {
        failCount++;
        errors.push(`Baris ${rowNum} (${nik}): ${rowErr.message}`);
      }
    }

    // Selesai loop
    fs.unlinkSync(req.file.path); // Hapus file temp
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