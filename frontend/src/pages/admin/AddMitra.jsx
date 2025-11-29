import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';
import { 
  FaArrowLeft, FaUserTie, FaIdCard, FaPhone, FaEnvelope, 
  FaMapMarkerAlt, FaMoneyCheckAlt, FaSave, FaCheck 
} from 'react-icons/fa';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const AddMitra = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  // State Form
  const [formData, setFormData] = useState({
    nama_lengkap: '',
    nik: '',
    alamat: '',
    no_hp: '',
    email: '',
    nama_bank: '',
    no_rekening: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Validasi sederhana
    if (!formData.nama_lengkap || !formData.nik) {
        setLoading(false);
        return Swal.fire('Gagal', 'Nama Lengkap dan NIK wajib diisi.', 'warning');
    }

    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_URL}/api/mitra`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      Swal.fire({
        title: 'Berhasil!',
        text: 'Mitra baru berhasil ditambahkan.',
        icon: 'success',
        timer: 1500,
        showConfirmButton: false
      }).then(() => {
        navigate('/admin/pengajuan-mitra'); // Kembali ke halaman manajemen mitra
      });

    } catch (err) {
      console.error(err);
      Swal.fire('Gagal', err.response?.data?.error || 'Terjadi kesalahan saat menyimpan.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto w-full pb-20">
      
      {/* Header Navigasi */}
      <div className="flex items-center gap-4 mb-6">
        <Link 
          to="/admin/pengajuan-mitra" 
          className="text-gray-500 hover:text-[#1A2A80] transition p-2 rounded-full hover:bg-gray-100"
        >
          <FaArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Tambah Mitra Baru</h1>
          <p className="text-sm text-gray-500">Formulir pendaftaran mitra statistik secara manual.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        
        {/* Header Card */}
        <div className="px-8 py-5 bg-gray-50/50 border-b border-gray-100 flex items-center gap-3 text-[#1A2A80]">
            <FaUserTie className="text-xl" />
            <h3 className="font-bold text-gray-700">Identitas & Informasi Mitra</h3>
        </div>

        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* KOLOM KIRI: DATA PRIBADI */}
            <div className="space-y-5">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider border-b pb-2 mb-4">Data Pribadi</h4>
                
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Nama Lengkap <span className="text-red-500">*</span></label>
                    <div className="relative">
                        <span className="absolute left-3 top-3 text-gray-400"><FaUserTie /></span>
                        <input 
                            type="text" name="nama_lengkap" 
                            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1A2A80] outline-none transition"
                            placeholder="Contoh: Budi Santoso"
                            value={formData.nama_lengkap} onChange={handleChange} required
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">NIK <span className="text-red-500">*</span></label>
                    <div className="relative">
                        <span className="absolute left-3 top-3 text-gray-400"><FaIdCard /></span>
                        <input 
                            type="number" name="nik" 
                            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1A2A80] outline-none transition"
                            placeholder="16 digit NIK"
                            value={formData.nik} onChange={handleChange} required
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Alamat Domisili</label>
                    <div className="relative">
                        <span className="absolute left-3 top-3 text-gray-400"><FaMapMarkerAlt /></span>
                        <textarea 
                            name="alamat" rows="3"
                            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1A2A80] outline-none transition resize-none"
                            placeholder="Jalan, RT/RW, Kelurahan, Kecamatan..."
                            value={formData.alamat} onChange={handleChange}
                        ></textarea>
                    </div>
                </div>
            </div>

            {/* KOLOM KANAN: KONTAK & BANK */}
            <div className="space-y-5">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider border-b pb-2 mb-4">Kontak & Rekening</h4>

                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">No. Handphone / WA</label>
                    <div className="relative">
                        <span className="absolute left-3 top-3 text-gray-400"><FaPhone /></span>
                        <input 
                            type="text" name="no_hp" 
                            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1A2A80] outline-none transition"
                            placeholder="0812..."
                            value={formData.no_hp} onChange={handleChange}
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Email</label>
                    <div className="relative">
                        <span className="absolute left-3 top-3 text-gray-400"><FaEnvelope /></span>
                        <input 
                            type="email" name="email" 
                            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1A2A80] outline-none transition"
                            placeholder="email@example.com"
                            value={formData.email} onChange={handleChange}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Nama Bank</label>
                        <div className="relative">
                            <span className="absolute left-3 top-3 text-gray-400"><FaMoneyCheckAlt /></span>
                            <input 
                                type="text" name="nama_bank" 
                                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1A2A80] outline-none transition"
                                placeholder="BRI, BNI, dll"
                                value={formData.nama_bank} onChange={handleChange}
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">No. Rekening</label>
                        <input 
                            type="text" name="no_rekening" 
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1A2A80] outline-none transition"
                            placeholder="Nomor Rekening"
                            value={formData.no_rekening} onChange={handleChange}
                        />
                    </div>
                </div>
            </div>

        </div>

        {/* Footer Actions */}
        <div className="px-8 py-5 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
            <button 
                type="button"
                onClick={() => navigate('/admin/pengajuan-mitra')}
                className="px-6 py-2.5 rounded-lg border border-gray-300 text-gray-600 font-bold hover:bg-gray-100 transition"
            >
                Batal
            </button>
            <button 
                type="submit"
                disabled={loading}
                className="px-8 py-2.5 rounded-lg bg-[#1A2A80] text-white font-bold hover:bg-blue-900 transition shadow-lg flex items-center gap-2 disabled:opacity-50"
            >
                {loading ? 'Menyimpan...' : <><FaCheck /> Simpan Mitra</>}
            </button>
        </div>

      </form>
    </div>
  );
};

export default AddMitra;