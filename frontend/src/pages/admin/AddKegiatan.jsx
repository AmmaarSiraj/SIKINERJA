// src/pages/admin/AddKegiatan.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import PartSubKegiatan from '../../components/admin/PartSubKegiatan';
import PartAddHonor from '../../components/admin/PartAddHonor'; 
// 1. IMPORT ICON
import { 
  FaArrowLeft, 
  FaSave, 
  FaListAlt, 
  FaPlus, 
  FaLayerGroup 
} from 'react-icons/fa';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const AddKegiatan = () => {
  // --- STATE ---
  const [modeInput, setModeInput] = useState('new'); 
  const [existingKegiatanList, setExistingKegiatanList] = useState([]);
  const [selectedKegiatanId, setSelectedKegiatanId] = useState('');

  // State Form Kegiatan Baru
  const [formData, setFormData] = useState({
    nama_kegiatan: '',
    deskripsi: '',
  });
  
  const [showSubKegiatan, setShowSubKegiatan] = useState(false);
  const [subKegiatans, setSubKegiatans] = useState([]);
  
  // State Honorarium
  const [honorariumMap, setHonorariumMap] = useState({});

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const navigate = useNavigate();

  // --- FETCH DATA ---
  useEffect(() => {
    const fetchKegiatan = async () => {
      try {
        const token = localStorage.getItem('token');
        if(!token) return;
        const res = await axios.get(`${API_URL}/api/kegiatan`, {
           headers: { Authorization: `Bearer ${token}` }
        });
        setExistingKegiatanList(res.data);
      } catch (err) {
        console.error("Gagal memuat daftar kegiatan", err);
      }
    };
    fetchKegiatan();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleToggleSubKegiatan = (e) => {
    const isChecked = e.target.checked;
    setShowSubKegiatan(isChecked);
    
    if (isChecked && subKegiatans.length === 0) {
      setSubKegiatans([{ 
        id: Date.now(), 
        nama_sub_kegiatan: '', 
        deskripsi: '', 
        periode: new Date().getFullYear().toString(), 
        tanggal_mulai: '', 
        tanggal_selesai: '', 
        open_req: '', 
        close_req: '' 
      }]);
    } else if (!isChecked) {
      setSubKegiatans([]);
      setHonorariumMap({});
    }
  };

  // --- HANDLE SUBMIT ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    // VALIDASI
    if (showSubKegiatan && subKegiatans.some(sub => !sub.nama_sub_kegiatan)) {
      setError('Nama sub kegiatan tidak boleh kosong.');
      setLoading(false);
      return;
    }

    if (modeInput === 'existing' && !selectedKegiatanId) {
      setError('Harap pilih Survei/Sensus terlebih dahulu.');
      setLoading(false);
      return;
    }

    if (modeInput === 'new' && !formData.nama_kegiatan) {
      setError('Nama Survei/Sensus baru wajib diisi.');
      setLoading(false);
      return;
    }

    let token;
    try {
      token = localStorage.getItem('token');
      if (!token) throw new Error('No auth token found. Please login.');
      
      const config = {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        }
      };

      let finalKegiatanId = null;

      // 1. PROSES INDUK KEGIATAN
      if (modeInput === 'new') {
        const payloadKegiatan = {
            ...formData,
            subkegiatans: [] 
        };
        const response = await axios.post(`${API_URL}/api/kegiatan`, payloadKegiatan, config);
        finalKegiatanId = response.data.data?.kegiatan?.id || response.data.id || response.data.data?.id;
      } else {
        finalKegiatanId = selectedKegiatanId;
      }

      // 2. PROSES SUB KEGIATAN & HONOR
      if (showSubKegiatan && subKegiatans.length > 0) {
        for (const sub of subKegiatans) {
            const payloadSub = {
                id_kegiatan: finalKegiatanId,
                nama_sub_kegiatan: sub.nama_sub_kegiatan,
                deskripsi: sub.deskripsi,
                periode: sub.periode, 
                open_req: sub.open_req,
                close_req: sub.close_req,
                tanggal_mulai: sub.tanggal_mulai,
                tanggal_selesai: sub.tanggal_selesai
            };

            const resSub = await axios.post(`${API_URL}/api/subkegiatan`, payloadSub, config);
            const realSubId = resSub.data.data?.id || resSub.data.data?.insertId || resSub.data.id;

            const honorConfig = honorariumMap[sub.id];
            if (honorConfig && honorConfig.tarif > 0) {
                const payloadHonor = {
                    id_subkegiatan: realSubId, 
                    tarif: honorConfig.tarif,
                    id_satuan: honorConfig.id_satuan,
                    basis_volume: honorConfig.basis_volume
                };
                await axios.post(`${API_URL}/api/honorarium`, payloadHonor, config);
            }
        }
      }
      
      setSuccess('Data berhasil disimpan!');
      setTimeout(() => {
        navigate(`/admin/manage-kegiatan`);
      }, 1500);

    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || err.message || 'Terjadi kesalahan.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto pb-10">
      
      {/* Tombol Kembali */}
      <div className="mb-6">
        <Link 
          to="/admin/manage-kegiatan" 
          className="inline-flex items-center gap-2 text-gray-500 hover:text-[#1A2A80] transition font-medium"
        >
          <FaArrowLeft size={14} /> Kembali ke Daftar
        </Link>
      </div>

      {/* Toggle Mode Input */}
      <div className="bg-white p-1.5 rounded-xl shadow-sm border border-gray-200 inline-flex mb-8">
        <button
            type="button"
            onClick={() => setModeInput('new')}
            className={`px-5 py-2.5 rounded-lg text-sm font-bold transition flex items-center gap-2 ${modeInput === 'new' ? 'bg-[#1A2A80] text-white shadow-md' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'}`}
        >
            <FaPlus size={12} /> Buat Survei/Sensus Baru
        </button>
        <button
            type="button"
            onClick={() => setModeInput('existing')}
            className={`px-5 py-2.5 rounded-lg text-sm font-bold transition flex items-center gap-2 ${modeInput === 'existing' ? 'bg-[#1A2A80] text-white shadow-md' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'}`}
        >
            <FaListAlt size={12} /> Pilih yang Sudah Ada
        </button>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* KOLOM KIRI: DETAIL INDUK */}
        <div className="space-y-6">
            <div className="bg-white shadow-sm rounded-xl border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center gap-3">
                    <div className="bg-blue-100 text-[#1A2A80] p-2 rounded-lg">
                        <FaLayerGroup />
                    </div>
                    <h2 className="text-lg font-bold text-gray-800">
                        {modeInput === 'new' ? 'Detail Survei/Sensus Baru' : 'Pilih Survei/Sensus Induk'}
                    </h2>
                </div>

                <div className="p-6">
                    {modeInput === 'existing' ? (
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Pilih Survei/Sensus</label>
                            <select
                                value={selectedKegiatanId}
                                onChange={(e) => setSelectedKegiatanId(e.target.value)}
                                className="block w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1A2A80] focus:border-[#1A2A80] bg-gray-50 transition outline-none"
                                required
                            >
                                <option value="">-- Pilih dari daftar --</option>
                                {existingKegiatanList.map(keg => (
                                    <option key={keg.id} value={keg.id}>
                                        {keg.nama_kegiatan}
                                    </option>
                                ))}
                            </select>
                            <p className="text-xs text-gray-500 mt-2 italic">
                                Sub kegiatan yang dibuat akan ditambahkan ke dalam kegiatan yang Anda pilih di atas.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-5">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Nama Survei/Sensus</label>
                                <input
                                    type="text"
                                    name="nama_kegiatan"
                                    value={formData.nama_kegiatan}
                                    onChange={handleChange}
                                    required={modeInput === 'new'}
                                    placeholder="Contoh: Sensus Ekonomi 2026"
                                    className="block w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1A2A80] focus:border-[#1A2A80] transition outline-none"
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Deskripsi Singkat</label>
                                <textarea
                                    name="deskripsi"
                                    value={formData.deskripsi}
                                    onChange={handleChange}
                                    rows="4"
                                    placeholder="Jelaskan tujuan kegiatan..."
                                    className="block w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1A2A80] focus:border-[#1A2A80] transition outline-none resize-none"
                                ></textarea>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>

        {/* KOLOM KANAN: SUB KEGIATAN & HONOR */}
        <div className="space-y-6">
            {/* Toggle Sub Kegiatan */}
            <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
                <div>
                    <h3 className="text-sm font-bold text-gray-800">Tambahkan Rincian (Sub Kegiatan)</h3>
                    <p className="text-xs text-gray-500 mt-0.5">Aktifkan untuk mengisi detail tahapan & honor.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                        type="checkbox" 
                        className="sr-only peer"
                        checked={showSubKegiatan}
                        onChange={handleToggleSubKegiatan}
                    />
                    <div className="w-12 h-7 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-blue-100 peer-checked:bg-[#1A2A80] peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all"></div>
                </label>
            </div>

            {showSubKegiatan ? (
                <div className="animate-fade-in-up space-y-6">
                    <PartSubKegiatan 
                        subKegiatans={subKegiatans} 
                        setSubKegiatans={setSubKegiatans} 
                    />
                    
                    <PartAddHonor
                        subKegiatans={subKegiatans}
                        honorariumMap={honorariumMap}
                        setHonorariumMap={setHonorariumMap}
                        isSubKegiatanActive={showSubKegiatan}
                    />
                </div>
            ) : (
                <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl p-8 text-center flex flex-col items-center justify-center h-48">
                    <div className="text-gray-300 text-4xl mb-3"><FaListAlt /></div>
                    <p className="text-gray-500 text-sm font-medium">Rincian Sub Kegiatan belum diaktifkan.</p>
                </div>
            )}
        </div>

        {/* SUBMIT AREA */}
        <div className="lg:col-span-2 pt-6 border-t border-gray-200 mt-2">
            {error && <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg mb-4 border border-red-100 text-sm">{error}</div>}
            {success && <div className="bg-green-50 text-green-600 px-4 py-3 rounded-lg mb-4 border border-green-100 text-sm">{success}</div>}

            <div className="flex justify-end">
                <button
                    type="submit"
                    disabled={loading}
                    className="flex items-center gap-2 bg-[#1A2A80] hover:bg-blue-900 text-white font-bold py-3 px-8 rounded-xl shadow-lg transform active:scale-95 transition disabled:opacity-70 disabled:cursor-not-allowed"
                >
                    {loading ? 'Memproses...' : (
                        <>
                            <FaSave /> {modeInput === 'new' ? 'Simpan Semua Data' : 'Simpan Sub Kegiatan'}
                        </>
                    )}
                </button>
            </div>
        </div>

      </form>
    </div>
  );
};

export default AddKegiatan;