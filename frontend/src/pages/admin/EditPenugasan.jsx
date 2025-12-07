// src/pages/admin/EditPenugasan.jsx
import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useNavigate, useParams, Link } from 'react-router-dom';
import Swal from 'sweetalert2';
import { 
  FaArrowLeft, FaCheck, FaIdCard, FaSearch, FaTimes, 
  FaUsers, FaMoneyBillWave, FaExclamationCircle, 
  FaChartBar, FaBoxOpen, FaFilter
} from 'react-icons/fa';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const EditPenugasan = () => {
  const { id } = useParams(); // ID Penugasan
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Data Utama
  const [penugasanInfo, setPenugasanInfo] = useState(null);
  const [subKegiatanInfo, setSubKegiatanInfo] = useState(null);

  // Data Master
  const [listMitra, setListMitra] = useState([]);
  const [listHonorarium, setListHonorarium] = useState([]); 
  const [listAturan, setListAturan] = useState([]);
  
  // State Tim (Anggota)
  const [currentMembers, setCurrentMembers] = useState([]); // Anggota yang ada di DB
  const [selectedMitras, setSelectedMitras] = useState([]); // Gabungan (DB + Baru)
  
  // Form State
  const [mitraSearch, setMitraSearch] = useState('');
  const [showMitraDropdown, setShowMitraDropdown] = useState(false);

  // Finance State
  const [batasHonorPeriode, setBatasHonorPeriode] = useState(0);
  const [mitraIncomeMap, setMitraIncomeMap] = useState({});

  // 1. FETCH DATA INIT
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        const headers = { Authorization: `Bearer ${token}` };

        // Ambil Detail Penugasan
        const resPenugasan = await axios.get(`${API_URL}/api/penugasan/${id}`, { headers });
        setPenugasanInfo(resPenugasan.data);
        
        const idSub = resPenugasan.data.id_subkegiatan;

        // Ambil Data Lainnya secara paralel
        const [resSub, resMitra, resHonor, resAturan, resAnggota, resAllKelompok, resAllPenugasan] = await Promise.all([
          axios.get(`${API_URL}/api/subkegiatan/${idSub}`, { headers }),
          axios.get(`${API_URL}/api/mitra`, { headers }),
          axios.get(`${API_URL}/api/honorarium`, { headers }), // Nanti difilter manual
          axios.get(`${API_URL}/api/aturan-periode`, { headers }),
          axios.get(`${API_URL}/api/penugasan/${id}/anggota`, { headers }), // Anggota spesifik penugasan ini
          axios.get(`${API_URL}/api/kelompok-penugasan`, { headers }), // Semua kelompok (untuk hitung income)
          axios.get(`${API_URL}/api/penugasan`, { headers }) // Semua penugasan (untuk map id_subkegiatan)
        ]);

        setSubKegiatanInfo(resSub.data);
        setListMitra(resMitra.data);
        // Filter honorarium hanya untuk sub kegiatan ini
        setListHonorarium(resHonor.data.filter(h => String(h.id_subkegiatan) === String(idSub)));
        setListAturan(resAturan.data);

        // Format Anggota Existing ke State selectedMitras
        const formattedMembers = resAnggota.data.map(m => ({
            id: m.id_mitra,
            nama_lengkap: m.nama_lengkap,
            nik: m.nik,
            assignedJabatan: m.kode_jabatan,
            assignedVolume: m.volume_tugas,
            isExisting: true, // Flag penanda data lama
            id_kelompok: m.id_kelompok // ID Unik di tabel kelompok_penugasan
        }));
        setCurrentMembers(formattedMembers);
        setSelectedMitras(formattedMembers);

        // --- HITUNG INCOME & LIMIT ---
        if (resSub.data.tanggal_mulai) {
            const tahunKegiatan = new Date(resSub.data.tanggal_mulai).getFullYear().toString();
            
            // Set Limit
            const aturan = resAturan.data.find(r => String(r.tahun || r.periode) === tahunKegiatan);
            setBatasHonorPeriode(aturan ? Number(aturan.batas_honor) : 0);

            // Hitung Income Existing (Global)
            const incomeMap = {};
            
            // Map Penugasan ID -> Sub ID
            const mapPenugasanSub = {};
            resAllPenugasan.data.forEach(p => mapPenugasanSub[p.id_penugasan] = p.id_subkegiatan);

            // Filter Kelompok yang relevan (Tahun sama, KECUALI penugasan ini - karena ini yang mau diedit)
            // Kita akan tambahkan nilai honor dari form edit secara realtime, jadi incomeMap hanya berisi "honor dari kegiatan LAIN"
            resAllKelompok.data.forEach(k => {
                // Skip data dari penugasan yang sedang diedit (agar tidak double count dengan state form)
                if (String(k.id_penugasan) === String(id)) return;

                const subId = mapPenugasanSub[k.id_penugasan];
                // Cari info sub (sayangnya kita butuh tanggal mulai semua sub, 
                // asumsi resAllPenugasan/resAllSub sudah ada, tapi disini kita pakai logic sederhana dulu
                // atau fetch semua sub kegiatan jika perlu akurasi tinggi.
                // Disini kita skip validasi tanggal sub lain demi performa, atau anggap user hanya edit current context
            });
            
            // NOTE: Untuk Edit, perhitungan "Realtime Cross-Activity" agak kompleks. 
            // Disini kita gunakan pendekatan: 
            // 1. Ambil total pendapatan SAAT INI dari database (termasuk kegiatan ini).
            // 2. Kurangi pendapatan LAMA dari kegiatan ini.
            // 3. Tambahkan pendapatan BARU dari form.
            
            // Fetch Transaksi Mitra Spesifik untuk Tahun Ini
            const resTrans = await axios.get(`${API_URL}/api/transaksi`, { 
                headers, params: { tahun: tahunKegiatan } 
            });
            
            const transMap = {};
            resTrans.data.forEach(t => {
                transMap[String(t.id)] = Number(t.total_pendapatan);
            });

            // Kurangi honor dari kegiatan INI (karena mau diganti dengan nilai form)
            formattedMembers.forEach(m => {
                const hItem = resHonor.data.find(h => String(h.id_subkegiatan) === String(idSub) && h.kode_jabatan === m.assignedJabatan);
                const tarifLama = hItem ? Number(hItem.tarif) : 0;
                const honorLama = tarifLama * Number(m.assignedVolume);
                
                if (transMap[String(m.id)]) {
                    transMap[String(m.id)] -= honorLama;
                }
            });

            setMitraIncomeMap(transMap);
        }

      } catch (err) {
        console.error(err);
        Swal.fire('Error', 'Gagal memuat data penugasan.', 'error');
        navigate('/admin/penugasan');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, navigate]);

  // 2. MENGHITUNG TAHUN TARGET (Untuk Filter Mitra)
  const targetYear = useMemo(() => {
    if (!subKegiatanInfo || !subKegiatanInfo.tanggal_mulai) return null;
    return new Date(subKegiatanInfo.tanggal_mulai).getFullYear().toString();
  }, [subKegiatanInfo]);

  // 3. FILTER MITRA (Search + Tahun Aktif)
  const filteredMitra = useMemo(() => {
    return listMitra.filter(m => {
        // Filter Search
        const matchSearch = m.nama_lengkap.toLowerCase().includes(mitraSearch.toLowerCase()) || m.nik.includes(mitraSearch);
        
        // Filter Sudah Ada di List
        const notSelected = !selectedMitras.some(selected => selected.id === m.id);

        // [BARU] Filter Tahun Aktif
        let isActiveInYear = false;
        if (targetYear && m.riwayat_tahun) {
            const years = m.riwayat_tahun.split(', ');
            isActiveInYear = years.includes(targetYear);
        } else if (!targetYear) {
            isActiveInYear = true; 
        }

        return matchSearch && notSelected && isActiveInYear;
    });
  }, [listMitra, mitraSearch, selectedMitras, targetYear]);

  // 4. STATISTIK VOLUME JABATAN
  const getVolumeStats = (kodeJabatan, basisVolume) => {
    const used = selectedMitras
        .filter(m => m.assignedJabatan === kodeJabatan)
        .reduce((acc, curr) => acc + (Number(curr.assignedVolume) || 0), 0);

    return { used, max: basisVolume || 0 };
  };

  // --- HANDLERS ---

  const handleAddMitra = (mitra) => {
    setSelectedMitras([...selectedMitras, { 
        ...mitra, 
        assignedJabatan: '', 
        assignedVolume: 1,
        isExisting: false // Penanda data baru
    }]);
    setMitraSearch('');
    setShowMitraDropdown(false);
  };

  const handleRemoveMitra = (mitraId) => {
    setSelectedMitras(selectedMitras.filter(m => m.id !== mitraId));
  };

  const handleUpdateMitraData = (mitraId, field, value) => {
    setSelectedMitras(prev => prev.map(m => 
      m.id === mitraId ? { ...m, [field]: value } : m
    ));
  };

  const handleSubmit = async () => {
    // Validasi Data Lengkap
    const incomplete = selectedMitras.find(m => !m.assignedJabatan || m.assignedVolume <= 0);
    if (incomplete) {
        return Swal.fire('Gagal', `Lengkapi jabatan dan volume untuk mitra: ${incomplete.nama_lengkap}`, 'warning');
    }

    // Validasi Limit Honor
    if (batasHonorPeriode > 0) {
        const overLimitUser = selectedMitras.find(m => {
            const hInfo = listHonorarium.find(h => h.kode_jabatan === m.assignedJabatan);
            const tarif = hInfo ? Number(hInfo.tarif) : 0;
            const totalHonorBaru = tarif * Number(m.assignedVolume);
            
            const incomeLain = mitraIncomeMap[String(m.id)] || 0;
            return (incomeLain + totalHonorBaru) > batasHonorPeriode;
        });

        if (overLimitUser) {
            return Swal.fire('Limit Terlampaui', `Mitra <b>${overLimitUser.nama_lengkap}</b> melebihi batas honor tahunan.`, 'error');
        }
    }

    setSubmitting(true);
    const token = localStorage.getItem('token');
    const headers = { Authorization: `Bearer ${token}` };

    try {
        // A. Hapus Anggota yang dibuang (Ada di currentMembers tapi tidak ada di selectedMitras)
        const selectedIds = selectedMitras.map(m => m.id);
        const toDelete = currentMembers.filter(m => !selectedIds.includes(m.id));
        
        if (toDelete.length > 0) {
            await Promise.all(toDelete.map(m => 
                axios.delete(`${API_URL}/api/kelompok-penugasan/${m.id_kelompok}`, { headers })
            ));
        }

        // B. Update atau Insert Anggota
        // Kita loop selectedMitras
        const promises = selectedMitras.map(m => {
            if (m.isExisting) {
                // UPDATE
                return axios.put(`${API_URL}/api/kelompok-penugasan/${m.id_kelompok}`, {
                    kode_jabatan: m.assignedJabatan,
                    volume_tugas: m.assignedVolume
                }, { headers });
            } else {
                // INSERT BARU
                return axios.post(`${API_URL}/api/kelompok-penugasan`, {
                    id_penugasan: id,
                    id_mitra: m.id,
                    kode_jabatan: m.assignedJabatan,
                    volume_tugas: m.assignedVolume
                }, { headers });
            }
        });

        await Promise.all(promises);

        Swal.fire('Berhasil', 'Perubahan penugasan berhasil disimpan.', 'success')
            .then(() => navigate('/admin/penugasan'));

    } catch (err) {
        console.error(err);
        Swal.fire('Error', err.response?.data?.error || 'Gagal menyimpan perubahan.', 'error');
    } finally {
        setSubmitting(false);
    }
  };

  const formatRupiah = (num) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);

  if (loading) return <div className="text-center py-20 text-gray-500">Memuat data penugasan...</div>;

  return (
    <div className="max-w-6xl mx-auto pb-20">
      
      {/* HEADER */}
      <div className="flex items-center gap-4 mb-8">
        <Link to="/admin/penugasan" className="text-gray-500 hover:text-[#1A2A80] transition"><FaArrowLeft size={20}/></Link>
        <div>
            <h1 className="text-2xl font-bold text-gray-800">Edit Penugasan Tim</h1>
            <p className="text-sm text-gray-500">
                {subKegiatanInfo?.nama_sub_kegiatan} ({penugasanInfo?.nama_kegiatan})
            </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* KOLOM KIRI: PENCARIAN & INFO KUOTA */}
        <div className="lg:col-span-1 space-y-6">
            
            {/* 1. INFO KUOTA */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <FaChartBar /> Kuota Jabatan
                </h3>
                <div className="space-y-3">
                    {listHonorarium.map(h => {
                        const { used, max } = getVolumeStats(h.kode_jabatan, h.basis_volume);
                        const percent = max > 0 ? (used / max) * 100 : 0;
                        let color = 'bg-green-500';
                        if (percent > 80) color = 'bg-yellow-500';
                        if (percent >= 100) color = 'bg-red-500';

                        return (
                            <div key={h.id_honorarium} className="border border-gray-100 rounded-lg p-3 bg-gray-50">
                                <div className="flex justify-between items-start mb-1">
                                    <div>
                                        <p className="font-bold text-xs text-gray-700">{h.nama_jabatan}</p>
                                        <p className="text-[10px] text-gray-400">{formatRupiah(h.tarif)}</p>
                                    </div>
                                    <div className="text-right">
                                        <span className={`text-xs font-bold ${percent >= 100 ? 'text-red-600' : 'text-gray-600'}`}>
                                            {used}/{max}
                                        </span>
                                    </div>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                                    <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${Math.min(percent, 100)}%` }}></div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* 2. TAMBAH MITRA */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                <h3 className="text-sm font-bold text-gray-700 mb-3 uppercase flex items-center gap-2">
                  <FaSearch /> Tambah Anggota
                </h3>
                
                {/* Badge Tahun Aktif */}
                {targetYear && (
                    <div className="mb-2">
                        <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 text-[10px] px-2 py-1 rounded border border-blue-200 font-bold">
                            <FaFilter size={10} /> Menampilkan Mitra Aktif Tahun {targetYear}
                        </span>
                    </div>
                )}

                <div className="relative">
                  <input 
                    type="text"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1A2A80] outline-none text-sm"
                    placeholder="Cari nama / NIK..."
                    value={mitraSearch}
                    onChange={(e) => { setMitraSearch(e.target.value); setShowMitraDropdown(true); }}
                    onFocus={() => setShowMitraDropdown(true)}
                  />
                  {showMitraDropdown && mitraSearch && (
                    <div className="absolute z-20 w-full bg-white border border-gray-200 rounded-lg shadow-xl mt-1 max-h-60 overflow-y-auto">
                      {filteredMitra.length === 0 ? (
                        <div className="p-3 text-xs text-gray-500 italic text-center">
                            Tidak ditemukan / Tidak aktif thn {targetYear}.
                        </div>
                      ) : (
                        filteredMitra.map(m => {
                            const currentIncome = mitraIncomeMap[String(m.id)] || 0;
                            const limit = batasHonorPeriode;
                            const isFull = limit > 0 && currentIncome >= limit;
                            
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
                                        {isFull && <span className="text-[9px] font-bold text-red-600 bg-red-100 px-1.5 py-0.5 rounded">FULL</span>}
                                    </div>
                                </div>
                            );
                        })
                      )}
                    </div>
                  )}
                </div>
            </div>

        </div>

        {/* KOLOM KANAN: DAFTAR TIM */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col min-h-[500px]">
            <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
                <h3 className="text-lg font-bold text-gray-700 flex items-center gap-2">
                    <FaUsers className="text-[#1A2A80]" /> Daftar Anggota Tim ({selectedMitras.length})
                </h3>
                <button onClick={handleSubmit} disabled={submitting || selectedMitras.length === 0} className="px-6 py-2 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 shadow-md flex items-center gap-2 disabled:opacity-50 text-sm">
                    {submitting ? 'Menyimpan...' : <><FaCheck /> Simpan Perubahan</>}
                </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-2 max-h-[600px]">
                {selectedMitras.length === 0 ? (
                    <div className="text-center py-20 text-gray-400 italic bg-gray-50 rounded-xl border border-dashed border-gray-200">
                        Tim kosong. Silakan tambahkan mitra.
                    </div>
                ) : (
                    selectedMitras.map((mitra, idx) => {
                        const honorInfo = listHonorarium.find(h => h.kode_jabatan === mitra.assignedJabatan);
                        const tarif = honorInfo ? Number(honorInfo.tarif) : 0;
                        const vol = Number(mitra.assignedVolume) || 0;
                        const totalHonorBaru = tarif * vol;
                        
                        const incomeLain = mitraIncomeMap[String(mitra.id)] || 0;
                        const totalProjected = incomeLain + totalHonorBaru;
                        const limit = batasHonorPeriode;
                        const isOverLimit = limit > 0 && totalProjected > limit;

                        return (
                            <div key={mitra.id} className={`bg-white p-4 rounded-lg border shadow-sm relative group transition ${isOverLimit ? 'border-red-300 ring-1 ring-red-100' : 'border-gray-200 hover:border-blue-300'}`}>
                                <div className="flex justify-between items-start gap-4">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white ${mitra.isExisting ? 'bg-blue-600' : 'bg-green-500'}`}>
                                            {idx + 1}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-gray-800">{mitra.nama_lengkap}</p>
                                            <p className="text-xs text-gray-500 font-mono flex items-center gap-1">
                                                <FaIdCard className="text-gray-300"/> {mitra.nik}
                                                {mitra.isExisting ? <span className="ml-2 bg-gray-100 text-gray-500 px-1.5 rounded text-[10px]">Lama</span> : <span className="ml-2 bg-green-100 text-green-700 px-1.5 rounded text-[10px]">Baru</span>}
                                            </p>
                                        </div>
                                    </div>
                                    <button onClick={() => handleRemoveMitra(mitra.id)} className="text-gray-300 hover:text-red-500 p-1 rounded hover:bg-red-50 transition" title="Hapus"><FaTimes /></button>
                                </div>

                                <div className="mt-3 grid grid-cols-12 gap-3 items-end bg-gray-50 p-3 rounded-lg">
                                    <div className="col-span-5">
                                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Jabatan</label>
                                        <select 
                                            className={`w-full text-xs border rounded px-2 py-1.5 outline-none ${isOverLimit ? 'border-red-300 bg-red-50 text-red-700' : 'border-gray-300 focus:ring-[#1A2A80]'}`}
                                            value={mitra.assignedJabatan}
                                            onChange={(e) => handleUpdateMitraData(mitra.id, 'assignedJabatan', e.target.value)}
                                        >
                                            <option value="">-- Pilih --</option>
                                            {listHonorarium.map(h => (
                                                <option key={h.kode_jabatan} value={h.kode_jabatan}>{h.nama_jabatan}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="col-span-3">
                                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Volume</label>
                                        <div className="flex items-center">
                                            <input 
                                                type="number" min="1"
                                                className="w-full text-xs border border-gray-300 rounded-l px-2 py-1.5 outline-none text-center font-bold text-gray-700 focus:ring-1 focus:ring-[#1A2A80]"
                                                value={mitra.assignedVolume}
                                                onChange={(e) => handleUpdateMitraData(mitra.id, 'assignedVolume', parseInt(e.target.value) || 0)}
                                            />
                                            <span className="bg-gray-200 text-gray-500 text-[10px] px-2 py-1.5 rounded-r border border-l-0 border-gray-300"><FaBoxOpen/></span>
                                        </div>
                                    </div>
                                    <div className="col-span-4 text-right">
                                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Honor</label>
                                        <p className={`text-sm font-bold ${isOverLimit ? 'text-red-600' : 'text-green-600'}`}>{formatRupiah(totalHonorBaru)}</p>
                                    </div>
                                </div>

                                {limit > 0 && isOverLimit && (
                                    <div className="mt-2 text-[10px] text-red-600 font-bold flex items-center gap-1 justify-end animate-pulse">
                                        <FaExclamationCircle /> Akumulasi pendapatan ({formatRupiah(totalProjected)}) melebihi batas!
                                    </div>
                                )}
                            </div>
                        )
                    })
                )}
            </div>
        </div>

      </div>
    </div>
  );
};

export default EditPenugasan;