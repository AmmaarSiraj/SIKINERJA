// src/components/admin/PopupTambahAnggota.jsx
import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2'; 
import { 
  FaSearch, 
  FaUserPlus, 
  FaTimes, 
  FaIdCard, 
  FaBriefcase,
  FaExclamationCircle,
  FaBoxOpen,
  FaFilter,
  FaChartPie
} from 'react-icons/fa';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const getToken = () => localStorage.getItem('token');

const PopupTambahAnggota = ({ isOpen, onClose, id_penugasan, existingAnggotaIds, onAnggotaAdded }) => {
  // Data State
  const [allMitra, setAllMitra] = useState([]);
  const [availableJobs, setAvailableJobs] = useState([]); 
  const [currentTeamData, setCurrentTeamData] = useState([]); // Data anggota tim saat ini (untuk hitung kuota terpakai)
  const [targetYear, setTargetYear] = useState(null); 
  
  // Selection State
  const [selectedJob, setSelectedJob] = useState(''); 
  const [volume, setVolume] = useState(1); 
  const [searchTerm, setSearchTerm] = useState('');
  
  // UI State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 1. FETCH DATA
  useEffect(() => {
    if (isOpen && id_penugasan) {
      const initData = async () => {
        setLoading(true);
        setError(null);
        try {
          const token = getToken();
          const headers = { Authorization: `Bearer ${token}` };

          // A. Ambil Detail Penugasan & Anggota Tim Saat Ini (PENTING untuk hitung sisa kuota)
          const [resPenugasan, resAnggotaTim] = await Promise.all([
            axios.get(`${API_URL}/api/penugasan/${id_penugasan}`, { headers }),
            axios.get(`${API_URL}/api/penugasan/${id_penugasan}/anggota`, { headers })
          ]);

          const { id_subkegiatan, tanggal_mulai } = resPenugasan.data;
          setCurrentTeamData(resAnggotaTim.data || []);

          // Set Target Year
          if (tanggal_mulai) {
            const year = new Date(tanggal_mulai).getFullYear().toString();
            setTargetYear(year);
          }

          // B. Ambil Master Mitra & Honorarium
          const [resMitra, resHonor] = await Promise.all([
            axios.get(`${API_URL}/api/mitra`, { headers }),
            axios.get(`${API_URL}/api/honorarium`, { headers })
          ]);

          // C. Filter Jabatan & Ambil BASIS VOLUME
          const validHonors = resHonor.data.filter(h => h.id_subkegiatan == id_subkegiatan);
          
          const jobs = validHonors.map(h => ({
            kode: h.kode_jabatan,
            nama: h.nama_jabatan,
            tarif: h.tarif,
            satuan: h.nama_satuan,
            basis_volume: Number(h.basis_volume) || 0 // Load Basis Volume
          }));

          setAllMitra(resMitra.data || []);
          setAvailableJobs(jobs);

          if (jobs.length > 0) {
            setSelectedJob(jobs[0].kode);
          }
          setVolume(1);

        } catch (err) {
          console.error(err);
          setError('Gagal memuat data yang diperlukan.');
        } finally {
          setLoading(false);
        }
      };

      initData();
    }
  }, [isOpen, id_penugasan]);

  // 2. HITUNG SISA KUOTA BERDASARKAN JABATAN TERPILIH
  const quotaInfo = useMemo(() => {
    if (!selectedJob) return { sisa: 0, total: 0, terpakai: 0 };

    const jobInfo = availableJobs.find(j => j.kode === selectedJob);
    if (!jobInfo) return { sisa: 0, total: 0, terpakai: 0 };

    const totalQuota = jobInfo.basis_volume;
    
    // Hitung volume yang sudah dipakai oleh anggota lain di jabatan yang sama
    const usedQuota = currentTeamData
      .filter(m => m.kode_jabatan === selectedJob)
      .reduce((acc, curr) => acc + (Number(curr.volume_tugas) || 0), 0);

    return {
        total: totalQuota,
        terpakai: usedQuota,
        sisa: Math.max(0, totalQuota - usedQuota)
    };
  }, [selectedJob, availableJobs, currentTeamData]);

  // 3. FILTER MITRA (Termasuk Tahun Aktif)
  const availableMitra = useMemo(() => {
    if (!existingAnggotaIds) return allMitra;
    const excludedIds = new Set(existingAnggotaIds.map(id => String(id)));
    
    return allMitra
      .filter(mitra => {
        const notInTeam = !excludedIds.has(String(mitra.id));
        
        const matchSearch = 
            mitra.nama_lengkap.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (mitra.nik && mitra.nik.includes(searchTerm));

        let isActiveInYear = false;
        if (targetYear && mitra.riwayat_tahun) {
            const years = mitra.riwayat_tahun.split(', ');
            isActiveInYear = years.includes(targetYear);
        } else if (!targetYear) {
            isActiveInYear = true;
        }

        return notInTeam && matchSearch && isActiveInYear;
      });
  }, [allMitra, existingAnggotaIds, searchTerm, targetYear]);

  // 4. HANDLER TAMBAH ANGGOTA
  const handleAddAnggota = async (id_mitra) => {
    if (!selectedJob) {
      Swal.fire('Peringatan', 'Harap pilih posisi/jabatan terlebih dahulu!', 'warning');
      return;
    }
    
    const finalVolume = (!volume || volume <= 0) ? 1 : volume;

    // VALIDASI KUOTA
    if (quotaInfo.total > 0 && finalVolume > quotaInfo.sisa) {
        Swal.fire({
            title: 'Kuota Tidak Cukup',
            text: `Sisa kuota untuk jabatan ini hanya ${quotaInfo.sisa}, sedangkan Anda ingin menambahkan ${finalVolume}.`,
            icon: 'warning'
        });
        return;
    }

    try {
      const token = getToken();
      
      await axios.post(`${API_URL}/api/kelompok-penugasan`, 
        { 
          id_penugasan, 
          id_mitra,
          kode_jabatan: selectedJob,
          volume_tugas: finalVolume 
        }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Update data lokal (currentTeamData) agar perhitungan kuota langsung update tanpa refresh page penuh
      const mitraBaru = allMitra.find(m => m.id === id_mitra);
      setCurrentTeamData(prev => [
          ...prev, 
          { 
              id_mitra, 
              kode_jabatan: selectedJob, 
              volume_tugas: finalVolume,
              // Data dummy sekedar untuk perhitungan lokal
              nama_lengkap: mitraBaru?.nama_lengkap 
          }
      ]);

      Swal.fire({
        title: 'Berhasil!',
        text: 'Anggota berhasil ditambahkan ke tim.',
        icon: 'success',
        timer: 1500,
        showConfirmButton: false,
        toast: true,
        position: 'top-end'
      });

      onAnggotaAdded(); // Trigger refresh di parent component
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.error || 'Gagal menambahkan anggota.';
      Swal.fire('Gagal', msg, 'error');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-50 p-4 backdrop-blur-sm transition-opacity">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden border border-gray-200 animate-fade-in-up">
        
        {/* HEADER */}
        <div className="flex justify-between items-center p-5 bg-[#1A2A80] text-white">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <FaUserPlus className="text-blue-200" /> Tambah Anggota Tim
          </h2>
          <button 
            onClick={onClose} 
            className="text-white/70 hover:text-white hover:bg-white/10 p-2 rounded-full transition"
          >
            <FaTimes size={18} />
          </button>
        </div>

        {/* --- FORM PENGATURAN TUGAS --- */}
        <div className="px-5 pt-5 pb-3 bg-white space-y-4">
            
            {/* 1. Pilih Jabatan */}
            <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2 flex items-center gap-2">
                    <FaBriefcase className="text-[#1A2A80]" /> Pilih Posisi Penugasan
                </label>
                
                {loading ? (
                    <div className="h-10 bg-gray-100 rounded animate-pulse w-full"></div>
                ) : availableJobs.length === 0 ? (
                    <div className="p-3 bg-red-50 text-red-600 text-sm rounded border border-red-100 flex items-center gap-2">
                        <FaExclamationCircle /> 
                        <span>Tidak ada jabatan/honor yang diatur untuk kegiatan ini.</span>
                    </div>
                ) : (
                    <select
                        value={selectedJob}
                        onChange={(e) => setSelectedJob(e.target.value)}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#1A2A80] outline-none text-sm font-medium bg-gray-50 focus:bg-white transition"
                    >
                        {availableJobs.map((job) => (
                            <option key={job.kode} value={job.kode}>
                                {job.nama} (Rp {Number(job.tarif).toLocaleString('id-ID')}) - Kuota: {job.basis_volume}
                            </option>
                        ))}
                    </select>
                )}
            </div>

            {/* 2. Atur Volume & Info Kuota */}
            <div>
                <div className="flex justify-between items-center mb-2">
                    <label className="block text-xs font-bold text-gray-500 uppercase flex items-center gap-2">
                        <FaBoxOpen className="text-[#1A2A80]" /> Volume Tugas
                    </label>
                    {/* Badge Sisa Kuota */}
                    {selectedJob && (
                        <div className={`text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1 border ${quotaInfo.sisa === 0 ? 'bg-red-50 text-red-600 border-red-200' : 'bg-green-50 text-green-700 border-green-200'}`}>
                            <FaChartPie />
                            Sisa Kuota: {quotaInfo.sisa} / {quotaInfo.total}
                        </div>
                    )}
                </div>
                
                <div className="flex items-center">
                    <input 
                        type="number" 
                        min="1"
                        max={quotaInfo.total > 0 ? quotaInfo.sisa : undefined}
                        value={volume}
                        onFocus={(e) => e.target.select()} 
                        onChange={(e) => {
                            const val = e.target.value;
                            const intVal = parseInt(val);
                            // Validasi input manual agar tidak lebih dari sisa
                            if (val !== '' && quotaInfo.total > 0 && intVal > quotaInfo.sisa) {
                                return; // Prevent typing more than limit
                            }
                            setVolume(val === '' ? '' : intVal);
                        }}
                        onBlur={() => {
                            if (!volume || volume < 1) setVolume(1);
                        }}
                        className={`w-full px-4 py-2.5 border rounded-l-xl focus:ring-2 outline-none text-sm font-bold transition ${quotaInfo.sisa === 0 ? 'bg-gray-100 text-gray-400 border-gray-200' : 'bg-gray-50 focus:bg-white border-gray-300 focus:ring-[#1A2A80]'}`}
                        placeholder="1"
                        disabled={quotaInfo.sisa === 0 && quotaInfo.total > 0}
                    />
                    <div className="bg-gray-100 border border-l-0 border-gray-300 px-4 py-2.5 rounded-r-xl text-sm font-medium text-gray-500">
                        Unit
                    </div>
                </div>
                {quotaInfo.sisa === 0 && quotaInfo.total > 0 && (
                    <p className="text-[10px] text-red-500 mt-1 italic">* Kuota untuk jabatan ini sudah penuh.</p>
                )}
            </div>

        </div>

        {/* SEARCH BAR & FILTER BADGE */}
        <div className="px-5 py-3 border-b border-t border-gray-100 bg-gray-50/50">
          
          {targetYear && (
            <div className="mb-2">
                <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 text-[10px] px-2 py-1 rounded border border-blue-200 font-bold shadow-sm">
                    <FaFilter size={10} /> Mitra Aktif Thn {targetYear}
                </span>
            </div>
          )}

          <div className="relative">
            <span className="absolute left-4 top-3 text-gray-400">
                <FaSearch />
            </span>
            <input
                type="text"
                placeholder="Cari nama atau NIK mitra..."
                className="w-full pl-11 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1A2A80] outline-none text-sm transition bg-white"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* LIST MITRA */}
        <div className="overflow-y-auto flex-grow p-4 bg-gray-50 space-y-3">
          {loading && <p className="text-center py-8 text-gray-500 italic">Memuat data...</p>}
          {error && <p className="text-center py-8 text-red-500 text-sm">{error}</p>}
          
          {!loading && !error && (
            <>
                {availableMitra.length === 0 ? (
                    <div className="text-center py-10 text-gray-400 flex flex-col items-center">
                        <FaSearch size={30} className="mb-2 opacity-20" />
                        <p className="text-sm">
                           {searchTerm 
                             ? "Tidak ada mitra yang cocok." 
                             : `Tidak ada mitra tersedia.`}
                        </p>
                    </div>
                ) : (
                    availableMitra.map(mitra => (
                        <div 
                            key={mitra.id} 
                            className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center hover:border-blue-300 transition-colors group"
                        >
                            <div className="flex items-center gap-3 overflow-hidden">
                                <div className="w-10 h-10 rounded-full bg-blue-50 flex-shrink-0 flex items-center justify-center text-[#1A2A80] font-bold text-sm border border-blue-100">
                                    {mitra.nama_lengkap.charAt(0)}
                                </div>
                                <div className="min-w-0">
                                    <p className="font-bold text-gray-800 text-sm truncate group-hover:text-[#1A2A80] transition-colors">
                                        {mitra.nama_lengkap}
                                    </p>
                                    <p className="text-xs text-gray-500 font-mono flex items-center gap-1">
                                        <FaIdCard className="text-gray-300" /> {mitra.nik}
                                    </p>
                                </div>
                            </div>
                            
                            <button
                                onClick={() => handleAddAnggota(mitra.id)}
                                disabled={!selectedJob || (quotaInfo.sisa === 0 && quotaInfo.total > 0)}
                                className={`text-xs font-bold py-2 px-4 rounded-lg shadow-sm flex items-center gap-2 flex-shrink-0 transition 
                                  ${selectedJob && (quotaInfo.sisa > 0 || quotaInfo.total === 0)
                                    ? 'bg-[#1A2A80] hover:bg-blue-900 text-white hover:shadow' 
                                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
                            >
                                <FaUserPlus /> Tambah
                            </button>
                        </div>
                    ))
                )}
            </>
          )}
        </div>

        {/* FOOTER */}
        <div className="p-3 bg-white border-t border-gray-200 text-center text-xs text-gray-400">
            {availableMitra.length} mitra tersedia untuk ditambahkan
        </div>

      </div>
    </div>
  );
};

export default PopupTambahAnggota;