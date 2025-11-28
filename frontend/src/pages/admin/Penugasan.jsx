// src/pages/admin/Penugasan.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
// 1. IMPORT SEMUA ICON YANG DIBUTUHKAN
import { 
  FaDownload, 
  FaFileUpload, 
  FaPlus, 
  FaChevronDown, 
  FaUsers, 
  FaArrowRight,
  FaClipboardList
} from 'react-icons/fa';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const getToken = () => localStorage.getItem('token');

const Penugasan = () => {
  // Data Utama
  const [groupedPenugasan, setGroupedPenugasan] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  // State untuk Dropdown & Cache Anggota
  const [expandedTaskId, setExpandedTaskId] = useState(null); 
  const [membersCache, setMembersCache] = useState({});
  // loadingMembers tidak terlalu dibutuhkan lagi karena sudah preload, tapi dijaga untuk fallback
  const [loadingMembers, setLoadingMembers] = useState(false);

  // State untuk Import
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

  // 1. Fetch & Group Data Penugasan + PRELOAD Anggota
  const fetchPenugasan = async () => {
    setIsLoading(true);
    try {
      const token = getToken();
      const config = { headers: { Authorization: `Bearer ${token}` } };
      
      // PERUBAHAN: Panggil 2 endpoint sekaligus (Paralel)
      const [resPenugasan, resKelompok] = await Promise.all([
        axios.get(`${API_URL}/api/penugasan`, config),
        axios.get(`${API_URL}/api/kelompok-penugasan`, config)
      ]);
      
      // A. Grouping Data Penugasan (Utama)
      const grouped = resPenugasan.data.reduce((acc, item) => {
        const key = item.nama_kegiatan;
        if (!acc[key]) acc[key] = [];
        acc[key].push(item);
        return acc;
      }, {});

      setGroupedPenugasan(grouped);

      // B. Grouping Data Anggota (Preload ke Cache)
      // Kita mapping array flat dari backend menjadi object { id_penugasan: [array_anggota] }
      const membersMap = {};
      
      if (Array.isArray(resKelompok.data)) {
        resKelompok.data.forEach(member => {
          // Normalisasi nama field (antisipasi beda nama field di backend)
          const cleanMember = {
            ...member,
            // Gunakan nama_mitra jika nama_lengkap kosong (fallback)
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

  // 2. Handle Klik Baris (Toggle Dropdown)
  const toggleRow = async (id_penugasan) => {
    if (expandedTaskId === id_penugasan) {
      setExpandedTaskId(null);
      return;
    }
    setExpandedTaskId(id_penugasan);

    // Cek cache: Jika data SUDAH ada (dari preload), tidak perlu fetch lagi
    if (!membersCache[id_penugasan]) {
      // Fallback: Jika ternyata kosong, baru fetch manual (opsional)
      setLoadingMembers(true);
      try {
        const token = getToken();
        const res = await axios.get(`${API_URL}/api/penugasan/${id_penugasan}/anggota`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setMembersCache(prev => ({ ...prev, [id_penugasan]: res.data }));
      } catch (err) {
        // Jika 404/kosong, set array kosong agar loading stop
        setMembersCache(prev => ({ ...prev, [id_penugasan]: [] }));
      } finally {
        setLoadingMembers(false);
      }
    }
  };

  // --- DOWNLOAD TEMPLATE ---
  const handleDownloadTemplate = () => {
    const csvHeader = "nik,kegiatan_id,nama_kegiatan_ref,kode_jabatan";
    const csvRows = [
      "'3301020304050002,sub1,Persiapan Awal,PML-01",
      "'6253761257157635,sub2,Pencacahan,PPL-01",
      "'3322122703210001,sub3,Pengolahan,ENT-01"
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

  // --- IMPORT EXCEL/CSV ---
  const handleImportClick = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.name.match(/\.(xlsx|xls|csv)$/)) {
      alert("Harap upload file Excel (.xlsx) atau CSV (.csv).");
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    setUploading(true);
    try {
      const token = getToken();
      const response = await axios.post(`${API_URL}/api/penugasan/import`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        }
      });

      const { successCount, failCount, errors } = response.data;
      let msg = `Import Selesai!\n✅ Sukses: ${successCount}\n❌ Gagal: ${failCount}`;
      if (errors && errors.length > 0) {
        msg += `\n\nDetail Error (3 Teratas):\n` + errors.slice(0, 3).join('\n') + (errors.length > 3 ? '\n...' : '');
      }
      alert(msg);
      fetchPenugasan(); 
      // Reset cache agar data baru termuat
      setMembersCache({}); 

    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Gagal mengimpor data.");
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
          Kelola tim dan alokasi mitra untuk setiap sub-kegiatan.
        </div>
        
        <div className="flex gap-2">
          <button 
            onClick={handleDownloadTemplate} 
            className="flex items-center gap-2 bg-white hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium border border-gray-200 transition shadow-sm"
          >
            <FaDownload /> Template CSV
          </button>
          <button 
            onClick={handleImportClick} 
            disabled={uploading} 
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-bold transition shadow-sm disabled:opacity-50"
          >
            <FaFileUpload /> {uploading ? '...' : 'Import Excel'}
          </button>
          <Link 
            to="/admin/penugasan/tambah" 
            className="flex items-center gap-2 bg-[#1A2A80] hover:bg-blue-900 text-white px-4 py-2 rounded-lg text-sm font-bold transition shadow-sm"
          >
            <FaPlus /> Buat Manual
          </Link>
        </div>
      </div>

      {/* --- LIST PENUGASAN (GROUPED) --- */}
      <div className="space-y-6">
        {Object.keys(groupedPenugasan).length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-300 text-gray-400 italic">
            Belum ada data penugasan. Silakan import atau buat baru.
          </div>
        ) : (
          Object.entries(groupedPenugasan).map(([kegiatanName, subItems]) => (
            <div key={kegiatanName} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              
              {/* Header Grup (Nama Kegiatan Utama) */}
              <div className="bg-gray-50/50 px-6 py-4 border-b border-gray-100 flex items-center gap-3">
                 <span className="text-[#1A2A80]"><FaClipboardList size={18} /></span>
                 <h2 className="text-lg font-bold text-gray-800">{kegiatanName}</h2>
                 <span className="text-xs font-medium bg-white text-gray-600 border border-gray-200 px-2 py-0.5 rounded-full ml-auto">
                    {subItems.length} Tim
                 </span>
              </div>

              {/* List Sub Kegiatan */}
              <div className="divide-y divide-gray-100">
                {subItems.map((task) => {
                  const isOpen = expandedTaskId === task.id_penugasan;
                  // Ambil data dari cache yang sudah di-preload
                  const members = membersCache[task.id_penugasan] || [];
                  const membersCount = members.length;
                  
                  return (
                    <div key={task.id_penugasan} className="group">
                      
                      {/* Baris Utama (Klik untuk Expand) */}
                      <div 
                        onClick={() => toggleRow(task.id_penugasan)} 
                        className={`px-6 py-4 cursor-pointer transition-colors flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 ${isOpen ? 'bg-blue-50/40' : 'hover:bg-gray-50'}`}
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-1">
                            {/* Icon Panah Dropdown */}
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

                        {/* DISINI PERUBAHANNYA: Menggunakan membersCount langsung tanpa tanda tanya */}
                        <div className="text-xs font-medium text-gray-400 group-hover:text-[#1A2A80] transition-colors flex items-center gap-2 min-w-fit">
                           {isOpen ? 'Tutup Detail' : (
                               <>
                                 <FaUsers /> {membersCount} Anggota
                               </>
                           )}
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
                                    Kelola Tim <FaArrowRight size={10} />
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
                                   // Gunakan m.id_mitra atau kombinasi index sebagai key
                                   <li key={m.id_mitra || idx} className="flex items-center gap-3 bg-white px-3 py-2.5 rounded-lg border border-gray-200 shadow-sm">
                                     <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 text-xs font-bold">
                                        {m.nama_lengkap ? m.nama_lengkap.charAt(0) : '?'}
                                     </div>
                                     <div className="overflow-hidden">
                                        <p className="text-gray-700 font-bold text-xs truncate">
                                            {m.nama_lengkap || m.nama_mitra || 'Nama Tidak Tersedia'}
                                        </p>
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