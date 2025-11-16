const supabase = require('../config/supabase');

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
        const { data, error } = await supabase
            .from('mitra')
            .insert([{
                id_user,
                nama_lengkap,
                nik,
                alamat,
                no_hp,
                email,
                no_rekening,
                nama_bank,
                batas_honor_bulanan: batas_honor_bulanan || 0.00
            }])
            .select()
            .single(); 

        if (error) throw error;
        
        res.status(201).json(data);
    } catch (error) {
        if (error.code === '23505') { 
            return res.status(409).json({ error: 'Mitra dengan NIK atau ID User tersebut sudah terdaftar.', details: error.message });
        }
        res.status(500).json({ error: 'Terjadi kesalahan pada server.', details: error.message });
    }
};

exports.getAllMitra = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('mitra')
            .select('*')
            .order('created_at', { ascending: false }); 

        if (error) throw error;
        
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ error: 'Terjadi kesalahan pada server.', details: error.message });
    }
};

exports.getMitraById = async (req, res) => {
    const { id } = req.params;

    try {
        const { data, error } = await supabase
            .from('mitra')
            .select('*')
            .eq('id', id)
            .single(); 

        if (error) throw error;
        
        if (!data) {
             return res.status(404).json({ error: 'Mitra tidak ditemukan.' });
        }

        res.status(200).json(data);
    } catch (error) {
        if (error.code === 'PGRST116') {
            return res.status(404).json({ error: 'Mitra tidak ditemukan.' });
        }
        res.status(500).json({ error: 'Terjadi kesalahan pada server.', details: error.message });
    }
};

exports.getMitraByUserId = async (req, res) => {
    const { id_user } = req.params;

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id_user)) {
        return res.status(400).json({ error: 'Format ID User tidak valid.' });
    }

    try {
        const { data, error } = await supabase
            .from('mitra')
            .select('*')
            .eq('id_user', id_user)
            .single(); 

        if (error) throw error;
        
        if (!data) {
             return res.status(404).json({ error: 'Mitra dengan ID User tersebut tidak ditemukan.' });
        }

        res.status(200).json(data);
    } catch (error) {
        if (error.code === 'PGRST116') {
            return res.status(404).json({ error: 'Mitra dengan ID User tersebut tidak ditemukan.' });
        }
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
        const { data, error } = await supabase
            .from('mitra')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        if (!data) {
             return res.status(404).json({ error: 'Mitra tidak ditemukan.' });
        }

        res.status(200).json(data);
    } catch (error) {
        if (error.code === '23505') {
            return res.status(409).json({ error: 'NIK tersebut sudah digunakan.', details: error.message });
        }
        if (error.code === 'PGRST116') {
            return res.status(404).json({ error: 'Mitra tidak ditemukan.' });
        }
        res.status(500).json({ error: 'Terjadi kesalahan pada server.', details: error.message });
    }
};

exports.deleteMitra = async (req, res) => {
    const { id } = req.params;

    try {
        const { data, error } = await supabase
            .from('mitra')
            .delete()
            .eq('id', id)
            .select() 
            .single();

        if (error) throw error;
        
        if (!data) {
             return res.status(404).json({ error: 'Mitra tidak ditemukan.' });
        }

        res.status(200).json({ message: 'Mitra berhasil dihapus.', data: data });
    } catch (error) {
        if (error.code === 'PGRST116') {
            return res.status(404).json({ error: 'Mitra tidak ditemukan.' });
        }
        res.status(500).json({ error: 'Terjadi kesalahan pada server.', details: error.message });
    }
};