import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const LengkapiProfile = () => {
  const [formData, setFormData] = useState({
    id_user: '',
    nama_lengkap: '',
    nik: '',
    alamat: '',
    no_hp: '',
    email: '',
    no_rekening: '',
    nama_bank: '',
  });

  const [loading, setLoading] = useState(true); // Mulai true untuk cek status
  const [error, setError] = useState('');
  const [statusPengajuan, setStatusPengajuan] = useState(null); // 'pending', 'approved', 'rejected'
  const navigate = useNavigate();

  // 1. Cek status pengajuan & isi data user
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError('');
      try {
        const storedUser = localStorage.getItem('user');
        if (!storedUser) {
          throw new Error('Anda harus login untuk mengakses halaman ini.');
        }
        const user = JSON.parse(storedUser);

        // Set data awal form
        setFormData((prev) => ({
          ...prev,
          id_user: user.id,
          email: user.email,
        }));

        // Cek apakah user sudah pernah mengajukan
        try {
          const response = await axios.get(
            `${API_URL}/api/pengajuan-mitra/user/${user.id}`
          );
          // Jika data ditemukan, set statusnya
          setStatusPengajuan(response.data.status);
        } catch (err) {
          if (err.response && err.response.status === 404) {
            // 404 berarti 'Belum ada pengajuan', ini BUKAN error
            setStatusPengajuan(null);
          } else {
            throw err; // Lempar error lain
          }
        }
      } catch (err) {
        setError(
          err.response?.data?.error ||
            err.message ||
            'Gagal memuat data'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // 2. Kirim data ke endpoint PENGUSULAN
      // (Kita tidak perlu token karena authMiddleware sudah dihapus)
      await axios.post(`${API_URL}/api/pengajuan-mitra`, formData);

      // 3. Jika sukses, update status & arahkan ke home
      setStatusPengajuan('pending'); // Set status di frontend
      alert('Pengajuan berhasil terkirim! Admin akan segera meninjau data Anda.');
      navigate('/home');
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.error ||
          'Gagal mengirim pengajuan. Pastikan NIK tidak duplikat.'
      );
    } finally {
      setLoading(false);
    }
  };

  // Tampilan loading awal
  if (loading) {
    return (
      <div className="container mx-auto max-w-2xl p-8 text-center">
        <p>Memeriksa status pengajuan...</p>
      </div>
    );
  }

  // Tampilan jika pengajuan sedang ditinjau atau sudah diproses
  if (statusPengajuan === 'pending') {
    return (
      <div className="container mx-auto max-w-2xl p-8 text-center">
        <h1 className="text-2xl font-bold mb-4 text-gray-800">
          Pengajuan Anda Sedang Ditinjau
        </h1>
        <p className="mb-6 text-gray-600">
          Data Anda telah kami terima dan sedang dalam proses verifikasi oleh
          Admin.
        </p>
        <Link to="/home" className="text-indigo-600 hover:underline">
          Kembali ke Home
        </Link>
      </div>
    );
  }
  
  // Tampilan jika ditolak (Opsional)
  if (statusPengajuan === 'rejected') {
     return (
      <div className="container mx-auto max-w-2xl p-8 text-center">
        <h1 className="text-2xl font-bold mb-4 text-red-600">
          Pengajuan Anda Ditolak
        </h1>
        <p className="mb-6 text-gray-600">
          Mohon maaf, pengajuan Anda ditolak oleh admin. Silakan hubungi admin untuk informasi lebih lanjut.
        </p>
        {/* Anda bisa tambahkan tombol untuk mengajukan ulang di sini */}
        <Link to="/home" className="text-indigo-600 hover:underline">
          Kembali ke Home
        </Link>
      </div>
    );
  }
  
  // Tampilan jika sudah disetujui (Opsional)
  if (statusPengajuan === 'approved') {
     return (
      <div className="container mx-auto max-w-2xl p-8 text-center">
        <h1 className="text-2xl font-bold mb-4 text-green-600">
          Anda Sudah Menjadi Mitra
        </h1>
        <p className="mb-6 text-gray-600">
          Akun Anda telah disetujui. Anda sekarang dapat melihat penugasan.
        </p>
        <Link to="/home" className="text-indigo-600 hover:underline">
          Kembali ke Home
        </Link>
      </div>
    );
  }

  // Tampilan form pengajuan (jika statusPengajuan === null)
  return (
    <div className="container mx-auto max-w-2xl p-8">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">
        Form Pengajuan Mitra
      </h1>
      <p className="mb-6 text-gray-600">
        Data Anda akan ditinjau oleh Admin sebelum akun Anda diaktifkan sebagai
        mitra.
      </p>

      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded-lg shadow-md space-y-6"
      >
        {error && (
          <div
            className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded"
            role="alert"
          >
            {error}
          </div>
        )}

        {/* Data Akun (Read Only) */}
        <div className="p-4 bg-gray-50 rounded-md border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-500">
                User ID
              </label>
              <p className="text-gray-900 font-medium">
                {formData.id_user || '-'}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500">
                Email Terdaftar
              </label>
              <p className="text-gray-900 font-medium">
                {formData.email || '-'}
              </p>
            </div>
          </div>
        </div>

        {/* Form Input */}
        <div>
          <label
            htmlFor="nama_lengkap"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Nama Lengkap (Sesuai KTP)
          </label>
          <input
            type="text"
            name="nama_lengkap"
            id="nama_lengkap"
            value={formData.nama_lengkap}
            onChange={handleChange}
            required
            className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label
              htmlFor="nik"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              NIK
            </label>
            <input
              type="text"
              name="nik"
              id="nik"
              value={formData.nik}
              onChange={handleChange}
              required
              className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div>
            <label
              htmlFor="no_hp"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              No. Handphone (WhatsApp)
            </label>
            <input
              type="text"
              name="no_hp"
              id="no_hp"
              value={formData.no_hp}
              onChange={handleChange}
              required
              className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="alamat"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Alamat (Sesuai KTP)
          </label>
          <textarea
            name="alamat"
            id="alamat"
            rows="3"
            value={formData.alamat}
            onChange={handleChange}
            required
            className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          ></textarea>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label
              htmlFor="nama_bank"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Nama Bank
            </label>
            <input
              type="text"
              name="nama_bank"
              id="nama_bank"
              value={formData.nama_bank}
              onChange={handleChange}
              required
              className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Contoh: BCA, BRI, Mandiri"
            />
          </div>
          <div>
            <label
              htmlFor="no_rekening"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Nomor Rekening
            </label>
            <input
              type="text"
              name="no_rekening"
              id="no_rekening"
              value={formData.no_rekening}
              onChange={handleChange}
              required
              className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Tombol Submit */}
        <div className="text-right">
          <Link
            to="/home"
            className="text-gray-600 hover:underline mr-4"
          >
            Batal
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex justify-center py-2 px-6 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400"
          >
            {loading ? 'Mengirim...' : 'Kirim Pengajuan'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default LengkapiProfile;