// src/components/admin/PopupTambahAnggota.jsx
import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost:3000/api';
const getToken = () => localStorage.getItem('token');

/**
 * Komponen ini menerima props:
 * - isOpen (boolean): Menentukan apakah popup terlihat.
 * - onClose (function): Fungsi untuk menutup popup.
 * - id_penugasan (string/number): ID dari penugasan saat ini.
 * - id_pengawas (number): ID mitra yang menjadi pengawas.
 * - existingAnggotaIds (array): Array berisi ID mitra yang sudah ada di tim.
 * - onAnggotaAdded (function): Callback untuk me-refresh data di halaman detail.
 */
const PopupTambahAnggota = ({ isOpen, onClose, id_penugasan, id_pengawas, existingAnggotaIds, onAnggotaAdded }) => {
  const [allMitra, setAllMitra] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // 1. Fetch semua mitra saat popup pertama kali dibuka
  useEffect(() => {
    if (isOpen) {
      const fetchAllMitra = async () => {
        setLoading(true);
        setError(null);
        try {
          const token = getToken();
          const config = { headers: { Authorization: `Bearer ${token}` } };
          const response = await axios.get(`${API_URL}/mitra`, config);
          setAllMitra(response.data || []);
        } catch (err) {
          setError(err.response?.data?.message || err.message || 'Gagal memuat daftar mitra');
        } finally {
          setLoading(false);
        }
      };
      fetchAllMitra();
    }
  }, [isOpen]); // Hanya fetch ketika isOpen berubah menjadi true

  // 2. Filter mitra yang bisa ditambahkan
  const availableMitra = useMemo(() => {
    // Gabungkan semua ID yang tidak boleh tampil
    const excludedIds = new Set([id_pengawas, ...existingAnggotaIds]);
    
    return allMitra
      .filter(mitra => !excludedIds.has(mitra.id))
      .filter(mitra => 
        mitra.nama_lengkap.toLowerCase().includes(searchTerm.toLowerCase()) ||
        mitra.jabatan.toLowerCase().includes(searchTerm.toLowerCase())
      );
  }, [allMitra, id_pengawas, existingAnggotaIds, searchTerm]);

  // 3. Handler untuk menambah anggota
  const handleAddAnggota = async (id_mitra) => {
    try {
      const token = getToken();
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const body = { id_penugasan: id_penugasan, id_mitra: id_mitra };
      
      await axios.post(`${API_URL}/kelompok-penugasan`, body, config);
      
      alert('Anggota berhasil ditambahkan!');
      onAnggotaAdded(); // Panggil fungsi refresh dari parent
      onClose(); // Tutup popup

    } catch (err) {
      alert(`Error: ${err.response?.data?.message || err.message}`);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    // Overlay
    // --- BARIS INI YANG DIUBAH: bg-opacity-40 menjadi bg-opacity-0 ---
    <div className="fixed inset-0  bg-opacity-40 flex justify-center items-center z-50 p-4">
      {/* Konten Popup */}
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        {/* Header Popup */}
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-bold">Pilih Anggota untuk Ditambahkan</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800 text-2xl">&times;</button>
        </div>

        {/* Search Bar */}
        <div className="p-4 border-b">
          <input
            type="text"
            placeholder="Cari nama atau jabatan..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* List Anggota */}
        <div className="overflow-y-auto flex-grow p-4">
          {loading && <p className="text-center">Memuat daftar mitra...</p>}
          {error && <p className="text-center text-red-600">{error}</p>}
          
          {!loading && !error && (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Nama</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Jabatan</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Aksi</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {availableMitra.length > 0 ? (
                  availableMitra.map(mitra => (
                    <tr key={mitra.id}>
                      <td className="px-4 py-3 text-sm text-gray-900">{mitra.nama_lengkap}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">{mitra.jabatan}</td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => handleAddAnggota(mitra.id)}
                          className="bg-green-600 hover:bg-green-700 text-white text-xs py-1 px-3 rounded"
                        >
                          Tambah
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="3" className="px-4 py-4 text-center text-gray-500">
                      {allMitra.length > 0 ? 'Semua mitra sudah terdaftar.' : 'Tidak ada mitra tersedia.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default PopupTambahAnggota;