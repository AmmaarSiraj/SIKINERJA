// src/components/admin/spk/ModalSPKSetting.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { FaSave, FaTimes, FaInfoCircle } from 'react-icons/fa';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const ModalSPKSetting = ({ isOpen, onClose, periode, onSuccess }) => {
  const [formData, setFormData] = useState({
    nama_ppk: '',
    nip_ppk: '',
    jabatan_ppk: 'Pejabat Pembuat Komitmen',
    tanggal_surat: '',
    nomor_surat_format: '000/33730/SPK.MITRA/MM/YYYY',
    komponen_honor: 'biaya pajak, bea materai, dan jasa pelayanan keuangan' // Default 2025
  });
  const [loading, setLoading] = useState(false);

  // Ambil data setting saat modal dibuka
  useEffect(() => {
    if (isOpen && periode) {
      const fetchSetting = async () => {
        try {
          const res = await axios.get(`${API_URL}/api/spk/setting/${periode}`);
          if (res.data) {
            // Format tanggal agar masuk ke input date (YYYY-MM-DD)
            const formattedDate = res.data.tanggal_surat ? res.data.tanggal_surat.split('T')[0] : '';
            setFormData({ ...res.data, tanggal_surat: formattedDate });
          }
        } catch (err) {
          console.error("Gagal ambil setting:", err);
        }
      };
      fetchSetting();
    }
  }, [isOpen, periode]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post(`${API_URL}/api/spk/setting`, {
        ...formData,
        periode // Pastikan periode ikut dikirim
      });
      Swal.fire('Tersimpan', 'Pengaturan surat untuk periode ini berhasil disimpan.', 'success');
      onSuccess(); // Refresh data di parent
      onClose();
    } catch (err) {
      Swal.fire('Gagal', 'Terjadi kesalahan saat menyimpan.', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in-up">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header Modal */}
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <div>
            <h3 className="font-bold text-gray-800 text-lg">Pengaturan Template Surat</h3>
            <p className="text-xs text-gray-500">Periode: <span className="font-mono font-bold text-[#1A2A80]">{periode}</span></p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-red-500 transition">
            <FaTimes size={20} />
          </button>
        </div>

        {/* Body Form (Scrollable) */}
        <div className="p-6 overflow-y-auto">
          <form id="form-spk" onSubmit={handleSubmit} className="space-y-5">
            
            {/* Bagian 1: Pejabat Penandatangan */}
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                <h4 className="text-xs font-bold text-blue-800 uppercase mb-3 flex items-center gap-2">
                    <FaInfoCircle /> Pihak Pertama (PPK)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-600 mb-1">Nama Lengkap & Gelar</label>
                        <input type="text" name="nama_ppk" value={formData.nama_ppk} onChange={handleChange} required 
                            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="Contoh: Ninik Sri L, S.ST, M.Si" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-600 mb-1">NIP</label>
                        <input type="text" name="nip_ppk" value={formData.nip_ppk} onChange={handleChange} 
                            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="19xxxxxxxx..." />
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-xs font-bold text-gray-600 mb-1">Jabatan</label>
                        <input type="text" name="jabatan_ppk" value={formData.jabatan_ppk} onChange={handleChange} required
                            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                    </div>
                </div>
            </div>

            {/* Bagian 2: Detail Surat */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">Tanggal Surat</label>
                    <input type="date" name="tanggal_surat" value={formData.tanggal_surat} onChange={handleChange} required
                        className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">Format Nomor Surat</label>
                    <input type="text" name="nomor_surat_format" value={formData.nomor_surat_format} onChange={handleChange}
                        className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                        placeholder=".../SPK.MITRA/..." />
                </div>
            </div>

            {/* Bagian 3: Komponen Honor (Pasal 5) */}
            <div>
                <label className="block text-xs font-bold text-gray-600 mb-1 flex justify-between">
                    <span>Rincian Komponen Honor (Pasal 5)</span>
                    <span className="text-[10px] text-gray-400 font-normal italic">Sesuaikan dengan kebijakan tahun ini</span>
                </label>
                <textarea 
                    name="komponen_honor" 
                    value={formData.komponen_honor} 
                    onChange={handleChange}
                    rows="3"
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Contoh: biaya pajak, bea materai, dan jasa pelayanan keuangan"
                ></textarea>
                <p className="text-[10px] text-gray-500 mt-1">
                    *Teks ini akan muncul setelah kalimat "...termasuk..." pada Pasal 5.
                </p>
            </div>

          </form>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
            <button onClick={onClose} type="button" className="px-5 py-2.5 rounded-lg border border-gray-300 text-gray-600 text-sm font-bold hover:bg-gray-100 transition">
                Batal
            </button>
            <button form="form-spk" type="submit" disabled={loading} className="px-6 py-2.5 rounded-lg bg-[#1A2A80] text-white text-sm font-bold hover:bg-blue-900 transition flex items-center gap-2 shadow-lg disabled:opacity-50">
                {loading ? 'Menyimpan...' : <><FaSave /> Simpan Pengaturan</>}
            </button>
        </div>

      </div>
    </div>
  );
};

export default ModalSPKSetting;