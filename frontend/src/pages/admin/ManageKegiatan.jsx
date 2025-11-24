// src/pages/admin/ManageKegiatan.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
// 1. IMPORT ICON
import { 
  FaDownload, 
  FaFileUpload, 
  FaPlus, 
  FaEdit, 
  FaTrash, 
  FaChevronDown, 
  FaChevronUp,
  FaInfoCircle
} from 'react-icons/fa';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const ManageKegiatan = () => {
  // --- STATE ---
  const [kegiatan, setKegiatan] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // State untuk Accordion / Dropdown
  const [expandedRow, setExpandedRow] = useState(null); 
  const [subKegiatanMap, setSubKegiatanMap] = useState({}); 
  const [loadingSub, setLoadingSub] = useState(false);

  // State untuk Import
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const navigate = useNavigate();

  // --- FUNGSI DATA ---

  const fetchKegiatan = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token'); 
      if (!token) throw new Error('No auth token found. Please login.');

      const response = await axios.get(`${API_URL}/api/kegiatan`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setKegiatan(response.data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKegiatan();
  }, []);

  // --- HANDLERS UTAMA ---

  const handleDelete = async (e, id) => {
    e.stopPropagation(); 
    if (!window.confirm('Apakah Anda yakin ingin menghapus Survei/Sensus ini beserta seluruh sub kegiatannya?')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/api/kegiatan/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setKegiatan(prev => prev.filter(item => item.id !== id));
      
      const newSubMap = { ...subKegiatanMap };
      delete newSubMap[id];
      setSubKegiatanMap(newSubMap);
      
      alert('Survei/Sensus berhasil dihapus');
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    }
  };

  const handleRowClick = async (id) => {
    if (expandedRow === id) {
      setExpandedRow(null); 
      return;
    }

    setExpandedRow(id); 

    if (!subKegiatanMap[id]) {
      setLoadingSub(true);
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`${API_URL}/api/subkegiatan/kegiatan/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        setSubKegiatanMap(prev => ({ ...prev, [id]: res.data }));
      } catch (err) {
        console.error("Gagal ambil sub kegiatan:", err);
      } finally {
        setLoadingSub(false);
      }
    }
  };

  const handleSubRowClick = (subId) => {
    navigate(`/admin/manage-kegiatan/detail/${subId}`);
  };

  // --- HANDLERS IMPORT ---

  const handleDownloadTemplate = () => {
    const csvHeader = "nama_kegiatan,nama_sub_kegiatan,deskripsi,periode,tanggal_mulai,tanggal_selesai,open_req,close_req";
    const csvRows = [
      "Sensus Penduduk 2030,Persiapan Lapangan,Rapat koordinasi,Agustus 2030,2030-08-01,2030-08-15,2030-07-01,2030-07-31",
      "Sensus Penduduk 2030,Pelaksanaan,Pencacahan lapangan,September 2030,2030-09-01,2030-09-30,2030-08-01,2030-08-25"
    ];
    
    const csvContent = "data:text/csv;charset=utf-8," + csvHeader + "\n" + csvRows.join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "template_import_kegiatan.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportClick = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    setUploading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_URL}/api/subkegiatan/import`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        }
      });

      const { successCount, failCount, createdKegiatanCount, errors } = response.data;
      
      let msg = `Import Selesai!\n✅ Sub Kegiatan Masuk: ${successCount}`;
      if (createdKegiatanCount > 0) msg += `\n🆕 Kegiatan Baru Dibuat: ${createdKegiatanCount}`;
      msg += `\n❌ Gagal: ${failCount}`;
      
      if (errors && errors.length > 0) {
        msg += `\n\nDetail Error (3 Teratas):\n` + errors.slice(0, 3).join('\n');
      }
      alert(msg);
      
      setSubKegiatanMap({}); 
      setExpandedRow(null);
      fetchKegiatan(); 

    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Gagal mengimpor data.");
    } finally {
      setUploading(false);
      e.target.value = null;
    }
  };

  // --- HELPER RENDER BADGE ---

  const renderRecruitmentBadge = (status) => {
    switch (status) {
      case 'open':
        return <span className="px-2.5 py-0.5 text-[10px] font-bold text-green-700 bg-green-50 rounded-full border border-green-200 uppercase tracking-wide">Open</span>;
      case 'closed':
        return <span className="px-2.5 py-0.5 text-[10px] font-bold text-red-700 bg-red-50 rounded-full border border-red-200 uppercase tracking-wide">Closed</span>;
      case 'pending':
        return <span className="px-2.5 py-0.5 text-[10px] font-bold text-yellow-700 bg-yellow-50 rounded-full border border-yellow-200 uppercase tracking-wide">Soon</span>;
      default:
        return <span className="px-2.5 py-0.5 text-[10px] font-bold text-gray-500 bg-gray-100 rounded-full uppercase tracking-wide">-</span>;
    }
  };

  const renderStatusBadge = (status) => {
    return status === 'done' 
      ? <span className="px-2.5 py-0.5 text-[10px] font-bold text-white bg-green-600 rounded-full shadow-sm">Selesai</span>
      : <span className="px-2.5 py-0.5 text-[10px] font-bold text-white bg-yellow-500 rounded-full shadow-sm">Proses</span>;
  };

  // --- RENDER UTAMA ---

  if (loading) return <div className="text-center py-10 text-gray-500">Memuat data...</div>;
  if (error) return <div className="text-center py-10 text-red-600">Error: {error}</div>;

  return (
    <div className="w-full">
      {/* Input Hidden untuk Upload */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        accept=".csv, .xlsx, .xls" 
        className="hidden" 
      />

      {/* --- HEADER & TOMBOL --- */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <div className="text-gray-500 text-sm">
          Kelola daftar kegiatan survei/sensus dan sub-kegiatannya.
        </div>
        
        <div className="flex gap-2">
          <button 
            onClick={handleDownloadTemplate}
            className="flex items-center gap-2 bg-white hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium border border-gray-200 transition shadow-sm"
          >
            <FaDownload /> Template
          </button>
          <button 
            onClick={handleImportClick}
            disabled={uploading}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-bold transition shadow-sm disabled:opacity-50"
          >
            <FaFileUpload /> {uploading ? '...' : 'Import'}
          </button>
          <Link
            to="/admin/manage-kegiatan/tambah"
            className="flex items-center gap-2 bg-[#1A2A80] hover:bg-blue-900 text-white px-4 py-2 rounded-lg text-sm font-bold transition shadow-sm"
          >
            <FaPlus /> Tambah Baru
          </Link>
        </div>
      </div>

      {/* --- LIST KEGIATAN (ACCORDION STYLE) --- */}
      <div className="space-y-4">
        {kegiatan.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-300">
            <p className="text-gray-500 font-medium">Belum ada data Survei/Sensus.</p>
          </div>
        ) : (
          kegiatan.map((item) => {
            const isExpanded = expandedRow === item.id;
            
            return (
              <div 
                key={item.id} 
                className={`bg-white rounded-xl shadow-sm border transition-all duration-200 overflow-hidden ${isExpanded ? 'border-blue-300 ring-1 ring-blue-100' : 'border-gray-100 hover:border-blue-200'}`}
              >
                {/* HEADER CARD (Klik untuk Expand) */}
                <div 
                  onClick={() => handleRowClick(item.id)}
                  className={`px-6 py-4 cursor-pointer flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-colors ${isExpanded ? 'bg-blue-50/30' : 'bg-white hover:bg-gray-50'}`}
                >
                  <div className="flex items-center gap-4 flex-1">
                    {/* Icon Toggle Panah */}
                    <div className={`p-2 rounded-full transition-transform duration-200 ${isExpanded ? 'bg-blue-100 text-[#1A2A80]' : 'text-gray-400 bg-gray-100'}`}>
                       {isExpanded ? <FaChevronUp size={12} /> : <FaChevronDown size={12} />}
                    </div>
                    
                    {/* Info Utama Kegiatan */}
                    <div>
                      <h3 className={`text-base font-bold transition-colors ${isExpanded ? 'text-[#1A2A80]' : 'text-gray-800'}`}>
                        {item.nama_kegiatan}
                      </h3>
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-1 max-w-md">
                        {item.deskripsi || 'Tidak ada deskripsi.'}
                      </p>
                    </div>
                  </div>

                  {/* Tombol Aksi (Edit/Hapus Induk) */}
                  <div className="flex items-center gap-2 pl-12 md:pl-0">
                    <Link
                      to={`/admin/manage-kegiatan/edit/${item.id}`}
                      className="p-2 text-indigo-600 hover:text-indigo-900 hover:bg-indigo-50 rounded transition"
                      onClick={(e) => e.stopPropagation()}
                      title="Edit Kegiatan"
                    >
                      <FaEdit />
                    </Link>
                    <button
                      onClick={(e) => handleDelete(e, item.id)}
                      className="p-2 text-red-600 hover:text-red-900 hover:bg-red-50 rounded transition"
                      title="Hapus Kegiatan"
                    >
                      <FaTrash />
                    </button>
                  </div>
                </div>

                {/* EXPANDED CONTENT (Tabel Sub Kegiatan) */}
                {isExpanded && (
                  <div className="bg-gray-50/50 border-t border-gray-100 animate-fade-in-down">
                    {loadingSub && !subKegiatanMap[item.id] ? (
                      <div className="p-6 text-center text-gray-500 text-sm italic">Memuat sub kegiatan...</div>
                    ) : (
                      <>
                        {subKegiatanMap[item.id] && subKegiatanMap[item.id].length > 0 ? (
                          <div className="overflow-x-auto p-4">
                            <table className="w-full text-left text-sm bg-white rounded-lg border border-gray-200 overflow-hidden">
                              <thead className="bg-gray-50 text-gray-500 uppercase text-xs font-bold border-b border-gray-200">
                                <tr>
                                  <th className="px-4 py-3 w-1/3">Nama Sub Kegiatan</th>
                                  <th className="px-4 py-3">Periode</th>
                                  <th className="px-4 py-3 text-center">Rekrutmen</th>
                                  <th className="px-4 py-3 text-center">Status</th>
                                  <th className="px-4 py-3 text-right">Detail</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-100">
                                {subKegiatanMap[item.id].map((sub) => (
                                  <tr 
                                    key={sub.id} 
                                    onClick={() => handleSubRowClick(sub.id)}
                                    className="hover:bg-blue-50 cursor-pointer transition-colors"
                                  >
                                    <td className="px-4 py-3 font-medium text-gray-800">
                                      {sub.nama_sub_kegiatan}
                                      <div className="text-[10px] text-gray-400 font-normal mt-0.5 truncate max-w-[200px]">
                                        {sub.deskripsi}
                                      </div>
                                    </td>
                                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                                      {sub.periode || '-'}
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                      {renderRecruitmentBadge(sub.status_rekrutmen)}
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                      {renderStatusBadge(sub.status)}
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                      <span className="text-[#1A2A80] hover:text-blue-800">
                                        <FaInfoCircle />
                                      </span>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <div className="p-8 text-center">
                            <p className="text-sm text-gray-500 italic mb-3">Tidak ada sub kegiatan.</p>
                            <Link 
                              to={`/admin/manage-kegiatan/edit/${item.id}`}
                              className="inline-flex items-center gap-2 text-[#1A2A80] text-xs font-bold hover:underline bg-blue-50 px-3 py-2 rounded-lg border border-blue-100"
                            >
                              <FaPlus size={10} /> Tambah Sub Kegiatan Manual
                            </Link>
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

export default ManageKegiatan;