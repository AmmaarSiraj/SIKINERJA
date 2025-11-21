import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom'; // Hapus Link jika tidak dipakai di tombol
import * as XLSX from 'xlsx'; 

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const ManajemenMitra = () => {
  const [mitraList, setMitraList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null); 
  const navigate = useNavigate(); // Hook navigasi

  // Fetch data (Kode sama seperti sebelumnya)
  const fetchMitra = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/mitra`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMitraList(response.data);
    } catch (err) {
      console.error("Gagal memuat data:", err);
      setError("Gagal memuat data mitra.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMitra();
  }, []);

  // ... (Fungsi Export, Import, HandleFileChange TETAP SAMA, salin dari kode sebelumnya) ...
  const handleExport = () => { /* ...kode export... */ 
    const dataToExport = mitraList.map(m => ({
      "Nama Lengkap": m.nama_lengkap, "NIK": m.nik, "Alamat": m.alamat,
      "No HP": m.no_hp, "Email": m.email, "Bank": m.nama_bank,
      "No Rekening": m.no_rekening, "Batas Honor": m.batas_honor_bulanan
    }));
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Data Mitra");
    XLSX.writeFile(workbook, "Data_Mitra_Sikinerja.xlsx");
  };

  const handleImportClick = () => fileInputRef.current.click();

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    setUploading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_URL}/api/mitra/import`, formData, {
        headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${token}` }
      });
      alert('Import Berhasil!'); fetchMitra(); 
    } catch (err) { alert('Gagal import'); } 
    finally { setUploading(false); e.target.value = null; }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation(); // PENTING: Agar klik tombol hapus tidak memicu klik baris (detail)
    if (!window.confirm("Yakin hapus mitra ini?")) return;
    try {
        const token = localStorage.getItem('token');
        await axios.delete(`${API_URL}/api/mitra/${id}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        setMitraList(prev => prev.filter(m => m.id !== id));
    } catch (err) { alert("Gagal menghapus mitra."); }
  };

  // --- NAVIGASI KE DETAIL ---
  const handleRowClick = (id) => {
    navigate(`/admin/mitra/${id}`);
  };

  if (loading) return <div className="p-8 text-center">Memuat data...</div>;

  return (
    <div className="p-8">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold text-gray-800">Manajemen Mitra</h1>
        <div className="flex gap-2">
          <button onClick={handleExport} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded text-sm transition">📥 Export Excel</button>
          <button onClick={handleImportClick} disabled={uploading} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm transition disabled:bg-gray-400">
            {uploading ? 'Mengupload...' : '📤 Import Excel'}
          </button>
          <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".xlsx, .xls" className="hidden" />
        </div>
      </div>
      
      {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</div>}

      <div className="bg-white shadow overflow-hidden sm:rounded-lg border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nama Lengkap</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">NIK</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kontak</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nama Bank</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">No. Rekening</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Aksi</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {mitraList.length === 0 ? (
                <tr><td colSpan="6" className="px-6 py-10 text-center text-gray-500 italic">Belum ada data mitra.</td></tr>
            ) : (
                mitraList.map((mitra) => (
                <tr 
                    key={mitra.id} 
                    onClick={() => handleRowClick(mitra.id)} // <--- TAMBAHKAN INI
                    className="hover:bg-blue-50 transition cursor-pointer" // Tambahkan cursor-pointer
                >
                    <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{mitra.nama_lengkap}</div>
                        <div className="text-xs text-gray-500">{mitra.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">{mitra.nik}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{mitra.no_hp}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">{mitra.nama_bank}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono bg-gray-50 rounded">
                        {mitra.no_rekening}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button 
                            onClick={(e) => handleDelete(mitra.id, e)} // Pass 'e' untuk stopPropagation
                            className="text-red-600 hover:text-red-900 z-10 relative"
                        >
                            Hapus
                        </button>
                    </td>
                </tr>
                ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ManajemenMitra;