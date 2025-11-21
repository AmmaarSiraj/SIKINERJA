import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';

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
      onAnggotaAdded();
      onClose();
    } catch (err) {
      alert(err.response?.data?.error || 'Gagal menambahkan anggota');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden">
        <div className="flex justify-between items-center p-5 border-b bg-gray-50">
          <h2 className="text-lg font-bold text-gray-800">Tambah Anggota Tim</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl font-bold">&times;</button>
        </div>

        <div className="p-4 border-b">
          <input
            type="text"
            placeholder="Cari nama atau NIK..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            autoFocus
          />
        </div>

        <div className="overflow-y-auto flex-grow p-2 bg-gray-50">
          {loading && <p className="text-center py-4">Memuat...</p>}
          
          {!loading && (
            <div className="space-y-2">
                {availableMitra.length === 0 ? (
                    <p className="text-center text-gray-500 py-4">Tidak ada mitra tersedia.</p>
                ) : (
                    availableMitra.map(mitra => (
                        <div key={mitra.id} className="bg-white p-3 rounded-lg shadow-sm flex justify-between items-center border border-gray-100">
                            <div>
                                <p className="font-bold text-gray-800">{mitra.nama_lengkap}</p>
                                <p className="text-xs text-gray-500 font-mono">{mitra.nik}</p>
                            </div>
                            <button
                                onClick={() => handleAddAnggota(mitra.id)}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-1.5 px-3 rounded transition"
                            >
                                + Tambah
                            </button>
                        </div>
                    ))
                )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PopupTambahAnggota;