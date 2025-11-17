import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import PopupTambahAnggota from '../../components/admin/PopupTambahAnggota'; // 1. Import popup

const API_URL = 'http://localhost:3000/api';
const getToken = () => localStorage.getItem('token');

const DetailPenugasan = () => {
  const { id } = useParams(); // id_penugasan
  const [penugasan, setPenugasan] = useState(null);
  const [anggota, setAnggota] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // 2. Tambah state untuk mengontrol popup
  const [isPopupOpen, setIsPopupOpen] = useState(false);

  const fetchDetailData = async () => {
    if (!id) return;
    setIsLoading(true);
    setError(null);
    try {
      const token = getToken();
      if (!token) {
        throw new Error('Autentikasi tidak ditemukan.');
      }
      
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };

      const penugasanRes = await axios.get(`${API_URL}/penugasan/${id}`, config);
      setPenugasan(penugasanRes.data);

      try {
        const anggotaRes = await axios.get(`${API_URL}/penugasan/${id}/anggota`, config);
        setAnggota(anggotaRes.data);
      } catch (anggotaErr) {
        if (anggotaErr.response?.status === 404) {
          setAnggota([]); 
        } else {
          console.warn("Gagal mengambil data anggota:", anggotaErr.response?.data?.message || anggotaErr.message);
          setError('Gagal memuat data anggota. Info utama berhasil dimuat.');
        }
      }

    } catch (err) { 
      console.error("Error fetching detail:", err);
      setError(err.response?.data?.message || err.message || 'Gagal memuat data utama');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDetailData();
  }, [id]);

  const handleRemoveAnggota = async (id_kelompok) => {
    if (!window.confirm('Apakah Anda yakin ingin mengeluarkan mitra ini dari penugasan?')) {
      return;
    }

    try {
      const token = getToken();
      
      await axios.delete(`${API_URL}/kelompok-penugasan/${id_kelompok}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      alert('Mitra berhasil dikeluarkan.');
      fetchDetailData(); // Refresh data

    } catch (err) {
      alert(`Error: ${err.response?.data?.message || err.message}`);
    }
  };
  
  const progres = useMemo(() => {
    if (!penugasan || anggota.length === 0) return 0;
    return (anggota.length / penugasan.jumlah_max_mitra) * 100;
  }, [penugasan, anggota]);


  if (isLoading) {
    return (
      <div className="container mx-auto p-4 text-center">
        Memuat data detail...
      </div>
    );
  }

  if (error && !penugasan) {
    return (
      <div className="container mx-auto p-4">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong>Error:</strong> {error}
        </div>
        <Link
          to="/admin/penugasan"
          className="mt-4 inline-block text-blue-600 hover:text-blue-800"
        >
          &larr; Kembali ke Daftar Penugasan
        </Link>
      </div>
    );
  }
  
  if (!penugasan) {
    return (
       <div className="container mx-auto p-4 text-center">
        Data tidak ditemukan.
       </div>
    );
  }

  return (
    <> {/* 3. Gunakan Fragment agar popup bisa tampil di root */}
      <div className="container mx-auto p-4 space-y-6 max-w-4xl">
        <div>
          <Link
            to="/admin/penugasan"
            className="text-blue-600 hover:text-blue-800"
          >
            &larr; Kembali ke Daftar Penugasan
          </Link>
          <h1 className="text-3xl font-bold mt-2">
            Detail Penugasan: {penugasan.nama_kegiatan}
          </h1>
        </div>

        {error && penugasan && (
           <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded relative" role="alert">
              <strong>Warning:</strong> {error}
           </div>
        )}

        {/* --- KARTU INFORMASI UMUM --- */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          {/* ... (Konten Informasi Umum tidak berubah) ... */}
          <h2 className="text-xl font-bold mb-4">Informasi Umum</h2>
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">ID Penugasan</dt>
              <dd className="mt-1 text-sm text-gray-900">{penugasan.id_penugasan}</dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Pengawas</dt>
              <dd className="mt-1 text-sm text-gray-900">{penugasan.nama_pengawas} ({penugasan.jabatan_pengawas})</dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Tanggal Dibuat</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {new Date(penugasan.penugasan_created_at).toLocaleString('id-ID')}
              </dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Status Keterisian</dt>
              <dd className="mt-1 text-sm text-gray-900 font-semibold">
                {anggota.length} / {penugasan.jumlah_max_mitra} Mitra
              </dd>
              <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                <div
                  className="bg-blue-600 h-2.5 rounded-full"
                  style={{ width: `${progres}%` }}
                ></div>
              </div>
            </div>
          </dl>
        </div>

        {/* --- KARTU LIST KELOMPOK --- */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold">
              List Anggota Penugasan ({anggota.length} Mitra)
            </h3>
            {/* 4. Perbarui tombol */}
            <button 
              onClick={() => setIsPopupOpen(true)}
              className="bg-green-500 hover:bg-green-600 text-white py-1 px-3 rounded text-sm"
              // Disable tombol jika tim sudah penuh
              disabled={anggota.length >= penugasan.jumlah_max_mitra}
            >
              Tambah Anggota
            </button>
          </div>

          <div className="overflow-x-auto">
            {/* ... (Tabel tidak berubah) ... */}
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Nama Lengkap</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Jabatan</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">No. HP</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Aksi</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {anggota.length > 0 ? (
                  anggota.map((item) => (
                    <tr key={item.id_kelompok}>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-800 font-medium">
                        {item.nama_lengkap}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{item.jabatan}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{item.no_hp}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-right text-sm">
                        <button 
                          onClick={() => handleRemoveAnggota(item.id_kelompok)}
                          className="text-red-500 hover:text-red-700 text-sm font-medium"
                        >
                          Keluarkan
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="px-4 py-4 text-center text-gray-500">
                      Belum ada mitra yang ditugaskan ke kelompok ini.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 5. Render Komponen Popup */}
      <PopupTambahAnggota
        isOpen={isPopupOpen}
        onClose={() => setIsPopupOpen(false)}
        id_penugasan={id}
        id_pengawas={penugasan.id_pengawas}
        existingAnggotaIds={anggota.map(a => a.id_mitra)}
        onAnggotaAdded={fetchDetailData} // Kirim fungsi refresh
      />
    </>
  );
};

export default DetailPenugasan;