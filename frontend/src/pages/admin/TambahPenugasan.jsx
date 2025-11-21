import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const getToken = () => localStorage.getItem('token');

const TambahPenugasan = () => {
  const navigate = useNavigate();

  const [listMitra, setListMitra] = useState([]);
  const [listAllSubKegiatan, setListAllSubKegiatan] = useState([]);
  const [listJabatan, setListJabatan] = useState([]);

  const [selectedMitra, setSelectedMitra] = useState(null);
  const [mitraSearch, setMitraSearch] = useState('');
  const [showMitraSuggestions, setShowMitraSuggestions] = useState(false);

  const [rows, setRows] = useState([
    { id: Date.now(), penugasan: null, searchActivity: '', jabatan: '', showDropdown: false }
  ]);

  const [loadingInit, setLoadingInit] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const wrapperRef = useRef(null);

  useEffect(() => {
    const fetchInit = async () => {
      try {
        const token = getToken();
        const headers = { Authorization: `Bearer ${token}` };

        const [resMitra, resSubKegiatan, resJabatan] = await Promise.all([
          axios.get(`${API_URL}/api/mitra`, { headers }),
          axios.get(`${API_URL}/api/subkegiatan`, { headers }),
          axios.get(`${API_URL}/api/jabatan-mitra`, { headers })
        ]);

        setListMitra(resMitra.data);
        setListAllSubKegiatan(resSubKegiatan.data);
        setListJabatan(resJabatan.data);
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
    setRows([...rows, { id: Date.now(), penugasan: null, searchActivity: '', jabatan: '', showDropdown: false }]);
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
    setRows(rows.map(r => {
      if (r.id === rowId) {
        return {
          ...r,
          penugasan: itemSubKegiatan,
          searchActivity: itemSubKegiatan.nama_sub_kegiatan,
          showDropdown: false,
          jabatan: ''
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
           id_mitra: selectedMitra.id
         }, { headers: { Authorization: `Bearer ${token}` } });
      });

      await Promise.all(promises);

      alert("Berhasil menugaskan mitra!");
      navigate('/admin/penugasan');

    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || "Terjadi kesalahan saat menyimpan.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingInit) return <div className="p-8 text-center">Memuat form...</div>;

  return (
    <div className="p-8 max-w-4xl mx-auto min-h-screen pb-20" ref={wrapperRef}>
      <h1 className="text-3xl font-bold text-gray-800 mb-2">Tambah Penugasan Mitra</h1>
      <p className="text-gray-500 mb-8">Pilih mitra dan tentukan kegiatan serta jabatannya.</p>
      
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 space-y-8">
        
        <div className="relative z-50">
          <label className="block text-sm font-bold text-gray-700 mb-1">
            Cari Mitra <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
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
              <button 
                type="button"
                onClick={() => { setSelectedMitra(null); setMitraSearch(''); }}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-red-500"
              >
                &times;
              </button>
            )}
          </div>

          {showMitraSuggestions && mitraSearch && !selectedMitra && (
            <div className="absolute w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-60 overflow-y-auto z-50 animate-fade-in-down">
              {filteredMitra.length === 0 ? (
                <div className="p-4 text-center text-gray-500 text-sm">Mitra tidak ditemukan.</div>
              ) : (
                <ul>
                  {filteredMitra.map(m => (
                    <li 
                      key={m.id}
                      onClick={() => selectMitra(m)}
                      className="px-4 py-3 hover:bg-indigo-50 cursor-pointer border-b last:border-b-0 transition flex justify-between items-center"
                    >
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

        <div className="border-t border-gray-200 my-4"></div>

        <div>
          <h2 className="text-lg font-bold text-gray-800 mb-4">Daftar Kegiatan & Peran</h2>
          
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

                  <div className="flex-1 w-full relative">
                    <label className="block text-xs font-bold text-gray-500 mb-1 md:hidden">Kegiatan</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-medium"
                      placeholder="Cari Kegiatan / Sub Kegiatan..."
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
                              <li 
                                key={sub.id}
                                onClick={() => selectActivity(row.id, sub)}
                                className="px-3 py-2 hover:bg-blue-50 cursor-pointer border-b last:border-b-0 text-sm group"
                              >
                                <div className="font-bold text-gray-700 group-hover:text-blue-700">
                                  {sub.nama_sub_kegiatan}
                                </div>
                                <div className="text-xs text-gray-400 group-hover:text-blue-500">
                                  Induk: {sub.nama_kegiatan}
                                </div>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="w-full md:w-1/3">
                    <label className="block text-xs font-bold text-gray-500 mb-1 md:hidden">Jabatan</label>
                    <select
                      className={`w-full px-3 py-2 border rounded outline-none text-sm ${!row.penugasan ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-white border-gray-300 focus:ring-2 focus:ring-indigo-500'}`}
                      value={row.jabatan}
                      onChange={(e) => updateRow(row.id, 'jabatan', e.target.value)}
                      disabled={!row.penugasan}
                    >
                      <option value="">
                        {availableJabatan.length === 0 ? (row.penugasan ? '-- Tidak ada jabatan khusus --' : '-- Pilih Kegiatan Dulu --') : '-- Pilih Jabatan --'}
                      </option>
                      {availableJabatan.map(j => (
                        <option key={j.kode_jabatan} value={j.kode_jabatan}>
                          {j.nama_jabatan} ({j.kode_jabatan})
                        </option>
                      ))}
                    </select>
                  </div>

                  <button 
                    type="button"
                    onClick={() => removeRow(row.id)}
                    className={`p-2 rounded hover:bg-red-100 text-red-500 transition ${rows.length === 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
                    disabled={rows.length === 1}
                    title="Hapus baris ini"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                  </button>
                </div>
              );
            })}
          </div>

          <button
            type="button"
            onClick={addRow}
            className="mt-4 w-full py-3 border-2 border-dashed border-indigo-200 rounded-lg text-indigo-600 font-bold hover:bg-indigo-50 hover:border-indigo-400 transition flex justify-center items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
            Tambah Kegiatan Lain
          </button>
        </div>

        <div className="flex justify-end gap-4 pt-6 border-t border-gray-100">
          <Link to="/admin/penugasan" className="px-6 py-2 rounded-lg text-gray-600 hover:bg-gray-100 font-medium">
            Batal
          </Link>
          <button 
            type="submit" 
            disabled={submitting}
            className="px-8 py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 shadow-lg transform active:scale-95 transition disabled:bg-gray-400"
          >
            {submitting ? 'Menyimpan...' : 'Simpan Semua Penugasan'}
          </button>
        </div>

      </form>
    </div>
  );
};

export default TambahPenugasan;