import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const DaftarPengajuanMitra = () => {
  const [pengajuanList, setPengajuanList] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Auth headers jika diperlukan nanti, saat ini endpoint open/public di route
        const response = await axios.get(`${API_URL}/api/pengajuan-mitra`);
        setPengajuanList(response.data);
      } catch (error) {
        console.error("Gagal memuat data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div className="p-8 text-center">Memuat data...</div>;

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Daftar Pengajuan Mitra</h1>
      
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nama Lengkap</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">NIK</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tanggal</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Aksi</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {pengajuanList.length === 0 ? (
                <tr><td colSpan="5" className="px-6 py-4 text-center text-gray-500">Belum ada pengajuan.</td></tr>
            ) : (
                pengajuanList.map((item) => (
                <tr 
                    key={item.id} 
                    onClick={() => navigate(`/admin/pengajuan-mitra/${item.id}`)}
                    className="hover:bg-gray-50 cursor-pointer transition"
                >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.nama_lengkap}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.nik}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(item.created_at).toLocaleDateString('id-ID')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${item.status === 'approved' ? 'bg-green-100 text-green-800' : 
                          item.status === 'rejected' ? 'bg-red-100 text-red-800' : 
                          'bg-yellow-100 text-yellow-800'}`}>
                        {item.status}
                    </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <span className="text-indigo-600 hover:text-indigo-900">Detail &rarr;</span>
                    </td>
                </tr>
                ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DaftarPengajuanMitra;