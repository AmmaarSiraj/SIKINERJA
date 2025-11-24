// src/components/admin/PartManageHonor.jsx
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
// 1. IMPORT ICON
import { 
  FaMoneyBillWave, 
  FaSave, 
  FaTrash, 
  FaSyncAlt, 
  FaExclamationCircle,
  FaCheckCircle 
} from 'react-icons/fa';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const getToken = () => localStorage.getItem('token');

const PartManageHonor = ({ kegiatanId }) => {
  const [subKegiatans, setSubKegiatans] = useState([]);
  const [listSatuan, setListSatuan] = useState([]);
  
  // State untuk menyimpan nilai input per sub-kegiatan
  // Format Map: { subId: { id_honor, tarif, id_satuan, basis_volume, isNew } }
  const [inputsMap, setInputsMap] = useState({});

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Helper Notifikasi
  const showSuccess = (msg) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(null), 3000);
  };
  const showError = (msg) => {
    setError(msg);
    setTimeout(() => setError(null), 3000);
  };

  // --- FETCH DATA ---
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    const token = getToken();
    const headers = { Authorization: `Bearer ${token}` };

    try {
      // 1. Ambil Referensi Satuan & Data Sub Kegiatan
      const [resSatuan, resSub, resHonor] = await Promise.all([
        axios.get(`${API_URL}/api/satuan`, { headers }), // Endpoint satuan dinamis
        axios.get(`${API_URL}/api/subkegiatan/kegiatan/${kegiatanId}`, { headers }),
        axios.get(`${API_URL}/api/honorarium`, { headers })
      ]);

      const satList = resSatuan.data;
      const subs = resSub.data.data || resSub.data; // Handle format response
      const honors = resHonor.data;

      setListSatuan(satList);
      setSubKegiatans(subs);

      // 2. Mapping Data Honor ke State Lokal
      const initialMap = {};
      const defaultSatuan = satList.length > 0 ? satList[0].id : 1;

      subs.forEach(sub => {
        // Cari honor yang sesuai dengan sub kegiatan ini
        const honor = honors.find(h => h.id_subkegiatan === sub.id);
        
        if (honor) {
          // Jika sudah ada honor, isi state dengan data DB
          initialMap[sub.id] = {
            id_honor: honor.id_honorarium,
            tarif: Number(honor.tarif),
            id_satuan: honor.id_satuan,
            basis_volume: honor.basis_volume,
            isNew: false
          };
        } else {
          // Jika belum ada, siapkan state default (Mode Create)
          initialMap[sub.id] = {
            id_honor: null,
            tarif: 0,
            id_satuan: defaultSatuan,
            basis_volume: 1,
            isNew: true
          };
        }
      });
      setInputsMap(initialMap);

    } catch (err) {
      console.error(err);
      setError("Gagal memuat data honorarium.");
    } finally {
      setLoading(false);
    }
  }, [kegiatanId]);

  useEffect(() => {
    if (kegiatanId) fetchData();
  }, [fetchData, kegiatanId]);

  // --- HANDLERS ---

  const handleInputChange = (subId, field, value) => {
    setInputsMap(prev => ({
      ...prev,
      [subId]: {
        ...prev[subId],
        [field]: value
      }
    }));
  };

  const handleSave = async (subId) => {
    const token = getToken();
    const data = inputsMap[subId];
    
    if (data.tarif <= 0) return showError("Tarif harus lebih dari 0.");

    try {
      const payload = {
        tarif: data.tarif,
        id_satuan: data.id_satuan,
        basis_volume: data.basis_volume
      };

      if (data.isNew) {
        // CREATE
        await axios.post(`${API_URL}/api/honorarium`, {
          ...payload,
          id_subkegiatan: subId
        }, { headers: { Authorization: `Bearer ${token}` } });
        showSuccess("Honorarium berhasil dibuat.");
      } else {
        // UPDATE
        await axios.put(`${API_URL}/api/honorarium/${data.id_honor}`, payload, { 
          headers: { Authorization: `Bearer ${token}` } 
        });
        showSuccess("Honorarium berhasil diperbarui.");
      }
      
      fetchData(); // Refresh data agar ID tersinkron

    } catch (err) {
      showError(err.response?.data?.error || "Gagal menyimpan honorarium.");
    }
  };

  const handleDelete = async (subId) => {
    if (!window.confirm("Yakin hapus tarif honor ini?")) return;
    const token = getToken();
    const data = inputsMap[subId];

    try {
      await axios.delete(`${API_URL}/api/honorarium/${data.id_honor}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      showSuccess("Honorarium dihapus.");
      fetchData(); // Reset state ke mode 'isNew'
    } catch (err) {
      showError("Gagal menghapus data.");
    }
  };

  if (loading) return <div className="text-center py-6 text-gray-500">Memuat data honorarium...</div>;

  return (
    <div className="bg-white shadow-sm rounded-xl border border-gray-100 overflow-hidden">
      
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center gap-2">
        <span className="text-[#1A2A80] text-lg"><FaMoneyBillWave /></span>
        <div>
            <h2 className="text-lg font-bold text-gray-800">Kelola Honorarium</h2>
            <p className="text-xs text-gray-500">Atur tarif pembayaran untuk setiap sub kegiatan.</p>
        </div>
      </div>

      {/* Notifikasi */}
      {error && <div className="mx-6 mt-4 bg-red-50 text-red-600 px-4 py-2 rounded-lg border border-red-100 text-sm flex items-center gap-2"><FaExclamationCircle /> {error}</div>}
      {success && <div className="mx-6 mt-4 bg-green-50 text-green-600 px-4 py-2 rounded-lg border border-green-100 text-sm flex items-center gap-2"><FaCheckCircle /> {success}</div>}

      <div className="p-6 space-y-6">
        {subKegiatans.length === 0 && (
            <div className="text-center py-8 text-gray-400 italic border-2 border-dashed border-gray-100 rounded-xl">
                Tidak ada sub kegiatan. Tambahkan sub kegiatan terlebih dahulu.
            </div>
        )}

        {subKegiatans.map((sub, index) => {
          const inputData = inputsMap[sub.id] || {};
          
          return (
            <div key={sub.id} className="p-6 border border-gray-200 rounded-xl bg-white shadow-sm hover:border-green-300 transition-colors relative">
              
              {/* Header Item */}
              <div className="flex items-center gap-3 mb-5 pb-3 border-b border-gray-100">
                <span className="bg-green-100 text-green-800 w-8 h-8 flex items-center justify-center rounded-full text-xs font-bold">
                  {index + 1}
                </span>
                <div>
                    <h3 className="font-bold text-gray-800 text-sm">
                        {sub.nama_sub_kegiatan}
                    </h3>
                    <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${inputData.isNew ? 'bg-gray-100 text-gray-500' : 'bg-green-50 text-green-600'}`}>
                        {inputData.isNew ? 'Belum Ada Tarif' : 'Aktif'}
                    </span>
                </div>
              </div>

              {/* Form Inputs (Vertikal) */}
              <div className="flex flex-col gap-5">
                
                {/* 1. Tarif */}
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase mb-2">
                    Nominal Tarif (Rp)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-gray-500 text-sm font-bold">Rp</span>
                    <input
                      type="number"
                      min="0"
                      placeholder="0"
                      value={inputData.tarif || ''}
                      onChange={(e) => handleInputChange(sub.id, 'tarif', parseFloat(e.target.value) || 0)}
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500 text-sm font-bold text-gray-800"
                    />
                  </div>
                </div>

                {/* 2. Satuan */}
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase mb-2">
                    Satuan Kegiatan
                  </label>
                  <select
                    value={inputData.id_satuan}
                    onChange={(e) => handleInputChange(sub.id, 'id_satuan', parseInt(e.target.value))}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500 text-sm bg-white"
                  >
                    {listSatuan.map(opt => (
                      <option key={opt.id} value={opt.id}>
                        {opt.nama_satuan} {opt.alias ? `(${opt.alias})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 3. Volume Target */}
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase mb-2">
                    Volume Target (Per Pembayaran)
                  </label>
                  <div className="flex items-center gap-3">
                    <span className="text-gray-500 text-sm">Dibayar per:</span>
                    <input
                      type="number"
                      min="1"
                      value={inputData.basis_volume || 1}
                      onChange={(e) => handleInputChange(sub.id, 'basis_volume', parseInt(e.target.value) || 1)}
                      className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500 text-sm text-center font-bold"
                    />
                    <span className="text-gray-500 text-sm">Unit</span>
                  </div>
                </div>

              </div>

              {/* Footer Actions */}
              <div className="mt-6 pt-4 border-t border-gray-100 flex justify-end gap-3">
                {inputData.isNew ? (
                    <button 
                        onClick={() => handleSave(sub.id)}
                        className="flex items-center gap-2 bg-[#1A2A80] text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-blue-900 transition shadow-sm"
                    >
                        <FaSave /> Simpan Tarif
                    </button>
                ) : (
                    <>
                        <button 
                            onClick={() => handleDelete(sub.id)}
                            className="flex items-center gap-2 bg-red-50 text-red-600 px-4 py-2 rounded-lg text-xs font-bold hover:bg-red-100 border border-red-200 transition"
                        >
                            <FaTrash /> Hapus
                        </button>
                        <button 
                            onClick={() => handleSave(sub.id)}
                            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-green-700 transition shadow-sm"
                        >
                            <FaSyncAlt /> Update
                        </button>
                    </>
                )}
              </div>

            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PartManageHonor;