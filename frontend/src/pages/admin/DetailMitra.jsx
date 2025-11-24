// src/pages/admin/DetailMitra.jsx
import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
// 1. IMPORT ICON
import { 
  FaArrowLeft, 
  FaTrash, 
  FaUserTie, 
  FaIdCard, 
  FaPhone, 
  FaEnvelope, 
  FaMoneyCheckAlt, 
  FaCoins 
} from 'react-icons/fa';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const DetailMitra = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [mitra, setMitra] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDetail = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API_URL}/api/mitra/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setMitra(response.data);
      } catch (err) {
        console.error(err);
        setError(err.response?.data?.error || 'Gagal memuat detail mitra.');
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchDetail();
  }, [id]);

  const handleDelete = async () => {
    if (!window.confirm("Yakin hapus mitra ini? Data tidak bisa dikembalikan.")) return;
    try {
        const token = localStorage.getItem('token');
        await axios.delete(`${API_URL}/api/mitra/${id}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        alert("Mitra berhasil dihapus.");
        navigate('/admin/pengajuan-mitra'); // Kembali ke daftar
    } catch (err) {
        alert("Gagal menghapus mitra.");
    }
  };

  if (loading) return <div className="text-center py-10 text-gray-500">Memuat detail...</div>;
  if (error) return <div className="text-center py-10 text-red-600">{error}</div>;
  if (!mitra) return <div className="text-center py-10 text-gray-500">Data tidak ditemukan.</div>;

  return (
    <div className="max-w-4xl mx-auto w-full">
      
      {/* Tombol Kembali */}
      <div className="mb-6">
        <Link 
          to="/admin/pengajuan-mitra" 
          className="inline-flex items-center gap-2 text-gray-500 hover:text-[#1A2A80] transition font-medium"
        >
          <FaArrowLeft size={14} /> Kembali ke Daftar Mitra
        </Link>
      </div>

      {/* Card Utama */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        
        {/* Header Card */}
        <div className="px-8 py-6 bg-gray-50/50 border-b border-gray-100 flex justify-between items-center">
            <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center text-[#1A2A80] text-2xl shadow-sm border border-blue-100">
                    <FaUserTie />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">{mitra.nama_lengkap}</h1>
                    <p className="text-sm text-gray-500">{mitra.jabatan || 'Mitra Statistik'}</p>
                </div>
            </div>
            <div className="text-right hidden sm:block">
                 <span className="bg-gray-200 text-gray-600 px-3 py-1 rounded text-xs font-mono font-bold">ID: {mitra.id}</span>
            </div>
        </div>

        {/* Konten Detail */}
        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-10">
            
            {/* Kolom Kiri: Data Pribadi */}
            <div>
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-5 flex items-center gap-2 border-b border-gray-100 pb-2">
                    <FaIdCard /> Data Pribadi
                </h3>
                <div className="space-y-5">
                    <div>
                        <label className="block text-xs text-gray-500 mb-1 font-medium">NIK</label>
                        <div className="text-base font-bold text-gray-800 font-mono bg-gray-50 p-2 rounded border border-dashed border-gray-200 inline-block">
                            {mitra.nik}
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs text-gray-500 mb-1 font-medium flex items-center gap-1"><FaPhone size={10}/> No. Handphone</label>
                        <p className="text-base font-medium text-gray-900">{mitra.no_hp}</p>
                    </div>
                    <div>
                        <label className="block text-xs text-gray-500 mb-1 font-medium flex items-center gap-1"><FaEnvelope size={10}/> Email</label>
                        <p className="text-base font-medium text-gray-900">{mitra.email}</p>
                    </div>
                    <div>
                        <label className="block text-xs text-gray-500 mb-1 font-medium">Alamat</label>
                        <p className="text-sm font-medium text-gray-700 leading-relaxed">{mitra.alamat}</p>
                    </div>
                </div>
            </div>

            {/* Kolom Kanan: Data Keuangan */}
            <div>
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-5 flex items-center gap-2 border-b border-gray-100 pb-2">
                    <FaMoneyCheckAlt /> Informasi Keuangan
                </h3>
                <div className="space-y-5">
                    <div className="p-5 bg-blue-50 rounded-xl border border-blue-100">
                        <div className="grid grid-cols-1 gap-4">
                            <div>
                                <label className="block text-xs text-blue-600 mb-1 font-bold">BANK</label>
                                <p className="text-lg font-bold text-gray-800">{mitra.nama_bank}</p>
                            </div>
                            <div>
                                <label className="block text-xs text-blue-600 mb-1 font-bold">NO. REKENING</label>
                                <p className="text-lg font-mono font-medium text-gray-800 tracking-wide">{mitra.no_rekening}</p>
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs text-gray-500 mb-1 font-medium flex items-center gap-1">
                            <FaCoins size={10} /> Batas Honor Bulanan
                        </label>
                        <div className="text-2xl font-extrabold text-green-600">
                            Rp {Number(mitra.batas_honor_bulanan).toLocaleString('id-ID')}
                        </div>
                        <p className="text-xs text-gray-400 mt-1">Maksimal honor yang dapat diterima per bulan.</p>
                    </div>
                </div>
            </div>
        </div>
        
        {/* Footer Actions */}
        <div className="bg-gray-50 px-8 py-5 border-t border-gray-100 flex justify-end">
             <button 
                onClick={handleDelete}
                className="flex items-center gap-2 px-5 py-2.5 bg-white text-red-600 border border-red-200 rounded-lg hover:bg-red-50 hover:border-red-300 text-sm font-bold transition shadow-sm"
             >
                <FaTrash size={12} /> Hapus Mitra
             </button>
        </div>
      </div>
    </div>
  );
};

export default DetailMitra;