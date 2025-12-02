import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { 
  FaUserTie,
  FaCalendarAlt, 
  FaList, 
  FaBriefcase, 
  FaSearch,
  FaIdCard,
  FaPhone
} from 'react-icons/fa';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const Mitra = () => {
  const [mitraList, setMitraList] = useState([]);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'period'
  const [periodData, setPeriodData] = useState({});
  const [loading, setLoading] = useState(true);
  const [loadingPeriod, setLoadingPeriod] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // --- 1. FETCH DATA MITRA (LIST MODE) ---
  useEffect(() => {
    const fetchMitra = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        const config = { headers: { Authorization: `Bearer ${token}` } };
        
        // Mengambil daftar mitra
        // Catatan: Pastikan endpoint ini diizinkan untuk role 'user' di backend
        const response = await axios.get(`${API_URL}/api/mitra`, config);
        setMitraList(response.data);
      } catch (err) {
        console.error(err);
        // Fallback jika user tidak punya akses ke endpoint utama, 
        // kita set kosong atau tampilkan pesan
        if (err.response && err.response.status === 403) {
            setError("Anda tidak memiliki akses untuk melihat seluruh daftar mitra.");
        } else {
            setError("Gagal memuat data mitra.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchMitra();
  }, []);

  // --- 2. FETCH DATA PERIODE (PERIOD MODE) ---
  const fetchPeriodData = async () => {
    if (Object.keys(periodData).length > 0) return; // Cache sederhana
    setLoadingPeriod(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const [resSub, resPenugasan, resKelompok] = await Promise.all([
        axios.get(`${API_URL}/api/subkegiatan`, { headers }),
        axios.get(`${API_URL}/api/penugasan`, { headers }),
        axios.get(`${API_URL}/api/kelompok-penugasan`, { headers })
      ]);

      // Mapping Data
      const subMap = {};
      const subNameMap = {};
      resSub.data.forEach(s => {
        subMap[s.id] = s.periode;
        subNameMap[s.id] = s.nama_sub_kegiatan;
      });

      const taskMap = {};
      resPenugasan.data.forEach(t => {
        if (subMap[t.id_subkegiatan]) {
            taskMap[t.id_penugasan] = {
                periode: subMap[t.id_subkegiatan],
                nama_sub: subNameMap[t.id_subkegiatan]
            };
        }
      });

      const grouped = {};
      resKelompok.data.forEach(k => {
        const taskInfo = taskMap[k.id_penugasan];
        if (taskInfo && taskInfo.periode) {
            const periodeKey = taskInfo.periode;
            if (!grouped[periodeKey]) grouped[periodeKey] = [];
            grouped[periodeKey].push({
                id_mitra: k.id_mitra,
                nama_mitra: k.nama_mitra || k.nama_lengkap, // Fallback nama
                tugas: taskInfo.nama_sub,
                jabatan: k.kode_jabatan,
                nik: k.nik // Jika tersedia di endpoint ini
            });
        }
      });
      setPeriodData(grouped);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingPeriod(false);
    }
  };

  const formatPeriodeLabel = (periodeStr) => {
    if (!periodeStr) return '-';
    const parts = periodeStr.split('-');
    if (parts.length === 2) {
      const date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1);
      return date.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
    }
    return periodeStr;
  };

  // Filter List berdasarkan Search
  const filteredMitra = mitraList.filter(m => 
    m.nama_lengkap.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.nik.includes(searchTerm)
  );

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl pb-20">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <FaUserTie className="text-[#1A2A80]" /> Direktori Mitra
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Daftar rekan kerja dan mitra statistik yang terdaftar.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 justify-end w-full md:w-auto">
          {/* View Toggle */}
          <button 
            onClick={() => {
                if (viewMode === 'list') { setViewMode('period'); fetchPeriodData(); } 
                else { setViewMode('list'); }
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition shadow-sm border w-full md:w-auto justify-center ${viewMode === 'period' ? 'bg-blue-50 text-[#1A2A80] border-[#1A2A80]' : 'bg-white text-gray-600 border-gray-200'}`}
          >
            {viewMode === 'list' ? <><FaCalendarAlt /> Mode Periode</> : <><FaList /> Mode Daftar</>}
          </button>
        </div>
      </div>

      {/* ERROR MESSAGE */}
      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6 border border-red-100 text-center">
            {error}
        </div>
      )}

      {/* CONTENT AREA */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden min-h-[400px]">
        
        {viewMode === 'list' ? (
            <>
              {/* SEARCH BAR (Hanya di List Mode) */}
              <div className="p-4 border-b border-gray-100 bg-gray-50/50">
                <div className="relative max-w-md">
                    <span className="absolute left-3 top-3 text-gray-400"><FaSearch /></span>
                    <input 
                        type="text" 
                        placeholder="Cari nama atau NIK..." 
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1A2A80] outline-none text-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
              </div>

              {loading ? (
                  <div className="text-center py-20 text-gray-500 animate-pulse">Memuat data mitra...</div>
              ) : (
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider w-10">No</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Identitas</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Kontak</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Bank</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                        {filteredMitra.length === 0 ? (
                            <tr><td colSpan="4" className="text-center py-10 text-gray-400 italic">Data tidak ditemukan.</td></tr>
                        ) : (
                            filteredMitra.map((mitra, index) => (
                            <tr key={mitra.id} className="hover:bg-blue-50/30 transition-colors">
                                <td className="px-6 py-4 text-xs text-gray-500">{index + 1}</td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-blue-100 text-[#1A2A80] flex items-center justify-center text-xs font-bold">
                                            {mitra.nama_lengkap.charAt(0)}
                                        </div>
                                        <div>
                                            <div className="text-sm font-bold text-gray-900">{mitra.nama_lengkap}</div>
                                            <div className="text-xs text-gray-500 font-mono flex items-center gap-1">
                                                <FaIdCard className="text-gray-300"/> {mitra.nik}
                                            </div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-600">
                                    <div className="flex items-center gap-2">
                                        <FaPhone className="text-gray-300 text-xs" /> {mitra.no_hp}
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-900">
                                    <span className="font-bold">{mitra.nama_bank}</span> 
                                    <span className="text-gray-400 mx-1">-</span> 
                                    <span className="font-mono text-gray-500">{mitra.no_rekening}</span>
                                </td>
                            </tr>
                            ))
                        )}
                    </tbody>
                    </table>
                </div>
              )}
            </>
        ) : (
            // VIEW: MODE PERIODE
            <div className="space-y-0 divide-y divide-gray-200">
                {loadingPeriod ? <div className="p-10 text-center text-gray-500 animate-pulse">Memuat data periode...</div> : 
                 Object.keys(periodData).length === 0 ? (
                    <div className="p-10 text-center text-gray-400 italic">Belum ada data penugasan per periode.</div>
                 ) : (
                 Object.keys(periodData).sort().reverse().map(periodeKey => {
                    const mitraInPeriod = periodData[periodeKey];
                    return (
                        <div key={periodeKey}>
                            <div className="bg-gray-50 px-6 py-3 flex items-center gap-3 border-l-4 border-[#1A2A80] sticky top-0">
                                <FaCalendarAlt className="text-[#1A2A80]" />
                                <h3 className="font-bold text-gray-800 text-lg">{formatPeriodeLabel(periodeKey)}</h3>
                                <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded border shadow-sm">
                                    {mitraInPeriod.length} Mitra Bertugas
                                </span>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="min-w-full">
                                    <tbody className="divide-y divide-gray-100">
                                        {mitraInPeriod.map((item, idx) => (
                                            <tr key={idx} className="hover:bg-blue-50/30">
                                                <td className="px-6 py-3 pl-12 whitespace-nowrap">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-6 h-6 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center text-xs font-bold">
                                                            {item.nama_mitra ? item.nama_mitra.charAt(0) : '?'}
                                                        </div>
                                                        <div className="text-sm font-bold text-gray-800">
                                                            {item.nama_mitra || 'Nama Tidak Tersedia'}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-3 text-xs text-gray-500">
                                                    <div className="flex items-center gap-1 bg-blue-50 px-2 py-1 rounded w-fit text-blue-700">
                                                        <FaBriefcase /> {item.tugas}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-3 text-xs font-bold text-gray-600 text-right">
                                                    {item.jabatan || '-'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    );
                }))}
            </div>
        )}
      </div>
    </div>
  );
};

export default Mitra;