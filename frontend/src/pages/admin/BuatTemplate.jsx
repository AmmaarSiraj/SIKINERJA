import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const BuatTemplate = () => {
  const [availableKegiatan, setAvailableKegiatan] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // 1. Ambil semua kegiatan
        // Kita butuh token jika endpoint ini diprotect, sesuaikan dengan authMiddleware Anda
        const token = localStorage.getItem('token');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        const reqKegiatan = axios.get(`${API_URL}/api/kegiatan`, { headers });
        const reqForms = axios.get(`${API_URL}/api/laporan-form`); // Endpoint public/admin

        const [resKegiatan, resForms] = await Promise.all([reqKegiatan, reqForms]);

        const allKegiatan = resKegiatan.data;
        const existingForms = resForms.data; // Array form yang sudah ada

        // 2. Filter: Cari kegiatan yang ID-nya BELUM ada di daftar existingForms
        // Buat Set ID kegiatan yang sudah punya form agar pencarian cepat
        const kegiatanWithFormIds = new Set(existingForms.map(f => f.id_kegiatan));

        const filtered = allKegiatan.filter(k => !kegiatanWithFormIds.has(k.id));
        
        setAvailableKegiatan(filtered);

      } catch (err) {
        console.error("Error loading data:", err);
        setError("Gagal memuat data kegiatan.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <div className="p-8 text-center">Memuat daftar kegiatan...</div>;
  if (error) return <div className="p-8 text-center text-red-600">{error}</div>;

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link to="/admin/laporan" className="text-indigo-600 hover:underline text-sm mb-1 block">
            &larr; Kembali ke Daftar Template
          </Link>
          <h1 className="text-3xl font-bold text-gray-800">Pilih Kegiatan</h1>
          <p className="text-gray-600 mt-1">
            Pilih kegiatan di bawah ini untuk membuatkan template laporannya.
          </p>
        </div>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg border border-gray-200">
        <ul className="divide-y divide-gray-200">
          {availableKegiatan.length === 0 ? (
            <li className="p-8 text-center text-gray-500">
              <p className="text-lg font-medium">Semua kegiatan sudah memiliki template laporan.</p>
              <p className="text-sm mt-2">
                Silakan buat <Link to="/admin/manage-kegiatan/tambah" className="text-indigo-600 hover:underline">Kegiatan Baru</Link> terlebih dahulu.
              </p>
            </li>
          ) : (
            availableKegiatan.map((kegiatan) => (
              <li key={kegiatan.id} className="hover:bg-gray-50 transition p-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-medium text-indigo-600 truncate">
                      {kegiatan.nama_kegiatan}
                    </h3>
                    <div className="mt-1 flex items-center text-sm text-gray-500">
                      <span className="truncate mr-4">
                        Tahun: {kegiatan.tahun_anggaran}
                      </span>
                      <span>
                        {new Date(kegiatan.tanggal_mulai).toLocaleDateString('id-ID')} - {new Date(kegiatan.tanggal_selesai).toLocaleDateString('id-ID')}
                      </span>
                    </div>
                  </div>
                  <div className="ml-4 flex-shrink-0">
                    <button
                      onClick={() => navigate(`/admin/laporan/setting/${kegiatan.id}`)}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                    >
                      + Buat Template
                    </button>
                  </div>
                </div>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
};

export default BuatTemplate;