import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useParams } from 'react-router-dom';
import PartEditSubKegiatan from '../../components/admin/PartEditSubKegiatan';
// --- 1. IMPORT KOMPONEN HONORARIUM BARU ---
import PartManageHonor from '../../components/admin/PartManageHonor';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// ... (fungsi formatDateForInput tetap sama)
const formatDateForInput = (isoDate) => {
  if (!isoDate) return '';
  try {
    return new Date(isoDate).toISOString().split('T')[0];
  } catch (error) {
    console.error('Error formatting date:', error);
    return '';
  }
};


const EditKegiatan = () => {
  // State untuk form utama (kegiatan)
  const [nama_kegiatan, setNamaKegiatan] = useState('');
  const [deskripsi, setDeskripsi] = useState('');
  const [tahun_anggaran, setTahunAnggaran] = useState(new Date().getFullYear());
  const [tanggal_mulai, setTanggalMulai] = useState('');
  const [tanggal_selesai, setTanggalSelesai] = useState('');
  
  const [loading, setLoading] = useState(false); // Loading untuk submit
  const [fetchLoading, setFetchLoading] = useState(true); // Loading untuk fetch awal
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  
  const { id } = useParams(); // Mengambil 'id' dari URL

  // 1. Ambil data kegiatan UTAMA (ini tidak berubah)
  useEffect(() => {
    const fetchKegiatanData = async () => {
      setFetchLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('No auth token found. Please login.');
        }

        const response = await fetch(`${API_URL}/api/kegiatan/${id}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.message || 'Gagal mengambil data kegiatan');
        }

        const data = await response.json();
        
        setNamaKegiatan(data.nama_kegiatan);
        setDeskripsi(data.deskripsi || '');
        setTahunAnggaran(data.tahun_anggaran);
        setTanggalMulai(formatDateForInput(data.tanggal_mulai));
        setTanggalSelesai(formatDateForInput(data.tanggal_selesai));

      } catch (err) {
        setError(err.message);
      } finally {
        setFetchLoading(false);
      }
    };

    fetchKegiatanData();
  }, [id]);

  // 2. Handler submit untuk data KEGIATAN UTAMA (ini tidak berubah)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No auth token found. Please login.');
      }

      const response = await fetch(`${API_URL}/api/kegiatan/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          nama_kegiatan,
          deskripsi,
          tahun_anggaran: parseInt(tahun_anggaran, 10),
          tanggal_mulai,
          tanggal_selesai
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Gagal memperbarui kegiatan');
      }

      setSuccessMessage('Data kegiatan utama berhasil diperbarui!');
      
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);

    } catch (err) {
      setError(err.message);
      setTimeout(() => {
        setError(null);
      }, 3000);
    } finally {
      setLoading(false);
    }
  };

  if (fetchLoading) {
    return <div className="text-center p-8">Memuat data kegiatan...</div>;
  }

  return (
    // Container dilebarkan menjadi max-w-6xl
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Edit Kegiatan</h1>
        <Link
          to="/admin/manage-kegiatan"
          className="text-sm text-indigo-600 hover:underline"
        >
          &larr; Kembali ke Daftar
        </Link>
      </div>
      
      {/* Wrapper Grid 2 Kolom */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Kolom 1: Form Kegiatan Utama */}
        <div className="bg-white shadow-md rounded-lg p-6">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">Detail Kegiatan Utama</h2>

          {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">{error}</div>}
          {successMessage && <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4" role="alert">{successMessage}</div>}

          <form onSubmit={handleSubmit}>
            {/* ... (form input untuk nama_kegiatan, deskripsi, dll tidak berubah) ... */}
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
                disabled={loading || fetchLoading}
                className={`bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline ${loading || fetchLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {loading ? 'Menyimpan...' : 'Simpan Perubahan Kegiatan'}
              </button>
            </div>
          </form>
        </div>
        
        {/* Kolom 2: Form Sub Kegiatan & Honorarium */}
        <div className="space-y-6">
          {/* Komponen Sub Kegiatan (tidak berubah) */}
          <PartEditSubKegiatan kegiatanId={id} />

          {/* --- 2. TAMBAHKAN KOMPONEN HONORARIUM DI SINI --- */}
          {/* Kita tambahkan pengecekan fetchLoading agar ID-nya valid */}
          {!fetchLoading && <PartManageHonor kegiatanId={id} />}
        </div>
      </div>
    </div>
  );
};

export default EditKegiatan;