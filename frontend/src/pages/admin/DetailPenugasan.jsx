// src/pages/admin/DetailPenugasan.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import PopupTambahAnggota from '../../components/admin/PopupTambahAnggota';
// 1. IMPORT ICON
import { 
  FaArrowLeft, 
  FaTrash, 
  FaPlus, 
  FaUserTie, 
  FaChartPie, 
  FaClipboardList, 
  FaPhone, 
  FaIdCard,
  FaExclamationTriangle
} from 'react-icons/fa';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const getToken = () => localStorage.getItem('token');

const DetailPenugasan = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [penugasan, setPenugasan] = useState(null);
  const [anggota, setAnggota] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isPopupOpen, setIsPopupOpen] = useState(false);

  const fetchDetailData = async () => {
    if (!id) return;
    setIsLoading(true);
    setError(null);
    try {
      const token = getToken();
      const config = { headers: { Authorization: `Bearer ${token}` } };

      const penugasanRes = await axios.get(`${API_URL}/api/penugasan/${id}`, config);
      setPenugasan(penugasanRes.data);

      try {
        const anggotaRes = await axios.get(`${API_URL}/api/penugasan/${id}/anggota`, config);
        setAnggota(anggotaRes.data);
      } catch (anggotaErr) {
        setAnggota([]); 
      }

    } catch (err) { 
      setError(err.response?.data?.message || 'Gagal memuat data utama.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDetailData();
  }, [id]);

  const handleRemoveAnggota = async (id_kelompok) => {
    if (!window.confirm('Keluarkan mitra ini dari tim?')) return;
    try {
      const token = getToken();
      await axios.delete(`${API_URL}/api/kelompok-penugasan/${id_kelompok}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchDetailData(); 
    } catch (err) {
      alert('Gagal menghapus anggota.');
    }
  };

  const handleDeletePenugasan = async () => {
    if (!window.confirm('Yakin bubarkan tim ini? Semua anggota akan dikeluarkan.')) return;
    try {
      const token = getToken();
      await axios.delete(`${API_URL}/api/penugasan/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      navigate('/admin/penugasan');
    } catch (err) {
      alert('Gagal menghapus penugasan.');
    }
  };
  
  const progres = useMemo(() => {
    if (!penugasan || anggota.length === 0) return 0;
    return (anggota.length / penugasan.jumlah_max_mitra) * 100;
  }, [penugasan, anggota]);

  if (isLoading) return <div className="text-center py-10 text-gray-500">Memuat detail...</div>;
  if (error) return <div className="text-center py-10 text-red-600">{error}</div>;
  if (!penugasan) return <div className="text-center py-10 text-gray-500">Data tidak ditemukan.</div>;

  return (
    <>
      <div className="w-full space-y-6">
        
        {/* Header Navigasi */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <Link 
              to="/admin/penugasan" 
              className="inline-flex items-center gap-2 text-gray-500 hover:text-[#1A2A80] transition font-medium mb-2"
            >
              <FaArrowLeft size={14} /> Kembali ke Daftar
            </Link>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <span className="bg-blue-100 text-[#1A2A80] p-2 rounded-lg text-lg"><FaClipboardList /></span>
              {penugasan.nama_sub_kegiatan}
            </h1>
            <p className="text-sm text-gray-500 mt-1 ml-11">
              Induk: <span className="font-medium">{penugasan.nama_kegiatan}</span>
            </p>
          </div>
          
          <button 
            onClick={handleDeletePenugasan}
            className="flex items-center gap-2 bg-red-50 text-red-600 px-4 py-2 rounded-lg hover:bg-red-100 text-sm font-bold border border-red-200 transition shadow-sm"
          >
            <FaTrash size={12} /> Bubarkan Tim
          </button>
        </div>

        {/* --- KARTU INFO --- */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Info Pengawas */}
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">
                <FaUserTie />
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-1">Ketua Tim / Pengawas</p>
                <p className="text-base font-bold text-gray-900">{penugasan.nama_pengawas}</p>
                <p className="text-sm text-gray-500">{penugasan.email_pengawas} ({penugasan.role_pengawas})</p>
              </div>
            </div>

            {/* Info Progress */}
            <div>
              <p className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-2 flex items-center gap-2">
                <FaChartPie /> Kapasitas & Status
              </p>
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-gray-900 text-lg">
                  {anggota.length} <span className="text-gray-400 text-sm font-normal">/ {penugasan.jumlah_max_mitra} Anggota</span>
                </span>
                <span className={`text-xs font-bold px-2 py-1 rounded ${progres >= 100 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                  {progres.toFixed(0)}% Terisi
                </span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                <div 
                  className={`h-full transition-all duration-500 ${progres >= 100 ? 'bg-red-500' : 'bg-green-500'}`} 
                  style={{ width: `${Math.min(progres, 100)}%` }}
                ></div>
              </div>
            </div>

          </div>
        </div>

        {/* --- TABEL ANGGOTA --- */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/30">
            <h3 className="font-bold text-gray-800">Daftar Anggota Lapangan</h3>
            <button 
              onClick={() => setIsPopupOpen(true)}
              disabled={anggota.length >= penugasan.jumlah_max_mitra}
              className="flex items-center gap-2 bg-[#1A2A80] hover:bg-blue-900 disabled:bg-gray-300 text-white py-2 px-4 rounded-lg text-sm font-bold transition shadow-sm"
            >
              <FaPlus size={12} /> Tambah Anggota
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-white">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Nama Mitra</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Identitas</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Kontak</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {anggota.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="px-6 py-12 text-center text-gray-400 italic">
                      <div className="flex flex-col items-center gap-2">
                        <FaExclamationTriangle size={24} className="text-gray-300"/>
                        Belum ada anggota yang ditambahkan.
                      </div>
                    </td>
                  </tr>
                ) : (
                  anggota.map((item) => (
                    <tr key={item.id_kelompok} className="hover:bg-blue-50/30 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-[#1A2A80] font-bold text-xs">
                            {item.nama_lengkap.charAt(0)}
                          </div>
                          <div>
                            <div className="text-sm font-bold text-gray-900">{item.nama_lengkap}</div>
                            <div className="text-xs text-gray-500">{item.nama_jabatan || 'Mitra'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2 text-sm text-gray-600 font-mono bg-gray-50 px-2 py-1 rounded w-fit">
                          <FaIdCard className="text-gray-400"/> {item.nik}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                         <div className="flex items-center gap-2">
                           <FaPhone className="text-gray-400" size={12}/> {item.no_hp}
                         </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                        <button 
                          onClick={() => handleRemoveAnggota(item.id_kelompok)}
                          className="text-red-500 hover:text-red-700 font-medium bg-red-50 hover:bg-red-100 px-3 py-1 rounded-full transition text-xs flex items-center gap-1 ml-auto"
                        >
                          <FaTrash size={10} /> Keluarkan
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* POPUP ADD MEMBER */}
      <PopupTambahAnggota
        isOpen={isPopupOpen}
        onClose={() => setIsPopupOpen(false)}
        id_penugasan={id}
        id_pengawas={null} 
        existingAnggotaIds={anggota.map(a => a.id_mitra)}
        onAnggotaAdded={fetchDetailData}
      />
    </>
  );
};

export default DetailPenugasan;