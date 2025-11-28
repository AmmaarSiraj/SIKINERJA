import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';
import PopupTambahAnggota from '../../components/admin/PopupTambahAnggota';
import { 
  FaArrowLeft, 
  FaTrash, 
  FaPlus, 
  FaUserTie, 
  FaChartPie, 
  FaClipboardList, 
  FaExclamationTriangle,
  FaMoneyBillWave
} from 'react-icons/fa';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const getToken = () => localStorage.getItem('token');

const DetailPenugasan = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [penugasan, setPenugasan] = useState(null);
  const [anggota, setAnggota] = useState([]);
  const [listHonorarium, setListHonorarium] = useState([]); // State untuk menyimpan data master honor
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isPopupOpen, setIsPopupOpen] = useState(false);

  const fetchDetailData = async () => {
    if (!id) return;
    setIsLoading(true);
    setError(null);
    try {
      const token = getToken();
      const config = { headers: { Authorization: `Bearer ${token}` } };

      // Ambil 3 Data sekaligus: Detail Penugasan, Daftar Anggota, dan Master Honorarium
      const [penugasanRes, anggotaRes, honorRes] = await Promise.all([
        axios.get(`${API_URL}/api/penugasan/${id}`, config),
        axios.get(`${API_URL}/api/penugasan/${id}/anggota`, config),
        axios.get(`${API_URL}/api/honorarium`, config)
      ]);

      setPenugasan(penugasanRes.data);
      setAnggota(anggotaRes.data || []);
      setListHonorarium(honorRes.data || []);

    } catch (err) { 
      console.error(err);
      setError(err.response?.data?.message || 'Gagal memuat data utama.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDetailData();
  }, [id]);

  // --- LOGIKA PENCARIAN HONOR (FIX NaN) ---
  const getHonorValue = (kodeJabatan) => {
    if (!penugasan || !kodeJabatan) return 0;

    // Cari honor yang cocok dengan Sub Kegiatan ini DAN Jabatan anggota tersebut
    const match = listHonorarium.find(h => 
      // Gunakan '==' untuk perbandingan longgar (antisipasi string vs number)
      h.id_subkegiatan == penugasan.id_subkegiatan && 
      h.kode_jabatan === kodeJabatan
    );

    return match ? Number(match.tarif) : 0;
  };

  const handleRemoveAnggota = async (id_kelompok, nama_mitra) => {
    const result = await Swal.fire({
      title: 'Keluarkan Anggota?',
      text: `Apakah Anda yakin ingin mengeluarkan "${nama_mitra}" dari tim ini?`,
      icon: 'warning',
      showCancelButton: true,
      reverseButtons: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Ya, Keluarkan!',
      cancelButtonText: 'Batal'
    });

    if (result.isConfirmed) {
      try {
        const token = getToken();
        await axios.delete(`${API_URL}/api/kelompok-penugasan/${id_kelompok}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        await Swal.fire('Dikeluarkan!', 'Anggota berhasil dikeluarkan dari tim.', 'success');
        fetchDetailData(); 
      } catch (err) {
        Swal.fire('Gagal!', 'Terjadi kesalahan saat menghapus anggota.', 'error');
      }
    }
  };

  const handleDeletePenugasan = async () => {
    const result = await Swal.fire({
      title: 'Bubarkan Tim?',
      text: "Tindakan ini akan menghapus penugasan ini dan mengeluarkan seluruh anggota yang terdaftar di dalamnya!",
      icon: 'warning',
      showCancelButton: true,
      reverseButtons: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Ya, Bubarkan!',
      cancelButtonText: 'Batal'
    });

    if (result.isConfirmed) {
      try {
        const token = getToken();
        await axios.delete(`${API_URL}/api/penugasan/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        await Swal.fire('Dibubarkan!', 'Tim penugasan berhasil dibubarkan.', 'success');
        navigate('/admin/penugasan');
      } catch (err) {
        Swal.fire('Gagal!', 'Terjadi kesalahan saat membubarkan tim.', 'error');
      }
    }
  };

  const formatRupiah = (num) => {
    // Pastikan input adalah number, jika tidak valid (NaN/null), return Rp 0
    const value = Number(num);
    if (isNaN(value)) return 'Rp 0';
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value);
  };
  
  if (isLoading) return <div className="text-center py-10 text-gray-500">Memuat detail...</div>;
  if (error) return <div className="text-center py-10 text-red-600">{error}</div>;
  if (!penugasan) return <div className="text-center py-10 text-gray-500">Data tidak ditemukan.</div>;

  return (
    <>
      <div className="w-full space-y-6">
        
        {/* Header Navigasi */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <Link 
              to="/admin/penugasan" 
              className="inline-flex items-center gap-2 text-gray-500 hover:text-[#1A2A80] transition font-medium mb-2"
            >
              <FaArrowLeft size={14} /> Kembali ke Daftar
            </Link>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <span className="bg-blue-100 text-[#1A2A80] p-2 rounded-lg text-lg"><FaClipboardList /></span>
              {penugasan.nama_sub_kegiatan}
            </h1>
            <p className="text-sm text-gray-500 mt-1 ml-11">
              Induk: <span className="font-medium">{penugasan.nama_kegiatan}</span>
            </p>
          </div>
          
          <button 
            onClick={handleDeletePenugasan}
            className="flex items-center gap-2 bg-red-50 text-red-600 px-4 py-2 rounded-lg hover:bg-red-100 text-sm font-bold border border-red-200 transition shadow-sm"
          >
            <FaTrash size={12} /> Bubarkan Tim
          </button>
        </div>

        {/* --- KARTU INFO --- */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">
                <FaUserTie />
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-1">Ketua Tim / Pengawas</p>
                <p className="text-base font-bold text-gray-900">{penugasan.nama_pengawas}</p>
                <p className="text-sm text-gray-500">{penugasan.email_pengawas} ({penugasan.role_pengawas})</p>
              </div>
            </div>

            <div>
              <p className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-2 flex items-center gap-2">
                <FaChartPie /> Total Anggota
              </p>
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-gray-900 text-lg">
                  {anggota.length} <span className="text-gray-400 text-sm font-normal"> Orang</span>
                </span>
                <span className="text-xs font-bold px-2 py-1 rounded bg-green-100 text-green-700">
                  Aktif
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* --- TABEL ANGGOTA --- */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/30">
            <h3 className="font-bold text-gray-800">Daftar Anggota Lapangan</h3>
            <button 
              onClick={() => setIsPopupOpen(true)}
              className="flex items-center gap-2 bg-[#1A2A80] hover:bg-blue-900 text-white py-2 px-4 rounded-lg text-sm font-bold transition shadow-sm"
            >
              <FaPlus size={12} /> Tambah Anggota
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-white">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Nama Mitra</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Jabatan</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Honor</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {anggota.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="px-6 py-12 text-center text-gray-400 italic">
                      <div className="flex flex-col items-center gap-2">
                        <FaExclamationTriangle size={24} className="text-gray-300"/>
                        Belum ada anggota yang ditambahkan.
                      </div>
                    </td>
                  </tr>
                ) : (
                  anggota.map((item) => {
                    // Hitung honor di sini
                    const honorValue = getHonorValue(item.kode_jabatan);

                    return (
                      <tr key={item.id_kelompok} className="hover:bg-blue-50/30 transition-colors">
                        {/* KOLOM NAMA MITRA */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-[#1A2A80] font-bold text-xs">
                              {item.nama_lengkap.charAt(0)}
                            </div>
                            <div>
                              <div className="text-sm font-bold text-gray-900">{item.nama_lengkap}</div>
                              <div className="text-xs text-gray-500 font-mono">{item.nik}</div>
                            </div>
                          </div>
                        </td>

                        {/* KOLOM JABATAN */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {item.nama_jabatan}
                          </span>
                          {item.kode_jabatan && (
                             <div className="text-[10px] text-gray-400 mt-1 ml-1 font-mono">{item.kode_jabatan}</div>
                          )}
                        </td>

                        {/* KOLOM HONOR */}
                        <td className="px-6 py-4 whitespace-nowrap">
                           <div className="text-sm font-bold text-green-600 flex items-center gap-1">
                             <FaMoneyBillWave size={12} className="text-green-500" />
                             {formatRupiah(honorValue)}
                           </div>
                        </td>

                        {/* KOLOM AKSI */}
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                          <button 
                            onClick={() => handleRemoveAnggota(item.id_kelompok, item.nama_lengkap)}
                            className="text-red-500 hover:text-red-700 font-medium bg-red-50 hover:bg-red-100 px-3 py-1 rounded-full transition text-xs flex items-center gap-1 ml-auto"
                          >
                            <FaTrash size={10} /> Keluarkan
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* POPUP ADD MEMBER */}
      <PopupTambahAnggota
        isOpen={isPopupOpen}
        onClose={() => setIsPopupOpen(false)}
        id_penugasan={id}
        existingAnggotaIds={anggota.map(a => a.id_mitra)}
        onAnggotaAdded={fetchDetailData}
      />
    </>
  );
};

export default DetailPenugasan;