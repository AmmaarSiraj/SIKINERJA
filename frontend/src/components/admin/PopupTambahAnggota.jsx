// src/components/admin/PopupTambahAnggota.jsx
import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { 
  FaSearch, 
  FaUserPlus, 
  FaTimes, 
  FaIdCard, 
  FaBriefcase,
  FaExclamationCircle
} from 'react-icons/fa';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const getToken = () => localStorage.getItem('token');

const PopupTambahAnggota = ({ isOpen, onClose, id_penugasan, existingAnggotaIds, onAnggotaAdded }) => {
  // Data State
  const [allMitra, setAllMitra] = useState([]);
  const [availableJobs, setAvailableJobs] = useState([]); 
  
  // Selection State
  const [selectedJob, setSelectedJob] = useState(''); 
  const [searchTerm, setSearchTerm] = useState('');
  
  // UI State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 1. FETCH DATA (Mitra, Penugasan, Honorarium)
  useEffect(() => {
    if (isOpen && id_penugasan) {
      const initData = async () => {
        setLoading(true);
        setError(null);
        try {
          const token = getToken();
          const headers = { Authorization: `Bearer ${token}` };

          // A. Ambil Detail Penugasan (untuk tahu id_subkegiatan)
          const resPenugasan = await axios.get(`${API_URL}/api/penugasan/${id_penugasan}`, { headers });
          const idSubKegiatan = resPenugasan.data.id_subkegiatan;

          // B. Ambil Master Mitra & Honorarium secara paralel
          const [resMitra, resHonor] = await Promise.all([
            axios.get(`${API_URL}/api/mitra`, { headers }),
            axios.get(`${API_URL}/api/honorarium`, { headers })
          ]);

          // C. Filter Jabatan yang tersedia untuk Sub Kegiatan ini
          const validHonors = resHonor.data.filter(h => h.id_subkegiatan == idSubKegiatan);
          
          const jobs = validHonors.map(h => ({
            kode: h.kode_jabatan,
            nama: h.nama_jabatan,
            tarif: h.tarif
          }));

          setAllMitra(resMitra.data || []);
          setAvailableJobs(jobs);

          if (jobs.length > 0) {
            setSelectedJob(jobs[0].kode);
          }

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

  // 2. FILTER MITRA (LOGIKA DIPERKUAT)
  // Hanya tampilkan mitra yang BELUM ada di existingAnggotaIds
  const availableMitra = useMemo(() => {
    if (!existingAnggotaIds) return allMitra;

    // Konversi semua ID ke String agar perbandingan aman (antisipasi beda tipe data Number vs String)
    const excludedIds = new Set(existingAnggotaIds.map(id => String(id)));
    
    return allMitra
      .filter(mitra => !excludedIds.has(String(mitra.id))) // Filter Utama: Exclude yang sudah ada
      .filter(mitra => 
        mitra.nama_lengkap.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (mitra.nik && mitra.nik.includes(searchTerm))
      );
  }, [allMitra, existingAnggotaIds, searchTerm]);

  // 3. HANDLER TAMBAH ANGGOTA
  const handleAddAnggota = async (id_mitra) => {
    if (!selectedJob) {
      alert("Harap pilih posisi/jabatan terlebih dahulu!");
      return;
    }

    try {
      const token = getToken();
      await axios.post(`${API_URL}/api/kelompok-penugasan`, 
        { 
          id_penugasan, 
          id_mitra,
          kode_jabatan: selectedJob 
        }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      onAnggotaAdded(); // Refresh parent agar list existingAnggotaIds terupdate
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || 'Gagal menambahkan anggota');
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

        {/* --- SECTION PILIH JABATAN --- */}
        <div className="px-5 pt-5 pb-2 bg-white">
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
                            {job.nama} (Rp {Number(job.tarif).toLocaleString('id-ID')})
                        </option>
                    ))}
                </select>
            )}
        </div>

        {/* SEARCH BAR */}
        <div className="px-5 py-3 border-b border-gray-100">
          <div className="relative">
            <span className="absolute left-4 top-3 text-gray-400">
                <FaSearch />
            </span>
            <input
                type="text"
                placeholder="Cari nama atau NIK mitra..."
                className="w-full pl-11 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1A2A80] outline-none text-sm transition"
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
                             : "Semua mitra sudah masuk ke tim ini."}
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
                                disabled={!selectedJob}
                                className={`text-xs font-bold py-2 px-4 rounded-lg shadow-sm flex items-center gap-2 flex-shrink-0 transition 
                                  ${selectedJob 
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