// src/components/admin/PopupTambahAnggota.jsx
import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
// 1. IMPORT ICON
import { 
  FaSearch, 
  FaUserPlus, 
  FaTimes, 
  FaIdCard 
} from 'react-icons/fa';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const getToken = () => localStorage.getItem('token');

const PopupTambahAnggota = ({ isOpen, onClose, id_penugasan, existingAnggotaIds, onAnggotaAdded }) => {
  const [allMitra, setAllMitra] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  useEffect(() => {
    if (isOpen) {
      const fetchAllMitra = async () => {
        setLoading(true);
        setError(null);
        try {
          const token = getToken();
          const response = await axios.get(`${API_URL}/api/mitra`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          setAllMitra(response.data || []);
        } catch (err) {
          setError('Gagal memuat daftar mitra');
        } finally {
          setLoading(false);
        }
      };
      fetchAllMitra();
    }
  }, [isOpen]);

  const availableMitra = useMemo(() => {
    // Filter ID yang sudah ada di tim saja
    const excludedIds = new Set(existingAnggotaIds);
    
    return allMitra
      .filter(mitra => !excludedIds.has(mitra.id))
      .filter(mitra => 
        mitra.nama_lengkap.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (mitra.nik && mitra.nik.includes(searchTerm))
      );
  }, [allMitra, existingAnggotaIds, searchTerm]);

  const handleAddAnggota = async (id_mitra) => {
    try {
      const token = getToken();
      await axios.post(`${API_URL}/api/kelompok-penugasan`, 
        { id_penugasan, id_mitra }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      onAnggotaAdded(); // Refresh data di parent
      // Jangan close popup agar bisa tambah banyak sekaligus
    } catch (err) {
      alert(err.response?.data?.error || 'Gagal menambahkan anggota');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-50 p-4 backdrop-blur-sm transition-opacity">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col overflow-hidden border border-gray-200 animate-fade-in-up">
        
        {/* Header Popup */}
        <div className="flex justify-between items-center p-5 bg-[#1A2A80] text-white">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <FaUserPlus className="text-blue-200" /> Tambah Anggota Tim
          </h2>
          <button 
            onClick={onClose} 
            className="text-white/70 hover:text-white hover:bg-white/10 p-2 rounded-full transition"
          >
            <FaTimes size={18} />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-5 border-b border-gray-100 bg-gray-50">
          <div className="relative">
            <span className="absolute left-4 top-3.5 text-gray-400">
                <FaSearch />
            </span>
            <input
                type="text"
                placeholder="Cari nama atau NIK mitra..."
                className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1A2A80] focus:border-[#1A2A80] outline-none text-sm transition shadow-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                autoFocus
            />
          </div>
        </div>

        {/* List Mitra */}
        <div className="overflow-y-auto flex-grow p-4 bg-gray-50 space-y-3">
          {loading && <p className="text-center py-8 text-gray-500 italic">Memuat data mitra...</p>}
          {error && <p className="text-center py-8 text-red-500">{error}</p>}
          
          {!loading && !error && (
            <>
                {availableMitra.length === 0 ? (
                    <div className="text-center py-10 text-gray-400 flex flex-col items-center">
                        <FaSearch size={30} className="mb-2 opacity-20" />
                        <p className="text-sm">Tidak ada mitra yang cocok atau tersedia.</p>
                    </div>
                ) : (
                    availableMitra.map(mitra => (
                        <div 
                            key={mitra.id} 
                            className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center hover:border-blue-300 transition-colors group"
                        >
                            <div className="flex items-center gap-3 overflow-hidden">
                                {/* Avatar Inisial */}
                                <div className="w-10 h-10 rounded-full bg-blue-50 flex-shrink-0 flex items-center justify-center text-[#1A2A80] font-bold text-sm border border-blue-100">
                                    {mitra.nama_lengkap.charAt(0)}
                                </div>
                                <div className="min-w-0">
                                    <p className="font-bold text-gray-800 text-sm truncate group-hover:text-[#1A2A80] transition-colors">
                                        {mitra.nama_lengkap}
                                    </p>
                                    <p className="text-xs text-gray-500 font-mono flex items-center gap-1">
                                        <FaIdCard className="text-gray-300" /> {mitra.nik}
                                    </p>
                                </div>
                            </div>
                            
                            <button
                                onClick={() => handleAddAnggota(mitra.id)}
                                className="bg-[#1A2A80] hover:bg-blue-900 text-white text-xs font-bold py-2 px-4 rounded-lg shadow-sm hover:shadow transition flex items-center gap-2 flex-shrink-0"
                            >
                                <FaUserPlus /> Tambah
                            </button>
                        </div>
                    ))
                )}
            </>
          )}
        </div>

        {/* Footer Info */}
        <div className="p-3 bg-white border-t border-gray-200 text-center text-xs text-gray-400">
            Menampilkan {availableMitra.length} mitra tersedia
        </div>

      </div>
    </div>
  );
};

export default PopupTambahAnggota;