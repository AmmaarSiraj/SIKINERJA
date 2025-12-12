// src/controllers/kelompokPerencanaanController.js
const { pool } = require('../config/db');

exports.addMitraToPerencanaan = async (req, res) => {
  const { id_perencanaan, id_mitra, kode_jabatan, volume_tugas } = req.body;

  if (!id_perencanaan || !id_mitra) {
    return res.status(400).json({ error: 'ID Perencanaan dan ID Mitra wajib diisi.' });
  }

  const vol = volume_tugas ? parseInt(volume_tugas) : 0;

  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    // 1. Ambil Info Perencanaan & Tanggal Mulai
    const [perencanaanInfo] = await connection.query(`
        SELECT p.id, s.id AS id_subkegiatan, s.tanggal_mulai 
        FROM perencanaan p
        JOIN subkegiatan s ON p.id_subkegiatan = s.id
        WHERE p.id = ?
    `, [id_perencanaan]);

    if (perencanaanInfo.length === 0) throw new Error('Perencanaan tidak ditemukan.');
    const { tanggal_mulai, id_subkegiatan } = perencanaanInfo[0];

    // --- LOGIKA TAHUN & HONOR (Sama seperti Penugasan) ---
    if (!tanggal_mulai) throw new Error('Sub Kegiatan ini belum memiliki Tanggal Mulai (Acuan Tahun Anggaran).');
    
    const tahunKegiatan = new Date(tanggal_mulai).getFullYear().toString(); 

    // 2. Ambil Aturan Batas Honor
    const [rule] = await connection.query(
        'SELECT batas_honor FROM aturan_periode WHERE periode = ?', 
        [tahunKegiatan]
    );
    
    if (rule.length === 0) {
        throw new Error(`Belum ada aturan batas honor untuk tahun ${tahunKegiatan}. Hubungi Admin.`);
    }
    const LIMIT_TAHUNAN = Number(rule[0].batas_honor);

    // 3. Hitung Rencana Pendapatan Baru
    let tarifSatuan = 0;
    if (kode_jabatan) {
        const [tarifRows] = await connection.query(
            'SELECT tarif FROM honorarium WHERE id_subkegiatan = ? AND kode_jabatan = ?',
            [id_subkegiatan, kode_jabatan]
        );
        if (tarifRows.length > 0) tarifSatuan = Number(tarifRows[0].tarif);
    }
    const rencanaHonorBaru = tarifSatuan * vol;

    // 4. Hitung Total Pendapatan Mitra di TAHUN Tersebut (Berdasarkan Tabel Kelompok Perencanaan)
    // Asumsi: Perencanaan juga dicek terhadap perencanaan lain di tahun yang sama
    const [histori] = await connection.query(`
        SELECT SUM(h.tarif * kp.volume_tugas) as total_pendapatan
        FROM kelompok_perencanaan kp
        JOIN perencanaan p ON kp.id_perencanaan = p.id
        JOIN subkegiatan s ON p.id_subkegiatan = s.id
        JOIN honorarium h ON (h.id_subkegiatan = s.id AND h.kode_jabatan = kp.kode_jabatan)
        WHERE kp.id_mitra = ? AND YEAR(s.tanggal_mulai) = ?
    `, [id_mitra, tahunKegiatan]);

    const currentTotal = Number(histori[0].total_pendapatan || 0);

    // 5. Validasi Akhir
    if ((currentTotal + rencanaHonorBaru) > LIMIT_TAHUNAN) {
        const formatRupiah = (n) => 'Rp ' + n.toLocaleString('id-ID');
        throw new Error(
            `Gagal! Total rencana honor mitra di tahun ${tahunKegiatan} akan menjadi ${formatRupiah(currentTotal + rencanaHonorBaru)}, melebihi batas tahunan sebesar ${formatRupiah(LIMIT_TAHUNAN)}.`
        );
    }

    // 6. Insert Data
    const sql = 'INSERT INTO kelompok_perencanaan (id_perencanaan, id_mitra, kode_jabatan, volume_tugas) VALUES (?, ?, ?, ?)';
    const [result] = await connection.query(sql, [id_perencanaan, id_mitra, kode_jabatan || null, vol]);
    
    await connection.commit();
    const [newRows] = await connection.query('SELECT * FROM kelompok_perencanaan WHERE id = ?', [result.insertId]);
    res.status(201).json({ message: 'Mitra berhasil ditambahkan ke perencanaan.', data: newRows[0] });

  } catch (error) {
    if (connection) await connection.rollback();
    if (error.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Mitra ini sudah ada di dalam perencanaan tersebut.' });
    res.status(400).json({ error: error.message });
  } finally {
    if (connection) connection.release();
  }
};

