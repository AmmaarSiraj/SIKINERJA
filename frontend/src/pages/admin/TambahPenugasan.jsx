import React, { useState, useEffect, useRef, useMemo } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';

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

  if (loadingInit) return <div className="p-8 text-center">Memuat form...</div>;

  return (
    <div className="p-8 max-w-5xl mx-auto min-h-screen pb-20" ref={wrapperRef}>
      <h1 className="text-3xl font-bold text-gray-800 mb-2">Tambah Penugasan Mitra</h1>
      <p className="text-gray-500 mb-8">Pilih mitra dan atur alokasi kegiatan sesuai batas anggaran.</p>
      
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 space-y-8">
        
        <div className="relative z-50">
          <label className="block text-sm font-bold text-gray-700 mb-1">
            Cari Mitra <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </div>
            <input
              type="text"
              className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition ${selectedMitra ? 'bg-green-50 border-green-300 text-green-800 font-semibold' : 'bg-white border-gray-300'}`}
              placeholder="Ketik nama atau NIK..."
              value={mitraSearch}
              onChange={handleMitraChange}
              onFocus={() => setShowMitraSuggestions(true)}
              autoComplete="off"
            />
            {selectedMitra && (
              <button type="button" onClick={() => { setSelectedMitra(null); setMitraSearch(''); }} className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-red-500">&times;</button>
            )}
          </div>

          {showMitraSuggestions && mitraSearch && !selectedMitra && (
            <div className="absolute w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-60 overflow-y-auto z-50 animate-fade-in-down">
              {filteredMitra.length === 0 ? (
                <div className="p-4 text-center text-gray-500 text-sm">Mitra tidak ditemukan.</div>
              ) : (
                <ul>
                  {filteredMitra.map(m => (
                    <li key={m.id} onClick={() => selectMitra(m)} className="px-4 py-3 hover:bg-indigo-50 cursor-pointer border-b last:border-b-0 transition flex justify-between items-center">
                      <div>
                        <p className="font-bold text-gray-800 text-sm">{m.nama_lengkap}</p>
                        <p className="text-xs text-gray-500">{m.nik}</p>
                      </div>
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">Pilih</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        {selectedMitra && (
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <div className="flex justify-between items-end mb-2">
              <span className="text-sm font-bold text-gray-700">Penggunaan Honor Bulanan</span>
              <div className="text-right">
                <span className={`text-lg font-bold ${isOverLimit ? 'text-red-600' : 'text-green-600'}`}>
                  {formatRupiah(totalHonorDiajukan)}
                </span>
                <span className="text-sm text-gray-500 mx-1">/</span>
                <span className="text-sm text-gray-600">{formatRupiah(batasHonor)}</span>
              </div>
            </div>
            
            <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
              <div 
                className={`h-full transition-all duration-500 ease-out ${isOverLimit ? 'bg-red-500' : 'bg-green-500'}`}
                style={{ width: `${Math.min(persentaseTerpakai, 100)}%` }}
              ></div>
            </div>
            
            {isOverLimit ? (
              <p className="text-xs text-red-600 mt-1 font-bold">⚠️ Total honor melebihi batas maksimum mitra!</p>
            ) : (
              <p className="text-xs text-gray-500 mt-1">Sisa anggaran: {formatRupiah(Math.max(batasHonor - totalHonorDiajukan, 0))}</p>
            )}
          </div>
        )}

        <div className="border-t border-gray-200 my-4"></div>

        <div>
          <h2 className="text-lg font-bold text-gray-800 mb-4">Daftar Kegiatan & Tarif</h2>
          
          <div className="space-y-4">
            {rows.map((row, index) => {
              const availableJabatan = row.penugasan 
                ? listJabatan.filter(j => j.id_subkegiatan === row.penugasan.id)
                : [];

              const filteredActivities = listAllSubKegiatan.filter(item => 
                item.nama_sub_kegiatan.toLowerCase().includes(row.searchActivity.toLowerCase()) ||
                item.nama_kegiatan.toLowerCase().includes(row.searchActivity.toLowerCase())
              );

              return (
                <div key={row.id} className="relative bg-gray-50 p-4 rounded-xl border border-gray-200 flex flex-col md:flex-row gap-4 items-start md:items-center z-10">
                  
                  <span className="hidden md:flex bg-white w-8 h-8 rounded-full border border-gray-300 items-center justify-center text-sm font-bold text-gray-500 flex-shrink-0">
                    {index + 1}
                  </span>

                  <div className="flex-[2] w-full relative">
                    <label className="block text-xs font-bold text-gray-500 mb-1 md:hidden">Kegiatan</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-medium"
                      placeholder="Cari Sub Kegiatan..."
                      value={row.searchActivity}
                      onChange={(e) => updateRow(row.id, 'searchActivity', e.target.value)}
                      onFocus={() => toggleActivityDropdown(row.id, true)}
                    />
                    {row.showDropdown && (
                      <div className="absolute w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-xl max-h-48 overflow-y-auto z-[100]">
                        {filteredActivities.length === 0 ? (
                          <div className="p-3 text-xs text-center text-gray-400">Tidak ada kegiatan cocok.</div>
                        ) : (
                          <ul>
                            {filteredActivities.map(sub => (
                              <li key={sub.id} onClick={() => selectActivity(row.id, sub)} className="px-3 py-2 hover:bg-blue-50 cursor-pointer border-b last:border-b-0 text-sm group">
                                <div className="font-bold text-gray-700 group-hover:text-blue-700">{sub.nama_sub_kegiatan}</div>
                                <div className="text-xs text-gray-400 group-hover:text-blue-500">{sub.nama_kegiatan}</div>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex-1 w-full md:w-auto bg-white px-3 py-2 border border-gray-200 rounded text-sm text-gray-700">
                    <label className="block text-[10px] text-gray-400 font-bold mb-0.5 uppercase">Honor</label>
                    {row.penugasan ? (
                        <div>
                            <span className="font-bold text-green-700">{formatRupiah(row.tarif)}</span>
                            <span className="text-xs text-gray-500"> / {row.satuan}</span>
                        </div>
                    ) : (
                        <span className="text-gray-400 text-xs italic">- Pilih kegiatan -</span>
                    )}
                  </div>

                  <div className="flex-1 w-full">
                    <label className="block text-xs font-bold text-gray-500 mb-1 md:hidden">Jabatan</label>
                    <select
                      className={`w-full px-3 py-2 border rounded outline-none text-sm ${!row.penugasan ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-white border-gray-300 focus:ring-2 focus:ring-indigo-500'}`}
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

                  <button type="button" onClick={() => removeRow(row.id)} className={`p-2 rounded hover:bg-red-100 text-red-500 transition ${rows.length === 1 ? 'opacity-50 cursor-not-allowed' : ''}`} disabled={rows.length === 1}>
                    &times;
                  </button>
                </div>
              );
            })}
          </div>

          <button
            type="button"
            onClick={addRow}
            disabled={isOverLimit}
            className={`mt-4 w-full py-3 border-2 border-dashed rounded-lg font-bold transition flex justify-center items-center gap-2 ${isOverLimit ? 'border-gray-300 text-gray-400 cursor-not-allowed' : 'border-indigo-200 text-indigo-600 hover:bg-indigo-50 hover:border-indigo-400'}`}
          >
            + Tambah Kegiatan Lain
          </button>
        </div>

        <div className="flex justify-end gap-4 pt-6 border-t border-gray-100">
          <Link to="/admin/penugasan" className="px-6 py-2 rounded-lg text-gray-600 hover:bg-gray-100 font-medium">Batal</Link>
          <button 
            type="submit" 
            disabled={submitting || isOverLimit}
            className={`px-8 py-2 text-white font-bold rounded-lg shadow-lg transform active:scale-95 transition ${isOverLimit ? 'bg-gray-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'}`}
          >
            {submitting ? 'Menyimpan...' : 'Simpan Penugasan'}
          </button>
        </div>

      </form>
    </div>
  );
};

export default TambahPenugasan;