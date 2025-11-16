const { pool } = require('../config/db');

exports.createMitra = async (req, res) => {
    const {
        id_user,
        nama_lengkap,
        nik,
        alamat,
        no_hp,
        email,
        no_rekening,
        nama_bank,
        batas_honor_bulanan
    } = req.body;

    if (!id_user || !nama_lengkap || !nik || !alamat || !no_hp || !no_rekening || !nama_bank) {
        return res.status(400).json({ error: 'Data wajib tidak lengkap. Mohon periksa id_user, nama_lengkap, nik, alamat, no_hp, no_rekening, dan nama_bank.' });
    }

    try {
        const sql = `
            INSERT INTO mitra (id_user, nama_lengkap, nik, alamat, no_hp, email, no_rekening, nama_bank, batas_honor_bulanan) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        
        const [result] = await pool.query(sql, [
            id_user,
            nama_lengkap,
            nik,
            alamat,
            no_hp,
            email,
            no_rekening,
            nama_bank,
            batas_honor_bulanan || 0.00
        ]);

        const [rows] = await pool.query('SELECT * FROM mitra WHERE id = ?', [result.insertId]);
        
        res.status(201).json(rows[0]);
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') { 
            return res.status(409).json({ error: 'Mitra dengan NIK atau ID User tersebut sudah terdaftar.', details: error.message });
        }
        console.error(error);
        res.status(500).json({ error: 'Terjadi kesalahan pada server.', details: error.message });
    }
};

exports.getAllMitra = async (req, res) => {
    try {
        const [rows] = await pool.query(
            'SELECT * FROM mitra ORDER BY created_at DESC'
        );
        res.status(200).json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Terjadi kesalahan pada server.', details: error.message });
    }
};

exports.getMitraById = async (req, res) => {
    const { id } = req.params;

    try {
        const [rows] = await pool.query('SELECT * FROM mitra WHERE id = ?', [id]);
        
        if (!rows || rows.length === 0) {
             return res.status(404).json({ error: 'Mitra tidak ditemukan.' });
        }

        res.status(200).json(rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Terjadi kesalahan pada server.', details: error.message });
    }
};

exports.getMitraByUserId = async (req, res) => {
    const { id_user } = req.params;

    if (isNaN(parseInt(id_user))) {
        return res.status(400).json({ error: 'Format ID User harus berupa angka.' });
    }

    try {
        const [rows] = await pool.query('SELECT * FROM mitra WHERE id_user = ?', [id_user]);
        
        if (!rows || rows.length === 0) {
             return res.status(404).json({ error: 'Mitra dengan ID User tersebut tidak ditemukan.' });
        }

        res.status(200).json(rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Terjadi kesalahan pada server.', details: error.message });
    }
};

exports.updateMitra = async (req, res) => {
    const { id } = req.params;
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

    const updates = {};
    if (nama_lengkap) updates.nama_lengkap = nama_lengkap;
    if (nik) updates.nik = nik;
    if (alamat) updates.alamat = alamat;
    if (no_hp) updates.no_hp = no_hp;
    if (email !== undefined) updates.email = email; 
    if (no_rekening) updates.no_rekening = no_rekening;
    if (nama_bank) updates.nama_bank = nama_bank;
    if (batas_honor_bulanan !== undefined) updates.batas_honor_bulanan = batas_honor_bulanan;

    if (Object.keys(updates).length === 0) {
        return res.status(400).json({ error: 'Tidak ada data untuk diperbarui.' });
    }

    try {
        const [result] = await pool.query('UPDATE mitra SET ? WHERE id = ?', [updates, id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Mitra tidak ditemukan.' });
        }

        const [rows] = await pool.query('SELECT * FROM mitra WHERE id = ?', [id]);

        res.status(200).json(rows[0]);
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ error: 'NIK tersebut sudah digunakan.', details: error.message });
        }
        console.error(error);
        res.status(500).json({ error: 'Terjadi kesalahan pada server.', details: error.message });
    }
};

exports.deleteMitra = async (req, res) => {
    const { id } = req.params;

    try {
        const [selectRows] = await pool.query('SELECT * FROM mitra WHERE id = ?', [id]);

        if (!selectRows || selectRows.length === 0) {
            return res.status(404).json({ error: 'Mitra tidak ditemukan.' });
        }

        const [result] = await pool.query('DELETE FROM mitra WHERE id = ?', [id]);

        if (result.affectedRows === 0) {
             return res.status(404).json({ error: 'Mitra tidak ditemukan.' });
        }

        res.status(200).json({ message: 'Mitra berhasil dihapus.', data: selectRows[0] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Terjadi kesalahan pada server.', details: error.message });
    }
};