exports.removeMitraFromPerencanaan = async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await pool.query('DELETE FROM kelompok_perencanaan WHERE id = ?', [id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Data tidak ditemukan.' });
    res.status(200).json({ message: 'Mitra berhasil dihapus dari perencanaan.' });
  } catch (error) {
    res.status(500).json({ error: 'Terjadi kesalahan pada server.' });
  }
};

exports.getAllKelompokPerencanaan = async (req, res) => {
  try {
    const sql = `
        SELECT kp.id AS id_kelompok, p.id AS id_perencanaan, s.nama_sub_kegiatan, k.nama_kegiatan,
          u.username AS nama_pengawas, m.id AS id_mitra, m.nama_lengkap AS nama_mitra,
          kp.kode_jabatan, kp.volume_tugas
        FROM kelompok_perencanaan AS kp
        JOIN perencanaan AS p ON kp.id_perencanaan = p.id
        JOIN subkegiatan AS s ON p.id_subkegiatan = s.id
        JOIN kegiatan AS k ON s.id_kegiatan = k.id
        JOIN users AS u ON p.id_pengawas = u.id
        JOIN mitra AS m ON kp.id_mitra = m.id
        ORDER BY kp.created_at DESC
    `;
    const [rows] = await pool.query(sql);
    res.status(200).json(rows);
  } catch (error) {
    res.status(500).json({ error: 'Terjadi kesalahan.' });
  }
};

exports.updateKelompokPerencanaan = async (req, res) => {
  const { id } = req.params; 
  const { kode_jabatan, volume_tugas } = req.body;

  if (!kode_jabatan || !volume_tugas) return res.status(400).json({ error: 'Data tidak lengkap.' });

  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    const [oldData] = await connection.query(`
        SELECT kp.*, s.tanggal_mulai, s.id as id_subkegiatan, h.tarif as old_tarif
        FROM kelompok_perencanaan kp
        JOIN perencanaan p ON kp.id_perencanaan = p.id
        JOIN subkegiatan s ON p.id_subkegiatan = s.id
        LEFT JOIN honorarium h ON (h.id_subkegiatan = s.id AND h.kode_jabatan = kp.kode_jabatan)
        WHERE kp.id = ?
    `, [id]);

    if (oldData.length === 0) throw new Error('Data tidak ditemukan.');
    const current = oldData[0];

    if (!current.tanggal_mulai) throw new Error('Sub kegiatan tidak memiliki tanggal mulai.');
    const tahunKegiatan = new Date(current.tanggal_mulai).getFullYear().toString();

    const [newHonor] = await connection.query(
        'SELECT tarif FROM honorarium WHERE id_subkegiatan = ? AND kode_jabatan = ?',
        [current.id_subkegiatan, kode_jabatan]
    );
    const tarifBaru = newHonor.length > 0 ? Number(newHonor[0].tarif) : 0;
    const honorBaruTotal = tarifBaru * Number(volume_tugas);
    const honorLamaTotal = Number(current.old_tarif || 0) * Number(current.volume_tugas);

    const [rule] = await connection.query('SELECT batas_honor FROM aturan_periode WHERE periode = ?', [tahunKegiatan]);
    
    if (rule.length > 0) {
        const limit = Number(rule[0].batas_honor);
        const [histori] = await connection.query(`
            SELECT SUM(h.tarif * kp.volume_tugas) as total
            FROM kelompok_perencanaan kp
            JOIN perencanaan p ON kp.id_perencanaan = p.id
            JOIN subkegiatan s ON p.id_subkegiatan = s.id
            JOIN honorarium h ON (h.id_subkegiatan = s.id AND h.kode_jabatan = kp.kode_jabatan)
            WHERE kp.id_mitra = ? AND YEAR(s.tanggal_mulai) = ?
        `, [current.id_mitra, tahunKegiatan]);
        
        const totalSekarang = Number(histori[0].total || 0);
        const prediksiTotal = (totalSekarang - honorLamaTotal) + honorBaruTotal;

        if (prediksiTotal > limit) throw new Error(`Gagal Update! Melebihi batas rencana Rp ${limit.toLocaleString('id-ID')}`);
    }

    await connection.query(
        'UPDATE kelompok_perencanaan SET kode_jabatan = ?, volume_tugas = ? WHERE id = ?',
        [kode_jabatan, volume_tugas, id]
    );

    await connection.commit();
    res.json({ message: 'Data perencanaan berhasil diperbarui.' });

  } catch (error) {
    if (connection) await connection.rollback();
    res.status(400).json({ error: error.message });
  } finally {
    if (connection) connection.release();
  }
};