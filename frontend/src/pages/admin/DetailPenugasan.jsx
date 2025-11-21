import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import PopupTambahAnggota from '../../components/admin/PopupTambahAnggota';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const getToken = () => localStorage.getItem('token');

const DetailPenugasan = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [penugasan, setPenugasan] = useState(null);
  const [anggota, setAnggota] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isPopupOpen, setIsPopupOpen] = useState(false);

  const fetchDetailData = async () => {
    if (!id) return;
    setIsLoading(true);
    setError(null);
    try {
      const token = getToken();
      const config = { headers: { Authorization: `Bearer ${token}` } };

      const penugasanRes = await axios.get(`${API_URL}/api/penugasan/${id}`, config);
      setPenugasan(penugasanRes.data);

      try {
        const anggotaRes = await axios.get(`${API_URL}/api/penugasan/${id}/anggota`, config);
        setAnggota(anggotaRes.data);
      } catch (anggotaErr) {
        setAnggota([]); // Jika kosong/404 biarkan array kosong
      }

    } catch (err) { 
      setError(err.response?.data?.message || 'Gagal memuat data utama.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDetailData();
  }, [id]);

  const handleRemoveAnggota = async (id_kelompok) => {
    if (!window.confirm('Keluarkan mitra ini dari tim?')) return;
    try {
      const token = getToken();
      await axios.delete(`${API_URL}/api/kelompok-penugasan/${id_kelompok}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchDetailData(); 
    } catch (err) {
      alert('Gagal menghapus anggota.');
    }
  };

  const handleDeletePenugasan = async () => {
    if (!window.confirm('Yakin bubarkan tim ini? Semua anggota akan dikeluarkan.')) return;
    try {
      const token = getToken();
      await axios.delete(`${API_URL}/api/penugasan/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      navigate('/admin/penugasan');
    } catch (err) {
      alert('Gagal menghapus penugasan.');
    }
  };
  
  const progres = useMemo(() => {
    if (!penugasan || anggota.length === 0) return 0;
    return (anggota.length / penugasan.jumlah_max_mitra) * 100;
  }, [penugasan, anggota]);

  if (isLoading) return <div className="p-8 text-center">Memuat detail...</div>;
  if (error) return <div className="p-8 text-center text-red-600">Error: {error}</div>;
  if (!penugasan) return <div className="p-8 text-center">Data tidak ditemukan.</div>;

  return (
    <>
      <div className="p-8 max-w-5xl mx-auto space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <Link to="/admin/penugasan" className="text-indigo-600 hover:underline text-sm">
              &larr; Kembali ke Daftar
            </Link>
            <h1 className="text-3xl font-bold mt-2 text-gray-800">
              Tim: {penugasan.nama_sub_kegiatan}
            </h1>
            <p className="text-gray-500">Induk: {penugasan.nama_kegiatan}</p>
          </div>
          <button 
            onClick={handleDeletePenugasan}
            className="bg-red-100 text-red-700 px-4 py-2 rounded hover:bg-red-200 text-sm font-bold"
          >
            Bubarkan Tim
          </button>
        </div>

        {/* --- KARTU INFO --- */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h2 className="text-lg font-bold mb-4 border-b pb-2 text-gray-700">Informasi Tim</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-xs text-gray-500 uppercase font-bold">Ketua Tim / Pengawas</p>
              <p className="text-lg font-medium text-gray-900">{penugasan.nama_pengawas}</p>
              <p className="text-sm text-gray-500">{penugasan.email_pengawas} ({penugasan.role_pengawas})</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase font-bold">Kapasitas & Status</p>
              <div className="flex items-center justify-between mt-1 mb-2">
                <span className="font-bold text-gray-900">{anggota.length} / {penugasan.jumlah_max_mitra} Anggota</span>
                <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded">{progres.toFixed(0)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className={`h-2 rounded-full ${progres >= 100 ? 'bg-red-500' : 'bg-green-500'}`} style={{ width: `${Math.min(progres, 100)}%` }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* --- TABEL ANGGOTA --- */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-gray-700">Daftar Anggota Lapangan</h3>
            <button 
              onClick={() => setIsPopupOpen(true)}
              disabled={anggota.length >= penugasan.jumlah_max_mitra}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 text-white py-2 px-4 rounded text-sm font-medium transition"
            >
              + Tambah Anggota
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nama Mitra</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">NIK</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kontak</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {anggota.length === 0 ? (
                  <tr><td colSpan="4" className="px-4 py-6 text-center text-gray-500 italic">Belum ada anggota.</td></tr>
                ) : (
                  anggota.map((item) => (
                    <tr key={item.id_kelompok}>
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium text-gray-900">{item.nama_lengkap}</div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500 font-mono">{item.nik}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">{item.no_hp}</td>
                      <td className="px-4 py-3 text-right">
                        <button 
                          onClick={() => handleRemoveAnggota(item.id_kelompok)}
                          className="text-red-600 hover:text-red-800 text-sm font-medium"
                        >
                          Keluarkan
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <PopupTambahAnggota
        isOpen={isPopupOpen}
        onClose={() => setIsPopupOpen(false)}
        id_penugasan={id}
        // id_pengawas tidak lagi digunakan untuk filter mitra karena beda tabel
        id_pengawas={null} 
        existingAnggotaIds={anggota.map(a => a.id_mitra)}
        onAnggotaAdded={fetchDetailData}
      />
    </>
  );
};

export default DetailPenugasan;