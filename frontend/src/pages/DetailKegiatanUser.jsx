// src/pages/DetailKegiatanUser.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const DetailKegiatanUser = () => {
  const { id } = useParams(); // ID Kegiatan
  const navigate = useNavigate();

  // State Data
  const [kegiatan, setKegiatan] = useState(null);
  const [subKegiatans, setSubKegiatans] = useState([]);
  const [mitraData, setMitraData] = useState(null);

  // State Status
  const [isTaken, setIsTaken] = useState(false); // Apakah user ini sudah ambil?
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // 1. Ambil Detail Kegiatan (dengan info kuota dari backend yg baru diupdate)
        const resKegiatan = await axios.get(`${API_URL}/api/kegiatan/${id}`);
        setKegiatan(resKegiatan.data);

        // 2. Ambil Sub Kegiatan
        const resSub = await axios.get(`${API_URL}/api/subkegiatan/kegiatan/${id}`);
        setSubKegiatans(resSub.data);

        // 3. Cek Status User (Mitra & Apakah sudah ambil tugas ini)
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          const user = JSON.parse(storedUser);

          // A. Cek Data Mitra
          try {
            const resMitra = await axios.get(`${API_URL}/api/mitra/un/user/${user.id}`);
            setMitraData(resMitra.data);

            // B. Cek apakah mitra ini ada di dalam penugasan kegiatan ini?
            // Kita cek ke endpoint anggota penugasan jika penugasan sudah dibuat
            if (resKegiatan.data.id_penugasan) {
              const idPenugasan = resKegiatan.data.id_penugasan;
              // Ambil list anggota dari penugasan tersebut
              const resAnggota = await axios.get(`${API_URL}/api/penugasan/${idPenugasan}/anggota`);

              // Cek ID mitra saya ada di list tidak?
              const isAlreadyMember = resAnggota.data.some(
                anggota => anggota.id_mitra === resMitra.data.id
              );
              setIsTaken(isAlreadyMember);
            }

          } catch (err) {
            console.log("User belum jadi mitra atau error fetch mitra");
          }
        }
      } catch (err) {
        console.error("Gagal memuat detail:", err);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchData();
  }, [id]);

  // Handler Ambil Tugas
  const handleAmbilTugas = async () => {
    if (!mitraData) {
      alert("Anda harus terdaftar sebagai Mitra untuk mengambil tugas.");
      navigate('/lengkapi-profil');
      return;
    }

    if (!confirm(`Yakin ingin mengambil tugas "${kegiatan.nama_kegiatan}"?`)) return;

    setProcessing(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_URL}/api/kelompok-penugasan`, {
        id_penugasan: kegiatan.id_penugasan,
        id_mitra: mitraData.id
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert("Berhasil! Anda telah bergabung dalam tugas ini.");
      setIsTaken(true);
      // Update jumlah terisi secara visual
      setKegiatan(prev => ({ ...prev, jumlah_terisi: prev.jumlah_terisi + 1 }));

    } catch (err) {
      alert(err.response?.data?.error || "Gagal mengambil tugas.");
    } finally {
      setProcessing(false);
    }
  };

  if (loading) return <div className="p-8 text-center">Memuat detail kegiatan...</div>;
  if (!kegiatan) return <div className="p-8 text-center text-red-600">Kegiatan tidak ditemukan.</div>;

  // Helper Logika Tombol
  const isFull = kegiatan.jumlah_terisi >= kegiatan.jumlah_max_mitra;
  const hasPenugasan = !!kegiatan.id_penugasan;

  return (
    <div className="max-w-5xl mx-auto p-6 md:p-8 pb-24">
      <Link to="/home" className="text-indigo-600 hover:underline mb-4 inline-block">&larr; Kembali ke Daftar</Link>

      {/* SECTION 1: Header & Action Card */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-8">
        <div className="bg-indigo-600 p-6 text-white">
          <h1 className="text-3xl font-bold">{kegiatan.nama_kegiatan}</h1>
          <p className="opacity-90 mt-2 text-indigo-100">Tahun Anggaran: {kegiatan.tahun_anggaran}</p>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Info Kiri */}
          <div className="md:col-span-2 space-y-4">
            <div>
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide">Deskripsi</h3>
              <p className="text-gray-800 mt-1">{kegiatan.deskripsi || '-'}</p>
            </div>
            <div className="flex gap-8">
              <div>
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide">Tanggal Mulai</h3>
                <p className="font-medium">{new Date(kegiatan.tanggal_mulai).toLocaleDateString('id-ID')}</p>
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide">Tanggal Selesai</h3>
                <p className="font-medium">{new Date(kegiatan.tanggal_selesai).toLocaleDateString('id-ID')}</p>
              </div>
            </div>
          </div>

          {/* Card Status / Action (Kanan) */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 flex flex-col justify-between">
            <div>
              <h3 className="text-gray-500 font-bold text-xs uppercase mb-2">Status Kuota</h3>
              {hasPenugasan ? (
                <div>
                  <div className="flex justify-between items-end mb-1">
                    <span className={`text-3xl font-bold ${isFull ? 'text-red-600' : 'text-indigo-600'}`}>
                      {kegiatan.jumlah_terisi}
                    </span>
                    <span className="text-gray-500 font-medium mb-1">/ {kegiatan.jumlah_max_mitra} Mitra</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${isFull ? 'bg-red-500' : 'bg-indigo-500'}`}
                      style={{ width: `${Math.min((kegiatan.jumlah_terisi / kegiatan.jumlah_max_mitra) * 100, 100)}%` }}
                    ></div>
                  </div>
                  {isFull && !isTaken && <p className="text-xs text-red-600 mt-2 font-medium">Kuota Penuh</p>}
                </div>
              ) : (
                <p className="text-gray-500 italic text-sm">Penugasan belum dibuka oleh admin.</p>
              )}
            </div>

            <div className="mt-6">
              {!mitraData ? (
                <Link to="/lengkapi-profil" className="block w-full text-center bg-gray-800 text-white py-2 rounded hover:bg-gray-900 transition">
                  Daftar Mitra Dulu
                </Link>
              ) : isTaken ? (
                <button disabled className="w-full bg-green-100 text-green-700 font-bold py-2 rounded border border-green-300 cursor-default">
                  ✓ Sudah Anda Ambil
                </button>
              ) : !hasPenugasan ? (
                <button disabled className="w-full bg-gray-200 text-gray-500 font-bold py-2 rounded cursor-not-allowed">
                  Belum Dibuka
                </button>
              ) : isFull ? (
                <button disabled className="w-full bg-red-100 text-red-500 font-bold py-2 rounded cursor-not-allowed">
                  Kuota Penuh
                </button>
              ) : (
                <button
                  onClick={handleAmbilTugas}
                  disabled={processing}
                  className="w-full bg-indigo-600 text-white font-bold py-2 rounded hover:bg-indigo-700 shadow-lg transform active:scale-95 transition"
                >
                  {processing ? 'Memproses...' : 'Ambil Tugas Sekarang'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2: List Sub Kegiatan */}
      <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Rincian Tahapan (Sub Kegiatan)</h2>
        <div className="bg-white shadow rounded-lg overflow-hidden">
          {subKegiatans.length === 0 ? (
            <div className="p-8 text-center text-gray-500">Belum ada rincian sub kegiatan.</div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {subKegiatans.map((sub, idx) => {
                // Logika Status Tampilan (Berdasarkan status_rekrutmen dari backend)
                // status_rekrutmen bisa: 'pending', 'open', 'closed', 'undefined'

                let badgeColor = 'bg-gray-100 text-gray-600';
                let badgeText = 'Belum Dibuka';
                let canApply = false;

                if (sub.status_rekrutmen === 'open') {
                  badgeColor = 'bg-green-100 text-green-700';
                  badgeText = 'Open Recruitment';
                  canApply = true;
                } else if (sub.status_rekrutmen === 'closed') {
                  badgeColor = 'bg-red-100 text-red-700';
                  badgeText = 'Pendaftaran Tutup';
                } else if (sub.status_rekrutmen === 'pending') {
                  badgeColor = 'bg-yellow-100 text-yellow-700';
                  badgeText = 'Segera Dibuka';
                }

                return (
                  <li key={sub.id} className="p-5 hover:bg-gray-50 transition">
                    <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                      <div className="flex gap-4">
                        <div className="flex-shrink-0 mt-1">
                          <div className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-bold text-sm">
                            {idx + 1}
                          </div>
                        </div>
                        <div>
                          <h4 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                            {sub.nama_sub_kegiatan}
                            {/* Badge Status */}
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${badgeColor}`}>
                              {badgeText}
                            </span>
                          </h4>
                          <p className="text-gray-600 mt-1 text-sm">{sub.deskripsi || 'Tidak ada deskripsi tambahan.'}</p>

                          {/* Info Tanggal Req */}
                          {sub.open_req && (
                            <p className="text-xs text-gray-400 mt-1">
                              Periode Daftar: {new Date(sub.open_req).toLocaleDateString('id-ID')} s.d. {new Date(sub.close_req).toLocaleDateString('id-ID')}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Tombol Ambil Spesifik per Sub Kegiatan? 
                        Jika "Ambil Tugas" Anda bersifat umum (1 tombol untuk semua), 
                        logic ini harus dipindah ke tombol utama di atas.
                        
                        Namun, jika konsepnya user ambil sub-kegiatan spesifik, tombolnya di sini:
                    */}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default DetailKegiatanUser;