import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

// Pastikan port-nya 3000 sesuai dengan backend Anda
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const AddKegiatan = () => {
  const [nama_kegiatan, setNamaKegiatan] = useState('');
  const [deskripsi, setDeskripsi] = useState('');
  const [tahun_anggaran, setTahunAnggaran] = useState(new Date().getFullYear());
  const [tanggal_mulai, setTanggalMulai] = useState('');
  const [tanggal_selesai, setTanggalSelesai] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    // Validasi frontend sederhana berdasarkan controller
    if (!nama_kegiatan || !tahun_anggaran || !tanggal_mulai || !tanggal_selesai) {
      setError('Nama kegiatan, tahun anggaran, tanggal mulai, dan tanggal selesai wajib diisi.');
      setLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No auth token found. Please login.');
      }

      const response = await fetch(`${API_URL}/api/kegiatan`, { //
        method: 'POST', //
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` //
        },
        body: JSON.stringify({
          nama_kegiatan,
          deskripsi, //
          tahun_anggaran: parseInt(tahun_anggaran, 10),
          tanggal_mulai,
          tanggal_selesai
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Gagal menambahkan kegiatan');
      }

      setSuccessMessage('Kegiatan berhasil ditambahkan! Mengarahkan kembali...');
      
      // Reset form
      setNamaKegiatan('');
      setDeskripsi('');
      setTahunAnggaran(new Date().getFullYear());
      setTanggalMulai('');
      setTanggalSelesai('');

      // Arahkan kembali ke halaman manajemen setelah 2 detik
      setTimeout(() => {
        navigate('/admin/manage-kegiatan');
      }, 2000);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white shadow-md rounded-lg p-6 max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Tambah Kegiatan Baru</h2>
        <Link
          to="/admin/manage-kegiatan"
          className="text-sm text-blue-600 hover:underline"
        >
          &larr; Kembali ke Daftar
        </Link>
      </div>

      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">{error}</div>}
      {successMessage && <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4" role="alert">{successMessage}</div>}

      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="nama_kegiatan" className="block text-gray-700 text-sm font-bold mb-2">
            Nama Kegiatan <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="nama_kegiatan"
            value={nama_kegiatan}
            onChange={(e) => setNamaKegiatan(e.target.value)}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            required
          />
        </div>

        <div className="mb-4">
          <label htmlFor="deskripsi" className="block text-gray-700 text-sm font-bold mb-2">
            Deskripsi
          </label>
          <textarea
            id="deskripsi"
            rows="3"
            value={deskripsi}
            onChange={(e) => setDeskripsi(e.target.value)}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          />
        </div>

        <div className="mb-4">
          <label htmlFor="tahun_anggaran" className="block text-gray-700 text-sm font-bold mb-2">
            Tahun Anggaran <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            id="tahun_anggaran"
            value={tahun_anggaran}
            onChange={(e) => setTahunAnggaran(e.target.value)}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="mb-4 md:mb-0">
            <label htmlFor="tanggal_mulai" className="block text-gray-700 text-sm font-bold mb-2">
              Tanggal Mulai <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              id="tanggal_mulai"
              value={tanggal_mulai}
              onChange={(e) => setTanggalMulai(e.target.value)}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              required
            />
          </div>
          <div>
            <label htmlFor="tanggal_selesai" className="block text-gray-700 text-sm font-bold mb-2">
              Tanggal Selesai <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              id="tanggal_selesai"
              value={tanggal_selesai}
              onChange={(e) => setTanggalSelesai(e.target.value)}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              required
            />
          </div>
        </div>

        <div className="flex items-center justify-end">
          <button
            type="submit"
            disabled={loading}
            className={`bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {loading ? 'Menyimpan...' : 'Simpan Kegiatan'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddKegiatan;