// src/pages/admin/ManajemenSPK.jsx
import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { 
  FaPrint, FaEdit, FaUserTie, FaSearch, FaFileContract, 
  FaExclamationTriangle, FaCheckCircle, FaCalendarAlt 
} from 'react-icons/fa';
import ModalSPKSetting from '../../components/admin/spk/ModalSPKSetting';
import { useNavigate } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const ManajemenSPK = () => {
  const navigate = useNavigate();

  // --- STATE FILTER ---
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1; // 1-12

  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [searchQuery, setSearchQuery] = useState('');

  // --- STATE DATA ---
  const [mitraList, setMitraList] = useState([]);
  const [spkSetting, setSpkSetting] = useState(null); // Data setting surat
  const [loading, setLoading] = useState(false);
  
  // --- STATE MODAL ---
  const [showModal, setShowModal] = useState(false);

  // Helper: Generate Options
  const years = [currentYear - 1, currentYear, currentYear + 1];
  const months = [
    { v: 1, l: 'Januari' }, { v: 2, l: 'Februari' }, { v: 3, l: 'Maret' },
    { v: 4, l: 'April' }, { v: 5, l: 'Mei' }, { v: 6, l: 'Juni' },
    { v: 7, l: 'Juli' }, { v: 8, l: 'Agustus' }, { v: 9, l: 'September' },
    { v: 10, l: 'Oktober' }, { v: 11, l: 'November' }, { v: 12, l: 'Desember' }
  ];

  // Helper: Format Periode (YYYY-MM)
  const getPeriodeString = () => {
    return `${selectedYear}-${String(selectedMonth).padStart(2, '0')}`;
  };

  // --- FETCH DATA ---
  const fetchData = async () => {
    setLoading(true);
    const periode = getPeriodeString();
    
    try {
      // Panggil API secara paralel
      const [resMitra, resSetting] = await Promise.all([
        axios.get(`${API_URL}/api/spk/mitra/${periode}`),
        axios.get(`${API_URL}/api/spk/setting/${periode}`)
      ]);

      setMitraList(resMitra.data);
      setSpkSetting(resSetting.data || null); // null jika belum disetting (404/empty)

    } catch (err) {
      console.error("Gagal memuat data:", err);
      setMitraList([]);
      setSpkSetting(null);
    } finally {
      setLoading(false);
    }
  };

  // Fetch ulang saat filter berubah
  useEffect(() => {
    fetchData();
  }, [selectedYear, selectedMonth]);

  // --- FILTER CLIENT SIDE ---
  const filteredMitra = useMemo(() => {
    if (!searchQuery) return mitraList;
    const lower = searchQuery.toLowerCase();
    return mitraList.filter(m => 
      m.nama_lengkap.toLowerCase().includes(lower) ||
      (m.nik && m.nik.includes(lower)) ||
      (m.sobat_id && m.sobat_id.toLowerCase().includes(lower))
    );
  }, [mitraList, searchQuery]);

  // --- HANDLER ---
  const handlePrint = (id_mitra) => {
    if (!spkSetting) {
      alert("Mohon atur template surat terlebih dahulu!");
      setShowModal(true);
      return;
    }
    const periode = getPeriodeString();
    navigate(`/admin/spk/print/${periode}/${id_mitra}`);
  };

  return (
    <div className="w-full pb-20 animate-fade-in-up">
      
      {/* HEADER */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <FaFileContract className="text-[#1A2A80]" /> Manajemen SPK
        </h1>
        <p className="text-sm text-gray-500 mt-1">Kelola dan cetak Surat Perjanjian Kerja mitra per periode.</p>
      </div>

      {/* FILTER SECTION */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-6">
        <div className="flex flex-col md:flex-row items-end gap-4">
          
          {/* Filter Tahun */}
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

          {/* Filter Bulan */}
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

          {/* Indikator Loading Kecil */}
          {loading && <div className="text-xs text-gray-400 pb-2 animate-pulse">Sedang memuat data...</div>}
        </div>
      </div>

      {/* STATUS TEMPLATE SPK (ALERT BOX) */}
      <div className={`rounded-xl border p-5 mb-8 flex flex-col md:flex-row justify-between items-center gap-4 transition-colors duration-300 ${spkSetting ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
        <div className="flex items-start gap-4">
            <div className={`p-3 rounded-full text-xl ${spkSetting ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'}`}>
                {spkSetting ? <FaCheckCircle /> : <FaExclamationTriangle />}
            </div>
            <div>
                <h3 className={`font-bold text-lg ${spkSetting ? 'text-green-800' : 'text-yellow-800'}`}>
                    {spkSetting ? 'Template Surat Siap' : 'Template Surat Belum Diatur'}
                </h3>
                <p className={`text-sm mt-1 ${spkSetting ? 'text-green-700' : 'text-yellow-700'}`}>
                    {spkSetting 
                        ? `Nomor Surat: ${spkSetting.nomor_surat_format} | PPK: ${spkSetting.nama_ppk}`
                        : "Anda belum mengatur detail pejabat PPK dan format nomor surat untuk periode ini. SPK tidak dapat dicetak."}
                </p>
            </div>
        </div>
        
        <button 
            onClick={() => setShowModal(true)}
            className={`px-5 py-2.5 rounded-lg text-sm font-bold shadow-sm flex items-center gap-2 whitespace-nowrap transition ${spkSetting ? 'bg-white text-green-700 border border-green-200 hover:bg-green-50' : 'bg-yellow-600 text-white hover:bg-yellow-700'}`}
        >
            <FaEdit /> {spkSetting ? 'Edit Template' : 'Atur Template Sekarang'}
        </button>
      </div>

      {/* SECTION DAFTAR MITRA */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden min-h-[400px]">
        
        {/* Header Tabel & Search */}
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

        {/* Tabel Data */}
        <div className="overflow-x-auto">
            <table className="min-w-full text-sm text-left">
                <thead className="bg-white text-gray-500 border-b border-gray-100 uppercase text-xs font-bold">
                    <tr>
                        <th className="px-6 py-4">Nama Mitra</th>
                        <th className="px-6 py-4">NIK / ID</th>
                        <th className="px-6 py-4">Rekening Bank</th>
                        <th className="px-6 py-4 text-center">Aksi</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {loading ? (
                        <tr><td colSpan="4" className="text-center py-12 text-gray-400 italic">Memuat daftar mitra...</td></tr>
                    ) : filteredMitra.length === 0 ? (
                        <tr><td colSpan="4" className="text-center py-12 text-gray-400 italic bg-gray-50">
                            {searchQuery ? "Tidak ditemukan mitra dengan nama tersebut." : "Tidak ada mitra yang memiliki tugas di periode ini."}
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
                                <td className="px-6 py-4 text-gray-600">
                                    <span className="font-bold">{m.nama_bank}</span> - {m.no_rekening}
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <button 
                                        onClick={() => handlePrint(m.id)}
                                        disabled={!spkSetting}
                                        className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold shadow-sm transition ${spkSetting ? 'bg-[#1A2A80] text-white hover:bg-blue-900' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
                                        title={!spkSetting ? "Atur template dulu" : "Cetak"}
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

      {/* MODAL SETTING */}
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