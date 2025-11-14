// src/controllers/kegiatanController.js
const supabase = require('../config/supabase');

// POST /api/kegiatan
const createKegiatan = async (req, res) => {
  try {
    const { nama_kegiatan, deskripsi, tahun_anggaran, tanggal_mulai, tanggal_selesai } = req.body;

    // Validasi input
    if (!nama_kegiatan || !tahun_anggaran || !tanggal_mulai || !tanggal_selesai) {
      return res.status(400).json({ message: 'Nama kegiatan, tahun anggaran, tanggal mulai, dan tanggal selesai wajib diisi' });
    }

    const { data, error } = await supabase
      .from('kegiatan')
      .insert([
        {
          nama_kegiatan,
          deskripsi, // Boleh null
          tahun_anggaran,
          tanggal_mulai,
          tanggal_selesai,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error(error);
      return res.status(500).json({ message: 'Gagal membuat kegiatan baru' });
    }

    return res.status(201).json({
      message: 'Kegiatan berhasil ditambahkan',
      data: data,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/kegiatan
const getAllKegiatan = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('kegiatan')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error(error);
      return res.status(500).json({ message: 'Gagal mengambil data kegiatan' });
    }

    return res.json(data);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/kegiatan/:id
const getKegiatanById = async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('kegiatan')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      console.error(error);
      return res.status(404).json({ message: 'Kegiatan tidak ditemukan' });
    }

    return res.json(data);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// PUT /api/kegiatan/:id
const updateKegiatan = async (req, res) => {
  try {
    const { id } = req.params;
    const { nama_kegiatan, deskripsi, tahun_anggaran, tanggal_mulai, tanggal_selesai } = req.body;

    const updateData = {};
    if (nama_kegiatan) updateData.nama_kegiatan = nama_kegiatan;
    if (deskripsi !== undefined) updateData.deskripsi = deskripsi;
    if (tahun_anggaran) updateData.tahun_anggaran = tahun_anggaran;
    if (tanggal_mulai) updateData.tanggal_mulai = tanggal_mulai;
    if (tanggal_selesai) updateData.tanggal_selesai = tanggal_selesai;

    if (Object.keys(updateData).length === 0) {
        return res.status(400).json({ message: 'Tidak ada data yang diperbarui' });
    }

    const { data, error } = await supabase
      .from('kegiatan')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error(error);
      return res.status(500).json({ message: 'Gagal update kegiatan' });
    }

    if (!data) {
        return res.status(404).json({ message: 'Kegiatan tidak ditemukan' });
    }

    return res.json({
      message: 'Kegiatan updated successfully',
      data: data,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// DELETE /api/kegiatan/:id
const deleteKegiatan = async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase.from('kegiatan').delete().eq('id', id);

    if (error) {
      console.error(error);
      return res.status(500).json({ message: 'Gagal menghapus kegiatan' });
    }

    return res.json({ message: 'Kegiatan deleted successfully' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  createKegiatan,
  getAllKegiatan,
  getKegiatanById,
  updateKegiatan,
  deleteKegiatan,
};