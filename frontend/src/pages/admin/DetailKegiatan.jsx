import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const DetailKegiatan = () => {
  const { id } = useParams(); // Ini adalah id_kegiatan
  const [kegiatan, setKegiatan] = useState(null);
  const [subKegiatans, setSubKegiatans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [authToken, setAuthToken] = useState(localStorage.getItem('token'));

  // State untuk menyimpan info honorarium
  const [honorariumInfo, setHonorariumInfo] = useState({
    total: 0,
    mainTarif: 0,
    subTarif: 0,
  });

  // Ambil data kegiatan, sub-kegiatan, dan honorarium saat komponen dimuat
  useEffect(() => {
    if (!id || !authToken) {
      setError('ID Kegiatan tidak ditemukan atau Anda tidak terautentikasi.');
      setLoading(false);
      return;
    }

    const fetchAllData = async () => {
      setLoading(true);
      setError(null);
      
      const headers = {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      };

      try {
        // 1. Ambil data Kegiatan utama
        const kegPromise = fetch(`${API_URL}/api/kegiatan/${id}`, { headers });
        
        // 2. Ambil data Sub Kegiatan
        const subKegPromise = fetch(`${API_URL}/api/subkegiatan/kegiatan/${id}`, { headers });

        // 3. Ambil data Honorarium (semua)
        const honPromise = fetch(`${API_URL}/api/honorarium`, { headers });

        // Jalankan semua promise secara paralel
        const [kegRes, subKegRes, honRes] = await Promise.all([kegPromise, subKegPromise, honPromise]);

        // Proses data Kegiatan
        if (!kegRes.ok) {
          throw new Error('Gagal mengambil detail kegiatan');
        }
        const kegData = await kegRes.json();
        setKegiatan(kegData);

        // Proses data Sub Kegiatan & Honorarium
        let allHonors = [];
        if (!honRes.ok) {
          console.warn("Gagal memuat data honorarium.");
        } else {
          allHonors = await honRes.json();
        }

        if (!subKegRes.ok) {
          throw new Error('Gagal mengambil daftar sub kegiatan');
        }
        const subKegData = await subKegRes.json();
        
        // --- MODIFIKASI PENTING ---
        // Sisipkan data tarif ke dalam state subKegiatans
        const processedSubKegiatans = subKegData.map(sub => {
          const honor = allHonors.find(h => h.id_subkegiatan === sub.id);
          return {
            ...sub,
            tarif: honor ? Number(honor.tarif) : null // Tambahkan tarif ke setiap sub
          };
        });
        setSubKegiatans(processedSubKegiatans);
        // --- AKHIR MODIFIKASI ---

        // Hitung total honorarium
        const mainHonor = allHonors.find(h => h.id_kegiatan === kegData.id);
        let total = 0;
        let mainTarif = 0;
        let subTarif = 0;
        
        if (mainHonor) {
          mainTarif = Number(mainHonor.tarif) || 0;
          total += mainTarif;
        }
        
        // Gunakan processedSubKegiatans yang sudah memiliki tarif
        processedSubKegiatans.forEach(sub => {
          if (sub.tarif) {
            subTarif += sub.tarif;
            total += sub.tarif;
          }
        });

        // Set state honorarium
        setHonorariumInfo({ total, mainTarif, subTarif });

      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, [id, authToken]);

  // Hitung persentase progress bar
  const progressPercent = useMemo(() => {
    if (subKegiatans.length === 0) return 0;
    const doneCount = subKegiatans.filter(sub => sub.status === 'done').length;
    return (doneCount / subKegiatans.length) * 100;
  }, [subKegiatans]);

  // Fungsi untuk update status sub-kegiatan
  const handleUpdateStatus = async (subKegiatanId, newStatus) => {
    try {
      const response = await fetch(`${API_URL}/api/subkegiatan/${subKegiatanId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error('Gagal update status');
      }

      const updatedSubKegiatan = await response.json();
      
      // Update state lokal
      setSubKegiatans(prevSubs =>
        prevSubs.map(sub =>
          sub.id === updatedSubKegiatan.data.id ? updatedSubKegiatan.data : sub
        )
      );
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  // Tampilan loading
  if (loading) {
    return <div className="p-8 text-center">Memuat data Survei/Sensus...</div>;
  }

  // Tampilan error
  if (error) {
    return <div className="p-8 text-center text-red-600">Error: {error}</div>;
  }

  // Tampilan utama
  return (
    <div className="p-8 max-w-4xl mx-auto">
      <Link to="/admin/manage-kegiatan" className="text-indigo-600 hover:underline mb-4 inline-block">
        &larr; Kembali ke Daftar Survei/Sensus
      </Link>
      
      {/* 1. Detail Kegiatan Utama */}
      {kegiatan && (
        <div className="bg-white shadow rounded-lg p-6 mb-6 relative">
          
          {/* Badge Honorarium di Pojok Kanan Atas */}
          {honorariumInfo.total > 0 && (
            <div 
              className="absolute top-4 right-6 bg-green-100 border border-green-300 rounded-lg p-3 text-right"
              title={`Keg. Utama: ${honorariumInfo.mainTarif.toLocaleString('id-ID')} | Sub: ${honorariumInfo.subTarif.toLocaleString('id-ID')}`}
            >
              <span className="block text-sm font-medium text-green-700">Total Honorarium</span>
              <span className="block text-2xl font-bold text-green-800">
                Rp {Number(honorariumInfo.total).toLocaleString('id-ID')}
              </span>
            </div>
          )}

          <h1 className="text-3xl font-bold mb-2">{kegiatan.nama_kegiatan}</h1>
          <p className="text-gray-600 text-sm mb-4">
            Tahun Anggaran: {kegiatan.tahun_anggaran}
          </p>
          <p className="text-gray-800 mb-4">{kegiatan.deskripsi || 'Tidak ada deskripsi.'}</p>
          <div className="flex justify-between text-sm text-gray-700">
            <span>
              <strong>Mulai:</strong> {new Date(kegiatan.tanggal_mulai).toLocaleDateString('id-ID')}
            </span>
            <span>
              <strong>Selesai:</strong> {new Date(kegiatan.tanggal_selesai).toLocaleDateString('id-ID')}
            </span>
          </div>
        </div>
      )}

      {/* 2. Progress Bar */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-3">Progress Penyelesaian</h2>
        <div className="w-full bg-gray-200 rounded-full h-4">
          <div
            className="bg-indigo-600 h-4 rounded-full text-xs font-medium text-white text-center p-0.5 leading-none"
            style={{ width: `${progressPercent}%` }}
          >
            {Math.round(progressPercent)}%
          </div>
        </div>
      </div>

      {/* 3. Daftar Sub Kegiatan */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <h2 className="text-xl font-semibold p-6">Tahapan Kegiatan</h2>
        <ul className="divide-y divide-gray-200">
          {subKegiatans.length > 0 ? (
            subKegiatans.map(sub => (
              <li key={sub.id} className="p-6 flex justify-between items-center">
                <div>
                  {/* --- MODIFIKASI DI SINI --- */}
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-lg font-semibold">{sub.nama_sub_kegiatan}</h3>
                    {/* Tampilkan badge jika tarif ada (lebih dari 0) */}
                    {sub.tarif && sub.tarif > 0 && (
                      <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                        Rp {sub.tarif.toLocaleString('id-ID')}
                      </span>
                    )}
                  </div>
                  {/* --- AKHIR MODIFIKASI --- */}
                  <p className="text-gray-600 text-sm">{sub.deskripsi || '...'}</p>
                </div>
                <div>
                  {sub.status === 'done' ? (
                    <button
                      onClick={() => handleUpdateStatus(sub.id, 'pending')}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                    >
                      ✓ Selesai (Batal)
                    </button>
                  ) : (
                    <button
                      onClick={() => handleUpdateStatus(sub.id, 'done')}
                      className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
                    >
                      Tandai Selesai
                    </button>
                  )}
                </div>
              </li>
            ))
          ) : (
            <li className="p-6 text-center text-gray-500">
              Belum ada kegiatan untuk Survei/Sensus ini.
            </li>
          )}
        </ul>
      </div>
    </div>
  );
};

export default DetailKegiatan;