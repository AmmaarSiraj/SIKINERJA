// src/pages/admin/DaftarLaporan.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const DaftarLaporan = () => {
  const [laporanList, setLaporanList] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    axios.get(`${API_URL}/api/laporan-form`)
      .then(res => setLaporanList(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8 text-center">Memuat data...</div>;

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Template Laporan</h1>
        <Link to="/admin/laporan/buat" className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700">+ Buat Template</Link>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kegiatan</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Target Level</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Judul Laporan</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Aksi</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {laporanList.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm font-medium text-gray-900">{item.nama_kegiatan}</td>
                <td className="px-6 py-4">
                  {/* LOGIK TAMPILAN TARGET */}
                  {item.id_subkegiatan === 'ALL_SUB' ? (
                    <span className="px-2 py-1 text-xs font-bold rounded bg-purple-100 text-purple-800">
                      ★ SEMUA SUB KEGIATAN
                    </span>
                  ) : item.nama_sub_kegiatan ? (
                    <span className="px-2 py-1 text-xs font-medium rounded bg-blue-100 text-blue-800">
                      Sub: {item.nama_sub_kegiatan}
                    </span>
                  ) : (
                    <span className="px-2 py-1 text-xs font-medium rounded bg-green-100 text-green-800">
                      Kegiatan Utama
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">{item.judul_laporan}</td>
                <td className="px-6 py-4 text-right">
                  <button
                    onClick={() => navigate(`/admin/laporan/setting/${item.id_kegiatan}`)}
                    className="text-indigo-600 hover:text-indigo-900 border border-indigo-200 px-3 py-1 rounded"
                  >
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DaftarLaporan;