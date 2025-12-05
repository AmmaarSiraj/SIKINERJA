// src/pages/admin/ManajemenMitra.jsx
import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom'; 
import * as XLSX from 'xlsx'; 
import Swal from 'sweetalert2';
import { 
  FaDownload, FaFileUpload, FaTrash, FaUserTie,
  FaCalendarAlt, FaList, FaBriefcase, FaCog, FaTimes, FaSave, FaPlus,
  FaFileExcel, FaEdit
} from 'react-icons/fa';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const ManajemenMitra = () => {
  const [mitraList, setMitraList] = useState([]);
  const [viewMode, setViewMode] = useState('list');
  const [periodData, setPeriodData] = useState({});
  const [loadingPeriod, setLoadingPeriod] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  
  // --- STATE UNTUK ATURAN HONOR (TAHUNAN) ---
  const [showModalRule, setShowModalRule] = useState(false);
  const [rules, setRules] = useState([]);
  // Default tahun sekarang
  const [newRule, setNewRule] = useState({ tahun: new Date().getFullYear(), batas_honor: '' });
  const [loadingRules, setLoadingRules] = useState(false);

  const fileInputRef = useRef(null); 
  const navigate = useNavigate(); 

  const fetchMitra = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/mitra`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMitraList(response.data);
    } catch (err) {
      console.error(err);
      setError("Gagal memuat data mitra.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMitra(); }, []);

  // --- FETCH RULES (Backend mengirim field 'tahun') ---
  const fetchRules = async () => {
    setLoadingRules(true);
    try {
        const res = await axios.get(`${API_URL}/api/aturan-periode`);
        setRules(res.data);
    } catch (err) {
        console.error(err);
    } finally {
        setLoadingRules(false);
    }
  };

  const handleOpenRuleModal = () => {
    setShowModalRule(true);
    fetchRules();
  };

  // --- SIMPAN RULE (Format Tahun) ---
  const handleSaveRule = async () => {
    if (!newRule.tahun || !newRule.batas_honor) {
        return Swal.fire("Gagal", "Lengkapi data tahun dan nominal batas honor.", "warning");
    }
    
    // Validasi format tahun 4 digit
    if (!/^\d{4}$/.test(newRule.tahun)) {
        return Swal.fire("Gagal", "Format tahun harus 4 digit angka (contoh: 2025).", "warning");
    }

    try {
        await axios.post(`${API_URL}/api/aturan-periode`, newRule);
        
        // Reset form
        setNewRule({ tahun: new Date().getFullYear(), batas_honor: '' });
        fetchRules();
        Swal.fire("Sukses", "Aturan batas honor tahunan berhasil disimpan.", "success");
    } catch (err) {
        Swal.fire("Gagal", err.response?.data?.error || "Gagal menyimpan.", "error");
    }
  };

  const handleDeleteRule = async (id) => {
    const result = await Swal.fire({
        title: 'Hapus Aturan?', 
        text: "Data ini akan dihapus.", 
        icon: 'warning', 
        showCancelButton: true, 
        confirmButtonColor: '#d33'
    });
    if (result.isConfirmed) {
        try {
            await axios.delete(`${API_URL}/api/aturan-periode/${id}`);
            fetchRules();
            Swal.fire("Terhapus", "", "success");
        } catch (err) {
            Swal.fire("Gagal", "Tidak bisa menghapus aturan.", "error");
        }
    }
  };

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
            grouped[periodeKey].push({
                id_mitra: k.id_mitra,
                tugas: taskInfo.nama_sub,
                jabatan: k.kode_jabatan 
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
    // Cek jika formatnya YYYY-MM
    if (periodeStr.includes('-')) {
        const parts = periodeStr.split('-');
        if (parts.length === 2) {
          const date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1);
          return date.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
        }
    }
    // Jika formatnya hanya Tahun (YYYY)
    return `Tahun ${periodeStr}`;
  };

  // --- DOWNLOAD TEMPLATE IMPORT (EXCEL KOSONG) ---
  const handleDownloadTemplate = () => {
    const templateData = [
      {
        "NIK": "1234567890123456",            
        "Nama Lengkap": "Contoh Nama Mitra",
        "Alamat Detail": "Jl. Merdeka No. 45",
        "Jenis Kelamin": "Lk",                
        "Pendidikan": "Tamat D4/S1",
        "Pekerjaan": "Wiraswasta",
        "Deskripsi Pekerjaan Lain": "-",
        "No Telp": "081234567890",
        "SOBAT ID": "12345",
        "Email": "contoh@email.com"
      }
    ];

    const ws = XLSX.utils.json_to_sheet(templateData);
    const wscols = [
        {wch: 20}, // NIK
        {wch: 25}, // Nama
        {wch: 35}, // Alamat
        {wch: 15}, // JK
        {wch: 20}, // Pendidikan
        {wch: 20}, // Pekerjaan
        {wch: 25}, // Deskripsi
        {wch: 15}, // HP
        {wch: 15}, // SOBAT ID
        {wch: 25}  // Email
    ];
    ws['!cols'] = wscols;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template Import");
    XLSX.writeFile(wb, "Template_Import_Mitra.xlsx");
  };

  // --- EXPORT DATA (FORMAT SAMA DENGAN IMPORT) ---
  const handleExport = () => { 
    const dataToExport = mitraList.map(m => ({
      "NIK": m.nik,
      "Nama Lengkap": m.nama_lengkap,
      "Alamat Detail": m.alamat,
      "Jenis Kelamin": m.jenis_kelamin || '',
      "Pendidikan": m.pendidikan || '',
      "Pekerjaan": m.pekerjaan || '',
      "Deskripsi Pekerjaan Lain": m.deskripsi_pekerjaan_lain || '',
      "No Telp": m.no_hp,
      "SOBAT ID": m.sobat_id || '',
      "Email": m.email || ''
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wscols = [
        {wch: 20}, {wch: 30}, {wch: 40}, {wch: 15}, {wch: 15}, 
        {wch: 20}, {wch: 25}, {wch: 15}, {wch: 15}, {wch: 25}
    ];
    ws['!cols'] = wscols;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Data Mitra");
    XLSX.writeFile(wb, "Data_Mitra_Export.xlsx");
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
      const res = await axios.post(`${API_URL}/api/mitra/import`, formData, {
        headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${token}` }
      });
      Swal.fire({ title: 'Selesai', text: res.data.message, icon: 'success' });
      fetchMitra(); 
    } catch (err) { 
      Swal.fire('Gagal', err.response?.data?.message || 'Error import.', 'error');
    } finally { 
      setUploading(false); e.target.value = null; 
    }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    const result = await Swal.fire({
      title: 'Hapus Mitra?', icon: 'warning', showCancelButton: true, confirmButtonText: 'Ya', cancelButtonText: 'Batal', confirmButtonColor: '#d33'
    });
    if (result.isConfirmed) {
      try {
          const token = localStorage.getItem('token');
          await axios.delete(`${API_URL}/api/mitra/${id}`, { headers: { Authorization: `Bearer ${token}` } });
          setMitraList(prev => prev.filter(m => m.id !== id));
          Swal.fire('Terhapus!', '', 'success');
      } catch (err) { Swal.fire('Gagal!', '', 'error'); }
    }
  };

  if (loading) return <div className="text-center py-10 text-gray-500">Memuat data...</div>;

  return (
    <div className="w-full pb-20 relative">
      
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <div className="text-gray-500 text-sm">Database seluruh mitra statistik.</div>
        <div className="flex flex-wrap gap-2 justify-end">
          
          <button onClick={() => navigate('/admin/mitra/tambah')} className="flex items-center gap-2 px-4 py-2 bg-[#1A2A80] text-white rounded-lg text-sm font-bold hover:bg-blue-900 transition shadow-sm">
            <FaPlus /> Tambah Mitra
          </button>

          <button onClick={handleOpenRuleModal} className="flex items-center gap-2 px-4 py-2 bg-yellow-50 text-yellow-700 border border-yellow-200 rounded-lg text-sm font-bold hover:bg-yellow-100 transition shadow-sm">
            <FaCog /> Atur Batas Honor
          </button>

          <button 
            onClick={() => {
                if (viewMode === 'list') { setViewMode('period'); fetchPeriodData(); } 
                else { setViewMode('list'); }
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition shadow-sm border ${viewMode === 'period' ? 'bg-blue-50 text-[#1A2A80] border-[#1A2A80]' : 'bg-white text-gray-600 border-gray-200'}`}
          >
            {viewMode === 'list' ? <><FaCalendarAlt /> Mode Periode</> : <><FaList /> Mode Daftar</>}
          </button>

          <button 
            onClick={handleDownloadTemplate} 
            className="flex items-center gap-2 bg-white hover:bg-gray-50 text-green-700 border border-green-200 px-4 py-2 rounded-lg text-sm font-medium transition shadow-sm"
            title="Download Template Excel Kosong"
          >
            <FaFileExcel /> Template
          </button>

          <button onClick={handleExport} className="flex items-center gap-2 bg-white hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium border border-gray-200 transition shadow-sm">
            <FaDownload /> Export XLSX
          </button>
          
          <button onClick={handleImportClick} disabled={uploading} className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-bold transition shadow-sm disabled:opacity-50">
            <FaFileUpload /> Import
          </button>
          
          <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".xlsx, .xls" className="hidden" />
        </div>
      </div>
      
      {error && <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6 border border-red-100">{error}</div>}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {viewMode === 'list' ? (
            <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
                <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Nama Lengkap</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">NIK / ID Sobat</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Pekerjaan</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Kontak</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase">Aksi</th>
                </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
                {mitraList.map((mitra) => (
                <tr key={mitra.id} onClick={() => navigate(`/admin/mitra/${mitra.id}`)} className="hover:bg-blue-50/50 cursor-pointer transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-50 text-[#1A2A80] rounded-full"><FaUserTie /></div>
                            <div>
                                <div className="text-sm font-bold text-gray-900">{mitra.nama_lengkap}</div>
                                <div className="text-xs text-gray-500">{mitra.email || '-'}</div>
                            </div>
                        </div>
                    </td>
                    <td className="px-6 py-4 text-xs font-mono text-gray-500">
                        <div>{mitra.nik}</div>
                        {mitra.sobat_id && <div className="text-blue-600 mt-1">ID: {mitra.sobat_id}</div>}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                        <div>{mitra.pekerjaan || '-'}</div>
                        <div className="text-xs text-gray-400">{mitra.pendidikan}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                        <div>{mitra.no_hp}</div>
                        <div className="text-xs text-gray-400">{mitra.alamat ? mitra.alamat.substring(0, 20) + '...' : '-'}</div>
                    </td>
                    <td className="px-6 py-4 text-right">
                        <button 
                            onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/admin/edit-mitra/${mitra.id}`);
                            }} 
                            className="text-blue-400 hover:text-blue-600 p-2 rounded-full hover:bg-blue-50 transition mr-1"
                            title="Edit Mitra"
                        >
                            <FaEdit />
                        </button>
                        <button 
                            onClick={(e) => handleDelete(mitra.id, e)} 
                            className="text-red-400 hover:text-red-600 p-2 rounded-full hover:bg-red-50 transition"
                            title="Hapus Mitra"
                        >
                            <FaTrash />
                        </button>
                    </td>
                </tr>
                ))}
            </tbody>
            </table>
        ) : (
            <div className="space-y-0 divide-y divide-gray-200">
                {loadingPeriod ? <div className="p-10 text-center text-gray-500">Memuat...</div> : 
                 Object.keys(periodData).sort().reverse().map(periodeKey => {
                    const mitraInPeriod = periodData[periodeKey];
                    return (
                        <div key={periodeKey}>
                            <div className="bg-gray-50 px-6 py-3 flex items-center gap-3 border-l-4 border-[#1A2A80]">
                                <FaCalendarAlt className="text-[#1A2A80]" />
                                <h3 className="font-bold text-gray-800 text-lg">{formatPeriodeLabel(periodeKey)}</h3>
                                <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded border">Total: {mitraInPeriod.length} Mitra</span>
                            </div>
                            <table className="min-w-full">
                                <tbody className="divide-y divide-gray-100">
                                    {mitraInPeriod.map((item, idx) => {
                                        const fullMitra = mitraList.find(m => m.id === item.id_mitra) || {};
                                        return (
                                            <tr key={idx} onClick={() => navigate(`/admin/mitra/${item.id_mitra}`)} className="hover:bg-blue-50/30 cursor-pointer">
                                                <td className="px-6 py-3 pl-12"><div className="text-sm font-bold text-gray-800">{fullMitra.nama_lengkap}</div><div className="text-xs text-gray-500 flex gap-1 items-center"><FaBriefcase size={10}/> {item.tugas} ({item.jabatan})</div></td>
                                                <td className="px-6 py-3 text-xs font-mono text-gray-500">{fullMitra.nik}</td>
                                                <td className="px-6 py-3 text-sm text-gray-600">{fullMitra.no_hp}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    );
                })}
            </div>
        )}
      </div>

      {/* --- MODAL ATURAN HONOR TAHUNAN --- */}
      {showModalRule && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in-up">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <h3 className="font-bold text-gray-800 flex items-center gap-2"><FaCog /> Aturan Batas Honor Tahunan</h3>
                    <button onClick={() => setShowModalRule(false)} className="text-gray-400 hover:text-red-500"><FaTimes /></button>
                </div>
                
                <div className="p-6">
                    <p className="text-sm text-gray-500 mb-4 bg-yellow-50 p-3 rounded border border-yellow-200">
                       Atur batas maksimal pendapatan seorang mitra dalam satu tahun anggaran.
                    </p>

                    <div className="flex gap-3 mb-6 items-end">
                        <div className="w-1/3">
                            <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Tahun Anggaran</label>
                            {/* INPUT NUMBER UNTUK TAHUN */}
                            <input 
                                type="number" 
                                min="2000" 
                                max="2099" 
                                placeholder="2025"
                                className="w-full border rounded px-3 py-2 text-sm focus:ring-2 focus:ring-[#1A2A80] outline-none font-bold" 
                                value={newRule.tahun} 
                                onChange={e => setNewRule({...newRule, tahun: e.target.value})} 
                            />
                        </div>
                        <div className="flex-1">
                            <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Max Honor (Rp)</label>
                            <input 
                                type="number" 
                                className="w-full border rounded px-3 py-2 text-sm focus:ring-2 focus:ring-[#1A2A80] outline-none" 
                                placeholder="Contoh: 5000000"
                                value={newRule.batas_honor} 
                                onChange={e => setNewRule({...newRule, batas_honor: e.target.value})}
                            />
                        </div>
                        <button onClick={handleSaveRule} className="bg-[#1A2A80] text-white p-2.5 rounded hover:bg-blue-900 shadow transition">
                            <FaSave />
                        </button>
                    </div>

                    <div className="max-h-60 overflow-y-auto border rounded-lg">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 text-gray-500 font-bold uppercase text-xs">
                                <tr>
                                    <td className="px-4 py-2">Tahun</td>
                                    <td className="px-4 py-2">Batas Nominal</td>
                                    <td className="px-4 py-2 text-right">Aksi</td>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {loadingRules ? <tr><td colSpan="3" className="p-4 text-center text-gray-400">Loading...</td></tr> : 
                                 rules.length === 0 ? <tr><td colSpan="3" className="p-4 text-center text-gray-400 italic">Belum ada aturan.</td></tr> :
                                 rules.map(r => (
                                    <tr key={r.id} className="hover:bg-gray-50">
                                        {/* Menampilkan r.tahun dari response backend */}
                                        <td className="px-4 py-2 font-bold text-gray-800">{r.tahun || r.periode}</td>
                                        <td className="px-4 py-2 text-green-600 font-bold">Rp {Number(r.batas_honor).toLocaleString('id-ID')}</td>
                                        <td className="px-4 py-2 text-right">
                                            <button onClick={() => handleDeleteRule(r.id)} className="text-red-400 hover:text-red-600 transition">
                                                <FaTrash size={12}/>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
      )}

    </div>
  );
};

export default ManajemenMitra;