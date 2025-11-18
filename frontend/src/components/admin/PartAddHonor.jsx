// src/components/admin/PartAddHonor.jsx
import React from 'react';

/**
 * Komponen ini adalah "controlled component".
 * State-nya dikelola oleh komponen induk (AddKegiatan.jsx).
 * Menerima props:
 * - honorariumData (objek): Berisi { applyTo: 'none' | 'kegiatan' | 'subkegiatan', tarif: 0 }
 * - setHonorariumData (fungsi): Setter dari useState di induk
 * - isSubKegiatanActive (boolean): Apakah toggle sub-kegiatan sedang aktif?
 */
const PartAddHonor = ({ honorariumData, setHonorariumData, isSubKegiatanActive }) => {
  
  const handleTypeChange = (e) => {
    const newType = e.target.value;
    setHonorariumData(prev => ({
      ...prev,
      applyTo: newType,
      // Reset tarif jika user memilih "Tidak Ada"
      tarif: newType === 'none' ? 0 : prev.tarif 
    }));
  };

  const handleTarifChange = (e) => {
    setHonorariumData(prev => ({
      ...prev,
      tarif: e.target.valueAsNumber || 0 
    }));
  };

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-xl font-semibold mb-4">Tambahkan Honorarium</h2>
      <p className="text-sm text-gray-600 mb-4">
        Honorarium akan otomatis dibuat dan ditautkan setelah kegiatan ini berhasil disimpan.
      </p>

      <div className="space-y-4">
        {/* 1. Pilihan Tipe Honorarium */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Terapkan Honorarium Untuk:
          </label>
          <select
            value={honorariumData.applyTo}
            onChange={handleTypeChange}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="none">-- Tidak Ada Honorarium --</option>
            <option value="kegiatan">Kegiatan Utama (1x Tarif)</option>
            <option value="subkegiatan" disabled={!isSubKegiatanActive}>
              Semua Sub Kegiatan (Tarif per Sub)
            </option>
          </select>
          {!isSubKegiatanActive && (
            <p className="text-xs text-gray-500 mt-1">
              * Aktifkan "Tambahkan Sub Kegiatan" untuk memilih opsi ini.
            </p>
          )}
        </div>

        {/* 2. Input Tarif (Hanya tampil jika tipe dipilih) */}
        {honorariumData.applyTo !== 'none' && (
          <div>
            <label htmlFor="tarif" className="block text-sm font-medium text-gray-700">
              Tarif (per satuan)
            </label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500 sm:text-sm">Rp</span>
              </div>
              <input
                type="number"
                id="tarif"
                name="tarif"
                value={honorariumData.tarif}
                onChange={handleTarifChange}
                className="pl-7 pr-3 py-2 block w-full border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="0"
                min="0"
                required
              />
            </div>
            {honorariumData.applyTo === 'subkegiatan' && isSubKegiatanActive && (
              <p className="text-xs text-gray-500 mt-1">
                * Tarif ini akan diterapkan untuk SETIAP sub kegiatan yang Anda buat.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PartAddHonor;