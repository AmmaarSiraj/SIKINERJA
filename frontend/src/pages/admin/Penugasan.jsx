import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const getToken = () => localStorage.getItem('token');

const Penugasan = () => {
  // Data Utama
  const [groupedPenugasan, setGroupedPenugasan] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  // State untuk Dropdown & Cache Anggota
  const [expandedTaskId, setExpandedTaskId] = useState(null); 
  const [membersCache, setMembersCache] = useState({});
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

  // 1. Fetch & Group Data Penugasan
  const fetchPenugasan = async () => {
    setIsLoading(true);
    try {
      const token = getToken();
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const response = await axios.get(`${API_URL}/api/penugasan`, config);
      
      const grouped = response.data.reduce((acc, item) => {
        const key = item.nama_kegiatan;
        if (!acc[key]) acc[key] = [];
        acc[key].push(item);
        return acc;
      }, {});

      setGroupedPenugasan(grouped);
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

    if (!membersCache[id_penugasan]) {
      setLoadingMembers(true);
      try {
        const token = getToken();
        const res = await axios.get(`${API_URL}/api/penugasan/${id_penugasan}/anggota`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setMembersCache(prev => ({ ...prev, [id_penugasan]: res.data }));
      } catch (err) {
        console.error("Gagal ambil anggota:", err);
      } finally {
        setLoadingMembers(false);
      }
    }
  };

  // --- LOGIC BARU: DOWNLOAD TEMPLATE CSV ---
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

  // --- LOGIC BARU: IMPORT EXCEL/CSV ---
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
      setMembersCache({}); 

    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Gagal mengimpor data.");
    } finally {
      setUploading(false);
      e.target.value = null; 
    }
  };

  if (isLoading) return <div className="p-8 text-center text-gray-500">Memuat data penugasan...</div>;

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".csv, .xlsx, .xls" className="hidden" />

      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Manajemen Penugasan</h1>
          <p className="text-gray-500 mt-1">Kelola tim dan import penugasan massal di sini.</p>
        </div>
        
        <div className="flex gap-2">
          <button onClick={handleDownloadTemplate} className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded shadow-sm border border-gray-300 text-sm font-medium transition flex items-center gap-2">
            📥 Template CSV
          </button>
          <button onClick={handleImportClick} disabled={uploading} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded shadow text-sm font-bold transition flex items-center gap-2 disabled:opacity-50">
            {uploading ? 'Mengupload...' : '📤 Import Penugasan'}
          </button>
          <Link to="/admin/penugasan/tambah" className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded shadow text-sm font-bold transition flex items-center gap-2">
            + Buat Manual
          </Link>
        </div>
      </div>

      <div className="space-y-8">
        {Object.keys(groupedPenugasan).length === 0 ? (
          <div className="text-center py-10 bg-gray-50 rounded border border-dashed text-gray-400">
            Belum ada penugasan. Silakan import atau buat baru.
          </div>
        ) : (
          Object.entries(groupedPenugasan).map(([kegiatanName, subItems]) => (
            <div key={kegiatanName} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex items-center gap-3">
                 <h2 className="text-lg font-bold text-gray-800">{kegiatanName}</h2>
                 <span className="text-xs font-medium bg-gray-200 text-gray-600 px-2 py-1 rounded-full">{subItems.length} Sub Kegiatan</span>
              </div>

              <div className="divide-y divide-gray-100">
                {subItems.map((task) => {
                  const isOpen = expandedTaskId === task.id_penugasan;
                  const members = membersCache[task.id_penugasan] || [];
                  return (
                    <div key={task.id_penugasan} className="group">
                      <div onClick={() => toggleRow(task.id_penugasan)} className={`px-6 py-4 cursor-pointer transition flex items-center justify-between hover:bg-indigo-50 ${isOpen ? 'bg-indigo-50' : 'bg-white'}`}>
                        <div className="flex-1">
                          <h3 className="font-semibold text-sm text-gray-800">{task.nama_sub_kegiatan}</h3>
                          
                          {/* --- UPDATED: Menampilkan Tanggal di Sini --- */}
                          <div className="text-xs text-gray-500 mt-1 flex flex-col sm:flex-row sm:gap-4 gap-1">
                            <span className="flex items-center gap-1 text-indigo-600 font-medium">
                              📅 {formatDate(task.tanggal_mulai)} - {formatDate(task.tanggal_selesai)}
                            </span>
                            <span>👤 Pengawas: {task.nama_pengawas}</span>
                            <span>📊 Kapasitas: {task.jumlah_max_mitra} Orang</span>
                          </div>
                          {/* ------------------------------------------ */}
                        
                        </div>
                        <div className="text-xs text-gray-500">
                           {membersCache[task.id_penugasan] ? `${members.length} Anggota` : 'Klik untuk lihat'}
                        </div>
                      </div>
                      
                      {isOpen && (
                        <div className="bg-gray-50 px-6 py-4 border-t border-gray-100 text-sm">
                           {loadingMembers ? 'Memuat...' : (
                             members.length === 0 ? 'Belum ada anggota.' : (
                               <ul className="list-disc pl-5">
                                 {members.map(m => (
                                   <li key={m.id_mitra}>
                                     {m.nama_lengkap} <span className="text-gray-400">({m.nama_jabatan})</span>
                                   </li>
                                 ))}
                               </ul>
                             )
                           )}
                           <div className="mt-2 text-right">
                             <Link to={`/admin/penugasan/detail/${task.id_penugasan}`} className="text-indigo-600 font-bold text-xs hover:underline">Kelola Tim &rarr;</Link>
                           </div>
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