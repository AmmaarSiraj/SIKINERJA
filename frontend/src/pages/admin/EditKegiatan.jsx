// src/pages/admin/EditKegiatan.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';
import PartSubKegiatan from '../../components/admin/PartSubKegiatan';
import { FaArrowLeft, FaSave, FaPlus, FaCheck, FaArrowRight, FaLayerGroup } from 'react-icons/fa';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const EditKegiatan = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // --- STATE CONTROL ---
  const [step, setStep] = useState(1); 
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // --- DATA STATE ---
  // Data Step 1 (Induk)
  const [indukData, setIndukData] = useState({
    nama_kegiatan: '', 
    deskripsi: ''
  });

  // Data Step 2 (Array Sub Kegiatan & Honor)
  const [subKegiatans, setSubKegiatans] = useState([]);

  // State untuk melacak ID asli (guna keperluan penghapusan)
  const [originalSubIds, setOriginalSubIds] = useState([]);
  const [originalHonorIds, setOriginalHonorIds] = useState([]);

  // --- 1. FETCH DATA EXISTING ---
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        const headers = { Authorization: `Bearer ${token}` };

        // A. Ambil Data Induk, Sub, dan Honorarium sekaligus
        const [resInduk, resSub, resHonor] = await Promise.all([
          axios.get(`${API_URL}/api/kegiatan/${id}`, { headers }),
          axios.get(`${API_URL}/api/subkegiatan/kegiatan/${id}`, { headers }),
          axios.get(`${API_URL}/api/honorarium`, { headers }) // Ambil semua honor (nanti difilter)
        ]);

        // B. Set Data Induk
        setIndukData({
          nama_kegiatan: resInduk.data.nama_kegiatan,
          deskripsi: resInduk.data.deskripsi || ''
        });

        // C. Mapping Data Sub Kegiatan & Honor
        const allHonors = resHonor.data;
        const mappedSubs = resSub.data.map(sub => {
          // Filter honor yang milik sub kegiatan ini
          const myHonors = allHonors.filter(h => h.id_subkegiatan === sub.id).map(h => ({
            id: h.id_honorarium, // ID Asli dari DB
            kode_jabatan: h.kode_jabatan,
            tarif: Number(h.tarif),
            id_satuan: h.id_satuan,
            basis_volume: h.basis_volume
          }));

          return {
            id: sub.id, // ID Asli dari DB (misal: 'sub1')
            nama_sub_kegiatan: sub.nama_sub_kegiatan,
            deskripsi: sub.deskripsi || '',
            periode: sub.periode || '',
            tanggal_mulai: sub.tanggal_mulai ? sub.tanggal_mulai.split('T')[0] : '',
            tanggal_selesai: sub.tanggal_selesai ? sub.tanggal_selesai.split('T')[0] : '',
            open_req: sub.open_req ? sub.open_req.split('T')[0] : '',
            close_req: sub.close_req ? sub.close_req.split('T')[0] : '',
            honorList: myHonors
          };
        });

        setSubKegiatans(mappedSubs);

        // D. Simpan ID Asli untuk pelacakan hapus
        setOriginalSubIds(mappedSubs.map(s => s.id));
        
        const allHonorIds = [];
        mappedSubs.forEach(s => s.honorList.forEach(h => allHonorIds.push(h.id)));
        setOriginalHonorIds(allHonorIds);

      } catch (err) {
        console.error(err);
        Swal.fire('Error', 'Gagal memuat data kegiatan.', 'error');
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchData();
  }, [id]);

  // --- HANDLERS STEP 1 ---
  const handleNextStep = () => {
    if (!indukData.nama_kegiatan) {
        return Swal.fire('Validasi Gagal', 'Nama Kegiatan wajib diisi', 'warning');
    }
    setStep(2);
    window.scrollTo(0, 0);
  };

  // --- HANDLERS STEP 2 ---
  const addSubCard = () => {
    setSubKegiatans([...subKegiatans, { 
      id: Date.now(), // ID Sementara (Number)
      nama_sub_kegiatan: '', 
      deskripsi: '', 
      periode: '', 
      tanggal_mulai: '', 
      tanggal_selesai: '', 
      open_req: '', 
      close_req: '',
      honorList: [] 
    }]);
  };

  // --- FINAL SAVE (LOGIKA CRUD CERDAS) ---
  const handleFinalSubmit = async () => {
    // 1. Validasi Frontend
    for (const sub of subKegiatans) {
      if (!sub.nama_sub_kegiatan) return Swal.fire('Gagal', 'Nama Sub Kegiatan tidak boleh kosong.', 'error');
      for (const h of sub.honorList) {
        if (!h.kode_jabatan) return Swal.fire('Gagal', `Jabatan pada sub "${sub.nama_sub_kegiatan}" belum dipilih.`, 'error');
        if (h.tarif <= 0) return Swal.fire('Gagal', `Tarif pada sub "${sub.nama_sub_kegiatan}" tidak valid.`, 'error');
      }
    }

    setSaving(true);
    const token = localStorage.getItem('token');
    const config = { headers: { Authorization: `Bearer ${token}` } };

    try {
      // A. UPDATE KEGIATAN INDUK
      await axios.put(`${API_URL}/api/kegiatan/${id}`, indukData, config);

      // B. KELOLA SUB KEGIATAN (Create / Update / Delete)
      
      // B1. Hapus Sub Kegiatan yang hilang dari UI
      const currentSubIds = subKegiatans.map(s => s.id);
      const subsToDelete = originalSubIds.filter(oldId => !currentSubIds.includes(oldId));
      
      for (const delId of subsToDelete) {
        await axios.delete(`${API_URL}/api/subkegiatan/${delId}`, config);
      }

      // B2. Loop Sub Kegiatan yang ada di UI
      for (const sub of subKegiatans) {
        let subId = sub.id;
        
        const payloadSub = {
          id_kegiatan: id, // Link ke induk
          nama_sub_kegiatan: sub.nama_sub_kegiatan,
          deskripsi: sub.deskripsi,
          periode: sub.periode,
          tanggal_mulai: sub.tanggal_mulai,
          tanggal_selesai: sub.tanggal_selesai,
          open_req: sub.open_req,
          close_req: sub.close_req
        };

        if (typeof sub.id === 'number') {
          // ID Number = Item Baru -> POST
          const res = await axios.post(`${API_URL}/api/subkegiatan`, {
             ...payloadSub, 
             mode_kegiatan: 'existing' // Flag untuk backend
          }, config);
          subId = res.data.data.id; // Ambil ID baru dari database
        } else {
          // ID String = Item Lama -> PUT (Update Info)
          await axios.put(`${API_URL}/api/subkegiatan/${subId}/info`, payloadSub, config);
        }

        // C. KELOLA HONORARIUM (Create / Update / Delete) di dalam Sub ini
        
        // C1. Hapus Honor yang hilang (Khusus untuk sub kegiatan LAMA)
        if (typeof sub.id !== 'number') { // Hanya cek delete jika sub bukan barang baru
             const currentHonorIds = sub.honorList.map(h => h.id);
             // Cari ID honor yang dulunya ada di sub ini, tapi sekarang tidak ada di honorList UI
             // (Logic ini agak kompleks karena originalHonorIds adalah flat array. 
             //  Cara simpel: Kita asumsikan backend tidak masalah jika kita delete by ID)
             //  Tapi kita harus tahu honor ID mana yang milik sub ini.
             //  *Simplifikasi:* Kita skip delete spesifik per sub, kita akan handle logic Add/Update saja.
             //  *PENTING:* Jika user menghapus baris honor di UI, ID-nya hilang dari state. 
             //  Kita perlu membandingkan `originalHonorIds` global dengan `currentAllHonorIds`.
        }

        // C2. Loop Honorarium UI
        for (const h of sub.honorList) {
          const payloadHonor = {
            id_subkegiatan: subId, // Gunakan subId yang pasti (entah baru/lama)
            kode_jabatan: h.kode_jabatan,
            tarif: h.tarif,
            id_satuan: h.id_satuan,
            basis_volume: h.basis_volume
          };

          if (typeof h.id === 'number') {
            // ID Number (Timestamp) = Baru -> POST
            await axios.post(`${API_URL}/api/honorarium`, payloadHonor, config);
          } else {
            // ID Asli DB = Lama -> PUT
            await axios.put(`${API_URL}/api/honorarium/${h.id}`, payloadHonor, config);
          }
        }
      }

      // C3. Global Honor Deletion Check (Pembersihan)
      // Kumpulkan semua ID honor yang ada di UI sekarang
      const finalHonorIds = [];
      subKegiatans.forEach(s => s.honorList.forEach(h => {
          if(typeof h.id !== 'number') finalHonorIds.push(h.id);
      }));
      
      const honorsToDelete = originalHonorIds.filter(oldId => !finalHonorIds.includes(oldId));
      for (const hId of honorsToDelete) {
          await axios.delete(`${API_URL}/api/honorarium/${hId}`, config);
      }

      Swal.fire({
        title: 'Tersimpan!',
        text: 'Perubahan kegiatan berhasil disimpan.',
        icon: 'success',
        timer: 2000,
        showConfirmButton: false
      }).then(() => {
        navigate('/admin/manage-kegiatan');
      });

    } catch (err) {
      console.error(err);
      Swal.fire('Gagal', err.response?.data?.message || 'Terjadi kesalahan saat menyimpan.', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="text-center py-20 text-gray-500">Memuat data kegiatan...</div>;

  return (
    <div className="max-w-5xl mx-auto pb-20">
      
      {/* HEADER NAVIGASI */}
      <div className="flex items-center gap-4 mb-8">
        <Link to="/admin/manage-kegiatan" className="text-gray-500 hover:text-[#1A2A80] transition">
          <FaArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Edit Kegiatan</h1>
          <p className="text-sm text-gray-500 flex items-center gap-2">
            <span className={`px-2 py-0.5 rounded ${step === 1 ? 'bg-[#1A2A80] text-white font-bold' : 'bg-gray-200 text-gray-500'}`}>1. Induk</span>
            <span className="text-gray-300">/</span>
            <span className={`px-2 py-0.5 rounded ${step === 2 ? 'bg-[#1A2A80] text-white font-bold' : 'bg-gray-200 text-gray-500'}`}>2. Rincian & Honor</span>
          </p>
        </div>
      </div>

      {/* --- STEP 1: EDIT INDUK --- */}
      {step === 1 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 animate-fade-in-up">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
             <div className="bg-blue-100 text-[#1A2A80] p-2 rounded-lg"><FaLayerGroup /></div>
             <h2 className="text-lg font-bold text-gray-800">Informasi Dasar Kegiatan</h2>
          </div>

          <div className="space-y-6 max-w-2xl mx-auto">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Nama Kegiatan</label>
              <input 
                type="text" 
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1A2A80] focus:border-[#1A2A80] outline-none" 
                value={indukData.nama_kegiatan} 
                onChange={(e) => setIndukData({...indukData, nama_kegiatan: e.target.value})} 
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Deskripsi Singkat</label>
              <textarea 
                rows="4" 
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1A2A80] outline-none resize-none" 
                value={indukData.deskripsi} 
                onChange={(e) => setIndukData({...indukData, deskripsi: e.target.value})} 
              />
            </div>
          </div>

          <div className="mt-10 flex justify-end gap-3 pt-6 border-t border-gray-100">
            <Link to="/admin/manage-kegiatan" className="px-6 py-3 rounded-xl font-bold text-gray-500 hover:bg-gray-100 transition">
                Batal
            </Link>
            <button 
              onClick={handleNextStep}
              className="px-8 py-3 bg-[#1A2A80] text-white rounded-xl font-bold hover:bg-blue-900 shadow-lg flex items-center gap-2 transform active:scale-95 transition"
            >
              Lanjut Edit Rincian <FaArrowRight size={12}/>
            </button>
          </div>
        </div>
      )}

      {/* --- STEP 2: EDIT SUB KEGIATAN & HONOR --- */}
      {step === 2 && (
        <div className="animate-fade-in-up">
          
          <div className="bg-blue-50 border border-blue-200 p-5 rounded-xl mb-8 flex justify-between items-center shadow-sm">
             <div>
                <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Sedang Mengedit</span>
                <h2 className="text-xl font-bold text-gray-800 mt-1">{indukData.nama_kegiatan}</h2>
             </div>
             <button onClick={() => setStep(1)} className="text-sm font-bold text-blue-600 hover:text-blue-800 hover:underline bg-white px-4 py-2 rounded-lg shadow-sm">
                Edit Induk
             </button>
          </div>

          <PartSubKegiatan 
            subKegiatans={subKegiatans} 
            setSubKegiatans={setSubKegiatans} 
          />

          <button 
            onClick={addSubCard}
            className="w-full mt-8 py-5 border-2 border-dashed border-gray-300 rounded-2xl text-gray-500 font-bold hover:bg-white hover:border-[#1A2A80] hover:text-[#1A2A80] hover:shadow-md transition flex justify-center items-center gap-3 group"
          >
            <div className="bg-gray-200 group-hover:bg-[#1A2A80] text-white p-2 rounded-full transition">
                <FaPlus size={14} />
            </div>
            Tambah Sub Kegiatan Lain
          </button>

          <div className="mt-12 flex justify-between items-center pt-8 border-t border-gray-200">
            <button 
              onClick={() => setStep(1)}
              className="px-6 py-3 rounded-xl font-bold text-gray-600 hover:bg-gray-100 border border-transparent hover:border-gray-200 transition flex items-center gap-2"
            >
              <FaArrowLeft size={12} /> Kembali
            </button>
            <button 
              onClick={handleFinalSubmit}
              disabled={saving}
              className="px-10 py-4 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 shadow-xl flex items-center gap-3 disabled:opacity-50 transform active:scale-95 transition"
            >
              {saving ? 'Menyimpan...' : <><FaCheck /> Simpan Perubahan</>}
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default EditKegiatan;