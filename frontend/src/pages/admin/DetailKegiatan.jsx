// src/pages/admin/DetailKegiatan.jsx
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
// 1. IMPORT ICON
import { 
  FaArrowLeft, 
  FaMoneyBillWave, 
  FaUserTag, 
  FaCheck, 
  FaClock, 
  FaLayerGroup,
  FaCalendarAlt
} from 'react-icons/fa';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const DetailKegiatan = () => {
  const { id } = useParams(); // ID Sub Kegiatan (misal: "sub1")

  const [subData, setSubData] = useState(null);
  const [honor, setHonor] = useState(null);
  const [jabatanList, setJabatanList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('Token tidak ditemukan.');
        const headers = { Authorization: `Bearer ${token}` };

        // 1. Ambil Detail Sub Kegiatan
        const resSub = await axios.get(`${API_URL}/api/subkegiatan/${id}`, { headers });
        setSubData(resSub.data);

        // 2. Ambil Data Honorarium
        const resHon = await axios.get(`${API_URL}/api/honorarium`, { headers });
        if (resHon.data && Array.isArray(resHon.data)) {
          const foundHonor = resHon.data.find(h => h.id_subkegiatan === id);
          setHonor(foundHonor || null);
        }

        // 3. Ambil Daftar Jabatan
        const resJab = await axios.get(`${API_URL}/api/jabatan-mitra?id_subkegiatan=${id}`, { headers });
        setJabatanList(resJab.data || []);

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
    } catch (err) {
      alert("Gagal update status");
    }
  };

  if (loading) return <div className="text-center py-10 text-gray-500">Memuat detail...</div>;
  if (error) return <div className="text-center py-10 text-red-600">{error}</div>;
  if (!subData) return <div className="text-center py-10 text-gray-500">Data tidak ditemukan.</div>;

  return (
    <div className="w-full space-y-6">
      
      {/* Tombol Kembali */}
      <div className="mb-4">
        <Link 
          to="/admin/manage-kegiatan" 
          className="inline-flex items-center gap-2 text-gray-500 hover:text-[#1A2A80] transition font-medium"
        >
          <FaArrowLeft size={14} /> Kembali ke Daftar Kegiatan
        </Link>
      </div>

      {/* === BAGIAN 1: Header Sub Kegiatan === */}
      <div className="bg-white shadow-sm rounded-xl overflow-hidden border border-gray-100 relative">
        {/* Status Bar di Kiri */}
        <div className={`absolute top-0 left-0 w-1.5 h-full ${subData.status === 'done' ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
        
        <div className="p-8 pl-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-gray-800">{subData.nama_sub_kegiatan}</h1>
              <span className="text-xs font-mono text-gray-500 bg-gray-100 px-2 py-1 rounded border border-gray-200">ID: {subData.id}</span>
            </div>
            <p className="text-gray-600 max-w-2xl leading-relaxed mb-4">{subData.deskripsi || 'Tidak ada deskripsi.'}</p>
            
            {/* Info Tanggal (Opsional, jika ada datanya) */}
            {(subData.tanggal_mulai || subData.periode) && (
                <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1"><FaCalendarAlt /> Periode: {subData.periode || '-'}</span>
                </div>
            )}
          </div>
          
          {/* Tombol Status */}
          <div className="flex flex-col items-end gap-2">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">Status Pelaksanaan</span>
            {subData.status === 'done' ? (
              <button 
                onClick={() => handleUpdateStatus('pending')}
                className="flex items-center gap-2 px-5 py-2.5 bg-green-50 text-green-700 text-sm font-bold rounded-lg border border-green-200 hover:bg-green-100 transition shadow-sm"
              >
                <FaCheck /> Selesai
              </button>
            ) : (
              <button 
                onClick={() => handleUpdateStatus('done')}
                className="flex items-center gap-2 px-5 py-2.5 bg-yellow-50 text-yellow-700 text-sm font-bold rounded-lg border border-yellow-200 hover:bg-yellow-100 transition shadow-sm"
              >
                <FaClock /> Dalam Proses
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* === BAGIAN 2: Informasi Honorarium (Kiri) === */}
        <div className="lg:col-span-1">
          <div className="bg-white shadow-sm rounded-xl border border-gray-100 h-full overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                    <FaMoneyBillWave /> Ketentuan Honor
                </h3>
            </div>
            
            <div className="p-6">
                {honor ? (
                <div className="bg-[#1A2A80]/5 rounded-xl p-6 border border-blue-100 text-center">
                    <p className="text-xs text-[#1A2A80] mb-2 font-bold uppercase tracking-wide">Tarif Dasar</p>
                    <div className="text-3xl font-extrabold text-[#1A2A80] mb-3">
                    Rp {Number(honor.tarif).toLocaleString('id-ID')}
                    </div>
                    <div className="text-sm text-gray-600 font-medium border-t border-blue-200 pt-3">
                    Per <span className="font-bold text-gray-800">{honor.basis_volume}</span> {honor.nama_satuan || 'Satuan'}
                    </div>
                    <p className="text-xs text-gray-400 mt-1 font-medium">
                    ({honor.satuan_alias || '-'})
                    </p>
                </div>
                ) : (
                <div className="text-center py-8 text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                    <p className="text-sm">Belum ada tarif honor.</p>
                </div>
                )}
            </div>
          </div>
        </div>

        {/* === BAGIAN 3: Daftar Jabatan (Kanan) === */}
        <div className="lg:col-span-2">
          <div className="bg-white shadow-sm rounded-xl border border-gray-100 h-full flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                <FaUserTag /> Posisi / Jabatan Tersedia
              </h3>
              <span className="bg-[#1A2A80] text-white py-0.5 px-2.5 rounded-full text-xs font-bold">
                {jabatanList.length}
              </span>
            </div>
            
            <div className="flex-grow overflow-x-auto">
              {jabatanList.length === 0 ? (
                <div className="p-10 text-center text-gray-400 italic">
                  <p>Belum ada jabatan yang didaftarkan untuk kegiatan ini.</p>
                </div>
              ) : (
                <table className="min-w-full divide-y divide-gray-100">
                  <thead className="bg-white">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Kode</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Nama Jabatan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {jabatanList.map((jab) => (
                      <tr key={jab.kode_jabatan} className="hover:bg-blue-50/30 transition-colors">
                        <td className="px-6 py-3 whitespace-nowrap text-sm font-mono text-[#1A2A80] font-bold bg-blue-50/50 w-fit">
                          {jab.kode_jabatan}
                        </td>
                        <td className="px-6 py-3 whitespace-nowrap text-sm font-medium text-gray-800">
                          {jab.nama_jabatan}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            
            <div className="bg-gray-50 px-6 py-3 border-t border-gray-100 text-xs text-gray-500 flex items-center gap-2">
              <FaLayerGroup /> Mitra yang ditugaskan akan menempati salah satu posisi di atas.
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default DetailKegiatan;