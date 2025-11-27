import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom'; 
import * as XLSX from 'xlsx'; 
import Swal from 'sweetalert2';
// 1. IMPORT ICON
import { 
  FaDownload, 
  FaFileUpload, 
  FaTrash, 
  FaChevronRight,
  FaUserTie 
} from 'react-icons/fa';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const ManajemenMitra = () => {
  const [mitraList, setMitraList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null); 
  const navigate = useNavigate(); 

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

  const handleExport = () => { 
    const dataToExport = mitraList.map(m => ({
      "Nama Lengkap": m.nama_lengkap, "NIK": m.nik, "Alamat": m.alamat,
      "No HP": m.no_hp, "Email": m.email, "Bank": m.nama_bank,
      "No Rekening": m.no_rekening, "Batas Honor": m.batas_honor_bulanan
    }));
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Data Mitra");
    XLSX.writeFile(workbook, "Data_Mitra_Sikinerja.xlsx");
    
    Swal.fire({
      icon: 'success',
      title: 'Export Berhasil',
      text: 'File Excel sedang diunduh...',
      timer: 2000,
      showConfirmButton: false
    });
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
      const response = await axios.post(`${API_URL}/api/mitra/import`, formData, {
        headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${token}` }
      });
      
      const { message, details } = response.data; // Sesuaikan dengan respon backend importMitra

      // Parsing pesan dari backend untuk ditampilkan lebih rapi
      // Asumsi message format: "Proses Selesai. Sukses: X, Gagal: Y, Skip: Z"
      let iconType = 'success';
      if (message.includes('Gagal: 0') === false) iconType = 'warning';

      let htmlMsg = `<p>${message}</p>`;
      if (details && details.length > 0) {
         htmlMsg += `<div style="text-align:left; font-size:12px; max-height:150px; overflow-y:auto; background:#f9f9f9; padding:10px; margin-top:10px; border:1px solid #eee;">
            <strong>Detail Error:</strong><br/>
            ${details.map(err => `• ${err}`).join('<br/>')}
         </div>`;
      }

      Swal.fire({
        title: 'Import Selesai',
        html: htmlMsg,
        icon: iconType
      });

      fetchMitra(); 
    } catch (err) { 
      Swal.fire('Gagal', err.response?.data?.message || 'Terjadi kesalahan saat import.', 'error');
    } finally { 
      setUploading(false); 
      e.target.value = null; 
    }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation(); 
    
    const result = await Swal.fire({
      title: 'Yakin hapus mitra ini?',
      text: "Data mitra beserta riwayatnya akan dihapus permanen!",
      icon: 'warning',
      showCancelButton: true,
      reverseButtons: true, // Tombol hapus di kanan
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Ya, Hapus!',
      cancelButtonText: 'Batal'
    });

    if (result.isConfirmed) {
      try {
          const token = localStorage.getItem('token');
          await axios.delete(`${API_URL}/api/mitra/${id}`, {
              headers: { Authorization: `Bearer ${token}` }
          });
          setMitraList(prev => prev.filter(m => m.id !== id));
          
          Swal.fire(
            'Terhapus!',
            'Data mitra berhasil dihapus.',
            'success'
          );
      } catch (err) { 
          Swal.fire(
            'Gagal!',
            'Gagal menghapus mitra. Mungkin ada data terkait.',
            'error'
          );
      }
    }
  };

  const handleRowClick = (id) => {
    navigate(`/admin/mitra/${id}`);
  };

  if (loading) return <div className="text-center py-10 text-gray-500">Memuat data...</div>;

  return (
    <div className="w-full">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <div className="text-gray-500 text-sm">
            Database seluruh mitra statistik yang terdaftar.
        </div>

        <div className="flex gap-2">
          <button 
            onClick={handleExport} 
            className="flex items-center gap-2 bg-white hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium border border-gray-200 transition shadow-sm"
          >
            <FaDownload /> Export Excel
          </button>
          <button 
            onClick={handleImportClick} 
            disabled={uploading} 
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-bold transition shadow-sm disabled:opacity-50"
          >
            <FaFileUpload /> {uploading ? '...' : 'Import Excel'}
          </button>
          <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".xlsx, .xls" className="hidden" />
        </div>
      </div>
      
      {error && <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6 border border-red-100">{error}</div>}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Nama Lengkap</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">NIK</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Kontak</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Bank</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Rekening</th>
              <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Aksi</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {mitraList.length === 0 ? (
                <tr><td colSpan="6" className="px-6 py-12 text-center text-gray-400 italic">Belum ada data mitra.</td></tr>
            ) : (
                mitraList.map((mitra) => (
                <tr 
                    key={mitra.id} 
                    onClick={() => handleRowClick(mitra.id)} 
                    className="hover:bg-blue-50/50 cursor-pointer transition-colors group"
                >
                    <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-50 text-[#1A2A80] rounded-full">
                                <FaUserTie />
                            </div>
                            <div>
                                <div className="text-sm font-bold text-gray-900 group-hover:text-[#1A2A80] transition-colors">
                                    {mitra.nama_lengkap}
                                </div>
                                <div className="text-xs text-gray-500">{mitra.email}</div>
                            </div>
                        </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500 font-mono bg-gray-50/50 rounded px-2">
                        {mitra.nik}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {mitra.no_hp}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                        {mitra.nama_bank}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                        {mitra.no_rekening}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                            <span className="text-gray-300 group-hover:text-[#1A2A80] transition-colors mr-2">
                                <FaChevronRight size={12} />
                            </span>
                            <button 
                                onClick={(e) => handleDelete(mitra.id, e)} 
                                className="text-red-400 hover:text-red-600 p-2 rounded-full hover:bg-red-50 transition z-10 relative"
                                title="Hapus Mitra"
                            >
                                <FaTrash />
                            </button>
                        </div>
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