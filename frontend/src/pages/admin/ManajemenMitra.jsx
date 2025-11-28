import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom'; 
import * as XLSX from 'xlsx'; 
import Swal from 'sweetalert2';
import { 
  FaDownload, 
  FaFileUpload, 
  FaTrash, 
  FaChevronRight,
  FaUserTie,
  FaCalendarAlt, 
  FaList,
  FaBriefcase // Icon tambahan untuk penanda tugas
} from 'react-icons/fa';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const ManajemenMitra = () => {
  // Data Utama
  const [mitraList, setMitraList] = useState([]);
  
  // State View Mode
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'period'
  const [periodData, setPeriodData] = useState({}); 
  const [loadingPeriod, setLoadingPeriod] = useState(false);

  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  
  const fileInputRef = useRef(null); 
  const navigate = useNavigate(); 

  // 1. Fetch Data Mitra
  const fetchMitra = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/mitra`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMitraList(response.data);
    } catch (err) {
      console.error("Gagal memuat data:", err);
      setError("Gagal memuat data mitra.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMitra();
  }, []);

  // 2. Fetch & Group Data Periode
  const fetchPeriodData = async () => {
    if (Object.keys(periodData).length > 0) return; 
    
    setLoadingPeriod(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const [resSub, resPenugasan, resKelompok] = await Promise.all([
        axios.get(`${API_URL}/api/subkegiatan`, { headers }),
        axios.get(`${API_URL}/api/penugasan`, { headers }),
        axios.get(`${API_URL}/api/kelompok-penugasan`, { headers })
      ]);

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

            // Simpan info tugas spesifik + ID Mitra untuk lookup nanti
            grouped[periodeKey].push({
                id_mitra: k.id_mitra,
                tugas: taskInfo.nama_sub,
                jabatan: k.kode_jabatan 
            });
        }
      });

      setPeriodData(grouped);

    } catch (err) {
      console.error("Gagal grouping:", err);
      Swal.fire("Error", "Gagal memuat data periode.", "error");
    } finally {
      setLoadingPeriod(false);
    }
  };

  const formatPeriodeLabel = (periodeStr) => {
    if (!periodeStr) return 'Periode Tidak Diketahui';
    const parts = periodeStr.split('-');
    if (parts.length === 2) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10);
      if (!isNaN(year) && !isNaN(month)) {
        return new Date(year, month - 1).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
      }
    }
    return periodeStr;
  };

  const handleExport = () => { 
    const dataToExport = mitraList.map(m => ({
      "Nama Lengkap": m.nama_lengkap, "NIK": m.nik, "Alamat": m.alamat,
      "No HP": m.no_hp, "Email": m.email, "Bank": m.nama_bank, "No Rekening": m.no_rekening
    }));
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Data Mitra");
    XLSX.writeFile(workbook, "Data_Mitra_Sikinerja.xlsx");
    Swal.fire({ icon: 'success', title: 'Export Berhasil', timer: 2000, showConfirmButton: false });
  };

  const handleImportClick = () => fileInputRef.current.click();
  
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    setUploading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_URL}/api/mitra/import`, formData, {
        headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${token}` }
      });
      Swal.fire({ title: 'Import Selesai', text: response.data.message, icon: 'success' });
      fetchMitra(); 
    } catch (err) { 
      Swal.fire('Gagal', err.response?.data?.message || 'Terjadi kesalahan.', 'error');
    } finally { 
      setUploading(false); 
      e.target.value = null; 
    }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    const result = await Swal.fire({
      title: 'Hapus Mitra?', text: "Data akan hilang permanen!", icon: 'warning', showCancelButton: true, confirmButtonText: 'Ya, Hapus!', cancelButtonText: 'Batal', confirmButtonColor: '#d33'
    });
    if (result.isConfirmed) {
      try {
          const token = localStorage.getItem('token');
          await axios.delete(`${API_URL}/api/mitra/${id}`, { headers: { Authorization: `Bearer ${token}` } });
          setMitraList(prev => prev.filter(m => m.id !== id));
          Swal.fire('Terhapus!', 'Data mitra berhasil dihapus.', 'success');
      } catch (err) { 
          Swal.fire('Gagal!', 'Gagal menghapus mitra.', 'error');
      }
    }
  };

  // --- RENDER ---
  if (loading) return <div className="text-center py-10 text-gray-500">Memuat data...</div>;

  return (
    <div className="w-full pb-20">
      
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <div className="text-gray-500 text-sm">
            Database seluruh mitra statistik yang terdaftar.
        </div>

        <div className="flex flex-wrap gap-2 justify-end">
          {/* SWITCH BUTTON */}
          <button 
            onClick={() => {
                if (viewMode === 'list') {
                    setViewMode('period');
                    fetchPeriodData(); 
                } else {
                    setViewMode('list');
                }
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition shadow-sm border ${
                viewMode === 'period' 
                ? 'bg-[#1A2A80] text-white border-[#1A2A80]' 
                : 'bg-white text-gray-600 hover:bg-gray-50 border-gray-200'
            }`}
          >
            {viewMode === 'list' ? <><FaCalendarAlt /> Tampilkan Periode Mitra</> : <><FaList /> Tampilkan Daftar Biasa</>}
          </button>

          <button onClick={handleExport} className="flex items-center gap-2 bg-white hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium border border-gray-200 transition shadow-sm">
            <FaDownload /> Export
          </button>
          
          <button onClick={handleImportClick} disabled={uploading} className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-bold transition shadow-sm disabled:opacity-50">
            <FaFileUpload /> {uploading ? '...' : 'Import'}
          </button>
          <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".xlsx, .xls" className="hidden" />
        </div>
      </div>
      
      {error && <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6 border border-red-100">{error}</div>}

      {/* --- KONTEN UTAMA --- */}
      
      {/* MODE 1: DAFTAR BIASA */}
      {viewMode === 'list' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
                <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Nama Lengkap</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">NIK</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Kontak</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Bank</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase">Aksi</th>
                </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
                {mitraList.length === 0 ? (
                    <tr><td colSpan="5" className="px-6 py-12 text-center text-gray-400 italic">Belum ada data mitra.</td></tr>
                ) : (
                    mitraList.map((mitra) => (
                    <tr key={mitra.id} onClick={() => navigate(`/admin/mitra/${mitra.id}`)} className="hover:bg-blue-50/50 cursor-pointer transition-colors group">
                        <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-50 text-[#1A2A80] rounded-full"><FaUserTie /></div>
                                <div>
                                    <div className="text-sm font-bold text-gray-900 group-hover:text-[#1A2A80] transition">{mitra.nama_lengkap}</div>
                                    <div className="text-xs text-gray-500">{mitra.email}</div>
                                </div>
                            </div>
                        </td>
                        <td className="px-6 py-4 text-xs font-mono text-gray-500">{mitra.nik}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{mitra.no_hp}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">{mitra.nama_bank} - <span className="font-mono text-gray-500">{mitra.no_rekening}</span></td>
                        <td className="px-6 py-4 text-right">
                            <button onClick={(e) => handleDelete(mitra.id, e)} className="text-red-400 hover:text-red-600 p-2 rounded-full hover:bg-red-50 transition">
                                <FaTrash />
                            </button>
                        </td>
                    </tr>
                    ))
                )}
            </tbody>
            </table>
        </div>
      )}

      {/* MODE 2: PERIODE VIEW (GAYA TABEL) */}
      {viewMode === 'period' && (
        <div className="space-y-8">
            {loadingPeriod ? (
                <div className="text-center py-12 text-gray-500 bg-white rounded-xl border border-gray-100">Memuat data periode...</div>
            ) : Object.keys(periodData).length === 0 ? (
                <div className="text-center py-12 text-gray-400 italic bg-white rounded-xl border border-gray-100">Belum ada riwayat periode.</div>
            ) : (
                Object.keys(periodData).sort().reverse().map(periodeKey => {
                    const mitraInPeriod = periodData[periodeKey];
                    
                    return (
                        <div key={periodeKey} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                            
                            {/* TAG PERIODE (HEADER) */}
                            <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex items-center gap-3">
                                <div className="bg-[#1A2A80] text-white p-2 rounded-lg">
                                    <FaCalendarAlt />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-800 text-lg leading-none">
                                        {formatPeriodeLabel(periodeKey)}
                                    </h3>
                                    <span className="text-xs text-gray-500 font-medium">
                                        Total: {mitraInPeriod.length} Mitra Bertugas
                                    </span>
                                </div>
                            </div>

                            {/* TABEL MITRA (SAMA PERSIS DENGAN MODE LIST) */}
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-white">
                                    <tr>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Nama & Tugas</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">NIK</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Kontak</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Bank</th>
                                    <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {mitraInPeriod.map((item, idx) => {
                                        // Cari data lengkap mitra dari mitraList
                                        const fullMitra = mitraList.find(m => m.id === item.id_mitra) || {};
                                        
                                        return (
                                            <tr key={idx} onClick={() => navigate(`/admin/mitra/${item.id_mitra}`)} className="hover:bg-blue-50/30 cursor-pointer transition-colors group">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-blue-100 text-[#1A2A80] flex items-center justify-center text-xs font-bold">
                                                            {(fullMitra.nama_lengkap || '?').charAt(0)}
                                                        </div>
                                                        <div>
                                                            <div className="text-sm font-bold text-gray-900 group-hover:text-[#1A2A80] transition">
                                                                {fullMitra.nama_lengkap || 'Mitra Dihapus'}
                                                            </div>
                                                            {/* Info Tugas Spesifik di Periode Ini */}
                                                            <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                                                                <FaBriefcase size={10} /> {item.tugas} ({item.jabatan || 'Anggota'})
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-xs font-mono text-gray-500">
                                                    {fullMitra.nik || '-'}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-600">
                                                    {fullMitra.no_hp || '-'}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-900">
                                                    {fullMitra.nama_bank || '-'} 
                                                    <span className="font-mono text-gray-500 block text-xs">{fullMitra.no_rekening}</span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <span className="text-gray-300 hover:text-[#1A2A80]">
                                                        <FaChevronRight />
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    );
                })
            )}
        </div>
      )}

    </div>
  );
};

export default ManajemenMitra;