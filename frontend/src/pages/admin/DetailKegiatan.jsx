import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const DetailKegiatan = () => {
  const { id } = useParams(); // Ini adalah ID Sub Kegiatan (misal: "sub1")

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
        // Kita ambil semua lalu filter yang id_subkegiatan-nya cocok
        const resHon = await axios.get(`${API_URL}/api/honorarium`, { headers });
        if (resHon.data && Array.isArray(resHon.data)) {
          const foundHonor = resHon.data.find(h => h.id_subkegiatan === id);
          setHonor(foundHonor || null);
        }

        // 3. Ambil Daftar Jabatan yang tersedia untuk sub kegiatan ini
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

  if (loading) return <div className="p-10 text-center text-gray-500">Memuat data...</div>;
  if (error) return <div className="p-10 text-center text-red-600">Error: {error}</div>;
  if (!subData) return <div className="p-10 text-center text-gray-500">Data tidak ditemukan.</div>;

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <Link to="/admin/manage-kegiatan" className="text-indigo-600 hover:underline mb-6 inline-block">
        &larr; Kembali ke Daftar Kegiatan
      </Link>

      {/* === BAGIAN 1: Header Sub Kegiatan === */}
      <div className="bg-white shadow-lg rounded-xl overflow-hidden border border-gray-200 mb-6 relative">
        <div className={`absolute top-0 left-0 w-2 h-full ${subData.status === 'done' ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
        <div className="p-6 pl-8">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold text-gray-800">{subData.nama_sub_kegiatan}</h1>
                <span className="text-xs font-mono text-gray-500 bg-gray-100 px-2 py-1 rounded">ID: {subData.id}</span>
              </div>
              <p className="text-gray-600 max-w-2xl">{subData.deskripsi || 'Tidak ada deskripsi.'}</p>
            </div>
            
            {/* Tombol Status */}
            <div>
              {subData.status === 'done' ? (
                <button 
                  onClick={() => handleUpdateStatus('pending')}
                  className="px-4 py-2 bg-green-100 text-green-800 text-sm font-bold rounded-full border border-green-200 hover:bg-green-200 transition"
                >
                  ✓ Selesai
                </button>
              ) : (
                <button 
                  onClick={() => handleUpdateStatus('done')}
                  className="px-4 py-2 bg-yellow-100 text-yellow-800 text-sm font-bold rounded-full border border-yellow-200 hover:bg-yellow-200 transition"
                >
                  • Dalam Proses
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* === BAGIAN 2: Informasi Honorarium (Kiri) === */}
        <div className="md:col-span-1">
          <div className="bg-white shadow rounded-xl border border-gray-200 p-5 h-full">
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">Ketentuan Honor</h3>
            
            {honor ? (
              <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-100 text-center">
                <p className="text-xs text-indigo-600 mb-1 font-semibold">Tarif Dasar</p>
                <div className="text-2xl font-extrabold text-indigo-700 mb-2">
                  Rp {Number(honor.tarif).toLocaleString('id-ID')}
                </div>
                <div className="text-sm text-indigo-800 font-medium border-t border-indigo-200 pt-2 mt-2">
                  Per <span className="font-bold">{honor.basis_volume}</span> {honor.nama_satuan || 'Satuan'}
                </div>
                <p className="text-[10px] text-indigo-400 mt-1">
                  ({honor.satuan_alias || '-'})
                </p>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                <p className="text-sm">Belum ada tarif honor.</p>
              </div>
            )}
          </div>
        </div>

        {/* === BAGIAN 3: Daftar Jabatan (Kanan) === */}
        <div className="md:col-span-2">
          <div className="bg-white shadow rounded-xl border border-gray-200 overflow-hidden h-full flex flex-col">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Posisi / Jabatan Tersedia</h3>
              <span className="bg-gray-200 text-gray-600 py-0.5 px-2 rounded-full text-xs font-bold">
                {jabatanList.length} Posisi
              </span>
            </div>
            
            <div className="flex-grow">
              {jabatanList.length === 0 ? (
                <div className="p-8 text-center text-gray-400">
                  <p>Belum ada jabatan yang didaftarkan untuk kegiatan ini.</p>
                </div>
              ) : (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kode</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nama Jabatan</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {jabatanList.map((jab) => (
                      <tr key={jab.kode_jabatan} className="hover:bg-gray-50">
                        <td className="px-6 py-3 whitespace-nowrap text-sm font-mono text-gray-600">
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
            
            {/* Footer Tabel (Opsional) */}
            <div className="bg-gray-50 px-6 py-3 border-t border-gray-200 text-xs text-gray-500">
              *Mitra yang ditugaskan akan menempati salah satu posisi di atas.
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default DetailKegiatan;