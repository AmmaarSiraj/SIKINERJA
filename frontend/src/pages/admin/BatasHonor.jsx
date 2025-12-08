import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { FaSave, FaTrash, FaCog, FaCalendarAlt, FaMoneyBillWave } from 'react-icons/fa';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const BatasHonor = () => {
  const [rules, setRules] = useState([]);
  const [newRule, setNewRule] = useState({ tahun: new Date().getFullYear(), batas_honor: '' });
  const [loading, setLoading] = useState(false);

  // Fetch Data
  const fetchRules = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/api/aturan-periode`);
      setRules(res.data);
    } catch (err) {
      console.error(err);
      Swal.fire("Gagal", "Gagal memuat data aturan.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRules();
  }, []);

  // Simpan Aturan Baru
  const handleSaveRule = async (e) => {
    e.preventDefault();
    if (!newRule.tahun || !newRule.batas_honor) {
      return Swal.fire("Validasi Gagal", "Lengkapi data tahun dan nominal batas honor.", "warning");
    }
    if (!/^\d{4}$/.test(newRule.tahun)) {
      return Swal.fire("Validasi Gagal", "Format tahun harus 4 digit angka.", "warning");
    }

    try {
      await axios.post(`${API_URL}/api/aturan-periode`, newRule);
      setNewRule({ tahun: new Date().getFullYear(), batas_honor: '' });
      fetchRules();
      Swal.fire("Sukses", "Aturan batas honor tahunan berhasil disimpan.", "success");
    } catch (err) {
      Swal.fire("Gagal", err.response?.data?.error || "Gagal menyimpan.", "error");
    }
  };

  // Hapus Aturan
  const handleDeleteRule = async (id) => {
    const result = await Swal.fire({
      title: 'Hapus Aturan?',
      text: "Data ini akan dihapus permanen.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      confirmButtonText: 'Ya, Hapus'
    });

    if (result.isConfirmed) {
      try {
        await axios.delete(`${API_URL}/api/aturan-periode/${id}`);
        fetchRules();
        Swal.fire("Terhapus", "Data aturan berhasil dihapus.", "success");
      } catch (err) {
        Swal.fire("Gagal", "Tidak bisa menghapus aturan.", "error");
      }
    }
  };

  return (
    <div className="w-full pb-20">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <FaCog className="text-[#1A2A80]" /> Pengaturan Batas Honor
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Tentukan batas maksimal pendapatan honorarium mitra per tahun anggaran.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* KOLOM KIRI: FORM INPUT */}
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-700 mb-4 border-b pb-2">Tambah Aturan Baru</h3>
            <form onSubmit={handleSaveRule} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Tahun Anggaran</label>
                <div className="relative">
                  <FaCalendarAlt className="absolute left-3 top-3 text-gray-400" />
                  <input 
                    type="number" 
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1A2A80] outline-none font-bold text-gray-700"
                    placeholder="2025"
                    value={newRule.tahun}
                    onChange={e => setNewRule({...newRule, tahun: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Batas Maksimal (Rp)</label>
                <div className="relative">
                  <span className="absolute left-3 top-3 text-gray-400 font-bold text-xs">Rp</span>
                  <input 
                    type="number" 
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1A2A80] outline-none font-bold text-gray-700"
                    placeholder="0"
                    value={newRule.batas_honor}
                    onChange={e => setNewRule({...newRule, batas_honor: e.target.value})}
                  />
                </div>
                <p className="text-[10px] text-gray-400 mt-1">*Nominal ini akan menjadi limit akumulasi honor mitra.</p>
              </div>

              <button 
                type="submit" 
                className="w-full bg-[#1A2A80] text-white py-2.5 rounded-lg font-bold hover:bg-blue-900 transition shadow-md flex justify-center items-center gap-2"
              >
                <FaSave /> Simpan Aturan
              </button>
            </form>
          </div>
        </div>

        {/* KOLOM KANAN: TABEL DATA */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-100">
              <h3 className="font-bold text-gray-700">Daftar Aturan Periode</h3>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-white text-gray-500 border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-3 font-bold uppercase text-xs">Tahun</th>
                    <th className="px-6 py-3 font-bold uppercase text-xs">Nominal Batas</th>
                    <th className="px-6 py-3 text-right font-bold uppercase text-xs">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {loading ? (
                    <tr><td colSpan="3" className="text-center py-8 text-gray-400">Memuat data...</td></tr>
                  ) : rules.length === 0 ? (
                    <tr><td colSpan="3" className="text-center py-8 text-gray-400 italic">Belum ada aturan yang dibuat.</td></tr>
                  ) : (
                    rules.map((r) => (
                      <tr key={r.id} className="hover:bg-blue-50/30 transition">
                        <td className="px-6 py-4 font-bold text-gray-800">
                          <span className="bg-blue-100 text-[#1A2A80] px-2 py-1 rounded text-xs">
                            {r.tahun || r.periode}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-bold text-green-600 flex items-center gap-2">
                          <FaMoneyBillWave className="text-gray-300" />
                          Rp {Number(r.batas_honor).toLocaleString('id-ID')}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button 
                            onClick={() => handleDeleteRule(r.id)} 
                            className="text-red-400 hover:text-red-600 p-2 rounded hover:bg-red-50 transition"
                            title="Hapus Aturan"
                          >
                            <FaTrash />
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

      </div>
    </div>
  );
};

export default BatasHonor;