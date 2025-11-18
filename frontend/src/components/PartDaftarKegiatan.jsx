import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

// Tentukan API URL, sesuaikan dengan backend Anda
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const PartDaftarKegiatan = () => {
  // 1. State untuk menyimpan data
  const [kegiatan, setKegiatan] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 2. useEffect untuk mengambil data saat komponen dimuat
  useEffect(() => {
    const fetchKegiatan = async () => {
      setLoading(true);
      setError(null);
      try {
        // Panggil endpoint GET /api/kegiatan (tidak perlu token)
        const response = await axios.get(`${API_URL}/api/kegiatan`);
        
        // Tampilkan 5 kegiatan terbaru (backend sudah mengurutkan)
        setKegiatan(response.data.slice(0, 5));

      } catch (err) {
        console.error("Error fetching kegiatan:", err);
        setError(err.response?.data?.message || "Gagal memuat daftar kegiatan.");
      } finally {
        setLoading(false);
      }
    };

    fetchKegiatan();
  }, []); // [] = jalankan sekali saat mount

  // 3. Fungsi helper untuk format tanggal
  const formatDate = (isoDate) => {
    if (!isoDate) return '-';
    return new Date(isoDate).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  // 4. Fungsi untuk merender konten berdasarkan state
  const renderContent = () => {
    if (loading) {
      return <p className="text-gray-500 text-center py-4">Memuat kegiatan...</p>;
    }

    if (error) {
      return <p className="text-red-600 text-center py-4">Error: {error}</p>;
    }

    if (kegiatan.length === 0) {
      return <p className="text-gray-500 text-center py-4">Belum ada kegiatan yang tersedia.</p>;
    }

    // Jika ada data, tampilkan list
    return (
      <ul className="divide-y divide-gray-200">
        {kegiatan.map(item => (
          <li key={item.id} className="py-4 px-2">
            <div className="flex justify-between items-center space-x-4">
              {/* Info Kegiatan */}
              <div className="flex-1 min-w-0">
                <p className="text-lg font-semibold text-indigo-700 truncate">
                  {item.nama_kegiatan}
                </p>
                <p className="text-sm text-gray-600 truncate">
                  {item.deskripsi || 'Tidak ada deskripsi'}
                </p>
              </div>
              
              {/* Info Tanggal (di kanan) */}
              <div className="text-right flex-shrink-0 ml-4">
                <p className="text-sm text-gray-700 font-medium">
                  {formatDate(item.tanggal_mulai)}
                </p>
                <p className="text-xs text-gray-500">
                  Tahun {item.tahun_anggaran}
                </p>
              </div>
            </div>
          </li>
        ))}
      </ul>
    );
  };

  // 5. Struktur JSX Komponen
  return (
    <div className="bg-white p-6 md:p-8 rounded-xl shadow-lg w-full max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b border-gray-200 pb-3">
        Kegiatan Terbaru
      </h2>
      <div>
        {renderContent()}
      </div>
      
      {/* Tombol "Call to Action" */}
      {kegiatan.length > 0 && (
        <div className="text-center mt-6">
          <Link 
            to="/lengkapi-profil" 
            className="text-indigo-600 hover:text-indigo-800 font-medium"
          >
            Daftar sebagai mitra untuk bergabung &rarr;
          </Link>
        </div>
      )}
    </div>
  );
};

export default PartDaftarKegiatan;