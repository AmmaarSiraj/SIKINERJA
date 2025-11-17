import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios'; // 1. Import axios

// 2. Tentukan API_URL dan helper getToken
const API_URL = 'http://localhost:3000/api';
const getToken = () => localStorage.getItem('token');

const Penugasan = () => {
  const [penugasanList, setPenugasanList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPenugasan = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const token = getToken(); // 3. Gunakan helper
        if (!token) {
          throw new Error('Autentikasi tidak ditemukan. Silakan login kembali.');
        }

        const config = {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        };

        // 4. Ganti fetch dengan axios.get
        const response = await axios.get(`${API_URL}/penugasan`, config);

        // 5. Data ada di response.data
        const data = response.data;
        
        if (Array.isArray(data)) {
          setPenugasanList(data);
        } else {
          setError('Data yang diterima dari server bukan array.');
        }
        
      } catch (err) {
        console.error("Error fetching penugasan:", err);
        // 6. Penanganan error axios
        setError(err.response?.data?.message || err.message || 'Gagal memuat data penugasan.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPenugasan();
  }, []);

  // Navigasi saat baris di-klik
  const handleRowClick = (id) => {
    navigate(`/admin/penugasan/detail/${id}`);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 text-center">
        Memuat data...
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong>Error:</strong> {error}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Manajemen Penugasan</h1>
        <Link
          to="/admin/penugasan/tambah" 
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Buat Penugasan Baru
        </Link>
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Nama Kegiatan
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Nama Pengawas
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Jabatan Pengawas
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Kapasitas
              </th>
              <th scope="col" className="relative px-6 py-3">
                <span className="sr-only">Aksi</span>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {penugasanList.length === 0 ? (
              <tr>
                <td
                  colSpan="5"
                  className="px-6 py-4 text-center text-gray-500"
                >
                  Belum ada data penugasan.
                </td>
              </tr>
            ) : (
              penugasanList.map((tugas) => (
                <tr 
                  key={tugas.id_penugasan} 
                  onClick={() => handleRowClick(tugas.id_penugasan)}
                  className="hover:bg-gray-50 cursor-pointer"
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                    {tugas.nama_kegiatan}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {tugas.nama_pengawas}
                  </td>
                   <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {tugas.jabatan_pengawas}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {tugas.jumlah_max_mitra} Mitra
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <span
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      Detail
                    </span>
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

export default Penugasan;