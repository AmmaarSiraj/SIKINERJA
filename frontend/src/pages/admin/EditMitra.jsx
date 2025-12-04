import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';
import { 
  FaArrowLeft, FaUserTie, FaIdCard, FaPhone, FaEnvelope, 
  FaMapMarkerAlt, FaSave, FaVenusMars, FaGraduationCap, FaBriefcase, FaIdBadge
} from 'react-icons/fa';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const EditMitra = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  const [formData, setFormData] = useState({
    nama_lengkap: '',
    nik: '',
    sobat_id: '',
    alamat: '',
    no_hp: '',
    email: '',
    jenis_kelamin: '',
    pendidikan: '',
    pekerjaan: '',
    deskripsi_pekerjaan_lain: ''
  });

  useEffect(() => {
    const fetchMitra = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`${API_URL}/api/mitra/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = res.data;
        
        setFormData({
            nama_lengkap: data.nama_lengkap || '',
            nik: data.nik || '',
            sobat_id: data.sobat_id || '',
            alamat: data.alamat || '',
            no_hp: data.no_hp || '',
            email: data.email || '',
            jenis_kelamin: data.jenis_kelamin || '',
            pendidikan: data.pendidikan || '',
            pekerjaan: data.pekerjaan || '',
            deskripsi_pekerjaan_lain: data.deskripsi_pekerjaan_lain || ''
        });
      } catch (err) {
        Swal.fire('Error', 'Gagal memuat data mitra.', 'error');
        navigate('/admin/pengajuan-mitra');
      } finally {
        setFetching(false);
      }
    };
    fetchMitra();
  }, [id, navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (!formData.nama_lengkap || !formData.nik || !formData.no_hp) {
        setLoading(false);
        return Swal.fire('Gagal', 'Nama Lengkap, NIK, dan No HP wajib diisi.', 'warning');
    }

    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API_URL}/api/mitra/${id}`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      Swal.fire({
        title: 'Berhasil!',
        text: 'Data mitra berhasil diperbarui.',
        icon: 'success',
        timer: 1500,
        showConfirmButton: false
      }).then(() => {
        navigate('/admin/pengajuan-mitra');
      });

    } catch (err) {
      console.error(err);
      Swal.fire('Gagal', err.response?.data?.error || 'Terjadi kesalahan saat menyimpan.', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return <div className="text-center py-10 text-gray-500">Memuat data...</div>;

  return (
    <div className="max-w-4xl mx-auto w-full pb-20">
      
      <div className="flex items-center gap-4 mb-6">
        <Link 
          to="/admin/pengajuan-mitra" 
          className="text-gray-500 hover:text-[#1A2A80] transition p-2 rounded-full hover:bg-gray-100"
        >
          <FaArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Edit Data Mitra</h1>
          <p className="text-sm text-gray-500">Perbarui informasi mitra statistik.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        
        <div className="px-8 py-5 bg-gray-50/50 border-b border-gray-100 flex items-center gap-3 text-[#1A2A80]">
            <FaUserTie className="text-xl" />
            <h3 className="font-bold text-gray-700">Identitas & Latar Belakang Mitra</h3>
        </div>

        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
            
            <div className="space-y-5">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider border-b pb-2 mb-4">Data Pribadi</h4>
                
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Nama Lengkap <span className="text-red-500">*</span></label>
                    <div className="relative">
                        <span className="absolute left-3 top-3 text-gray-400"><FaUserTie /></span>
                        <input 
                            type="text" name="nama_lengkap" 
                            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1A2A80] outline-none transition"
                            value={formData.nama_lengkap} onChange={handleChange} required
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">NIK <span className="text-red-500">*</span></label>
                        <div className="relative">
                            <span className="absolute left-3 top-3 text-gray-400"><FaIdCard /></span>
                            <input 
                                type="text" name="nik" 
                                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1A2A80] outline-none transition"
                                value={formData.nik} onChange={handleChange} required
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">ID Sobat</label>
                        <div className="relative">
                            <span className="absolute left-3 top-3 text-gray-400"><FaIdBadge /></span>
                            <input 
                                type="text" name="sobat_id" 
                                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1A2A80] outline-none transition"
                                value={formData.sobat_id} onChange={handleChange}
                            />
                        </div>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Jenis Kelamin</label>
                    <div className="relative">
                        <span className="absolute left-3 top-3 text-gray-400"><FaVenusMars /></span>
                        <select 
                            name="jenis_kelamin"
                            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1A2A80] outline-none transition bg-white"
                            value={formData.jenis_kelamin} onChange={handleChange}
                        >
                            <option value="">-- Pilih --</option>
                            <option value="Lk">Laki-laki</option>
                            <option value="Pr">Perempuan</option>
                        </select>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Alamat Domisili</label>
                    <div className="relative">
                        <span className="absolute left-3 top-3 text-gray-400"><FaMapMarkerAlt /></span>
                        <textarea 
                            name="alamat" rows="3"
                            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1A2A80] outline-none transition resize-none"
                            value={formData.alamat} onChange={handleChange} required
                        ></textarea>
                    </div>
                </div>
            </div>

            <div className="space-y-5">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider border-b pb-2 mb-4">Kontak & Latar Belakang</h4>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">No. Handphone <span className="text-red-500">*</span></label>
                        <div className="relative">
                            <span className="absolute left-3 top-3 text-gray-400"><FaPhone /></span>
                            <input 
                                type="text" name="no_hp" 
                                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1A2A80] outline-none transition"
                                value={formData.no_hp} onChange={handleChange} required
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
                                value={formData.email} onChange={handleChange}
                            />
                        </div>
                    </div>
                </div>

                {/* --- UPDATE: DROPDOWN PENDIDIKAN --- */}
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Pendidikan Terakhir</label>
                    <div className="relative">
                        <span className="absolute left-3 top-3 text-gray-400"><FaGraduationCap /></span>
                        <select
                            name="pendidikan"
                            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1A2A80] outline-none transition bg-white"
                            value={formData.pendidikan} onChange={handleChange}
                        >
                            <option value="">-- Pilih Pendidikan --</option>
                            <option value="Tamat SMA/Sederajat">Tamat SMA/Sederajat</option>
                            <option value="Tamat D4/S1">Tamat D4/S1</option>
                            
                            <option value="Tamat SD/Sederajat">Tamat SD/Sederajat</option>
                            <option value="Tamat SMP/Sederajat">Tamat SMP/Sederajat</option>
                            <option value="Tamat D1/D2/D3">Tamat D1/D2/D3</option>
                            <option value="Tamat S2">Tamat S2</option>
                            <option value="Tamat S3">Tamat S3</option>
                            <option value="Lainnya">Lainnya</option>
                        </select>
                    </div>
                </div>
                {/* ----------------------------------- */}

                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Pekerjaan Utama</label>
                    <div className="relative">
                        <span className="absolute left-3 top-3 text-gray-400"><FaBriefcase /></span>
                        <input 
                            type="text" name="pekerjaan" 
                            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1A2A80] outline-none transition"
                            value={formData.pekerjaan} onChange={handleChange}
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Keterangan Pekerjaan Lain</label>
                    <textarea 
                        name="deskripsi_pekerjaan_lain" rows="2"
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1A2A80] outline-none transition resize-none"
                        value={formData.deskripsi_pekerjaan_lain} onChange={handleChange}
                    ></textarea>
                </div>
            </div>

        </div>

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
                {loading ? 'Menyimpan...' : <><FaSave /> Simpan Perubahan</>}
            </button>
        </div>

      </form>
    </div>
  );
};

export default EditMitra;