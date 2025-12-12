// src/pages/admin/Penugasan.jsx
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2'; 
import { 
  FaDownload, 
  FaFileUpload, 
  FaPlus, 
  FaChevronDown, 
  FaUsers, 
  FaArrowRight,
  FaClipboardList,
  FaEdit,   
  FaTrash,
  FaSearch, // Icon Search
  FaFilter  // Icon Filter
} from 'react-icons/fa';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const getToken = () => localStorage.getItem('token');

const Penugasan = () => {
  const navigate = useNavigate();

  // --- STATE DATA ---
  const [allPenugasan, setAllPenugasan] = useState([]); // Data Mentah (Flat)
  const [isLoading, setIsLoading] = useState(true);

  // --- STATE FILTER & SEARCH ---
  const [searchTerm, setSearchTerm] = useState('');
  const [filterYear, setFilterYear] = useState('');

  // --- STATE DROPDOWN & CACHE ---
  const [expandedTaskId, setExpandedTaskId] = useState(null); 
  const [membersCache, setMembersCache] = useState({});
  const [loadingMembers, setLoadingMembers] = useState(false);

  // --- STATE IMPORT ---
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  // Helper Format Tanggal
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('id-ID', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric' 
    });
  };

  // 1. Fetch Data
  const fetchPenugasan = async () => {
    setIsLoading(true);
    try {
      const token = getToken();
      const config = { headers: { Authorization: `Bearer ${token}` } };
      
      const [resPenugasan, resKelompok] = await Promise.all([
        axios.get(`${API_URL}/api/penugasan`, config),
        axios.get(`${API_URL}/api/kelompok-penugasan`, config)
      ]);
      
      // Simpan data mentah (flat array)
      setAllPenugasan(resPenugasan.data);

      // Preload Anggota ke Cache
      const membersMap = {};
      if (Array.isArray(resKelompok.data)) {
        resKelompok.data.forEach(member => {
          const cleanMember = {
            ...member,
            nama_lengkap: member.nama_lengkap || member.nama_mitra, 
          };
          const pId = member.id_penugasan;
          if (!membersMap[pId]) {
            membersMap[pId] = [];
          }
          membersMap[pId].push(cleanMember);
        });
      }
      setMembersCache(membersMap);

    } catch (err) {
      console.error("Gagal load data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPenugasan();
  }, []);

  // 2. LOGIKA FILTER & GROUPING (useMemo)
  
  // A. Ambil Tahun yang tersedia dari data
  const availableYears = useMemo(() => {
    const years = new Set();
    allPenugasan.forEach(item => {
      if (item.tanggal_mulai) {
        const y = new Date(item.tanggal_mulai).getFullYear();
        if (!isNaN(y)) years.add(y);
      }
    });
    return [...years].sort((a, b) => b - a);
  }, [allPenugasan]);

  // B. Filter Data -> Lalu Grouping
  const groupedPenugasan = useMemo(() => {
    // 1. Filter Data Mentah
    const filtered = allPenugasan.filter(item => {
      const term = searchTerm.toLowerCase();
      
      // Pencarian berdasarkan Nama Kegiatan (Survei/Sensus), Sub Kegiatan (Kegiatan), atau Pengawas
      const matchSearch = 
        (item.nama_kegiatan || '').toLowerCase().includes(term) ||
        (item.nama_sub_kegiatan || '').toLowerCase().includes(term) ||
        (item.nama_pengawas || '').toLowerCase().includes(term);

      // Filter Tahun
      let matchYear = true;
      if (filterYear) {
        if (item.tanggal_mulai) {
          const y = new Date(item.tanggal_mulai).getFullYear();
          matchYear = y.toString() === filterYear.toString();
        } else {
          matchYear = false;
        }
      }

      return matchSearch && matchYear;
    });

    // 2. Grouping Data Hasil Filter
    return filtered.reduce((acc, item) => {
      const key = item.nama_kegiatan;
      if (!acc[key]) acc[key] = [];
      acc[key].push(item);
      return acc;
    }, {});

  }, [allPenugasan, searchTerm, filterYear]);


  // 3. Handle Klik Baris (Toggle Dropdown)
  const toggleRow = async (id_penugasan) => {
    if (expandedTaskId === id_penugasan) {
      setExpandedTaskId(null);
      return;
    }
    setExpandedTaskId(id_penugasan);

    // Load anggota on demand jika belum ada di cache (fallback)
    if (!membersCache[id_penugasan]) {
      setLoadingMembers(true);
      try {
        const token = getToken();
        const res = await axios.get(`${API_URL}/api/penugasan/${id_penugasan}/anggota`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setMembersCache(prev => ({ ...prev, [id_penugasan]: res.data }));
      } catch (err) {
        setMembersCache(prev => ({ ...prev, [id_penugasan]: [] }));
      } finally {
        setLoadingMembers(false);
      }
    }
  };

  // --- HANDLE ACTIONS ---
  const handleDelete = async (e, id) => {
    e.stopPropagation();
    const result = await Swal.fire({
      title: 'Hapus Penugasan?',
      text: "Data anggota dan plotting mitra di dalamnya akan ikut terhapus permanen.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Ya, Hapus!'
    });

    if (result.isConfirmed) {
      try {
        const token = getToken();
        await axios.delete(`${API_URL}/api/penugasan/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        Swal.fire('Terhapus!', 'Penugasan berhasil dihapus.', 'success');
        fetchPenugasan();
      } catch (err) {
        Swal.fire('Gagal!', 'Terjadi kesalahan saat menghapus.', 'error');
      }
    }
  };

  const handleEdit = (e, id) => {
    e.stopPropagation();
    navigate(`/admin/penugasan/edit/${id}`);
  };

  const handleDownloadTemplate = () => {
    const csvHeader = "nik,kegiatan_id,nama_kegiatan_ref,kode_jabatan,volume_tugas";
    const csvRows = [
      "'3301020304050002,sub1,Persiapan Awal,PML-01,10",
      "'6253761257157635,sub2,Pencacahan,PPL-01,50",
      "'3322122703210001,sub3,Pengolahan,ENT-01,200"
    ];
    const csvContent = "data:text/csv;charset=utf-8," + csvHeader + "\n" + csvRows.join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "template_import_penugasan.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportClick = () => { fileInputRef.current.click(); };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    setUploading(true);
    try {
      const token = getToken();
      const response = await axios.post(`${API_URL}/api/penugasan/import`, formData, {
        headers: { 'Content-Type': 'multipart/form-data', 'Authorization': `Bearer ${token}` }
      });
      const { successCount, failCount } = response.data;
      Swal.fire({
        title: 'Import Selesai',
        html: `<pre style="text-align:left; font-size:12px">✅ Sukses: ${successCount}\n❌ Gagal: ${failCount}</pre>`,
        icon: failCount > 0 ? 'warning' : 'success'
      });
      fetchPenugasan(); 
      setMembersCache({}); 
    } catch (err) {
      Swal.fire('Error', 'Gagal mengimpor data.', 'error');
    } finally {
      setUploading(false);
      e.target.value = null; 
    }
  };

  if (isLoading) return <div className="text-center py-10 text-gray-500">Memuat data penugasan...</div>;

  return (
    <div className="w-full">
      <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".csv, .xlsx, .xls" className="hidden" />

      {/* --- HEADER ACTIONS --- */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <div className="text-gray-500 text-sm">
          Kelola tim dan alokasi mitra untuk setiap kegiatan.
        </div>
        <div className="flex gap-2">
          <button onClick={handleDownloadTemplate} className="flex items-center gap-2 bg-white hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium border border-gray-200 transition shadow-sm">
            <FaDownload /> Template CSV
          </button>
          <button onClick={handleImportClick} disabled={uploading} className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-bold transition shadow-sm disabled:opacity-50">
            <FaFileUpload /> {uploading ? '...' : 'Import Excel'}
          </button>
          <Link to="/admin/penugasan/tambah" className="flex items-center gap-2 bg-[#1A2A80] hover:bg-blue-900 text-white px-4 py-2 rounded-lg text-sm font-bold transition shadow-sm">
            <FaPlus /> Buat Manual
          </Link>
        </div>
      </div>

      {/* --- SEARCH & FILTER SECTION (BARU) --- */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6 flex flex-col md:flex-row gap-4 items-center justify-between">
         <div className="relative w-full md:w-1/2">
            <FaSearch className="absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Cari Survei/Sensus, Kegiatan, atau pengawas..."
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

      {/* --- LIST PENUGASAN (GROUPED & FILTERED) --- */}
      <div className="space-y-6">
        {Object.keys(groupedPenugasan).length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-300 text-gray-400 italic">
            {searchTerm || filterYear ? 'Tidak ditemukan data yang sesuai filter.' : 'Belum ada data penugasan. Silakan import atau buat baru.'}
          </div>
        ) : (
          Object.entries(groupedPenugasan).map(([kegiatanName, subItems]) => (
            <div key={kegiatanName} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              
              {/* Header Grup (Nama Survei/Sensus) */}
              <div className="bg-gray-50/50 px-6 py-4 border-b border-gray-100 flex items-center gap-3">
                 <span className="text-[#1A2A80]"><FaClipboardList size={18} /></span>
                 <h2 className="text-lg font-bold text-gray-800">{kegiatanName}</h2>
                 <span className="text-xs font-medium bg-white text-gray-600 border border-gray-200 px-2 py-0.5 rounded-full ml-auto">
                    {subItems.length} Tim
                 </span>
              </div>

              {/* List Kegiatan */}
              <div className="divide-y divide-gray-100">
                {subItems.map((task) => {
                  const isOpen = expandedTaskId === task.id_penugasan;
                  const members = membersCache[task.id_penugasan] || [];
                  const membersCount = members.length;
                  
                  return (
                    <div key={task.id_penugasan} className="group">
                      
                      {/* Baris Utama */}
                      <div 
                        onClick={() => toggleRow(task.id_penugasan)} 
                        className={`px-6 py-4 cursor-pointer transition-colors flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 ${isOpen ? 'bg-blue-50/40' : 'hover:bg-gray-50'}`}
                      >
                        {/* Kiri: Info Kegiatan */}
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-1">
                            <div className={`p-1 rounded-full transition-transform duration-200 ${isOpen ? 'rotate-180 text-[#1A2A80] bg-blue-100' : 'text-gray-400'}`}>
                                <FaChevronDown size={10} />
                            </div>
                            <h3 className={`font-bold text-sm ${isOpen ? 'text-[#1A2A80]' : 'text-gray-700'}`}>
                                {task.nama_sub_kegiatan}
                            </h3>
                          </div>
                          
                          <div className="pl-7 flex flex-wrap gap-x-6 gap-y-1 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              📅 {formatDate(task.tanggal_mulai)} - {formatDate(task.tanggal_selesai)}
                            </span>
                            <span className="flex items-center gap-1">
                              👤 Pengawas: <span className="font-medium text-gray-700">{task.nama_pengawas}</span>
                            </span>
                          </div>
                        </div>

                        {/* Kanan: Info Anggota & Tombol Aksi */}
                        <div className="flex items-center gap-4 min-w-fit">
                            <div className="text-xs font-medium text-gray-400 group-hover:text-[#1A2A80] transition-colors flex items-center gap-2">
                                <FaUsers /> {membersCount} Anggota
                            </div>

                            {/* Tombol Aksi (Edit & Hapus) */}
                            <div className="flex items-center gap-1 border-l pl-4 border-gray-200">
                                <button onClick={(e) => handleEdit(e, task.id_penugasan)} className="p-2 text-indigo-500 hover:bg-indigo-100 rounded-full transition" title="Edit Penugasan">
                                    <FaEdit size={14} />
                                </button>
                                <button onClick={(e) => handleDelete(e, task.id_penugasan)} className="p-2 text-red-500 hover:bg-red-100 rounded-full transition" title="Hapus Penugasan">
                                    <FaTrash size={14} />
                                </button>
                            </div>
                        </div>
                      </div>
                      
                      {/* Konten Detail (Accordion) */}
                      {isOpen && (
                        <div className="bg-gray-50/30 px-6 py-5 border-t border-gray-100 text-sm animate-fade-in-down pl-6 sm:pl-14">
                           <div className="flex justify-between items-center mb-4">
                                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Daftar Anggota Tim:</h4>
                                <Link 
                                    to={`/admin/penugasan/detail/${task.id_penugasan}`} 
                                    className="text-[#1A2A80] font-bold text-xs hover:underline flex items-center gap-1 bg-white px-3 py-1.5 rounded border border-gray-200 shadow-sm hover:bg-blue-50 transition"
                                >
                                    Kelola Tim & Print SPK <FaArrowRight size={10} />
                                </Link>
                           </div>

                           {loadingMembers ? (
                             <p className="text-gray-400 italic text-center py-4">Memuat data anggota...</p>
                           ) : (
                             members.length === 0 ? (
                               <div className="text-center py-6 bg-white rounded border border-dashed border-gray-200 text-gray-400 text-xs">
                                 Belum ada anggota di tim ini.
                               </div>
                             ) : (
                               <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                 {members.map((m, idx) => (
                                   <li key={m.id_mitra || idx} className="flex items-center gap-3 bg-white px-3 py-2.5 rounded-lg border border-gray-200 shadow-sm">
                                     <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 text-xs font-bold">
                                        {m.nama_lengkap ? m.nama_lengkap.charAt(0) : '?'}
                                     </div>
                                     <div className="overflow-hidden w-full">
                                        <div className="flex justify-between items-center w-full">
                                            <p className="text-gray-700 font-bold text-xs truncate">
                                                {m.nama_lengkap || m.nama_mitra || 'Nama Tidak Tersedia'}
                                            </p>
                                            {m.volume_tugas > 0 && (
                                                <span className="text-[10px] bg-blue-50 text-blue-600 px-1.5 rounded border border-blue-100">
                                                    Vol: {m.volume_tugas}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs text-gray-400 truncate">
                                            {m.nama_jabatan || '-'}
                                        </p>
                                     </div>
                                   </li>
                                 ))}
                               </ul>
                             )
                           )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Penugasan;