// src/pages/admin/EditKegiatan.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useParams } from 'react-router-dom';
import PartEditSubKegiatan from '../../components/admin/PartEditSubKegiatan';
import PartManageHonor from '../../components/admin/PartManageHonor';
// 1. IMPORT ICON
import { 
  FaArrowLeft, 
  FaSave, 
  FaLayerGroup,
  FaEdit 
} from 'react-icons/fa';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const EditKegiatan = () => {
  const { id } = useParams(); 
  const navigate = useNavigate();

  // State Form Utama (Hanya Nama & Deskripsi)
  const [nama_kegiatan, setNamaKegiatan] = useState('');
  const [deskripsi, setDeskripsi] = useState('');
  
  const [loading, setLoading] = useState(false); 
  const [fetchLoading, setFetchLoading] = useState(true); 
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // 1. FETCH DATA SAAT INI
  useEffect(() => {
    const fetchKegiatanData = async () => {
      setFetchLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('No auth token found.');

        const response = await fetch(`${API_URL}/api/kegiatan/${id}`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });

        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.message || 'Gagal mengambil data kegiatan');
        }

        const data = await response.json();
        
        setNamaKegiatan(data.nama_kegiatan);
        setDeskripsi(data.deskripsi || '');
        // Tahun & Tanggal diabaikan karena sudah dihapus dari struktur induk

      } catch (err) {
        setError(err.message);
      } finally {
        setFetchLoading(false);
      }
    };

    fetchKegiatanData();
  }, [id]);

  // 2. HANDLER UPDATE INDUK
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${API_URL}/api/kegiatan/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          nama_kegiatan,
          deskripsi
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Gagal update kegiatan');
      }

      setSuccessMessage('Data Survei/Sensus utama berhasil diperbarui!');
      setTimeout(() => setSuccessMessage(null), 3000);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (fetchLoading) {
    return <div className="text-center py-10 text-gray-500">Memuat data Survei/Sensus...</div>;
  }

  return (
    <div className="w-full max-w-6xl mx-auto pb-10">
      
      {/* Header Navigasi */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Link
          to="/admin/manage-kegiatan"
          className="inline-flex items-center gap-2 text-gray-500 hover:text-[#1A2A80] transition font-medium"
        >
          <FaArrowLeft size={14} /> Kembali ke Daftar
        </Link>
        <h1 className="text-2xl font-bold text-gray-800">Edit Survei/Sensus</h1>
      </div>
      
      {/* Wrapper Grid 2 Kolom */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* KOLOM KIRI: FORM EDIT INDUK */}
        <div className="space-y-6 h-fit">
          <div className="bg-white shadow-sm rounded-xl border border-gray-100 overflow-hidden">
            
            {/* Header Card */}
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center gap-3">
                <div className="bg-blue-100 text-[#1A2A80] p-2 rounded-lg">
                    <FaLayerGroup />
                </div>
                <h2 className="text-lg font-bold text-gray-800">Detail Induk Kegiatan</h2>
            </div>

            <div className="p-6">
              {error && <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg mb-4 border border-red-100 text-sm">{error}</div>}
              {successMessage && <div className="bg-green-50 text-green-600 px-4 py-3 rounded-lg mb-4 border border-green-100 text-sm">{successMessage}</div>}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label htmlFor="nama_kegiatan" className="block text-sm font-bold text-gray-700 mb-2">
                    Nama Survei/Sensus <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="nama_kegiatan"
                    value={nama_kegiatan}
                    onChange={(e) => setNamaKegiatan(e.target.value)}
                    className="block w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1A2A80] focus:border-[#1A2A80] transition outline-none"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="deskripsi" className="block text-sm font-bold text-gray-700 mb-2">
                    Deskripsi
                  </label>
                  <textarea
                    id="deskripsi"
                    rows="4"
                    value={deskripsi}
                    onChange={(e) => setDeskripsi(e.target.value)}
                    className="block w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1A2A80] focus:border-[#1A2A80] transition outline-none resize-none"
                  />
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex items-center gap-2 bg-[#1A2A80] hover:bg-blue-900 text-white font-bold py-2.5 px-6 rounded-lg shadow-md transform active:scale-95 transition disabled:opacity-70"
                  >
                    {loading ? 'Menyimpan...' : <><FaSave /> Simpan Perubahan Induk</>}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
        
        {/* KOLOM KANAN: SUB KEGIATAN & HONOR */}
        <div className="space-y-8 animate-fade-in-up">
          
          {/* Komponen Edit Sub Kegiatan */}
          <PartEditSubKegiatan kegiatanId={id} />

          {/* Komponen Manage Honor */}
          <PartManageHonor kegiatanId={id} />
          
        </div>
      </div>
    </div>
  );
};

export default EditKegiatan;