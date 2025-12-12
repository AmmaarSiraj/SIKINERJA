// src/pages/Mitra.jsx
import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { 
  FaSearch, 
  FaUserTie, 
  FaMapMarkerAlt, 
  FaPhone, 
  FaIdCard,
  FaCalendarAlt,
  FaFilter,
  FaUser // Import ikon user baru
} from 'react-icons/fa';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const Mitra = () => {
  const [mitraList, setMitraList] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // State Filter
  const currentYear = new Date().getFullYear();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedYear, setSelectedYear] = useState(currentYear);

  // Opsi Tahun (Mundur 2 tahun, Maju 1 tahun)
  const yearOptions = [currentYear - 2, currentYear - 1, currentYear, currentYear + 1];

  // Fetch Data Mitra
  useEffect(() => {
    const fetchMitra = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        const config = { headers: { Authorization: `Bearer ${token}` } };
        
        const response = await axios.get(`${API_URL}/api/mitra`, config);
        setMitraList(response.data);
      } catch (err) {
        console.error("Gagal memuat data mitra:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchMitra();
  }, []);

  // Filter Logika Gabungan (Pencarian + Tahun Aktif)
  const filteredMitra = useMemo(() => {
    if (!selectedYear) return [];

    return mitraList.filter(item => {
      // 1. Cek Tahun Aktif
      const historyYears = item.riwayat_tahun ? item.riwayat_tahun.split(',').map(y => y.trim()) : [];
      const isActiveInYear = historyYears.includes(String(selectedYear));

      if (!isActiveInYear) return false;

      // 2. Cek Pencarian Teks
      const term = searchTerm.toLowerCase();
      const isSearchMatch = 
        (item.nama_lengkap && item.nama_lengkap.toLowerCase().includes(term)) ||
        (item.nik && item.nik.includes(term)) ||
        (item.alamat && item.alamat.toLowerCase().includes(term));

      return isSearchMatch;
    });
  }, [mitraList, searchTerm, selectedYear]);

  // Helper Sensor NIK
  const maskNIK = (nik) => {
    if (!nik || nik.length < 8) return nik;
    return nik.substring(0, 4) + '********' + nik.substring(nik.length - 4);
  };

  // Helper Format Gender
  const formatGender = (gender) => {
    if (!gender) return '-';
    const g = String(gender).toLowerCase().trim();
    if (g === 'lk' || g === 'l') return 'Laki-laki';
    if (g === 'pr' || g === 'p') return 'Perempuan';
    return gender;
  };

  return (
    <div className="w-full pt-8 px-8 pb-20 animate-fade-in-up">
      
      {/* HEADER PAGE */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <div>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <FaUserTie className="text-[#1A2A80]" /> Direktori Mitra
            </h1>
            <p className="text-sm text-gray-500 mt-1">Daftar mitra statistik yang aktif pada tahun terpilih.</p>
        </div>
      </div>

      {/* FILTER BAR */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6 flex flex-col md:flex-row gap-4 items-center justify-between">
         
         {/* Input Pencarian */}
         <div className="relative w-full md:w-2/3">
            <FaSearch className="absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Cari nama mitra, NIK, atau alamat..."
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#1A2A80] outline-none text-sm transition bg-gray-50 focus:bg-white"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
         </div>

         {/* Dropdown Tahun */}
         <div className="flex items-center gap-3 w-full md:w-auto min-w-[200px]">
            <div className="flex items-center gap-2 text-gray-500 text-sm font-bold whitespace-nowrap">
                <FaFilter className="text-[#1A2A80]" /> Tahun Aktif:
            </div>
            <div className="relative w-full">
                <FaCalendarAlt className="absolute left-3 top-3 text-gray-400 z-10" />
                <select
                   className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#1A2A80] outline-none text-sm bg-gray-50 focus:bg-white cursor-pointer font-bold text-gray-700"
                   value={selectedYear}
                   onChange={(e) => setSelectedYear(e.target.value)}
                >
                   {yearOptions.map(year => (
                       <option key={year} value={year}>{year}</option>
                   ))}
                </select>
            </div>
         </div>

      </div>

      {/* TABEL DATA */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Header Tabel */}
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
            <h3 className="font-bold text-gray-700 flex items-center gap-2 text-sm">
                <FaUserTie className="text-[#1A2A80]" /> Mitra Aktif Tahun {selectedYear} ({filteredMitra.length})
            </h3>
        </div>

        {/* Content Tabel */}
        <div className="overflow-x-auto">
            <table className="min-w-full text-sm text-left">
                <thead className="bg-white text-gray-500 uppercase text-xs font-bold border-b border-gray-200">
                    <tr>
                        <th className="px-6 py-4 w-1/3">Nama Lengkap</th>
                        <th className="px-6 py-4 w-1/3">Identitas (NIK/ID)</th>
                        <th className="px-6 py-4 w-1/3">Kontak & Alamat</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {loading ? (
                        <tr>
                            <td colSpan="3" className="text-center py-12 text-gray-400 italic">
                                <div className="flex justify-center items-center gap-2">
                                    <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></span>
                                    Memuat data direktori...
                                </div>
                            </td>
                        </tr>
                    ) : filteredMitra.length === 0 ? (
                        <tr>
                            <td colSpan="3" className="text-center py-12 text-gray-400 italic bg-gray-50/30">
                                {searchTerm 
                                    ? `Tidak ditemukan mitra dengan kata kunci "${searchTerm}" di tahun ${selectedYear}.` 
                                    : `Tidak ada mitra yang aktif pada tahun ${selectedYear}.`
                                }
                            </td>
                        </tr>
                    ) : (
                        filteredMitra.map((item, idx) => (
                            <tr key={item.id || idx} className="hover:bg-blue-50/30 transition-colors group">
                                <td className="px-6 py-4 align-top">
                                    <div className="flex items-center gap-3">
                                        {/* UBAH INISIAL JADI IKON USER DI SINI */}
                                        <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-[#1A2A80] border border-indigo-100 group-hover:bg-[#1A2A80] group-hover:text-white transition-colors">
                                            <FaUser size={18} />
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-800">{item.nama_lengkap}</p>
                                            <p className="text-xs text-gray-500">{formatGender(item.jenis_kelamin)}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 align-top">
                                    <div className="flex flex-col gap-1.5">
                                        <div className="flex items-center gap-2 text-gray-600">
                                            <FaIdCard className="text-gray-400" />
                                            <span className="font-mono text-xs font-medium bg-gray-100 px-2 py-0.5 rounded border border-gray-200">
                                                {maskNIK(item.nik)}
                                            </span>
                                        </div>
                                        {item.sobat_id && (
                                            <div className="text-xs text-[#1A2A80] font-bold pl-6">
                                                ID SOBAT: {item.sobat_id}
                                            </div>
                                        )}
                                    </div>
                                </td>
                                <td className="px-6 py-4 align-top">
                                    <div className="space-y-1.5">
                                        <p className="flex items-center gap-2 text-gray-600">
                                            <FaPhone className="text-green-600 text-xs" />
                                            <span className="font-medium">{item.no_hp || '-'}</span>
                                        </p>
                                        <p className="flex items-start gap-2 text-gray-500 text-xs mt-1">
                                            <FaMapMarkerAlt className="text-red-500 mt-0.5 flex-shrink-0" />
                                            <span className="line-clamp-2 max-w-xs leading-snug">{item.alamat || '-'}</span>
                                        </p>
                                    </div>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
      </div>

    </div>
  );
};

export default Mitra;