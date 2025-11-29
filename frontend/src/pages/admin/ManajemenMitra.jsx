import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom'; 
import * as XLSX from 'xlsx'; 
import Swal from 'sweetalert2';
import { 
  FaDownload, FaFileUpload, FaTrash, FaChevronRight, FaUserTie,
  FaCalendarAlt, FaList, FaBriefcase, FaCog, FaTimes, FaSave, FaPlus
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
  
  const [showModalRule, setShowModalRule] = useState(false);
  const [rules, setRules] = useState([]);
  const [newRule, setNewRule] = useState({ periode: '', batas_honor: '' });
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

  const handleSaveRule = async () => {
    if (!newRule.periode || !newRule.batas_honor) return Swal.fire("Gagal", "Lengkapi data periode dan nominal.", "warning");
    try {
        await axios.post(`${API_URL}/api/aturan-periode`, newRule);
        setNewRule({ periode: '', batas_honor: '' });
        fetchRules();
        Swal.fire("Sukses", "Aturan periode berhasil disimpan.", "success");
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
    const parts = periodeStr.split('-');
    if (parts.length === 2) {
      const date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1);
      return date.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
    }
    return periodeStr;
  };

  const handleExport = () => { 
    const dataToExport = mitraList.map(m => ({
      "Nama": m.nama_lengkap, "NIK": m.nik, "Alamat": m.alamat, "HP": m.no_hp, 
      "Bank": m.nama_bank, "Rek": m.no_rekening
    }));
    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Data Mitra");
    XLSX.writeFile(wb, "Data_Mitra.xlsx");
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

          <button onClick={handleExport} className="flex items-center gap-2 bg-white hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium border border-gray-200 transition shadow-sm"><FaDownload /> Export</button>
          <button onClick={handleImportClick} disabled={uploading} className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-bold transition shadow-sm disabled:opacity-50"><FaFileUpload /> Import</button>
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
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">NIK</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Kontak</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Bank</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase">Aksi</th>
                </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
                {mitraList.map((mitra) => (
                <tr key={mitra.id} onClick={() => navigate(`/admin/mitra/${mitra.id}`)} className="hover:bg-blue-50/50 cursor-pointer transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-50 text-[#1A2A80] rounded-full"><FaUserTie /></div>
                            <div><div className="text-sm font-bold text-gray-900">{mitra.nama_lengkap}</div><div className="text-xs text-gray-500">{mitra.email}</div></div>
                        </div>
                    </td>
                    <td className="px-6 py-4 text-xs font-mono text-gray-500">{mitra.nik}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{mitra.no_hp}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{mitra.nama_bank} - <span className="font-mono text-gray-500">{mitra.no_rekening}</span></td>
                    <td className="px-6 py-4 text-right">
                        <button onClick={(e) => handleDelete(mitra.id, e)} className="text-red-400 hover:text-red-600 p-2 rounded-full hover:bg-red-50 transition"><FaTrash /></button>
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
                                                <td className="px-6 py-3 text-sm text-gray-900">{fullMitra.nama_bank}</td>
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

      {showModalRule && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-fade-in-up">
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <h3 className="font-bold text-gray-800 flex items-center gap-2"><FaCog /> Aturan Batas Honor</h3>
                    <button onClick={() => setShowModalRule(false)} className="text-gray-400 hover:text-red-500"><FaTimes /></button>
                </div>
                
                <div className="p-6">
                    <div className="flex gap-3 mb-6 items-end">
                        <div className="flex-1">
                            <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Periode</label>
                            <input type="month" className="w-full border rounded px-3 py-2 text-sm" 
                                value={newRule.periode} onChange={e => setNewRule({...newRule, periode: e.target.value})} 
                            />
                        </div>
                        <div className="flex-1">
                            <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Max Honor (Rp)</label>
                            <input type="number" className="w-full border rounded px-3 py-2 text-sm" placeholder="0"
                                value={newRule.batas_honor} onChange={e => setNewRule({...newRule, batas_honor: e.target.value})}
                            />
                        </div>
                        <button onClick={handleSaveRule} className="bg-[#1A2A80] text-white p-2.5 rounded hover:bg-blue-900"><FaSave /></button>
                    </div>

                    <div className="max-h-60 overflow-y-auto border rounded-lg">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 text-gray-500 font-bold">
                                <tr><td className="px-4 py-2">Periode</td><td className="px-4 py-2">Batas Honor</td><td className="px-4 py-2 text-right">Aksi</td></tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {loadingRules ? <tr><td colSpan="3" className="p-4 text-center text-gray-400">Loading...</td></tr> : 
                                 rules.map(r => (
                                    <tr key={r.id}>
                                        <td className="px-4 py-2 font-medium">{formatPeriodeLabel(r.periode)}</td>
                                        <td className="px-4 py-2 text-green-600 font-bold">Rp {Number(r.batas_honor).toLocaleString('id-ID')}</td>
                                        <td className="px-4 py-2 text-right"><button onClick={() => handleDeleteRule(r.id)} className="text-red-400 hover:text-red-600"><FaTrash size={12}/></button></td>
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