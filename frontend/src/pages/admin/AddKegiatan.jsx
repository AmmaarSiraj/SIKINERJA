import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import PartSubKegiatan from '../../components/admin/PartSubKegiatan';
// --- 1. IMPORT KOMPONEN BARU ---
import PartAddHonor from '../../components/admin/PartAddHonor'; 

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const AddKegiatan = () => {
  const [formData, setFormData] = useState({
    nama_kegiatan: '',
    deskripsi: '',
    tahun_anggaran: new Date().getFullYear(),
    tanggal_mulai: '',
    tanggal_selesai: '',
  });
  
  const [showSubKegiatan, setShowSubKegiatan] = useState(false);
  const [subKegiatans, setSubKegiatans] = useState([]);
  
  // --- 2. TAMBAHKAN STATE BARU UNTUK HONORARIUM ---
  const [honorariumData, setHonorariumData] = useState({
    applyTo: 'none',
    tarif: 0,
  });
  // ---------------------------------------------

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleToggleSubKegiatan = (e) => {
    const isChecked = e.target.checked;
    setShowSubKegiatan(isChecked);
    
    if (isChecked && subKegiatans.length === 0) {
      setSubKegiatans([{ id: Date.now(), nama_sub_kegiatan: '', deskripsi: '' }]);
    } else if (!isChecked) {
      setSubKegiatans([]);
      // Jika sub kegiatan dimatikan, honorarium tidak bisa berlaku untuk subkegiatan
      if (honorariumData.applyTo === 'subkegiatan') {
        setHonorariumData({ applyTo: 'none', tarif: 0 });
      }
    }
  };

  // --- 3. MODIFIKASI FUNGSI HANDLESUBMIT ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    // Validasi
    if (showSubKegiatan && subKegiatans.some(sub => !sub.nama_sub_kegiatan)) {
      setError('Nama sub kegiatan tidak boleh kosong.');
      setLoading(false);
      return;
    }
    if (honorariumData.applyTo !== 'none' && honorariumData.tarif <= 0) {
      setError('Tarif honorarium harus lebih dari 0.');
      setLoading(false);
      return;
    }

    // Siapkan payload kegiatan
    const payloadKegiatan = {
      ...formData,
    };
    if (showSubKegiatan && subKegiatans.length > 0) {
      payloadKegiatan.subkegiatans = subKegiatans.map(({ nama_sub_kegiatan, deskripsi }) => ({
        nama_sub_kegiatan,
        deskripsi,
      }));
    }

    let token;
    try {
      token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No auth token found. Please login.');
      }

      // === LANGKAH A: BUAT KEGIATAN & SUB KEGIATAN ===
      const response = await fetch(`${API_URL}/api/kegiatan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payloadKegiatan),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || 'Gagal menyimpan kegiatan');
      }

      const result = await response.json();
      let successMessage = result.message;

      // === LANGKAH B: BUAT HONORARIUM (JIKA ADA) ===
      const { applyTo, tarif } = honorariumData;
      
      if (applyTo !== 'none' && tarif > 0) {
        const newKegiatan = result.data.kegiatan;
        const newSubKegiatans = result.data.subkegiatans; // Ini dari controller

        const honorHeaders = {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        };

        try {
          if (applyTo === 'kegiatan') {
            // --- Buat 1 honorarium untuk kegiatan utama ---
            await fetch(`${API_URL}/api/honorarium`, {
              method: 'POST',
              headers: honorHeaders,
              body: JSON.stringify({
                id_kegiatan: newKegiatan.id,
                tarif: tarif
              }),
            });

          } else if (applyTo === 'subkegiatan' && newSubKegiatans.length > 0) {
            // --- Buat honorarium untuk setiap sub kegiatan ---
            const honorPromises = newSubKegiatans.map(sub => {
              return fetch(`${API_URL}/api/honorarium`, {
                method: 'POST',
                headers: honorHeaders,
                body: JSON.stringify({
                  id_subkegiatan: sub.id,
                  tarif: tarif
                }),
              });
            });
            
            await Promise.all(honorPromises);
          }
          successMessage += ' dan honorarium berhasil ditambahkan.';

        } catch (honorError) {
          // Jika kegiatan sukses tapi honor gagal
          console.error("Gagal menyimpan honorarium:", honorError);
          // Tetap set sukses, tapi beri peringatan
          setSuccess(result.message);
          throw new Error(`Kegiatan berhasil disimpan, TAPI gagal menambahkan honorarium: ${honorError.message}`);
        }
      }
      
      // === LANGKAH C: SELESAI ===
      setSuccess(successMessage);
      
      // Reset form
      setFormData({
        nama_kegiatan: '',
        deskripsi: '',
        tahun_anggaran: new Date().getFullYear(),
        tanggal_mulai: '',
        tanggal_selesai: '',
      });
      setSubKegiatans([]);
      setShowSubKegiatan(false);
      setHonorariumData({ applyTo: 'none', tarif: 0 }); // Reset state honor

      // Navigasi
      setTimeout(() => {
        navigate(`/admin/manage-kegiatan/detail/${result.data.kegiatan.id}`);
      }, 1500);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <Link to="/admin/manage-kegiatan" className="text-indigo-600 hover:underline mb-4 inline-block">
        &larr; Kembali ke Daftar Survei/Sensus
      </Link>
      <h1 className="text-3xl font-bold mb-6">Tambah Survei/Sensus Baru</h1>

      <div className="flex items-center justify-end mb-4">
        <label htmlFor="toggle-sub-kegiatan" className="mr-3 text-sm font-medium text-gray-900">
          Tambahkan Kegiatan
        </label>
        <label className="relative inline-flex items-center cursor-pointer">
          <input 
            type="checkbox" 
            id="toggle-sub-kegiatan" 
            className="sr-only peer"
            checked={showSubKegiatan}
            onChange={handleToggleSubKegiatan}
          />
          <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-indigo-300 peer-checked:bg-indigo-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
        </label>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Kolom 1: Detail Kegiatan Utama */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Detail Survei/Sensus Utama</h2>
          
          <div className="mb-4">
            <label htmlFor="nama_kegiatan" className="block text-sm font-medium text-gray-700">Nama Survei/Sensus</label>
            <input
              type="text"
              name="nama_kegiatan"
              id="nama_kegiatan"
              value={formData.nama_kegiatan}
              onChange={handleChange}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          
          <div className="mb-4">
            <label htmlFor="deskripsi" className="block text-sm font-medium text-gray-700">Deskripsi</label>
            <textarea
              name="deskripsi"
              id="deskripsi"
              value={formData.deskripsi}
              onChange={handleChange}
              rows="4"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            ></textarea>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label htmlFor="tahun_anggaran" className="block text-sm font-medium text-gray-700">Tahun</label>
              <input
                type="number"
                name="tahun_anggaran"
                id="tahun_anggaran"
                value={formData.tahun_anggaran}
                onChange={handleChange}
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div>
              <label htmlFor="tanggal_mulai" className="block text-sm font-medium text-gray-700">Tgl Mulai</label>
              <input
                type="date"
                name="tanggal_mulai"
                id="tanggal_mulai"
                value={formData.tanggal_mulai}
                onChange={handleChange}
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div>
              <label htmlFor="tanggal_selesai" className="block text-sm font-medium text-gray-700">Tgl Sselesai</label>
              <input
                type="date"
                name="tanggal_selesai"
                id="tanggal_selesai"
                value={formData.tanggal_selai}
                onChange={handleChange}
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Kolom 2: Sub Kegiatan & Honorarium */}
        <div className="space-y-6">
          {showSubKegiatan && (
            <PartSubKegiatan 
              subKegiatans={subKegiatans} 
              setSubKegiatans={setSubKegiatans} 
            />
          )}

          {/* --- 4. TEMPATKAN KOMPONEN BARU DI SINI --- */}
          <PartAddHonor
            honorariumData={honorariumData}
            setHonorariumData={setHonorariumData}
            isSubKegiatanActive={showSubKegiatan}
          />
        </div>

        {/* Notifikasi dan Tombol Submit */}
        <div className="md:col-span-2">
          {error && <div className="text-red-600 mb-4">Error: {error}</div>}
          {success && <div className="text-green-600 mb-4">{success}</div>}

          <div className="text-right">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex justify-center py-2 px-6 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400"
            >
              {loading ? 'Menyimpan...' : 'Simpan Survei/Sensus'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default AddKegiatan;