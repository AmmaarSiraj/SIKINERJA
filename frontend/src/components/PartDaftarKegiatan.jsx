// src/components/PartDaftarKegiatan.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const PartDaftarKegiatan = () => {
  const [kegiatanList, setKegiatanList] = useState([]);
  const [mitraData, setMitraData] = useState(null);
  const [userTasks, setUserTasks] = useState(new Set()); 
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false); 
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // A. Ambil Daftar Kegiatan
        const resKegiatan = await axios.get(`${API_URL}/api/kegiatan`);
        setKegiatanList(resKegiatan.data);

        // B. Cek User Login & Data Mitra
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          const user = JSON.parse(storedUser);
          
          try {
            const resMitra = await axios.get(`${API_URL}/api/mitra/un/user/${user.id}`);
            const myMitra = resMitra.data;
            setMitraData(myMitra);

            const resKelompok = await axios.get(`${API_URL}/api/kelompok-penugasan`);
            const myTasks = new Set(
              resKelompok.data
                .filter(kp => kp.id_mitra === myMitra.id)
                .map(kp => kp.id_penugasan)
            );
            setUserTasks(myTasks);

          } catch (err) {
            console.log("User bukan mitra atau belum terdaftar.");
          }
        }
      } catch (err) {
        console.error("Gagal memuat data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleAmbilTugas = async (e, id_penugasan, nama_kegiatan) => {
    // Mencegah event klik kartu (navigasi) tereksekusi
    e.stopPropagation();

    if (!mitraData) {
      alert("Anda harus terdaftar sebagai Mitra untuk mengambil tugas.");
      navigate('/lengkapi-profil');
      return;
    }

    if (!confirm(`Apakah Anda yakin ingin mengambil tugas "${nama_kegiatan}"?`)) return;

    setProcessing(true);
    try {
      const token = localStorage.getItem('token');
      
      await axios.post(`${API_URL}/api/kelompok-penugasan`, {
        id_penugasan: id_penugasan,
        id_mitra: mitraData.id
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert("Berhasil mengambil tugas! Silakan cek detail di dashboard.");
      
      setUserTasks(prev => new Set(prev).add(id_penugasan));
      setKegiatanList(prev => prev.map(k => {
        if (k.id_penugasan === id_penugasan) {
          return { ...k, jumlah_terisi: k.jumlah_terisi + 1 };
        }
        return k;
      }));

    } catch (err) {
      alert(err.response?.data?.error || "Gagal mengambil tugas.");
    } finally {
      setProcessing(false);
    }
  };

  // Handler untuk klik kartu -> Menuju Detail
  const handleCardClick = (id) => {
    navigate(`/kegiatan/${id}`);
  };

  const formatDate = (isoDate) => {
    if (!isoDate) return '-';
    return new Date(isoDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const renderButton = (item) => {
    // Jika belum login / bukan mitra
    if (!mitraData) {
      return (
        <Link 
            to="/lengkapi-profil" 
            className="text-xs text-indigo-600 underline hover:text-indigo-800"
            onClick={(e) => e.stopPropagation()} // Mencegah klik tembus ke kartu
        >
          Daftar Mitra
        </Link>
      );
    }

    if (!item.id_penugasan) {
      return <span className="text-xs text-gray-400 italic">Belum dibuka</span>;
    }

    if (userTasks.has(item.id_penugasan)) {
      return (
        <span className="px-3 py-1 text-xs font-bold text-green-700 bg-green-100 rounded-full border border-green-300">
          ✓ Diambil
        </span>
      );
    }

    if (item.jumlah_terisi >= item.jumlah_max_mitra) {
      return (
        <span className="px-3 py-1 text-xs font-bold text-red-700 bg-red-100 rounded-full border border-red-300">
          Penuh
        </span>
      );
    }

    return (
      <button
        onClick={(e) => handleAmbilTugas(e, item.id_penugasan, item.nama_kegiatan)}
        disabled={processing}
        className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs px-3 py-1.5 rounded shadow transition transform hover:scale-105 disabled:opacity-50"
      >
        {processing ? '...' : 'Ambil'}
      </button>
    );
  };

  if (loading) return <div className="text-center p-4 text-gray-500">Memuat kegiatan...</div>;

  return (
    <div className="bg-white p-6 md:p-8 rounded-xl shadow-lg w-full max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-6 border-b pb-2">
        <h2 className="text-2xl font-bold text-gray-800">Daftar Kegiatan Tersedia</h2>
        {mitraData && (
          <span className="text-sm text-green-600 bg-green-50 px-2 py-1 rounded border border-green-100">
            Halo, {mitraData.nama_lengkap}
          </span>
        )}
      </div>

      {kegiatanList.length === 0 ? (
        <p className="text-gray-500 text-center py-8">Belum ada kegiatan yang tersedia saat ini.</p>
      ) : (
        <div className="space-y-4">
          {kegiatanList.map(item => (
            <div 
                key={item.id} 
                onClick={() => handleCardClick(item.id)} // Navigasi saat klik kartu
                className="border rounded-lg p-4 hover:shadow-md transition bg-gray-50 cursor-pointer group hover:border-indigo-300"
            >
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                
                {/* Info Kegiatan */}
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-indigo-700 group-hover:text-indigo-900 transition">
                    {item.nama_kegiatan}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                    {item.deskripsi || 'Tidak ada deskripsi'}
                  </p>
                  
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-3 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                        📅 {formatDate(item.tanggal_mulai)} - {formatDate(item.tanggal_selesai)}
                    </span>
                    
                    {item.id_penugasan && (
                      <span className={`font-semibold flex items-center gap-1 ${item.jumlah_terisi >= item.jumlah_max_mitra ? 'text-red-600' : 'text-blue-600'}`}>
                        👤 Kuota: {item.jumlah_terisi} / {item.jumlah_max_mitra}
                      </span>
                    )}
                  </div>
                </div>

                {/* Tombol Aksi */}
                <div className="flex-shrink-0 self-start md:self-center">
                  {renderButton(item)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PartDaftarKegiatan;