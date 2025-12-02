import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { 
  FaArrowRight, FaArrowLeft, FaCheck, FaClipboardList, 
  FaUserTie, FaIdCard, FaSearch, FaTimes, FaUsers, FaMoneyBillWave,
  FaExclamationCircle 
} from 'react-icons/fa';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const TambahPenugasan = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Data Master
  const [listKegiatan, setListKegiatan] = useState([]);
  const [listSubKegiatan, setListSubKegiatan] = useState([]); 
  const [allSubKegiatan, setAllSubKegiatan] = useState([]); 
  const [listMitra, setListMitra] = useState([]);
  const [listHonorarium, setListHonorarium] = useState([]); 
  const [listAturan, setListAturan] = useState([]);
  const [listKelompok, setListKelompok] = useState([]);
  const [listPenugasan, setListPenugasan] = useState([]);

  // Form State
  const [selectedKegiatanId, setSelectedKegiatanId] = useState('');
  const [selectedSubId, setSelectedSubId] = useState('');
  
  const [selectedMitras, setSelectedMitras] = useState([]); 
  
  const [mitraSearch, setMitraSearch] = useState('');
  const [showMitraDropdown, setShowMitraDropdown] = useState(false);

  // Finance State
  const [batasHonorPeriode, setBatasHonorPeriode] = useState(0);
  const [mitraIncomeMap, setMitraIncomeMap] = useState({});

  // 1. FETCH DATA MASTER
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        const headers = { Authorization: `Bearer ${token}` };

        const [resKeg, resMitra, resHonor, resAturan, resKelompok, resPenugasan, resAllSub] = await Promise.all([
          axios.get(`${API_URL}/api/kegiatan`, { headers }),
          axios.get(`${API_URL}/api/mitra`, { headers }),
          axios.get(`${API_URL}/api/honorarium`, { headers }),
          axios.get(`${API_URL}/api/aturan-periode`, { headers }),
          axios.get(`${API_URL}/api/kelompok-penugasan`, { headers }),
          axios.get(`${API_URL}/api/penugasan`, { headers }),
          axios.get(`${API_URL}/api/subkegiatan`, { headers })
        ]);

        setListKegiatan(resKeg.data);
        setListMitra(resMitra.data);
        setListHonorarium(resHonor.data);
        setListAturan(resAturan.data);
        setListKelompok(resKelompok.data);
        setListPenugasan(resPenugasan.data);
        setAllSubKegiatan(resAllSub.data);

      } catch (err) {
        console.error(err);
        Swal.fire('Error', 'Gagal memuat data master', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // 2. FILTER SUB KEGIATAN
  useEffect(() => {
    const fetchSubDropdown = async () => {
        if (!selectedKegiatanId) {
            setListSubKegiatan([]);
            return;
        }
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${API_URL}/api/subkegiatan/kegiatan/${selectedKegiatanId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setListSubKegiatan(res.data);
        } catch (err) {
            console.error("Gagal load sub kegiatan:", err);
        }
    };
    fetchSubDropdown();
  }, [selectedKegiatanId]);

  // 3. HITUNG PENDAPATAN & LIMIT
  useEffect(() => {
    if (!selectedSubId) {
      setBatasHonorPeriode(0);
      setMitraIncomeMap({});
      return;
    }

    const subInfo = listSubKegiatan.find(s => s.id === selectedSubId);
    if (!subInfo || !subInfo.periode) return;
    
    const periode = subInfo.periode;
    const aturan = listAturan.find(r => r.periode === periode);
    setBatasHonorPeriode(aturan ? Number(aturan.batas_honor) : 0);

    const incomeMap = {};
    
    listKelompok.forEach(k => {
      const penugasan = listPenugasan.find(p => p.id_penugasan === k.id_penugasan);
      if (!penugasan) return;
      
      const sub = allSubKegiatan.find(s => s.id === penugasan.id_subkegiatan);
      if (!sub || sub.periode !== periode) return;

      const honor = listHonorarium.find(h => h.id_subkegiatan === sub.id && h.kode_jabatan === k.kode_jabatan);
      const tarif = honor ? Number(honor.tarif) : 0;

      const mId = String(k.id_mitra);
      incomeMap[mId] = (incomeMap[mId] || 0) + tarif;
    });

    setMitraIncomeMap(incomeMap);

  }, [selectedSubId, listSubKegiatan, listAturan, listKelompok, listPenugasan, allSubKegiatan, listHonorarium]);

  // 4. FILTER MITRA SUDAH BERTUGAS
  const unavailableMitraIds = useMemo(() => {
    if (!selectedSubId) return new Set();

    const relatedPenugasanIds = listPenugasan
      .filter(p => String(p.id_subkegiatan) === String(selectedSubId))
      .map(p => p.id_penugasan);

    const assignedIds = listKelompok
      .filter(k => relatedPenugasanIds.includes(k.id_penugasan))
      .map(k => String(k.id_mitra));

    return new Set(assignedIds);
  }, [selectedSubId, listPenugasan, listKelompok]);

  const formatRupiah = (num) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);
  };

  const availableJabatan = listHonorarium.filter(
    h => h.id_subkegiatan === selectedSubId
  );

  const handleNextStep = () => {
    if (!selectedKegiatanId || !selectedSubId) {
      Swal.fire('Perhatian', 'Silakan pilih Kegiatan dan Sub Kegiatan terlebih dahulu.', 'warning');
      return;
    }
    setStep(2);
  };

  const handleAddMitra = (mitra) => {
    if (selectedMitras.some(m => m.id === mitra.id)) return;
    const defaultJabatan = ''; 
    setSelectedMitras([...selectedMitras, { ...mitra, assignedJabatan: defaultJabatan }]);
    setMitraSearch(''); 
    setShowMitraDropdown(false);
  };

  const handleRemoveMitra = (mitraId) => {
    setSelectedMitras(selectedMitras.filter(m => m.id !== mitraId));
  };

  const handleUpdateMitraJabatan = (mitraId, newJabatan) => {
    setSelectedMitras(prev => prev.map(m => 
      m.id === mitraId ? { ...m, assignedJabatan: newJabatan } : m
    ));
  };

  // --- LOGIKA UTAMA PERUBAHAN ---
  const handleSubmit = async () => {
    // 1. Validasi Dasar
    if (selectedMitras.length === 0) {
      return Swal.fire('Perhatian', 'Belum ada mitra yang dipilih.', 'warning');
    }
    
    const incompleteMitra = selectedMitras.find(m => !m.assignedJabatan);
    if (incompleteMitra) {
      return Swal.fire('Data Belum Lengkap', `Harap pilih jabatan untuk mitra: ${incompleteMitra.nama_lengkap}`, 'warning');
    }

    // 2. Validasi Batas Honor
    const overLimitUser = selectedMitras.find(m => {
        const hInfo = availableJabatan.find(h => h.kode_jabatan === m.assignedJabatan);
        const honor = hInfo ? Number(hInfo.tarif) : 0;
        const current = mitraIncomeMap[String(m.id)] || 0;
        return batasHonorPeriode > 0 && (current + honor) > batasHonorPeriode;
    });

    if (overLimitUser) {
        return Swal.fire(
            'Gagal Menyimpan', 
            `Mitra <b>${overLimitUser.nama_lengkap}</b> melebihi batas honor periode ini. Silakan kurangi honor atau hapus dari daftar.`, 
            'error'
        );
    }

    setSubmitting(true);
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));
    const headers = { Authorization: `Bearer ${token}` };

    try {
      // 3. Cek apakah Penugasan (Header) untuk sub kegiatan ini sudah ada?
      // listPenugasan memiliki properti: id_penugasan, id_subkegiatan, dll.
      const existingPenugasan = listPenugasan.find(
        p => String(p.id_subkegiatan) === String(selectedSubId)
      );

      if (existingPenugasan) {
        // --- SKENARIO A: PENUGASAN SUDAH ADA ---
        // Kita hanya perlu menambahkan mitra ke penugasan tersebut
        const idPenugasanExist = existingPenugasan.id_penugasan;

        // Kita lakukan loop request karena endpoint createPenugasan yang bulk create juga membuat header baru.
        // Endpoint /api/kelompok-penugasan hanya menerima satu per satu (berdasarkan kode controller yang ada).
        const promises = selectedMitras.map(m => {
            return axios.post(`${API_URL}/api/kelompok-penugasan`, {
                id_penugasan: idPenugasanExist,
                id_mitra: m.id,
                kode_jabatan: m.assignedJabatan
            }, { headers });
        });

        await Promise.all(promises);

        Swal.fire({
            title: 'Berhasil Ditambahkan',
            text: `Mitra berhasil ditambahkan ke penugasan yang sudah ada (ID: ${idPenugasanExist}).`,
            icon: 'success',
            timer: 2000,
            showConfirmButton: false
        }).then(() => navigate('/admin/penugasan'));

      } else {
        // --- SKENARIO B: PENUGASAN BELUM ADA (BUAT BARU) ---
        const payload = {
            id_subkegiatan: selectedSubId,
            id_pengawas: user ? user.id : 1,
            anggota: selectedMitras.map(m => ({
                id_mitra: m.id,
                kode_jabatan: m.assignedJabatan
            }))
        };

        await axios.post(`${API_URL}/api/penugasan`, payload, { headers });

        Swal.fire({
            title: 'Berhasil Dibuat',
            text: 'Penugasan baru dan tim berhasil disimpan.',
            icon: 'success',
            timer: 2000,
            showConfirmButton: false
        }).then(() => navigate('/admin/penugasan'));
      }

    } catch (err) {
      console.error(err);
      // Tangani error jika salah satu request gagal (misal validasi backend)
      const msg = err.response?.data?.error || err.message || 'Terjadi kesalahan saat menyimpan.';
      Swal.fire('Gagal', msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredMitra = listMitra.filter(m => {
    const matchSearch = m.nama_lengkap.toLowerCase().includes(mitraSearch.toLowerCase()) || m.nik.includes(mitraSearch);
    const notSelected = !selectedMitras.some(selected => selected.id === m.id);
    const notAlreadyAssigned = !unavailableMitraIds.has(String(m.id));
    return matchSearch && notSelected && notAlreadyAssigned;
  });

  if (loading) return <div className="text-center py-20 text-gray-500">Memuat formulir...</div>;

  return (
    <div className="max-w-6xl mx-auto pb-20">
      
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Wizard Penugasan Mitra</h1>
        <div className="flex items-center gap-2 text-sm text-gray-500 mt-2">
          <span className={`px-3 py-1 rounded-full ${step === 1 ? 'bg-[#1A2A80] text-white font-bold' : 'bg-gray-200'}`}>1. Pilih Kegiatan</span>
          <span className="text-gray-300">-----</span>
          <span className={`px-3 py-1 rounded-full ${step === 2 ? 'bg-[#1A2A80] text-white font-bold' : 'bg-gray-200'}`}>2. Mitra & Jabatan</span>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden min-h-[400px] flex flex-col">
        
        {step === 1 && (
          <div className="p-8 animate-fade-in-up flex-1 flex flex-col">
            <h2 className="text-lg font-bold text-gray-700 mb-6 flex items-center gap-2">
              <FaClipboardList className="text-[#1A2A80]" /> Tentukan Sasaran Kegiatan
            </h2>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-gray-600 mb-2">Pilih Kegiatan Utama</label>
                <select 
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1A2A80] outline-none"
                  value={selectedKegiatanId}
                  onChange={(e) => { setSelectedKegiatanId(e.target.value); setSelectedSubId(''); }}
                >
                  <option value="">-- Pilih Kegiatan --</option>
                  {listKegiatan.map(k => (
                    <option key={k.id} value={k.id}>{k.nama_kegiatan}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-600 mb-2">Pilih Sub Kegiatan</label>
                <select 
                  className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1A2A80] outline-none ${!selectedKegiatanId ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}`}
                  value={selectedSubId}
                  onChange={(e) => setSelectedSubId(e.target.value)}
                  disabled={!selectedKegiatanId}
                >
                  <option value="">-- Pilih Sub Kegiatan --</option>
                  {listSubKegiatan.map(sub => (
                    <option key={sub.id} value={sub.id}>{sub.nama_sub_kegiatan} ({sub.periode || '-'})</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-auto pt-8 flex justify-end">
              <button onClick={handleNextStep} className="px-8 py-3 bg-[#1A2A80] text-white rounded-xl font-bold hover:bg-blue-900 transition shadow-lg flex items-center gap-2">
                Lanjut <FaArrowRight />
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="p-8 animate-fade-in-up flex-1 flex flex-col">
            
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 mb-6 flex justify-between items-center">
              <div className='text-sm text-blue-800'>
                <span className="font-bold block text-xs uppercase text-blue-400">Target Kegiatan:</span>
                {allSubKegiatan.find(s => s.id === selectedSubId)?.nama_sub_kegiatan}
              </div>
              <button onClick={() => setStep(1)} className="text-xs underline hover:text-blue-600">Ubah</button>
            </div>

            <div className="flex flex-col md:flex-row gap-8 h-full">
              
              {/* KOLOM KIRI: PENCARIAN */}
              <div className="md:w-1/3">
                <h3 className="text-sm font-bold text-gray-700 mb-3 uppercase flex items-center gap-2">
                  <FaSearch /> Tambah Mitra
                </h3>
                <div className="relative">
                  <input 
                    type="text"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1A2A80] outline-none"
                    placeholder="Cari nama / NIK..."
                    value={mitraSearch}
                    onChange={(e) => { setMitraSearch(e.target.value); setShowMitraDropdown(true); }}
                    onFocus={() => setShowMitraDropdown(true)}
                  />
                  {showMitraDropdown && mitraSearch && (
                    <div className="absolute z-10 w-full bg-white border border-gray-200 rounded-lg shadow-xl mt-1 max-h-80 overflow-y-auto">
                      {filteredMitra.length === 0 ? (
                        <div className="p-3 text-sm text-gray-500">Tidak ditemukan / Sudah Bertugas.</div>
                      ) : (
                        filteredMitra.map(m => {
                            const currentIncome = mitraIncomeMap[String(m.id)] || 0;
                            const limit = batasHonorPeriode;
                            const isFull = limit > 0 && currentIncome >= limit;
                            const percent = limit > 0 ? (currentIncome / limit) * 100 : 0;
                            
                            let barColor = 'bg-green-500';
                            if (percent > 50) barColor = 'bg-yellow-500';
                            if (percent >= 90) barColor = 'bg-red-500';

                            return (
                                <div 
                                    key={m.id} 
                                    onClick={() => !isFull && handleAddMitra(m)} 
                                    className={`px-4 py-3 border-b last:border-none transition cursor-pointer ${isFull ? 'bg-gray-100 opacity-60 cursor-not-allowed' : 'hover:bg-blue-50'}`}
                                >
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="text-sm font-bold text-gray-800">{m.nama_lengkap}</p>
                                            <p className="text-xs text-gray-500">{m.nik}</p>
                                        </div>
                                        {isFull && <span className="text-[10px] font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded">PENUH</span>}
                                    </div>
                                    
                                    {limit > 0 && (
                                        <div className="mt-2">
                                            <div className="flex justify-between text-[10px] mb-1 text-gray-500">
                                                <span>Rp {currentIncome.toLocaleString('id-ID')}</span>
                                                <span>Batas: Rp {limit.toLocaleString('id-ID')}</span>
                                            </div>
                                            <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                                                <div className={`h-1.5 rounded-full ${barColor}`} style={{ width: `${Math.min(percent, 100)}%` }}></div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* KOLOM KANAN: DAFTAR SELEKSI */}
              <div className="md:w-2/3 bg-gray-50 rounded-xl border border-gray-200 p-5 flex flex-col">
                <div className="flex justify-between items-center mb-4">
                   <h3 className="text-sm font-bold text-gray-700 uppercase flex items-center gap-2">
                     <FaUsers /> Daftar Seleksi ({selectedMitras.length})
                   </h3>
                   {availableJabatan.length === 0 && (
                     <span className="text-xs text-red-500 bg-red-50 px-2 py-1 rounded border border-red-100">
                       ⚠️ Belum ada Honor!
                     </span>
                   )}
                </div>

                <div className="flex-1 overflow-y-auto max-h-[400px] space-y-3 pr-1">
                  {selectedMitras.length === 0 ? (
                    <div className="text-center py-10 text-gray-400 italic border-2 border-dashed border-gray-200 rounded-lg">
                      Belum ada mitra yang ditambahkan.
                    </div>
                  ) : (
                    selectedMitras.map((mitra, idx) => {
                      const honorInfo = availableJabatan.find(h => h.kode_jabatan === mitra.assignedJabatan);
                      const honorBaru = honorInfo ? Number(honorInfo.tarif) : 0;
                      
                      const currentIncome = mitraIncomeMap[String(mitra.id)] || 0;
                      const totalProjected = currentIncome + honorBaru;
                      const limit = batasHonorPeriode;
                      
                      const percentCurrent = limit > 0 ? (currentIncome / limit) * 100 : 0;
                      const percentNew = limit > 0 ? (honorBaru / limit) * 100 : 0;
                      const isOverLimit = limit > 0 && totalProjected > limit;

                      return (
                        <div key={mitra.id} className={`bg-white p-4 rounded-lg border shadow-sm relative group transition ${isOverLimit ? 'border-red-300 ring-1 ring-red-100' : 'border-gray-200 hover:border-blue-300'}`}>
                          
                          <div className="flex justify-between items-start gap-4">
                            <div className="flex items-center gap-3">
                               <div className="w-8 h-8 rounded-full bg-[#1A2A80] text-white flex items-center justify-center text-xs font-bold">
                                 {idx + 1}
                               </div>
                               <div>
                                 <p className="text-sm font-bold text-gray-800">{mitra.nama_lengkap}</p>
                                 <p className="text-xs text-gray-500 font-mono flex items-center gap-1">
                                   <FaIdCard className="text-gray-300"/> {mitra.nik}
                                 </p>
                               </div>
                            </div>
                            <button onClick={() => handleRemoveMitra(mitra.id)} className="text-gray-300 hover:text-red-500 p-1" title="Hapus"><FaTimes /></button>
                          </div>

                          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 items-center bg-gray-50 p-3 rounded-lg">
                             <div>
                               <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Pilih Jabatan</label>
                               <select 
                                 className={`w-full text-xs border rounded px-2 py-1.5 outline-none ${isOverLimit ? 'border-red-500 focus:ring-red-500 text-red-700 bg-red-50' : 'border-gray-300 focus:ring-[#1A2A80]'}`}
                                 value={mitra.assignedJabatan}
                                 onChange={(e) => handleUpdateMitraJabatan(mitra.id, e.target.value)}
                               >
                                 <option value="">-- Pilih --</option>
                                 {availableJabatan.map(h => (
                                   <option key={h.kode_jabatan} value={h.kode_jabatan}>{h.nama_jabatan}</option>
                                 ))}
                               </select>
                               
                               {isOverLimit && (
                                 <div className="mt-1 text-[10px] text-red-600 font-bold flex items-center gap-1 animate-pulse">
                                   <FaExclamationCircle /> Melebihi Batas!
                                 </div>
                               )}
                             </div>
                             
                             <div className="text-right">
                               <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Estimasi Honor</label>
                               {honorInfo ? (
                                 <div className={`text-sm font-bold flex items-center justify-end gap-1 ${isOverLimit ? 'text-red-600' : 'text-green-600'}`}>
                                   <FaMoneyBillWave size={12}/> {formatRupiah(honorInfo.tarif)}
                                 </div>
                               ) : (
                                 <span className="text-xs text-gray-400 italic">-</span>
                               )}
                             </div>
                          </div>

                          {/* BAR PROGRESS (KANAN) */}
                          {limit > 0 && (
                            <div className="mt-3">
                                <div className="flex justify-between text-[10px] text-gray-500 mb-1">
                                    <span>Total Proyeksi: Rp {totalProjected.toLocaleString('id-ID')}</span>
                                    <span>Batas: Rp {limit.toLocaleString('id-ID')}</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden flex">
                                    {/* Bar Pendapatan Lama */}
                                    <div 
                                        className={`h-full ${percentCurrent > 90 ? 'bg-yellow-500' : 'bg-green-500'}`} 
                                        style={{ width: `${Math.min(percentCurrent, 100)}%` }}
                                        title="Pendapatan Saat Ini"
                                    ></div>
                                    {/* Bar Pendapatan Baru */}
                                    <div 
                                        className={`h-full ${isOverLimit ? 'bg-red-500' : 'bg-blue-400'}`} 
                                        style={{ width: `${Math.min(percentNew, 100 - Math.min(percentCurrent, 100))}%` }}
                                        title="Tambahan Honor Ini"
                                    ></div>
                                </div>
                            </div>
                          )}

                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            <div className="mt-auto pt-8 flex justify-between border-t border-gray-100">
              <button onClick={() => setStep(1)} className="px-6 py-3 border border-gray-300 text-gray-600 rounded-xl font-bold hover:bg-gray-50 flex items-center gap-2">
                <FaArrowLeft /> Kembali
              </button>
              <button onClick={handleSubmit} disabled={submitting || selectedMitras.length === 0} className="px-8 py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 shadow-lg flex items-center gap-2 disabled:opacity-50">
                {submitting ? 'Menyimpan...' : <><FaCheck /> Simpan Semua</>}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TambahPenugasan;