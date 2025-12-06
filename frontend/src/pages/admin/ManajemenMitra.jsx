import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom'; 
import * as XLSX from 'xlsx'; 
import Swal from 'sweetalert2';
import { 
  FaDownload, FaFileUpload, FaTrash, FaUserTie,
  FaCalendarAlt, FaList, FaBriefcase, FaCog, FaTimes, FaSave, FaPlus,
  FaFileExcel, FaEdit, FaCloudUploadAlt, FaCheckCircle
} from 'react-icons/fa';
import PartTableMitra from '../../components/admin/PartTabelMitra';

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
  const [newRule, setNewRule] = useState({ tahun: new Date().getFullYear(), batas_honor: '' });
  const [loadingRules, setLoadingRules] = useState(false);

  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importYear, setImportYear] = useState('');
  const [isDragging, setIsDragging] = useState(false);

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
    if (!newRule.tahun || !newRule.batas_honor) {
        return Swal.fire("Gagal", "Lengkapi data tahun dan nominal batas honor.", "warning");
    }
    if (!/^\d{4}$/.test(newRule.tahun)) {
        return Swal.fire("Gagal", "Format tahun harus 4 digit angka.", "warning");
    }
    try {
        await axios.post(`${API_URL}/api/aturan-periode`, newRule);
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

  const handleOpenImport = () => {
    setImportFile(null);
    setImportYear(new Date().getFullYear());
    setShowImportModal(true);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      validateAndSetFile(file);
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (file) => {
    const validTypes = ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel'];
    if (validTypes.includes(file.type) || file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
      setImportFile(file);
    } else {
      Swal.fire('Format Salah', 'Harap upload file Excel (.xlsx / .xls)', 'error');
    }
  };

  const handleSubmitImport = async () => {
    if (!importFile) return Swal.fire('Gagal', 'Silakan pilih file terlebih dahulu.', 'warning');

    setUploading(true);
    const formData = new FormData();
    const yearToSend = importYear || new Date().getFullYear();
    
    formData.append('tahun_daftar', yearToSend);
    formData.append('file', importFile);
    
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(`${API_URL}/api/mitra/import`, formData, {
        headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${token}` }
      });

      const { successCount, skipCount, failCount, errors } = res.data;
      
      let msgHTML = `<b>Tahun Aktif: ${yearToSend}</b><br/><br/>
      ✅ Berhasil Diaktifkan: <b>${successCount}</b><br/>
      ℹ️ Sudah Aktif Tahun Ini: <b>${skipCount}</b><br/>
      ❌ Gagal: <b>${failCount}</b>`;
      
      if (errors && errors.length > 0) {
        msgHTML += `<br/><br/><div style="text-align:left; max-height:100px; overflow-y:auto; font-size:12px; background:#f9f9f9; padding:5px;">${errors.slice(0, 3).join('<br/>')}${errors.length > 3 ? '<br/>...' : ''}</div>`;
      }

      setShowImportModal(false);
      Swal.fire({
        title: 'Proses Selesai',
        html: msgHTML,
        icon: failCount > 0 ? 'warning' : 'success'
      });

      fetchMitra(); 
    } catch (err) { 
      Swal.fire('Gagal', err.response?.data?.message || 'Error import.', 'error');
    } finally { 
      setUploading(false);
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
    if (periodeStr.includes('-')) {
        const parts = periodeStr.split('-');
        if (parts.length === 2) {
          const date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1);
          return date.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
        }
    }
    return `Tahun ${periodeStr}`;
  };

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
        {wch: 20}, {wch: 25}, {wch: 35}, {wch: 15}, {wch: 20}, 
        {wch: 20}, {wch: 25}, {wch: 15}, {wch: 15}, {wch: 25}
    ];
    ws['!cols'] = wscols;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template Import");
    XLSX.writeFile(wb, "Template_Import_Mitra.xlsx");
  };

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
  
  const handleDelete = async (id, year) => {
    const result = await Swal.fire({ 
        title: 'Hapus Data?', 
        text: `Jika mitra ini aktif di tahun lain, hanya data tahun ${year} yang dihapus. Jika tidak, data mitra dihapus permanen.`, 
        icon: 'warning', 
        showCancelButton: true, 
        confirmButtonText: 'Ya, Hapus', 
        confirmButtonColor: '#d33' 
    });

    if (result.isConfirmed) {
      try {
          const token = localStorage.getItem('token');
          await axios.delete(`${API_URL}/api/mitra/${id}`, { 
              headers: { Authorization: `Bearer ${token}` },
              params: { tahun: year }
          });
          
          setMitraList(prev => {
             fetchMitra(); 
             return prev;
          });
          
          Swal.fire('Terhapus!', 'Data berhasil diproses.', 'success');
      } catch (err) { 
          Swal.fire('Gagal!', 'Gagal menghapus data.', 'error'); 
      }
    }
  };

  if (loading) return <div className="text-center py-10 text-gray-500">Memuat data...</div>;

  return (
    <div className="w-full pb-20 relative">
      
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <div className="text-gray-500 text-sm">Database seluruh mitra statistik.</div>
        <div className="flex flex-wrap gap-2 justify-end">
          <button onClick={() => navigate('/admin/mitra/tambah')} className="flex items-center gap-2 px-4 py-2 bg-[#1A2A80] text-white rounded-lg text-sm font-bold hover:bg-blue-900 transition shadow-sm"><FaPlus /> Tambah Mitra</button>
          <button onClick={handleOpenRuleModal} className="flex items-center gap-2 px-4 py-2 bg-yellow-50 text-yellow-700 border border-yellow-200 rounded-lg text-sm font-bold hover:bg-yellow-100 transition shadow-sm"><FaCog /> Atur Batas Honor</button>
          <button onClick={() => { if (viewMode === 'list') { setViewMode('period'); fetchPeriodData(); } else { setViewMode('list'); }}} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition shadow-sm border ${viewMode === 'period' ? 'bg-blue-50 text-[#1A2A80] border-[#1A2A80]' : 'bg-white text-gray-600 border-gray-200'}`}>{viewMode === 'list' ? <><FaCalendarAlt /> Mode Periode</> : <><FaList /> Mode Daftar</>}</button>
          
          <button onClick={handleDownloadTemplate} className="flex items-center gap-2 bg-white hover:bg-gray-50 text-green-700 border border-green-200 px-4 py-2 rounded-lg text-sm font-medium transition shadow-sm"><FaFileExcel /> Template</button>
          <button onClick={handleExport} className="flex items-center gap-2 bg-white hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium border border-gray-200 transition shadow-sm"><FaDownload /> Export</button>
          
          <button onClick={handleOpenImport} className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-bold transition shadow-sm">
            <FaFileUpload /> Import
          </button>
        </div>
      </div>
      
      {error && <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6 border border-red-100">{error}</div>}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {viewMode === 'list' ? (
            <PartTableMitra 
                data={mitraList} 
                onEdit={(id) => navigate(`/admin/mitra/edit/${id}`)}
                onDelete={(id, year) => handleDelete(id, year)}
                onDetail={(id) => navigate(`/admin/mitra/${id}`)}
            />
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
                                <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded border shadow-sm">
                                    {mitraInPeriod.length} Mitra Bertugas
                                </span>
                            </div>
                            <table className="min-w-full">
                                <tbody className="divide-y divide-gray-100">
                                    {mitraInPeriod.map((item, idx) => (
                                        <tr key={idx} onClick={() => navigate(`/admin/mitra/${item.id_mitra}`)} className="hover:bg-blue-50/30 cursor-pointer">
                                            <td className="px-6 py-3 pl-12">
                                                <div className="font-bold text-gray-800 text-sm">{item.nama_mitra}</div>
                                                <div className="text-xs text-gray-500">{item.tugas} ({item.jabatan})</div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    );
                })}
            </div>
        )}
      </div>

      {showImportModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in-up">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2"><FaFileUpload className="text-green-600" /> Import Mitra Excel</h3>
                    <button onClick={() => setShowImportModal(false)} className="text-gray-400 hover:text-red-500 transition"><FaTimes size={20} /></button>
                </div>
                <div className="p-6 space-y-6">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Tahun Aktif</label>
                        <input type="number" min="2000" max="2099" placeholder={new Date().getFullYear()} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none text-gray-700 font-bold" value={importYear} onChange={(e) => setImportYear(e.target.value)} />
                        <p className="text-xs text-gray-500 mt-1">Kosongkan untuk menggunakan tahun saat ini ({new Date().getFullYear()}).</p>
                    </div>
                    <div onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop} onClick={() => fileInputRef.current.click()} className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center gap-3 ${isDragging ? 'border-green-500 bg-green-50 scale-[1.02]' : 'border-gray-300 hover:border-green-400 hover:bg-gray-50'} ${importFile ? 'bg-green-50/50 border-green-500' : 'bg-white'}`}>
                        <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept=".xlsx, .xls" className="hidden" />
                        {importFile ? (
                            <div className="text-green-700 animate-fade-in-up">
                                <FaCheckCircle className="text-4xl mx-auto mb-2" />
                                <p className="font-bold text-sm truncate max-w-[200px]">{importFile.name}</p>
                                <button onClick={(e) => { e.stopPropagation(); setImportFile(null); }} className="mt-3 text-xs text-red-500 hover:underline font-bold">Ganti File</button>
                            </div>
                        ) : (
                            <>
                                <div className="p-4 bg-green-100 text-green-600 rounded-full mb-2"><FaCloudUploadAlt size={32} /></div>
                                <p className="font-bold text-gray-600 text-sm">Klik atau Drag file Excel ke sini</p>
                            </>
                        )}
                    </div>
                </div>
                <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
                    <button onClick={() => setShowImportModal(false)} className="px-5 py-2.5 rounded-lg border border-gray-300 text-gray-600 text-sm font-bold hover:bg-white transition">Batal</button>
                    <button onClick={handleSubmitImport} disabled={uploading || !importFile} className="px-6 py-2.5 rounded-lg bg-green-600 text-white text-sm font-bold hover:bg-green-700 transition shadow-lg flex items-center gap-2 disabled:opacity-50">{uploading ? 'Mengupload...' : <><FaFileUpload /> Proses Import</>}</button>
                </div>
            </div>
        </div>
      )}

      {showModalRule && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in-up">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <h3 className="font-bold text-gray-800 flex items-center gap-2"><FaCog /> Aturan Batas Honor Tahunan</h3>
                    <button onClick={() => setShowModalRule(false)} className="text-gray-400 hover:text-red-500"><FaTimes /></button>
                </div>
                <div className="p-6">
                    <div className="flex gap-3 mb-6 items-end">
                        <div className="w-1/3">
                            <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Tahun</label>
                            <input type="number" className="w-full border rounded px-3 py-2 text-sm" value={newRule.tahun} onChange={e => setNewRule({...newRule, tahun: e.target.value})} />
                        </div>
                        <div className="flex-1">
                            <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Max Honor (Rp)</label>
                            <input type="number" className="w-full border rounded px-3 py-2 text-sm" value={newRule.batas_honor} onChange={e => setNewRule({...newRule, batas_honor: e.target.value})} />
                        </div>
                        <button onClick={handleSaveRule} className="bg-[#1A2A80] text-white p-2.5 rounded hover:bg-blue-900"><FaSave /></button>
                    </div>
                    <div className="max-h-60 overflow-y-auto border rounded-lg">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 text-gray-500 font-bold"><tr><td className="px-4 py-2">Tahun</td><td className="px-4 py-2">Nominal</td><td className="px-4 py-2 text-right">Aksi</td></tr></thead>
                            <tbody>{rules.map(r => (<tr key={r.id}><td className="px-4 py-2 font-bold">{r.tahun || r.periode}</td><td className="px-4 py-2 text-green-600 font-bold">{Number(r.batas_honor).toLocaleString()}</td><td className="px-4 py-2 text-right"><button onClick={() => handleDeleteRule(r.id)} className="text-red-500"><FaTrash size={12}/></button></td></tr>))}</tbody>
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