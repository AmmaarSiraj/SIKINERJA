import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { 
  FaArrowRight, FaArrowLeft, FaCheck, FaClipboardList, 
  FaUserTie, FaIdCard, FaSearch, FaTimes, FaUsers, FaMoneyBillWave 
} from 'react-icons/fa';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const TambahPenugasan = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // --- DATA MASTER ---
  const [listKegiatan, setListKegiatan] = useState([]);
  const [listSubKegiatan, setListSubKegiatan] = useState([]); 
  const [listMitra, setListMitra] = useState([]);
  const [listHonorarium, setListHonorarium] = useState([]); 

  // --- FORM STATE ---
  const [selectedKegiatanId, setSelectedKegiatanId] = useState('');
  const [selectedSubId, setSelectedSubId] = useState('');
  
  // State untuk menampung mitra yang dipilih beserta jabatannya
  const [selectedMitras, setSelectedMitras] = useState([]); 
  
  const [mitraSearch, setMitraSearch] = useState('');
  const [showMitraDropdown, setShowMitraDropdown] = useState(false);

  // 1. FETCH DATA AWAL (Kegiatan, Mitra, Honor)
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        const headers = { Authorization: `Bearer ${token}` };

        const [resKeg, resMitra, resHonor] = await Promise.all([
          axios.get(`${API_URL}/api/kegiatan`, { headers }),
          axios.get(`${API_URL}/api/mitra`, { headers }),
          axios.get(`${API_URL}/api/honorarium`, { headers }) 
        ]);

        setListKegiatan(resKeg.data);
        setListMitra(resMitra.data);
        setListHonorarium(resHonor.data);
      } catch (err) {
        console.error(err);
        Swal.fire('Error', 'Gagal memuat data master', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // 2. FETCH SUB KEGIATAN DINAMIS (Berdasarkan Kegiatan yg dipilih)
  useEffect(() => {
    const fetchSub = async () => {
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
        console.error("Gagal ambil sub kegiatan", err);
      }
    };
    fetchSub();
  }, [selectedKegiatanId]);

  // --- HELPERS ---
  const formatRupiah = (num) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);
  };

  // Filter jabatan yang tersedia untuk sub kegiatan ini
  const availableJabatan = listHonorarium.filter(
    h => h.id_subkegiatan === selectedSubId
  );

  // --- HANDLERS ---

  const handleNextStep = () => {
    if (!selectedKegiatanId || !selectedSubId) {
      Swal.fire('Perhatian', 'Silakan pilih Kegiatan dan Sub Kegiatan terlebih dahulu.', 'warning');
      return;
    }
    setStep(2);
  };

  // Tambah mitra ke list seleksi
  const handleAddMitra = (mitra) => {
    if (selectedMitras.some(m => m.id === mitra.id)) return;
    
    // Default jabatan kosong saat pertama ditambah
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

  // --- FINAL SUBMIT ---
  const handleSubmit = async () => {
    if (selectedMitras.length === 0) {
      return Swal.fire('Perhatian', 'Belum ada mitra yang dipilih.', 'warning');
    }
    
    // Validasi: Pastikan semua mitra sudah dipilihkan jabatannya
    const incompleteMitra = selectedMitras.find(m => !m.assignedJabatan);
    if (incompleteMitra) {
      return Swal.fire('Data Belum Lengkap', `Harap pilih jabatan untuk mitra: ${incompleteMitra.nama_lengkap}`, 'warning');
    }

    setSubmitting(true);
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));
    const headers = { Authorization: `Bearer ${token}` };

    try {
      // PERUBAHAN UTAMA:
      // Struktur payload ini sekarang akan diproses backend untuk:
      // 1. Membuat Penugasan
      // 2. Memasukkan Mitra ke Kelompok Penugasan beserta Kode Jabatannya
      const payload = {
        id_subkegiatan: selectedSubId,
        id_pengawas: user ? user.id : 1,
        anggota: selectedMitras.map(m => ({
            id_mitra: m.id,
            kode_jabatan: m.assignedJabatan // Ini yang akan masuk ke tabel kelompok_penugasan
        }))
      };

      await axios.post(`${API_URL}/api/penugasan`, payload, { headers });

      Swal.fire({
        title: 'Berhasil!',
        text: 'Penugasan dan tim berhasil disimpan.',
        icon: 'success',
        timer: 2000,
        showConfirmButton: false
      }).then(() => {
        navigate('/admin/penugasan');
      });

    } catch (err) {
      console.error(err);
      Swal.fire('Gagal', err.response?.data?.error || 'Terjadi kesalahan saat menyimpan.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Filter pencarian mitra di dropdown
  const filteredMitra = listMitra.filter(m => {
    const matchSearch = m.nama_lengkap.toLowerCase().includes(mitraSearch.toLowerCase()) || m.nik.includes(mitraSearch);
    const notSelected = !selectedMitras.some(selected => selected.id === m.id);
    return matchSearch && notSelected;
  });

  if (loading) return <div className="text-center py-20 text-gray-500">Memuat formulir...</div>;

  return (
    <div className="max-w-5xl mx-auto pb-20">
      
      {/* HEADER WIZARD */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Wizard Penugasan Mitra</h1>
        <div className="flex items-center gap-2 text-sm text-gray-500 mt-2">
          <span className={`px-3 py-1 rounded-full ${step === 1 ? 'bg-[#1A2A80] text-white font-bold' : 'bg-gray-200'}`}>1. Pilih Kegiatan</span>
          <span className="text-gray-300">-----</span>
          <span className={`px-3 py-1 rounded-full ${step === 2 ? 'bg-[#1A2A80] text-white font-bold' : 'bg-gray-200'}`}>2. Mitra & Jabatan</span>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden min-h-[400px] flex flex-col">
        
        {/* --- STEP 1: PILIH KEGIATAN --- */}
        {step === 1 && (
          <div className="p-8 animate-fade-in-up flex-1 flex flex-col">
            <h2 className="text-lg font-bold text-gray-700 mb-6 flex items-center gap-2">
              <FaClipboardList className="text-[#1A2A80]" /> Tentukan Sasaran Kegiatan
            </h2>

            <div className="space-y-6">
              {/* Dropdown Kegiatan Utama */}
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

              {/* Dropdown Sub Kegiatan */}
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

        {/* --- STEP 2: MITRA & JABATAN --- */}
        {step === 2 && (
          <div className="p-8 animate-fade-in-up flex-1 flex flex-col">
            
            {/* Info Sub Kegiatan yang dipilih */}
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 mb-6 flex justify-between items-center">
              <div className='text-sm text-blue-800'>
                <span className="font-bold block text-xs uppercase text-blue-400">Target Kegiatan:</span>
                {listSubKegiatan.find(s => s.id == selectedSubId)?.nama_sub_kegiatan}
              </div>
              <button onClick={() => setStep(1)} className="text-xs underline hover:text-blue-600">Ubah</button>
            </div>

            <div className="flex flex-col md:flex-row gap-8 h-full">
              
              {/* KOLOM KIRI: Pencarian Mitra */}
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
                    <div className="absolute z-10 w-full bg-white border border-gray-200 rounded-lg shadow-xl mt-1 max-h-60 overflow-y-auto">
                      {filteredMitra.length === 0 ? (
                        <div className="p-3 text-sm text-gray-500">Tidak ditemukan.</div>
                      ) : (
                        filteredMitra.map(m => (
                          <div key={m.id} onClick={() => handleAddMitra(m)} className="px-4 py-3 hover:bg-blue-50 cursor-pointer border-b last:border-none">
                            <p className="text-sm font-bold text-gray-800">{m.nama_lengkap}</p>
                            <p className="text-xs text-gray-500">{m.nik}</p>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  Cari mitra lalu klik untuk menambahkan ke daftar penugasan di sebelah kanan.
                </p>
              </div>

              {/* KOLOM KANAN: Daftar Penugasan (Mitra + Jabatan) */}
              <div className="md:w-2/3 bg-gray-50 rounded-xl border border-gray-200 p-5 flex flex-col">
                <div className="flex justify-between items-center mb-4">
                   <h3 className="text-sm font-bold text-gray-700 uppercase flex items-center gap-2">
                     <FaUsers /> Daftar Penugasan ({selectedMitras.length})
                   </h3>
                   {availableJabatan.length === 0 && (
                     <span className="text-xs text-red-500 bg-red-50 px-2 py-1 rounded border border-red-100">
                       ⚠️ Belum ada Jabatan/Honor diatur!
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

                      return (
                        <div key={mitra.id} className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm relative group hover:border-blue-300 transition">
                          
                          {/* Baris Atas: Identitas Mitra */}
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

                          {/* Baris Bawah: Pilihan Jabatan & Estimasi Honor */}
                          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 items-center bg-gray-50 p-3 rounded-lg">
                             <div>
                               <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Pilih Jabatan</label>
                               <select 
                                 className="w-full text-xs border border-gray-300 rounded px-2 py-1.5 focus:ring-1 focus:ring-[#1A2A80] outline-none"
                                 value={mitra.assignedJabatan}
                                 onChange={(e) => handleUpdateMitraJabatan(mitra.id, e.target.value)}
                               >
                                 <option value="">-- Pilih --</option>
                                 {availableJabatan.map(h => (
                                   <option key={h.kode_jabatan} value={h.kode_jabatan}>{h.nama_jabatan}</option>
                                 ))}
                               </select>
                             </div>
                             
                             <div className="text-right">
                               <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Estimasi Honor</label>
                               {honorInfo ? (
                                 <div className="text-sm font-bold text-green-600 flex items-center justify-end gap-1">
                                   <FaMoneyBillWave size={12}/> {formatRupiah(honorInfo.tarif)}
                                 </div>
                               ) : (
                                 <span className="text-xs text-gray-400 italic">-</span>
                               )}
                             </div>
                          </div>

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