// src/pages/ManajemenSPK.jsx
import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { 
  FaPrint, FaEdit, FaUserTie, FaSearch, FaFileContract, 
  FaExclamationTriangle, FaCheckCircle, FaCalendarAlt, FaPlus, 
  FaTrash, FaEye, FaPencilAlt 
} from 'react-icons/fa';
// Pastikan path ini benar relatif terhadap lokasi file ini
import ModalSPKSetting from '../components/admin/spk/ModalSPKSetting'; 
import { useNavigate, Link } from 'react-router-dom';
import Swal from 'sweetalert2';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const ManajemenSPK = () => {
  const navigate = useNavigate();

  // --- STATE FILTER ---
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [searchQuery, setSearchQuery] = useState('');

  // --- STATE DATA ---
  const [mitraList, setMitraList] = useState([]);
  const [spkSetting, setSpkSetting] = useState(null); 
  const [templates, setTemplates] = useState([]); 
  const [selectedTemplateId, setSelectedTemplateId] = useState(''); 
  const [loading, setLoading] = useState(false);
  
  // --- STATE MODAL ---
  const [showModal, setShowModal] = useState(false);

  const years = [currentYear - 1, currentYear, currentYear + 1];
  const months = [
    { v: 1, l: 'Januari' }, { v: 2, l: 'Februari' }, { v: 3, l: 'Maret' },
    { v: 4, l: 'April' }, { v: 5, l: 'Mei' }, { v: 6, l: 'Juni' },
    { v: 7, l: 'Juli' }, { v: 8, l: 'Agustus' }, { v: 9, l: 'September' },
    { v: 10, l: 'Oktober' }, { v: 11, l: 'November' }, { v: 12, l: 'Desember' }
  ];

  const getPeriodeString = () => {
    return `${selectedYear}-${String(selectedMonth).padStart(2, '0')}`;
  };

  // --- FETCH DATA ---
  const fetchData = async () => {
    setLoading(true);
    const periode = getPeriodeString();
    
    try {
      const [resMitra, resSetting, resTemplates] = await Promise.all([
        axios.get(`${API_URL}/api/spk/mitra/${periode}`),
        axios.get(`${API_URL}/api/spk/setting/${periode}`),
        axios.get(`${API_URL}/api/spk-templates`)
      ]);

      setMitraList(resMitra.data);
      setSpkSetting(resSetting.data || null);
      setTemplates(resTemplates.data || []);

      // LOGIKA SINKRONISASI DROPDOWN
      if (resSetting.data) {
        if (resSetting.data.template_id) {
            setSelectedTemplateId(resSetting.data.template_id);
        } else {
            // Jika setting ada tapi template_id null -> Default
            setSelectedTemplateId('DEFAULT');
        }
      } else {
        // Belum ada setting -> Kosong
        setSelectedTemplateId('');
      }

    } catch (err) {
      console.error("Gagal memuat data:", err);
      setMitraList([]);
      setSpkSetting(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedYear, selectedMonth]);

  // --- HANDLER TERAPKAN TEMPLATE ---
  const handleApplyTemplate = async () => {
    if (!selectedTemplateId) return Swal.fire('Pilih Template', 'Silakan pilih template terlebih dahulu.', 'warning');

    const periode = getPeriodeString();
    
    const defaultData = {
        nama_ppk: '', nip_ppk: '', jabatan_ppk: 'Pejabat Pembuat Komitmen',
        tanggal_surat: new Date().toISOString().split('T')[0],
        nomor_surat_format: '000/33730/SPK.MITRA/MM/YYYY',
        komponen_honor: 'biaya pajak, bea materai, dan jasa pelayanan keuangan'
    };

    // Konversi 'DEFAULT' menjadi null agar disimpan sebagai NULL di database
    const templateIdToSend = selectedTemplateId === 'DEFAULT' ? null : selectedTemplateId;

    const payload = spkSetting 
        ? { ...spkSetting, template_id: templateIdToSend, periode }
        : { ...defaultData, template_id: templateIdToSend, periode };

    try {
        await axios.post(`${API_URL}/api/spk/setting`, payload);
        Swal.fire('Berhasil', 'Template berhasil diterapkan untuk periode ini.', 'success');
        fetchData(); 
    } catch (err) {
        Swal.fire('Gagal', 'Gagal menerapkan template.', 'error');
    }
  };

  // --- HANDLER AKSI TEMPLATE ---
  const handlePreviewTemplate = async () => {
    if (!selectedTemplateId || selectedTemplateId === 'DEFAULT') return;
    try {
        const res = await axios.get(`${API_URL}/api/spk-templates/${selectedTemplateId}`);
        const { nama_template, parts, articles } = res.data;
        
        navigate('/spk/templates/preview', {
            state: {
                header: { nama_template },
                parts,
                articles,
                id: selectedTemplateId,
                fromPreview: false 
            }
        });
    } catch (error) {
        Swal.fire('Error', 'Gagal memuat template untuk preview.', 'error');
    }
  };

  const handleEditTemplate = () => {
    if (!selectedTemplateId || selectedTemplateId === 'DEFAULT') return;
    navigate(`/spk/templates/edit/${selectedTemplateId}`);
  };

  const handleDeleteTemplate = async () => {
    if (!selectedTemplateId || selectedTemplateId === 'DEFAULT') return;

    const confirm = await Swal.fire({
        title: 'Hapus Template?',
        text: "Template yang dihapus tidak bisa dikembalikan!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Ya, Hapus!'
    });

    if (confirm.isConfirmed) {
        try {
            await axios.delete(`${API_URL}/api/spk-templates/${selectedTemplateId}`);
            Swal.fire('Terhapus!', 'Template berhasil dihapus.', 'success');
            setSelectedTemplateId('');
            fetchData();
        } catch (error) {
            Swal.fire('Gagal', 'Gagal menghapus template.', 'error');
        }
    }
  };

  const filteredMitra = useMemo(() => {
    if (!searchQuery) return mitraList;
    const lower = searchQuery.toLowerCase();
    return mitraList.filter(m => 
      m.nama_lengkap.toLowerCase().includes(lower) ||
      (m.nik && m.nik.includes(lower)) ||
      (m.sobat_id && m.sobat_id.toLowerCase().includes(lower))
    );
  }, [mitraList, searchQuery]);

  // --- LOGIKA CETAK UTAMA ---
  const handlePrint = (id_mitra) => {
    // Cukup cek apakah spkSetting SUDAH ADA.
    // Tidak perlu cek template_id, karena null (Default) pun boleh mencetak.
    if (!spkSetting) {
      Swal.fire('Belum Siap', 'Mohon terapkan template (Default/Custom) dan atur detail pejabat terlebih dahulu!', 'warning');
      return;
    }
    
    const periode = getPeriodeString();
    
    // Arahkan ke halaman CetakSPK.
    // Halaman CetakSPK akan otomatis mendeteksi:
    // - Jika template_id ada -> Render tampilan dinamis (Preview Style)
    // - Jika template_id null -> Render tampilan default (CetakSPK Style)
    navigate(`/spk/print/${periode}/${id_mitra}`);
  };

  // Helper status template
  const getCurrentTemplateName = () => {
      if (!spkSetting) return null;
      if (!spkSetting.template_id) return 'Default (Sistem)';
      return spkSetting.nama_template || 'Terpilih';
  };

  return (
    <div className="w-full pb-20 pt-8 px-8 animate-fade-in-up">
      
      {/* HEADER */}
      <div className="mb-8 flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <FaFileContract className="text-[#1A2A80]" /> Manajemen SPK
            </h1>
            <p className="text-sm text-gray-500 mt-1">Kelola dan cetak Surat Perjanjian Kerja mitra per periode.</p>
        </div>
        
        <div className="flex gap-2">
            <Link 
                to="/spk/templates/create" 
                className="flex items-center gap-2 bg-[#1A2A80] text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-900 transition shadow-sm"
            >
                <FaPlus /> Buat Master Template
            </Link>
        </div>
      </div>

      {/* FILTER SECTION */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-6">
        <div className="flex flex-col md:flex-row items-end gap-4">
          
          <div className="w-full md:w-1/4">
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Tahun Anggaran</label>
            <div className="relative">
                <FaCalendarAlt className="absolute left-3 top-3 text-gray-400" />
                <select 
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1A2A80] outline-none font-bold text-gray-700 bg-gray-50 focus:bg-white transition"
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                >
                    {years.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
            </div>
          </div>

          <div className="w-full md:w-1/3">
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Bulan Kegiatan</label>
            <select 
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1A2A80] outline-none font-bold text-gray-700 bg-gray-50 focus:bg-white transition"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
            >
                {months.map(m => <option key={m.v} value={m.v}>{m.l}</option>)}
            </select>
          </div>

          {loading && <div className="text-xs text-gray-400 pb-2 animate-pulse">Sedang memuat data...</div>}
        </div>
      </div>

      {/* PANEL STATUS & PENGATURAN TEMPLATE */}
      <div className={`rounded-xl border p-5 mb-8 flex flex-col lg:flex-row justify-between items-start gap-6 transition-colors duration-300 ${spkSetting ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
        
        {/* Kiri: Info Status */}
        <div className="flex items-start gap-4">
            <div className={`p-3 rounded-full text-xl ${spkSetting ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'}`}>
                {spkSetting ? <FaCheckCircle /> : <FaExclamationTriangle />}
            </div>
            <div>
                <h3 className={`font-bold text-lg ${spkSetting ? 'text-green-800' : 'text-yellow-800'}`}>
                    {spkSetting ? 'SPK Siap Dicetak' : 'SPK Belum Diatur'}
                </h3>
                <p className={`text-sm mt-1 ${spkSetting ? 'text-green-700' : 'text-yellow-700'}`}>
                    {spkSetting 
                        ? `Template Aktif: "${getCurrentTemplateName()}"`
                        : "Pilih template di sebelah kanan dan klik 'Terapkan' untuk mengaktifkan."}
                </p>
                {spkSetting && (
                    <div className="mt-2 text-xs text-gray-500 bg-white/50 inline-block px-2 py-1 rounded border border-gray-200">
                        PPK: <b>{spkSetting.nama_ppk || '-'}</b> | Tgl: {spkSetting.tanggal_surat}
                    </div>
                )}
            </div>
        </div>
        
        {/* Kanan: Aksi (Dropdown Template & Tombol Detail) */}
        <div className="flex flex-col gap-3 w-full lg:w-auto">
            
            {/* 1. Baris Pilih Template + Terapkan */}
            <div className="flex flex-col sm:flex-row gap-2 bg-white p-2 rounded-lg border border-gray-300 shadow-sm">
                <select 
                    value={selectedTemplateId}
                    onChange={(e) => setSelectedTemplateId(e.target.value)}
                    className="bg-transparent text-sm px-2 py-1.5 outline-none text-gray-700 font-medium w-full sm:w-64"
                >
                    <option value="">-- Pilih Template --</option>
                    <option value="DEFAULT" className="font-bold text-blue-600 bg-blue-50">★ Template Default (Sistem)</option>
                    {templates.map(t => (
                        <option key={t.id} value={t.id}>{t.nama_template}</option>
                    ))}
                </select>
                <button 
                    onClick={handleApplyTemplate}
                    disabled={!selectedTemplateId}
                    className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2 rounded disabled:bg-gray-300 transition whitespace-nowrap"
                >
                    Terapkan
                </button>
            </div>

            {/* 2. Baris Tombol Aksi Template (Sembunyikan jika Default) */}
            {selectedTemplateId && selectedTemplateId !== 'DEFAULT' && (
                <div className="flex items-center justify-between sm:justify-end gap-2 text-xs">
                    <span className="text-gray-400 font-semibold mr-1">Aksi Template:</span>
                    <button 
                        onClick={handlePreviewTemplate}
                        className="flex items-center gap-1 px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded hover:bg-indigo-100 border border-indigo-200 transition font-medium"
                        title="Lihat Preview"
                    >
                        <FaEye /> Lihat
                    </button>
                    <button 
                        onClick={handleEditTemplate}
                        className="flex items-center gap-1 px-3 py-1.5 bg-orange-50 text-orange-700 rounded hover:bg-orange-100 border border-orange-200 transition font-medium"
                        title="Edit Konten"
                    >
                        <FaPencilAlt /> Edit
                    </button>
                    <button 
                        onClick={handleDeleteTemplate}
                        className="flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-700 rounded hover:bg-red-100 border border-red-200 transition font-medium"
                        title="Hapus Permanen"
                    >
                        <FaTrash /> Hapus
                    </button>
                </div>
            )}

            {/* 3. Tombol Atur Detail Surat */}
            <button 
                onClick={() => setShowModal(true)}
                className={`w-full mt-1 px-4 py-2 rounded-lg text-sm font-bold shadow-sm flex items-center justify-center gap-2 transition ${spkSetting ? 'bg-white text-green-700 border border-green-200 hover:bg-green-50' : 'bg-yellow-600 text-white hover:bg-yellow-700'}`}
            >
                <FaEdit /> {spkSetting ? 'Edit Detail Pejabat/Tanggal' : 'Atur Detail Pejabat/Tanggal'}
            </button>
        </div>
      </div>

      {/* DAFTAR MITRA (TANPA KOLOM BANK) */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden min-h-[400px]">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex flex-col sm:flex-row justify-between items-center gap-4">
            <h3 className="font-bold text-gray-700 flex items-center gap-2">
                <FaUserTie className="text-[#1A2A80]" /> Daftar Mitra Bertugas ({filteredMitra.length})
            </h3>
            <div className="relative w-full sm:w-64">
                <span className="absolute left-3 top-2.5 text-gray-400"><FaSearch /></span>
                <input 
                    type="text" 
                    placeholder="Cari Nama / ID Sobat..." 
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#1A2A80] outline-none transition bg-white"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>
        </div>

        <div className="overflow-x-auto">
            <table className="min-w-full text-sm text-left">
                <thead className="bg-white text-gray-500 border-b border-gray-100 uppercase text-xs font-bold">
                    <tr>
                        <th className="px-6 py-4">Nama Mitra</th>
                        <th className="px-6 py-4">NIK / ID</th>
                        <th className="px-6 py-4 text-center">Aksi</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {loading ? (
                        <tr><td colSpan="3" className="text-center py-12 text-gray-400 italic">Memuat daftar mitra...</td></tr>
                    ) : filteredMitra.length === 0 ? (
                        <tr><td colSpan="3" className="text-center py-12 text-gray-400 italic bg-gray-50">
                            {searchQuery ? "Tidak ditemukan mitra." : "Tidak ada mitra yang bertugas di periode ini."}
                        </td></tr>
                    ) : (
                        filteredMitra.map(m => (
                            <tr key={m.id} className="hover:bg-blue-50/40 transition">
                                <td className="px-6 py-4">
                                    <div className="font-bold text-gray-800">{m.nama_lengkap}</div>
                                </td>
                                <td className="px-6 py-4 text-gray-600 font-mono text-xs">
                                    <div>{m.nik}</div>
                                    {m.sobat_id && <div className="text-[#1A2A80] font-bold mt-0.5">{m.sobat_id}</div>}
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <button 
                                        onClick={() => handlePrint(m.id)}
                                        // DISINI PERUBAHAN UTAMANYA:
                                        // Tombol aktif jika spkSetting sudah ada (meskipun Default)
                                        disabled={!spkSetting}
                                        className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold shadow-sm transition ${spkSetting ? 'bg-[#1A2A80] text-white hover:bg-blue-900' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
                                        title={!spkSetting ? "Terapkan template dulu" : "Cetak"}
                                    >
                                        <FaPrint /> Cetak SPK
                                    </button>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
      </div>

      <ModalSPKSetting 
        isOpen={showModal} 
        onClose={() => setShowModal(false)} 
        periode={getPeriodeString()} 
        onSuccess={fetchData} 
      />

    </div>
  );
};

export default ManajemenSPK;