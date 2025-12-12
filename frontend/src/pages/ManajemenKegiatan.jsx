// src/pages/ManajemenKegiatan.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  FaChevronDown, 
  FaChevronUp,
  FaInfoCircle,
  FaCalendarAlt,
  FaSearch,
  FaFilter,
  FaLayerGroup,
  FaClipboardList
} from 'react-icons/fa';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const ManajemenKegiatan = () => {
  const [kegiatan, setKegiatan] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // State untuk Expand/Collapse
  const [expandedRow, setExpandedRow] = useState(null); 
  const [subKegiatanMap, setSubKegiatanMap] = useState({}); 
  const [loadingSub, setLoadingSub] = useState(false);
  
  // State untuk Filter & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [filterYear, setFilterYear] = useState('');

  const navigate = useNavigate();

  // 1. FETCH DATA (Kegiatan / Survei Sensus)
  const fetchKegiatan = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token'); 
      if (!token) throw new Error('No auth token found.');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      const [resKeg, resSub] = await Promise.all([
        axios.get(`${API_URL}/api/kegiatan`, config),
        axios.get(`${API_URL}/api/subkegiatan`, config)
      ]);

      const allSubs = Array.isArray(resSub.data) ? resSub.data : [];
      const allKegiatan = Array.isArray(resKeg.data) ? resKeg.data : [];
      
      // Grouping Sub Kegiatan by Nama Kegiatan (untuk mapping awal)
      const subsGroupedByName = {};
      allSubs.forEach(sub => {
        if (sub.nama_kegiatan) {
           const key = sub.nama_kegiatan.trim().toLowerCase();
           if (!subsGroupedByName[key]) {
             subsGroupedByName[key] = [];
           }
           subsGroupedByName[key].push(sub);
        }
      });

      // Merge Data
      const mergedData = allKegiatan.map(k => {
         const key = k.nama_kegiatan ? k.nama_kegiatan.trim().toLowerCase() : '';
         const mySubs = subsGroupedByName[key] || [];
         
         // Ambil tahun aktif dari sub kegiatan
         const activeYears = new Set();
         mySubs.forEach(sub => {
            if (sub.tanggal_mulai) {
                const y = new Date(sub.tanggal_mulai).getFullYear();
                if (!isNaN(y)) activeYears.add(y.toString());
            }
         });

         if (activeYears.size === 0 && k.created_at) {
             const createdYear = new Date(k.created_at).getFullYear();
             if (!isNaN(createdYear)) activeYears.add(createdYear.toString());
         }

         return {
             ...k,
             active_years: Array.from(activeYears),
             sub_list: mySubs 
         };
      });

      setKegiatan(mergedData);
      setError(null);
    } catch (err) {
      console.error(err);
      setError("Gagal memuat daftar kegiatan.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKegiatan();
  }, []);

  // --- LOGIKA FILTER & SEARCH ---
  const filteredKegiatan = useMemo(() => {
    return kegiatan.filter(item => {
      const term = searchTerm.toLowerCase();
      const namaKegiatan = item.nama_kegiatan || '';
      
      // Pencarian di Parent (Survei) dan Child (Kegiatan)
      const matchParent = namaKegiatan.toLowerCase().includes(term);
      const matchChild = item.sub_list && item.sub_list.some(sub => 
        sub.nama_sub_kegiatan && sub.nama_sub_kegiatan.toLowerCase().includes(term)
      );
      const isMatchSearch = matchParent || matchChild;
      
      // Filter Tahun
      const years = item.active_years || [];
      const matchYear = filterYear ? years.includes(filterYear) : true;

      return isMatchSearch && matchYear;
    });
  }, [kegiatan, searchTerm, filterYear]);

  const availableYears = useMemo(() => {
    const years = new Set();
    if (Array.isArray(kegiatan)) {
      kegiatan.forEach(item => {
          const yrs = item.active_years || [];
          if (Array.isArray(yrs)) {
            yrs.forEach(y => years.add(y));
          }
      });
    }
    return [...years].sort((a, b) => b - a);
  }, [kegiatan]);

  // --- HANDLERS ---

  const handleRowClick = async (id) => {
    if (expandedRow === id) {
      setExpandedRow(null); 
      return;
    }
    setExpandedRow(id); 
    fetchSubKegiatan(id);
  };

  const fetchSubKegiatan = async (parentId) => {
    setLoadingSub(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_URL}/api/subkegiatan/kegiatan/${parentId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSubKegiatanMap(prev => ({ ...prev, [parentId]: res.data }));
    } catch (err) {
      console.error("Gagal load kegiatan:", err);
    } finally {
      setLoadingSub(false);
    }
  };

  // --- HELPER ---
  const formatDateRange = (startDate, endDate) => {
    if (!startDate || !endDate) return '-';
    const options = { day: 'numeric', month: 'short', year: 'numeric' };
    const start = new Date(startDate).toLocaleDateString('id-ID', options);
    const end = new Date(endDate).toLocaleDateString('id-ID', options);
    return `${start} - ${end}`;
  };

  const getComputedStatus = (startDate, endDate) => {
    if (!startDate || !endDate) return { label: 'Jadwal Belum Lengkap', className: 'bg-gray-100 text-gray-500' };
    const now = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    now.setHours(0, 0, 0, 0);
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    if (now < start) return { label: 'Akan Datang', className: 'bg-blue-100 text-blue-700' };
    if (now > end) return { label: 'Selesai', className: 'bg-green-100 text-green-700' };
    return { label: 'Sedang Proses', className: 'bg-yellow-100 text-yellow-700' };
  };

  if (loading) return <div className="text-center py-20 text-gray-500">Memuat data...</div>;
  if (error) return <div className="text-center py-20 text-red-600">{error}</div>;

  return (
    <div className="w-full pt-24 px-4 container mx-auto max-w-6xl pb-20">
      
      {/* HEADER */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <FaLayerGroup className="text-[#1A2A80]" /> Daftar Survei & Sensus
        </h1>
        <p className="text-gray-500 text-sm mt-1">
            Informasi lengkap mengenai kegiatan statistik yang tersedia.
        </p>
      </div>

      {/* FILTER & SEARCH */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6 flex flex-col md:flex-row gap-4 items-center justify-between">
         <div className="relative w-full md:w-1/2">
            <FaSearch className="absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Cari Survei/Sensus atau Kegiatan..."
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#1A2A80] outline-none text-sm transition bg-gray-50 focus:bg-white"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
         </div>
         <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="flex items-center gap-2 text-gray-500 text-sm font-bold"><FaFilter /> Tahun:</div>
            <select
               className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#1A2A80] outline-none text-sm bg-white cursor-pointer"
               value={filterYear}
               onChange={(e) => setFilterYear(e.target.value)}
            >
               <option value="">Semua</option>
               {availableYears.map(year => <option key={year} value={year}>{year}</option>)}
            </select>
         </div>
      </div>

      {/* LIST SURVEI/SENSUS */}
      <div className="space-y-4">
        {kegiatan.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-300">
            <p className="text-gray-500 font-medium">Belum ada data Survei/Sensus.</p>
          </div>
        ) : filteredKegiatan.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-300">
            <p className="text-gray-500 font-medium">Tidak ditemukan data yang cocok.</p>
            <button onClick={() => {setSearchTerm(''); setFilterYear('')}} className="mt-2 text-[#1A2A80] text-sm underline hover:text-blue-800">Reset Filter</button>
          </div>
        ) : (
          filteredKegiatan.map((item) => {
            const isExpanded = expandedRow === item.id;
            
            return (
              <div key={item.id} className={`bg-white rounded-xl shadow-sm border transition-all duration-200 overflow-hidden ${isExpanded ? 'border-blue-300 ring-1 ring-blue-100' : 'border-gray-100 hover:border-blue-200'}`}>
                {/* Header Row (Induk) */}
                <div onClick={() => handleRowClick(item.id)} className={`px-6 py-4 cursor-pointer flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-colors ${isExpanded ? 'bg-blue-50/30' : 'bg-white hover:bg-gray-50'}`}>
                  <div className="flex items-center gap-4 flex-1">
                    <div className={`p-2 rounded-full transition-transform duration-200 ${isExpanded ? 'bg-blue-100 text-[#1A2A80]' : 'text-gray-400 bg-gray-100'}`}>
                       {isExpanded ? <FaChevronUp size={12} /> : <FaChevronDown size={12} />}
                    </div>
                    <div>
                      <h3 className={`text-base font-bold transition-colors ${isExpanded ? 'text-[#1A2A80]' : 'text-gray-800'}`}>{item.nama_kegiatan}</h3>
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{item.deskripsi || 'Tidak ada deskripsi.'}</p>
                    </div>
                  </div>
                  {/* Badge Jumlah Kegiatan */}
                  <div className="flex items-center">
                     <span className="text-xs font-medium text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                        {item.sub_list ? item.sub_list.length : 0} Kegiatan
                     </span>
                  </div>
                </div>

                {/* Sub Kegiatan List (Accordion Content) */}
                {isExpanded && (
                  <div className="bg-gray-50/50 border-t border-gray-100 animate-fade-in-down">
                    {loadingSub && !subKegiatanMap[item.id] ? (
                      <div className="p-6 text-center text-gray-500 text-sm italic">Memuat kegiatan...</div>
                    ) : (
                      <>
                        {subKegiatanMap[item.id] && subKegiatanMap[item.id].length > 0 ? (
                          <div className="overflow-x-auto p-4">
                            <table className="w-full text-left text-sm bg-white rounded-lg border border-gray-200 overflow-hidden">
                              <thead className="bg-gray-50 text-gray-500 uppercase text-xs font-bold border-b border-gray-200">
                                <tr>
                                  <th className="px-4 py-3 w-1/3">Nama Kegiatan</th>
                                  <th className="px-4 py-3">Jadwal Pelaksanaan</th>
                                  <th className="px-4 py-3 text-center">Status</th>
                                  <th className="px-4 py-3 text-right">Detail</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-100">
                                {subKegiatanMap[item.id].map((sub) => {
                                  const statusObj = getComputedStatus(sub.tanggal_mulai, sub.tanggal_selesai);
                                  return (
                                    <tr 
                                      key={sub.id} 
                                      // PERUBAHAN: Menambahkan onClick pada row agar bisa diklik
                                      className="hover:bg-blue-50 transition-colors group cursor-pointer"
                                      onClick={() => navigate(`/kegiatan/${sub.id}`)}
                                    >
                                      <td className="px-4 py-3 font-medium text-gray-800">
                                        <div className="flex items-center gap-2">
                                            <FaClipboardList className="text-gray-300 group-hover:text-[#1A2A80] transition-colors" />
                                            {sub.nama_sub_kegiatan}
                                        </div>
                                      </td>
                                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap text-xs">
                                        <div className="flex items-center gap-2">
                                            <FaCalendarAlt className="text-gray-400"/> 
                                            {formatDateRange(sub.tanggal_mulai, sub.tanggal_selesai)}
                                        </div>
                                      </td>
                                      <td className="px-4 py-3 text-center">
                                        <span className={`px-2.5 py-1 text-[10px] font-bold rounded-full uppercase tracking-wide shadow-sm ${statusObj.className}`}>{statusObj.label}</span>
                                      </td>
                                      <td className="px-4 py-3 text-right">
                                        <button 
                                            // onClick sudah dihandle di tr, tapi tetap simpan button agar visual jelas
                                            className="inline-flex items-center gap-1 text-[#1A2A80] bg-blue-50 hover:bg-blue-100 hover:text-blue-900 px-3 py-1.5 rounded-lg transition text-xs font-bold border border-blue-100"
                                        >
                                            <FaInfoCircle /> Info
                                        </button>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <div className="p-8 text-center text-gray-400 italic text-sm">
                            Tidak ada kegiatan di bawah survei/sensus ini.
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

    </div>
  );
};

export default ManajemenKegiatan;