// src/pages/admin/ManajemenSPK.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaFolder, FaChevronRight, FaFileContract } from 'react-icons/fa';
import PartSPKPeriodView from '../../components/admin/spk/PartSPKPeriodView';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const ManajemenSPK = () => {
  const [periods, setPeriods] = useState([]);
  const [selectedPeriod, setSelectedPeriod] = useState(null);
  const [loading, setLoading] = useState(true);

  // 1. Fetch Daftar Periode
  useEffect(() => {
    const fetchPeriods = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${API_URL}/api/spk/periods`);
        setPeriods(res.data);
      } catch (err) {
        console.error("Gagal load periode:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchPeriods();
  }, []);

  const formatPeriodeLabel = (p) => {
    if (!p) return '-';
    const [y, m] = p.split('-');
    const date = new Date(y, m - 1);
    return date.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
  };

  // 2. Jika ada periode dipilih, tampilkan Detail View
  if (selectedPeriod) {
    return <PartSPKPeriodView periode={selectedPeriod} onBack={() => setSelectedPeriod(null)} />;
  }

  // 3. Tampilan Utama: Daftar Folder Periode
  return (
    <div className="w-full pb-20">
      
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Manajemen Surat Perjanjian Kerja (SPK)</h1>
        <p className="text-sm text-gray-500 mt-1">Pilih periode kegiatan untuk mengelola dan mencetak SPK Mitra.</p>
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-400">Memuat periode...</div>
      ) : periods.length === 0 ? (
        <div className="text-center py-20 bg-gray-50 rounded-xl border border-dashed border-gray-300">
            <FaFileContract className="mx-auto text-4xl text-gray-300 mb-3" />
            <p className="text-gray-500">Belum ada periode kegiatan yang tersedia.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {periods.map((item) => (
                <div 
                    key={item.periode}
                    onClick={() => setSelectedPeriod(item.periode)}
                    className="group bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer relative overflow-hidden"
                >
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition">
                        <FaFolder className="text-6xl text-[#1A2A80]" />
                    </div>
                    
                    <div className="flex items-center justify-between relative z-10">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-blue-50 text-[#1A2A80] rounded-lg group-hover:bg-[#1A2A80] group-hover:text-white transition-colors">
                                <FaFileContract size={24} />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-800 group-hover:text-[#1A2A80] transition">{formatPeriodeLabel(item.periode)}</h3>
                                <p className="text-xs text-gray-500 font-mono">{item.periode}</p>
                            </div>
                        </div>
                        <FaChevronRight className="text-gray-300 group-hover:text-[#1A2A80] transition" />
                    </div>
                </div>
            ))}
        </div>
      )}
    </div>
  );
};

export default ManajemenSPK;