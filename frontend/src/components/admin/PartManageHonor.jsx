// src/components/admin/PartManageHonor.jsx
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const getToken = () => localStorage.getItem('token');

const PartManageHonor = ({ kegiatanId }) => {
  const [kegiatan, setKegiatan] = useState(null);
  const [subKegiatans, setSubKegiatans] = useState([]);
  
  // State untuk honorarium yang sudah ada
  const [mainHonor, setMainHonor] = useState(null);
  const [subHonorsMap, setSubHonorsMap] = useState(new Map());

  // State untuk nilai di input fields
  const [mainTarifInput, setMainTarifInput] = useState(0);
  const [subTarifInputs, setSubTarifInputs] = useState(new Map());

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const showSuccess = (message) => {
    setSuccess(message);
    setTimeout(() => setSuccess(null), 3000);
  };
  
  const showError = (message) => {
    setError(message);
    setTimeout(() => setError(null), 3000);
  }

  // Fungsi untuk mengambil semua data terkait
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    const token = getToken();
    const headers = { Authorization: `Bearer ${token}` };

    try {
      // 1. Ambil data Kegiatan, Sub Kegiatan, dan semua Honorarium
      const [kegRes, subKegRes, honRes] = await Promise.all([
        axios.get(`${API_URL}/api/kegiatan/${kegiatanId}`, { headers }),
        axios.get(`${API_URL}/api/subkegiatan/kegiatan/${kegiatanId}`, { headers }),
        axios.get(`${API_URL}/api/honorarium`, { headers })
      ]);

      const kegData = kegRes.data;
      const subKegData = subKegRes.data;
      const allHonors = honRes.data;

      setKegiatan(kegData);
      setSubKegiatans(subKegData);

      // 2. Proses dan petakan honorarium
      const foundMainHonor = allHonors.find(h => h.id_kegiatan === kegData.id) || null;
      setMainHonor(foundMainHonor);
      setMainTarifInput(foundMainHonor?.tarif || 0);
      
      const newSubHonorsMap = new Map();
      const newSubTarifInputs = new Map();
      
      subKegData.forEach(sub => {
        const foundSubHonor = allHonors.find(h => h.id_subkegiatan === sub.id) || null;
        newSubHonorsMap.set(sub.id, foundSubHonor);
        newSubTarifInputs.set(sub.id, foundSubHonor?.tarif || 0);
      });

      setSubHonorsMap(newSubHonorsMap);
      setSubTarifInputs(newSubTarifInputs);

    } catch (err) {
      setError(err.response?.data?.message || 'Gagal memuat data honorarium');
    } finally {
      setLoading(false);
    }
  }, [kegiatanId]);

  // Ambil data saat komponen dimuat
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handler untuk menyimpan/update/hapus
  const handleAction = async (actionType, targetId, targetType, honorId = null) => {
    const token = getToken();
    const config = { headers: { Authorization: `Bearer ${token}` } };
    let tarif, body, url, method;

    try {
      if (targetType === 'kegiatan') {
        tarif = mainTarifInput;
        body = { tarif, id_kegiatan: targetId, id_subkegiatan: null };
      } else { // subkegiatan
        tarif = subTarifInputs.get(targetId);
        body = { tarif, id_subkegiatan: targetId, id_kegiatan: null };
      }

      switch (actionType) {
        case 'CREATE':
          method = 'POST';
          url = `${API_URL}/api/honorarium`;
          break;
        case 'UPDATE':
          method = 'PUT';
          url = `${API_URL}/api/honorarium/${honorId}`;
          break;
        case 'DELETE':
          method = 'DELETE';
          url = `${API_URL}/api/honorarium/${honorId}`;
          body = undefined; // Hapus tidak perlu body
          break;
        default:
          return;
      }

      await axios({ method, url, data: body, ...config });
      showSuccess(`Honorarium berhasil di-${actionType.toLowerCase()}.`);
      fetchData(); // Muat ulang data
    } catch (err) {
      showError(err.response?.data?.error || `Gagal ${actionType.toLowerCase()} honorarium`);
    }
  };

  if (loading) return <div className="bg-white shadow rounded-lg p-6 text-center">Memuat data honorarium...</div>;

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-xl font-semibold mb-4">Kelola Honorarium</h2>
      {error && <div className="text-red-600 mb-4 text-sm">Error: {error}</div>}
      {success && <div className="text-green-600 mb-4 text-sm">{success}</div>}

      <div className="space-y-6">
        {/* 1. Honorarium Kegiatan Utama */}
        {kegiatan && (
          <div className="p-4 border rounded-md">
            <h3 className="font-medium text-gray-800 mb-2">Kegiatan Utama: {kegiatan.nama_kegiatan}</h3>
            <div className="flex items-center gap-2">
              <label htmlFor="main_tarif" className="text-sm font-medium text-gray-700">Tarif (Rp):</label>
              <input
                type="number"
                id="main_tarif"
                value={mainTarifInput}
                onChange={(e) => setMainTarifInput(e.target.valueAsNumber || 0)}
                className="block w-full max-w-xs px-3 py-1 border border-gray-300 rounded-md shadow-sm text-sm"
              />
            </div>
            <div className="flex items-center gap-2 mt-2">
              {mainHonor ? (
                <>
                  <button
                    onClick={() => handleAction('UPDATE', kegiatan.id, 'kegiatan', mainHonor.id_honorarium)}
                    className="px-3 py-1 text-sm text-white bg-green-600 rounded hover:bg-green-700"
                  >
                    Update
                  </button>
                  <button
                    onClick={() => handleAction('DELETE', kegiatan.id, 'kegiatan', mainHonor.id_honorarium)}
                    className="px-3 py-1 text-sm text-red-600 hover:underline"
                  >
                    Hapus
                  </button>
                </>
              ) : (
                <button
                  onClick={() => handleAction('CREATE', kegiatan.id, 'kegiatan')}
                  className="px-3 py-1 text-sm text-white bg-indigo-600 rounded hover:bg-indigo-700"
                >
                  Simpan Baru
                </button>
              )}
            </div>
          </div>
        )}

        {/* 2. Honorarium Sub Kegiatan */}
        {subKegiatans.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-medium text-gray-800">Sub Kegiatan:</h3>
            {subKegiatans.map(sub => {
              const subHonor = subHonorsMap.get(sub.id);
              return (
                <div key={sub.id} className="p-3 border rounded-md bg-gray-50">
                  <p className="text-sm font-medium text-gray-700 mb-1">{sub.nama_sub_kegiatan} (ID: {sub.id})</p>
                  <div className="flex items-center gap-2">
                    <label htmlFor={`sub_tarif_${sub.id}`} className="text-sm">Tarif (Rp):</label>
                    <input
                      type="number"
                      id={`sub_tarif_${sub.id}`}
                      value={subTarifInputs.get(sub.id) || 0}
                      onChange={(e) => setSubTarifInputs(prev => new Map(prev).set(sub.id, e.target.valueAsNumber || 0))}
                      className="block w-full max-w-xs px-3 py-1 border border-gray-300 rounded-md shadow-sm text-sm"
                    />
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    {subHonor ? (
                      <>
                        <button
                          onClick={() => handleAction('UPDATE', sub.id, 'subkegiatan', subHonor.id_honorarium)}
                          className="px-3 py-1 text-xs text-white bg-green-600 rounded hover:bg-green-700"
                        >
                          Update
                        </button>
                        <button
                          onClick={() => handleAction('DELETE', sub.id, 'subkegiatan', subHonor.id_honorarium)}
                          className="px-3 py-1 text-xs text-red-600 hover:underline"
                        >
                          Hapus
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => handleAction('CREATE', sub.id, 'subkegiatan')}
                        className="px-3 py-1 text-xs text-white bg-indigo-600 rounded hover:bg-indigo-700"
                      >
                        Simpan Baru
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default PartManageHonor;