// src/pages/admin/DetailPengajuanMitra.jsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
// 1. IMPORT ICON
import { 
  FaArrowLeft, 
  FaCheck, 
  FaTimes, 
  FaUserClock, 
  FaMoneyBillWave, 
  FaIdCard 
} from 'react-icons/fa';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const DetailPengajuanMitra = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processing, setProcessing] = useState(false);

  // State untuk Form Approval
  const [batasHonor, setBatasHonor] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API_URL}/api/pengajuan-mitra/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setData(response.data);
      } catch (err) {
        console.error(err);
        setError("Gagal memuat data pengajuan.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handleApprove = async (e) => {
    e.preventDefault();
    if (!batasHonor) return alert("Harap tentukan batas honor bulanan!");
    if (!window.confirm("Yakin setujui calon mitra ini?")) return;

    setProcessing(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${API_URL}/api/pengajuan-mitra/${id}/approve`,
        { batas_honor_bulanan: parseInt(batasHonor) },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      alert("Pengajuan berhasil disetujui! Mitra resmi terdaftar.");
      navigate('/admin/pengajuan-mitra');
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || "Gagal memproses persetujuan.");
    } finally {
      setProcessing(false);
    }
  };

  // Opsi Reject (Jika backend mendukung update status reject, sesuaikan endpointnya)
  // Saat ini saya buat tombol dummy/logika sederhana
  const handleReject = () => {
     if(window.confirm("Fitur tolak belum terhubung ke API. Apakah Anda ingin kembali?")) {
         navigate('/admin/pengajuan-mitra');
     }
  };

  if (loading) return <div className="text-center py-10 text-gray-500">Memuat detail...</div>;
  if (error) return <div className="text-center py-10 text-red-600">{error}</div>;
  if (!data) return <div className="text-center py-10 text-gray-500">Data tidak ditemukan.</div>;

  return (
    <div className="max-w-4xl mx-auto w-full">
      
      {/* Tombol Kembali */}
      <div className="mb-6">
        <Link 
          to="/admin/pengajuan-mitra" 
          className="inline-flex items-center gap-2 text-gray-500 hover:text-[#1A2A80] transition font-medium"
        >
          <FaArrowLeft size={14} /> Kembali ke Daftar
        </Link>
      </div>

      {/* Card Utama */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        
        {/* Header Card */}
        <div className="px-8 py-6 bg-gray-50/50 border-b border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-600 text-xl">
              <FaUserClock />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">{data.nama_lengkap}</h1>
              <p className="text-sm text-gray-500 flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-yellow-100 text-yellow-700 text-xs font-bold uppercase">
                  {data.status}
                </span>
                <span>• Diajukan pada {new Date(data.created_at).toLocaleDateString('id-ID')}</span>
              </p>
            </div>
          </div>
        </div>

        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-10">
          
          {/* Kolom Kiri: Data Diri */}
          <div>
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <FaIdCard /> Data Pribadi
            </h3>
            <div className="space-y-4">
              <div className="group">
                <label className="block text-xs text-gray-500 mb-1">NIK</label>
                <p className="text-base font-medium text-gray-900 font-mono bg-gray-50 p-2 rounded border border-transparent group-hover:border-gray-200 transition">
                  {data.nik}
                </p>
              </div>
              <div className="group">
                <label className="block text-xs text-gray-500 mb-1">Email</label>
                <p className="text-base font-medium text-gray-900 bg-gray-50 p-2 rounded border border-transparent group-hover:border-gray-200 transition">
                  {data.email}
                </p>
              </div>
              <div className="group">
                <label className="block text-xs text-gray-500 mb-1">No. Handphone</label>
                <p className="text-base font-medium text-gray-900 bg-gray-50 p-2 rounded border border-transparent group-hover:border-gray-200 transition">
                  {data.no_hp}
                </p>
              </div>
              <div className="group">
                <label className="block text-xs text-gray-500 mb-1">Alamat Lengkap</label>
                <p className="text-base font-medium text-gray-900 bg-gray-50 p-2 rounded border border-transparent group-hover:border-gray-200 transition">
                  {data.alamat}
                </p>
              </div>
            </div>
          </div>

          {/* Kolom Kanan: Data Bank & Approval */}
          <div className="flex flex-col h-full">
            <div className="mb-8">
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <FaMoneyBillWave /> Informasi Rekening
              </h3>
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-blue-600 mb-1">Nama Bank</label>
                    <p className="text-sm font-bold text-gray-800">{data.nama_bank}</p>
                  </div>
                  <div>
                    <label className="block text-xs text-blue-600 mb-1">No. Rekening</label>
                    <p className="text-sm font-bold text-gray-800 font-mono">{data.no_rekening}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Form Approval (Hanya muncul jika status pending) */}
            {data.status === 'pending' && (
              <div className="mt-auto pt-6 border-t border-gray-100">
                <h3 className="text-sm font-bold text-gray-800 mb-3">Tindak Lanjut</h3>
                
                <form onSubmit={handleApprove} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tetapkan Batas Honor Bulanan (Rp) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      placeholder="Contoh: 3000000"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1A2A80] outline-none transition"
                      value={batasHonor}
                      onChange={(e) => setBatasHonor(e.target.value)}
                    />
                    <p className="text-xs text-gray-500 mt-1">Wajib diisi sebelum menyetujui.</p>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={handleReject}
                      disabled={processing}
                      className="flex-1 py-2.5 px-4 border border-red-200 text-red-600 font-bold rounded-lg hover:bg-red-50 transition flex justify-center items-center gap-2 disabled:opacity-50"
                    >
                      <FaTimes /> Tolak
                    </button>
                    <button
                      type="submit"
                      disabled={processing}
                      className="flex-[2] py-2.5 px-4 bg-[#1A2A80] text-white font-bold rounded-lg hover:bg-blue-900 transition flex justify-center items-center gap-2 shadow-md disabled:opacity-50"
                    >
                      {processing ? 'Memproses...' : <><FaCheck /> Setujui & Aktifkan</>}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default DetailPengajuanMitra;