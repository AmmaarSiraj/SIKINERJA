// src/pages/admin/DetailKegiatan.jsx
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';
// 1. IMPORT ICON
import { 
  FaArrowLeft, 
  FaMoneyBillWave, 
  FaUserTag, 
  FaCheck, 
  FaClock, 
  FaLayerGroup,
  FaCalendarAlt,
  FaBullhorn,
  FaCoins,
  FaBoxOpen
} from 'react-icons/fa';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const DetailKegiatan = () => {
  const { id } = useParams(); // ID Sub Kegiatan (misal: "sub1")

  const [subData, setSubData] = useState(null);
  const [honorList, setHonorList] = useState([]); // List honorarium (berisi jabatan & tarif)
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('token');
        const headers = { Authorization: `Bearer ${token}` };

        // 1. Ambil Detail Sub Kegiatan
        const resSub = await axios.get(`${API_URL}/api/subkegiatan/${id}`, { headers });
        setSubData(resSub.data);

        // 2. Ambil Data Honorarium (yang sudah di-join dengan Jabatan & Satuan di backend)
        const resHon = await axios.get(`${API_URL}/api/honorarium`, { headers });
        if (resHon.data && Array.isArray(resHon.data)) {
          // Filter hanya honor yang milik sub kegiatan ini
          const relevantHonors = resHon.data.filter(h => h.id_subkegiatan === id);
          setHonorList(relevantHonors);
        }

      } catch (err) {
        console.error(err);
        setError(err.response?.data?.message || err.message || "Gagal memuat data.");
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchData();
  }, [id]);

  const handleUpdateStatus = async (newStatus) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${API_URL}/api/subkegiatan/${id}/status`, 
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSubData(prev => ({ ...prev, status: newStatus }));
      Swal.fire({
        icon: 'success',
        title: 'Status Diperbarui',
        text: `Status kegiatan kini: ${newStatus === 'done' ? 'Selesai' : 'Dalam Proses'}`,
        timer: 1500,
        showConfirmButton: false
      });
    } catch (err) {
      Swal.fire('Gagal', 'Gagal update status kegiatan', 'error');
    }
  };

  const formatRupiah = (num) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  if (loading) return <div className="text-center py-10 text-gray-500">Memuat detail...</div>;
  if (error) return <div className="text-center py-10 text-red-600">{error}</div>;
  if (!subData) return <div className="text-center py-10 text-gray-500">Data tidak ditemukan.</div>;

  return (
    <div className="w-full space-y-8 pb-10">
      
      {/* Header Navigasi */}
      <div>
        <Link 
          to="/admin/manage-kegiatan" 
          className="inline-flex items-center gap-2 text-gray-500 hover:text-[#1A2A80] transition font-medium"
        >
          <FaArrowLeft size={14} /> Kembali ke Daftar Kegiatan
        </Link>
      </div>

      {/* === BAGIAN 1: Header Informasi Sub Kegiatan === */}
      <div className="bg-white shadow-sm rounded-xl overflow-hidden border border-gray-100 relative">
        {/* Status Bar di Kiri */}
        <div className={`absolute top-0 left-0 w-1.5 h-full ${subData.status === 'done' ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
        
        <div className="p-8 pl-10">
          <div className="flex flex-col md:flex-row justify-between items-start gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-gray-800">{subData.nama_sub_kegiatan}</h1>
                <span className="text-xs font-mono text-gray-500 bg-gray-100 px-2 py-1 rounded border border-gray-200">ID: {subData.id}</span>
              </div>
              
              <p className="text-gray-600 max-w-3xl leading-relaxed mb-6">
                {subData.deskripsi || 'Tidak ada deskripsi.'}
              </p>
              
              {/* Info Tanggal Grid */}
              <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                 {subData.periode && (
                    <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200">
                        <FaClock className="text-[#1A2A80]" /> 
                        <span className="font-semibold text-gray-700">Periode:</span> {subData.periode}
                    </div>
                 )}
                 <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200">
                    <FaCalendarAlt className="text-[#1A2A80]" /> 
                    <span className="font-semibold text-gray-700">Pelaksanaan:</span> 
                    {formatDate(subData.tanggal_mulai)} - {formatDate(subData.tanggal_selesai)}
                 </div>
                 {subData.open_req && (
                    <div className="flex items-center gap-2 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100 text-blue-700">
                        <FaBullhorn /> 
                        <span className="font-semibold">Rekrutmen:</span> 
                        {formatDate(subData.open_req)} - {formatDate(subData.close_req)}
                    </div>
                 )}
              </div>
            </div>
            
            {/* Tombol Status */}
            <div className="flex flex-col items-end gap-2 min-w-fit">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">Status Kegiatan</span>
              {subData.status === 'done' ? (
                <button 
                  onClick={() => handleUpdateStatus('pending')}
                  className="flex items-center gap-2 px-6 py-2.5 bg-green-50 text-green-700 text-sm font-bold rounded-xl border border-green-200 hover:bg-green-100 transition shadow-sm"
                >
                  <FaCheck /> Selesai
                </button>
              ) : (
                <button 
                  onClick={() => handleUpdateStatus('done')}
                  className="flex items-center gap-2 px-6 py-2.5 bg-yellow-50 text-yellow-700 text-sm font-bold rounded-xl border border-yellow-200 hover:bg-yellow-100 transition shadow-sm"
                >
                  <FaClock /> Dalam Proses
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* === BAGIAN 2: Daftar Jabatan & Honorarium (Tabel Penuh) === */}
      <div className="bg-white shadow-sm rounded-xl border border-gray-100 overflow-hidden">
        <div className="px-8 py-6 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
            <div>
                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                    <FaUserTag className="text-[#1A2A80]" /> Daftar Posisi & Honorarium
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                    Berikut adalah daftar jabatan yang tersedia beserta nominal honorarium untuk sub kegiatan ini.
                </p>
            </div>
            <span className="bg-[#1A2A80] text-white px-3 py-1 rounded-full text-xs font-bold shadow-sm">
                {honorList.length} Jabatan
            </span>
        </div>
        
        <div className="p-0">
            {honorList.length === 0 ? (
                <div className="text-center py-16 text-gray-400 bg-white">
                    <div className="mb-3 text-gray-200 text-5xl flex justify-center"><FaUserTag /></div>
                    <p className="text-base font-medium text-gray-500">Belum ada aturan honorarium.</p>
                    <p className="text-sm mb-4">Silakan atur tarif jabatan di menu Edit Kegiatan.</p>
                    <Link 
                        to={`/admin/manage-kegiatan/edit/${subData.id_kegiatan}`} 
                        className="inline-flex items-center gap-2 text-[#1A2A80] font-bold border border-blue-100 bg-blue-50 px-4 py-2 rounded-lg hover:bg-blue-100 transition"
                    >
                        Kelola Honorarium
                    </Link>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-100">
                        <thead className="bg-gray-50 text-gray-500 text-xs font-bold uppercase tracking-wider">
                            <tr>
                                <th className="px-8 py-4 text-left">Nama Jabatan</th>
                                <th className="px-8 py-4 text-left">Nominal Honor</th>
                                <th className="px-8 py-4 text-left">Satuan / Volume</th>
                                <th className="px-8 py-4 text-center">Kode Jabatan</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-50">
                            {honorList.map((honor) => (
                                <tr key={honor.id_honorarium} className="hover:bg-blue-50/20 transition-colors group">
                                    {/* Kolom Jabatan */}
                                    <td className="px-8 py-5 whitespace-nowrap">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-[#1A2A80] group-hover:scale-110 transition-transform">
                                                <FaUserTag />
                                            </div>
                                            <div>
                                                <span className="block text-sm font-bold text-gray-800">
                                                    {honor.nama_jabatan || 'Jabatan Tidak Dikenal'}
                                                </span>
                                                <span className="block text-xs text-gray-400 mt-0.5">
                                                    Tersedia untuk Mitra
                                                </span>
                                            </div>
                                        </div>
                                    </td>

                                    {/* Kolom Tarif */}
                                    <td className="px-8 py-5 whitespace-nowrap">
                                        <div className="flex items-center gap-2">
                                            <FaCoins className="text-yellow-500" />
                                            <span className="text-base font-bold text-gray-800">
                                                {formatRupiah(honor.tarif)}
                                            </span>
                                        </div>
                                    </td>

                                    {/* Kolom Satuan */}
                                    <td className="px-8 py-5 whitespace-nowrap">
                                        <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 px-3 py-1.5 rounded-lg w-fit border border-gray-200">
                                            <FaBoxOpen className="text-gray-400" />
                                            <span>Per <strong>{honor.basis_volume}</strong> {honor.nama_satuan} <span className="text-gray-400">({honor.satuan_alias})</span></span>
                                        </div>
                                    </td>

                                    {/* Kolom Kode */}
                                    <td className="px-8 py-5 whitespace-nowrap text-center">
                                        <span className="inline-block px-2 py-1 text-xs font-mono font-bold text-gray-500 bg-gray-100 rounded border border-gray-200">
                                            {honor.kode_jabatan}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
        
        {/* Footer Card */}
        {honorList.length > 0 && (
            <div className="bg-gray-50 px-8 py-4 border-t border-gray-100 text-xs text-gray-500 flex items-center gap-2">
              <FaLayerGroup /> Data di atas akan digunakan sebagai acuan perhitungan gaji mitra saat penugasan.
            </div>
        )}
      </div>

    </div>
  );
};

export default DetailKegiatan;