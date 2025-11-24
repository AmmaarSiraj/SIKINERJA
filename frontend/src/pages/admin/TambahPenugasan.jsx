// src/pages/admin/TambahPenugasan.jsx
import React, { useState, useEffect, useRef, useMemo } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
// 1. IMPORT ICON
import { 
  FaArrowLeft, 
  FaSearch, 
  FaUserCheck, 
  FaMoneyBillWave, 
  FaPlus, 
  FaTrash, 
  FaSave,
  FaTimes,
  FaExclamationTriangle
} from 'react-icons/fa';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const getToken = () => localStorage.getItem('token');

const TambahPenugasan = () => {
  const navigate = useNavigate();

  const [listMitra, setListMitra] = useState([]);
  const [listAllSubKegiatan, setListAllSubKegiatan] = useState([]);
  const [listJabatan, setListJabatan] = useState([]);
  const [listHonorarium, setListHonorarium] = useState([]);

  const [selectedMitra, setSelectedMitra] = useState(null);
  const [mitraSearch, setMitraSearch] = useState('');
  const [showMitraSuggestions, setShowMitraSuggestions] = useState(false);

  const [rows, setRows] = useState([
    { id: Date.now(), penugasan: null, searchActivity: '', jabatan: '', tarif: 0, satuan: '', showDropdown: false }
  ]);

  const [loadingInit, setLoadingInit] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const wrapperRef = useRef(null);

  useEffect(() => {
    const fetchInit = async () => {
      try {
        const token = getToken();
        const headers = { Authorization: `Bearer ${token}` };

        const [resMitra, resSub, resJab, resHonor] = await Promise.all([
          axios.get(`${API_URL}/api/mitra`, { headers }),
          axios.get(`${API_URL}/api/subkegiatan`, { headers }),
          axios.get(`${API_URL}/api/jabatan-mitra`, { headers }),
          axios.get(`${API_URL}/api/honorarium`, { headers })
        ]);

        setListMitra(resMitra.data);
        setListAllSubKegiatan(resSub.data);
        setListJabatan(resJab.data);
        setListHonorarium(resHonor.data);
      } catch (err) {
        console.error(err);
        alert("Gagal memuat data awal.");
      } finally {
        setLoadingInit(false);
      }
    };
    fetchInit();

    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowMitraSuggestions(false);
        setRows(prev => prev.map(r => ({ ...r, showDropdown: false })));
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const formatRupiah = (num) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);
  };

  const totalHonorDiajukan = useMemo(() => {
    return rows.reduce((acc, row) => acc + (row.tarif || 0), 0);
  }, [rows]);

  const batasHonor = selectedMitra ? Number(selectedMitra.batas_honor_bulanan) : 0;
  const persentaseTerpakai = batasHonor > 0 ? (totalHonorDiajukan / batasHonor) * 100 : 0;
  const isOverLimit = totalHonorDiajukan > batasHonor;

  const handleMitraChange = (e) => {
    setMitraSearch(e.target.value);
    setShowMitraSuggestions(true);
    setSelectedMitra(null);
  };

  const selectMitra = (mitra) => {
    setSelectedMitra(mitra);
    setMitraSearch(`${mitra.nama_lengkap} - ${mitra.nik}`);
    setShowMitraSuggestions(false);
  };

  const filteredMitra = listMitra.filter(m => 
    m.nama_lengkap.toLowerCase().includes(mitraSearch.toLowerCase()) ||
    m.nik.includes(mitraSearch)
  );

  const addRow = () => {
    if (isOverLimit) return alert("Batas honor bulanan mitra sudah terlampaui!");
    setRows([...rows, { id: Date.now(), penugasan: null, searchActivity: '', jabatan: '', tarif: 0, satuan: '', showDropdown: false }]);
  };

  const removeRow = (id) => {
    if (rows.length > 1) {
      setRows(rows.filter(r => r.id !== id));
    }
  };

  const updateRow = (id, field, value) => {
    setRows(rows.map(r => {
      if (r.id === id) return { ...r, [field]: value };
      return r;
    }));
  };

  const selectActivity = (rowId, itemSubKegiatan) => {
    const foundHonor = listHonorarium.find(h => h.id_subkegiatan === itemSubKegiatan.id);
    const tarif = foundHonor ? Number(foundHonor.tarif) : 0;
    const satuan = foundHonor ? foundHonor.satuan_alias || foundHonor.nama_satuan : '-';

    setRows(rows.map(r => {
      if (r.id === rowId) {
        return {
          ...r,
          penugasan: itemSubKegiatan,
          searchActivity: itemSubKegiatan.nama_sub_kegiatan,
          showDropdown: false,
          jabatan: '',
          tarif: tarif,
          satuan: satuan
        };
      }
      return r;
    }));
  };

  const toggleActivityDropdown = (rowId, status) => {
    setRows(rows.map(r => r.id === rowId ? { ...r, showDropdown: status } : { ...r, showDropdown: false }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedMitra) return alert("Harap pilih Mitra terlebih dahulu.");
    const invalidRow = rows.find(r => !r.penugasan);
    if (invalidRow) return alert("Pastikan semua baris kegiatan telah diisi.");
    
    if (isOverLimit) return alert(`Gagal! Total honor Rp ${formatRupiah(totalHonorDiajukan)} melebihi batas Rp ${formatRupiah(batasHonor)}.`);

    setSubmitting(true);
    const token = getToken();

    try {
      const storedUser = JSON.parse(localStorage.getItem('user'));
      const currentUserId = storedUser ? storedUser.id : 1;

      const promises = rows.map(async (row) => {
         const resPenugasan = await axios.post(`${API_URL}/api/penugasan`, {
             id_subkegiatan: row.penugasan.id,
             id_pengawas: currentUserId, 
             jumlah_max_mitra: 50
         }, { headers: { Authorization: `Bearer ${token}` } });
         
         const newPenugasanId = resPenugasan.data.id_penugasan || resPenugasan.data.id;

         await axios.post(`${API_URL}/api/kelompok-penugasan`, {
           id_penugasan: newPenugasanId,
           id_mitra: selectedMitra.id,
         }, { headers: { Authorization: `Bearer ${token}` } });
      });

      await Promise.all(promises);

      const activitiesData = rows.map(r => ({
          ...r,
          jabatanList: listJabatan
      }));

      navigate('/admin/penugasan/preview', { 
        state: { 
          mitra: selectedMitra, 
          activities: activitiesData 
        } 
      });

    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || "Terjadi kesalahan saat menyimpan.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingInit) return <div className="text-center py-10 text-gray-500">Memuat form...</div>;

  return (
    <div className="w-full max-w-5xl mx-auto pb-20" ref={wrapperRef}>
      
      {/* Header Navigasi */}
      <div className="mb-6">
        <Link 
          to="/admin/penugasan" 
          className="inline-flex items-center gap-2 text-gray-500 hover:text-[#1A2A80] transition font-medium"
        >
          <FaArrowLeft size={14} /> Kembali ke Daftar
        </Link>
      </div>

      {/* Card Form */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        
        {/* Header Card */}
        <div className="px-8 py-6 bg-gray-50/50 border-b border-gray-100">
            <h2 className="text-xl font-bold text-gray-800">Tambah Penugasan Mitra</h2>
            <p className="text-sm text-gray-500 mt-1">Alokasikan kegiatan untuk mitra sesuai anggaran.</p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-8">
            
            {/* SECTION 1: PILIH MITRA */}
            <div className="space-y-4">
                <label className="block text-sm font-bold text-gray-700 mb-1 flex items-center gap-2">
                    <FaUserCheck className="text-[#1A2A80]" /> Cari Mitra <span className="text-red-500">*</span>
                </label>
                
                {/* Input Search */}
                <div className="relative z-50">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <FaSearch className="text-gray-400" />
                    </div>
                    <input
                        type="text"
                        className={`w-full pl-11 pr-10 py-3 border rounded-xl focus:ring-2 focus:ring-[#1A2A80] focus:border-[#1A2A80] outline-none transition shadow-sm ${selectedMitra ? 'bg-blue-50 border-blue-200 text-[#1A2A80] font-bold' : 'bg-white border-gray-200 text-gray-700'}`}
                        placeholder="Ketik nama atau NIK mitra..."
                        value={mitraSearch}
                        onChange={handleMitraChange}
                        onFocus={() => setShowMitraSuggestions(true)}
                        autoComplete="off"
                    />
                    {selectedMitra && (
                        <button 
                            type="button" 
                            onClick={() => { setSelectedMitra(null); setMitraSearch(''); }} 
                            className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-red-500 transition"
                        >
                            <FaTimes />
                        </button>
                    )}

                    {/* Dropdown Suggestions */}
                    {showMitraSuggestions && mitraSearch && !selectedMitra && (
                        <div className="absolute w-full mt-2 bg-white border border-gray-100 rounded-xl shadow-xl max-h-60 overflow-y-auto z-50 animate-fade-in-down">
                            {filteredMitra.length === 0 ? (
                                <div className="p-4 text-center text-gray-500 text-sm italic">Mitra tidak ditemukan.</div>
                            ) : (
                                <ul className="py-2">
                                    {filteredMitra.map(m => (
                                        <li key={m.id} onClick={() => selectMitra(m)} className="px-5 py-3 hover:bg-blue-50 cursor-pointer transition flex justify-between items-center group">
                                            <div>
                                                <p className="font-bold text-gray-800 text-sm group-hover:text-[#1A2A80]">{m.nama_lengkap}</p>
                                                <p className="text-xs text-gray-500">{m.nik}</p>
                                            </div>
                                            <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded group-hover:bg-white group-hover:text-[#1A2A80] group-hover:shadow-sm transition">Pilih</span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    )}
                </div>

                {/* Progress Bar Anggaran */}
                {selectedMitra && (
                    <div className="bg-gray-50 p-5 rounded-xl border border-gray-200 animate-fade-in-up">
                        <div className="flex justify-between items-end mb-3">
                            <span className="text-sm font-bold text-gray-700 flex items-center gap-2">
                                <FaMoneyBillWave className="text-green-600" /> Penggunaan Honor Bulanan
                            </span>
                            <div className="text-right">
                                <span className={`text-lg font-bold ${isOverLimit ? 'text-red-600' : 'text-green-600'}`}>
                                    {formatRupiah(totalHonorDiajukan)}
                                </span>
                                <span className="text-sm text-gray-400 mx-2">/</span>
                                <span className="text-sm text-gray-600 font-medium">{formatRupiah(batasHonor)}</span>
                            </div>
                        </div>
                        
                        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                            <div 
                                className={`h-full transition-all duration-500 ease-out rounded-full ${isOverLimit ? 'bg-red-500' : 'bg-green-500'}`}
                                style={{ width: `${Math.min(persentaseTerpakai, 100)}%` }}
                            ></div>
                        </div>
                        
                        <div className="mt-2 flex justify-between items-start">
                            {isOverLimit ? (
                                <p className="text-xs text-red-600 font-bold flex items-center gap-1">
                                    <FaExclamationTriangle /> Total honor melebihi batas maksimum!
                                </p>
                            ) : (
                                <p className="text-xs text-gray-500">Aman. Masih tersedia ruang anggaran.</p>
                            )}
                            <p className="text-xs text-gray-500 font-mono">
                                Sisa: {formatRupiah(Math.max(batasHonor - totalHonorDiajukan, 0))}
                            </p>
                        </div>
                    </div>
                )}
            </div>

            <hr className="border-gray-100" />

            {/* SECTION 2: DAFTAR KEGIATAN */}
            <div>
                <h3 className="text-lg font-bold text-gray-800 mb-4">Rincian Kegiatan</h3>
                
                <div className="space-y-4">
                    {rows.map((row, index) => {
                        const availableJabatan = row.penugasan 
                            ? listJabatan.filter(j => j.id_subkegiatan === row.penugasan.id)
                            : [];

                        const filteredActivities = listAllSubKegiatan.filter(item => 
                            item.nama_sub_kegiatan.toLowerCase().includes(row.searchActivity.toLowerCase()) ||
                            item.nama_kegiatan && item.nama_kegiatan.toLowerCase().includes(row.searchActivity.toLowerCase())
                        );

                        return (
                            <div key={row.id} className="relative bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:border-blue-300 transition-colors flex flex-col md:flex-row gap-5 items-start md:items-center z-10">
                                
                                {/* Number Badge */}
                                <span className="hidden md:flex bg-blue-50 w-8 h-8 rounded-full border border-blue-100 items-center justify-center text-sm font-bold text-[#1A2A80] flex-shrink-0">
                                    {index + 1}
                                </span>

                                {/* Input Kegiatan */}
                                <div className="flex-[2] w-full relative">
                                    <label className="block text-xs font-bold text-gray-500 mb-1 md:hidden">Kegiatan</label>
                                    <input
                                        type="text"
                                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#1A2A80] focus:border-[#1A2A80] outline-none text-sm font-medium transition"
                                        placeholder="Cari nama kegiatan..."
                                        value={row.searchActivity}
                                        onChange={(e) => updateRow(row.id, 'searchActivity', e.target.value)}
                                        onFocus={() => toggleActivityDropdown(row.id, true)}
                                    />
                                    {/* Dropdown Results */}
                                    {row.showDropdown && (
                                        <div className="absolute w-full mt-1 bg-white border border-gray-100 rounded-lg shadow-xl max-h-60 overflow-y-auto z-[60]">
                                            {filteredActivities.length === 0 ? (
                                                <div className="p-3 text-xs text-center text-gray-400">Tidak ada kegiatan cocok.</div>
                                            ) : (
                                                <ul>
                                                    {filteredActivities.map(sub => (
                                                        <li key={sub.id} onClick={() => selectActivity(row.id, sub)} className="px-4 py-2.5 hover:bg-blue-50 cursor-pointer border-b border-gray-50 last:border-b-0 text-sm group">
                                                            <div className="font-bold text-gray-700 group-hover:text-[#1A2A80]">{sub.nama_sub_kegiatan}</div>
                                                            <div className="text-xs text-gray-400 group-hover:text-blue-500">{sub.nama_kegiatan || 'Induk tidak diketahui'}</div>
                                                        </li>
                                                    ))}
                                                </ul>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Info Honor (Read Only) */}
                                <div className="flex-1 w-full md:w-auto bg-gray-50 px-4 py-2.5 border border-gray-200 rounded-lg">
                                    <label className="block text-[10px] text-gray-400 font-bold uppercase mb-0.5">Tarif Honor</label>
                                    {row.penugasan ? (
                                        <div className="text-sm">
                                            <span className="font-bold text-green-700">{formatRupiah(row.tarif)}</span>
                                            <span className="text-xs text-gray-500"> / {row.satuan}</span>
                                        </div>
                                    ) : (
                                        <span className="text-gray-400 text-xs italic">-</span>
                                    )}
                                </div>

                                {/* Select Jabatan */}
                                <div className="flex-1 w-full">
                                    <label className="block text-xs font-bold text-gray-500 mb-1 md:hidden">Jabatan</label>
                                    <select
                                        className={`w-full px-4 py-2.5 border rounded-lg outline-none text-sm transition ${!row.penugasan ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200' : 'bg-white border-gray-200 focus:ring-2 focus:ring-[#1A2A80] focus:border-[#1A2A80]'}`}
                                        value={row.jabatan}
                                        onChange={(e) => updateRow(row.id, 'jabatan', e.target.value)}
                                        disabled={!row.penugasan}
                                    >
                                        <option value="">{availableJabatan.length === 0 ? '-- Default --' : '-- Pilih Jabatan --'}</option>
                                        {availableJabatan.map(j => (
                                            <option key={j.kode_jabatan} value={j.kode_jabatan}>{j.nama_jabatan}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Delete Row Button */}
                                <button 
                                    type="button" 
                                    onClick={() => removeRow(row.id)} 
                                    className={`p-2.5 rounded-lg transition text-gray-400 hover:text-red-600 hover:bg-red-50 ${rows.length === 1 ? 'opacity-30 cursor-not-allowed' : ''}`}
                                    disabled={rows.length === 1}
                                >
                                    <FaTrash />
                                </button>
                            </div>
                        )
                    })}
                </div>

                {/* Add Row Button */}
                <button
                    type="button"
                    onClick={addRow}
                    disabled={isOverLimit}
                    className={`mt-5 w-full py-3 border-2 border-dashed rounded-xl font-bold transition flex justify-center items-center gap-2 ${isOverLimit ? 'border-gray-300 text-gray-400 cursor-not-allowed' : 'border-blue-200 text-[#1A2A80] hover:bg-blue-50 hover:border-[#1A2A80]'}`}
                >
                    <FaPlus /> Tambah Kegiatan Lain
                </button>
            </div>

            {/* Footer Actions */}
            <div className="pt-6 border-t border-gray-100 flex justify-end gap-3">
                <Link 
                    to="/admin/penugasan" 
                    className="px-6 py-2.5 rounded-lg text-gray-600 hover:bg-gray-100 font-bold transition text-sm"
                >
                    Batal
                </Link>
                <button 
                    type="submit" 
                    disabled={submitting || isOverLimit}
                    className={`flex items-center gap-2 px-8 py-2.5 text-white font-bold rounded-lg shadow-lg transform active:scale-95 transition text-sm ${isOverLimit ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#1A2A80] hover:bg-blue-900'}`}
                >
                    {submitting ? 'Menyimpan...' : <><FaSave /> Simpan Penugasan</>}
                </button>
            </div>

        </form>
      </div>
    </div>
  );
};

export default TambahPenugasan;