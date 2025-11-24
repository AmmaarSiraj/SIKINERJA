// src/components/admin/PartAddHonor.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios'; // Pastikan axios diimport

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const PartAddHonor = ({ subKegiatans, honorariumMap, setHonorariumMap, isSubKegiatanActive }) => {
  
  // State untuk menampung daftar satuan dari database
  const [listSatuan, setListSatuan] = useState([]);
  const [loadingSatuan, setLoadingSatuan] = useState(true);

  // 1. Fetch Data Satuan dari Database saat komponen dimuat
  useEffect(() => {
    const fetchSatuan = async () => {
      try {
        const token = localStorage.getItem('token');
        // Jika endpoint public, tidak perlu header auth. Sesuaikan dengan backend Anda.
        const response = await axios.get(`${API_URL}/api/satuan`, {
           headers: { Authorization: `Bearer ${token}` } 
        });
        setListSatuan(response.data);
      } catch (err) {
        console.error("Gagal memuat data satuan:", err);
      } finally {
        setLoadingSatuan(false);
      }
    };

    fetchSatuan();
  }, []);

  // 2. Inisialisasi default honorarium
  useEffect(() => {
    if (!isSubKegiatanActive) return;

    setHonorariumMap(prev => {
      const newMap = { ...prev };
      subKegiatans.forEach(sub => {
        if (!newMap[sub.id]) {
          // Default ambil ID satuan pertama jika ada, atau 1
          const defaultSatuanId = listSatuan.length > 0 ? listSatuan[0].id : 1;
          
          newMap[sub.id] = {
            tarif: 0,
            id_satuan: defaultSatuanId, 
            basis_volume: 1
          };
        }
      });
      return newMap;
    });
  }, [subKegiatans, isSubKegiatanActive, setHonorariumMap, listSatuan]); // Tambahkan listSatuan ke dependency

  const handleChange = (subId, field, value) => {
    setHonorariumMap(prev => ({
      ...prev,
      [subId]: {
        ...prev[subId],
        [field]: value
      }
    }));
  };

  if (!isSubKegiatanActive || subKegiatans.length === 0) {
    return (
      <div className="bg-white shadow rounded-lg p-6 text-center border-t-4 border-green-500">
        <h2 className="text-xl font-semibold mb-2">Pengaturan Honorarium</h2>
        <p className="text-gray-500 text-sm">
          Silakan tambahkan <strong>Sub Kegiatan</strong> terlebih dahulu di menu sebelumnya untuk mengatur honorarium.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg p-6 border-t-4 border-green-500">
      <h2 className="text-xl font-semibold mb-4 text-gray-800">Pengaturan Honorarium Per Sub Kegiatan</h2>
      <p className="text-sm text-gray-600 mb-6">
        Tentukan tarif dan satuan pembayaran untuk masing-masing sub kegiatan.
      </p>

      <div className="space-y-6">
        {subKegiatans.map((sub, index) => {
          // Gunakan ID satuan dari map, atau default ke id pertama
          const currentSatuanId = honorariumMap[sub.id]?.id_satuan || (listSatuan[0]?.id || 1);
          const honor = honorariumMap[sub.id] || { tarif: 0, id_satuan: currentSatuanId, basis_volume: 1 };

          return (
            <div key={sub.id} className="p-6 border border-green-200 rounded-lg bg-green-50">
              
              {/* Header Item */}
              <div className="flex items-center gap-2 mb-4 border-b border-green-200 pb-3">
                <span className="bg-green-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                  #{index + 1}
                </span>
                <h3 className="font-bold text-gray-800 text-sm truncate">
                  {sub.nama_sub_kegiatan || '(Nama Sub Kegiatan Belum Diisi)'}
                </h3>
              </div>

              {/* Form Fields (Disusun Atas-Bawah) */}
              <div className="flex flex-col gap-5">
                
                {/* 1. Tarif */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-2">
                    Nominal Tarif (Rp)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-gray-500 text-sm font-bold">Rp</span>
                    <input
                      type="number"
                      min="0"
                      placeholder="0"
                      value={honor.tarif}
                      onChange={(e) => handleChange(sub.id, 'tarif', parseFloat(e.target.value) || 0)}
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500 text-sm font-semibold"
                    />
                  </div>
                </div>

                {/* 2. Satuan (Dinamis dari DB) */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-2">
                    Satuan Kegiatan
                  </label>
                  <select
                    value={honor.id_satuan}
                    onChange={(e) => handleChange(sub.id, 'id_satuan', parseInt(e.target.value))}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500 text-sm bg-white"
                    disabled={loadingSatuan}
                  >
                    {loadingSatuan ? (
                      <option>Memuat data...</option>
                    ) : (
                      listSatuan.map(opt => (
                        <option key={opt.id} value={opt.id}>
                          {opt.nama_satuan} {opt.alias ? `(${opt.alias})` : ''}
                        </option>
                      ))
                    )}
                  </select>
                </div>

                {/* 3. Volume Target */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-2">
                    Volume Target (Per Pembayaran)
                  </label>
                  <div className="flex items-center gap-3">
                    <span className="text-gray-600 text-sm">Dibayar setiap kelipatan:</span>
                    <input
                      type="number"
                      min="1"
                      value={honor.basis_volume}
                      onChange={(e) => handleChange(sub.id, 'basis_volume', parseInt(e.target.value) || 1)}
                      className="w-24 px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500 text-sm text-center font-bold"
                    />
                    <span className="text-gray-600 text-sm">Unit/Satuan</span>
                  </div>
                  <p className="text-[10px] text-gray-500 mt-1 italic">
                    Contoh: Isi <strong>1</strong> jika dibayar per dokumen, atau <strong>10</strong> jika dibayar per 10 dokumen.
                  </p>
                </div>

              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PartAddHonor;