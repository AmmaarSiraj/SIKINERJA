import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const ManageKegiatan = () => {
  const [kegiatan, setKegiatan] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // State untuk Dropdown
  const [expandedRow, setExpandedRow] = useState(null); 
  const [subKegiatanMap, setSubKegiatanMap] = useState({}); 
  const [loadingSub, setLoadingSub] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchKegiatan = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token'); 
        if (!token) throw new Error('No auth token found. Please login.');

        const response = await axios.get(`${API_URL}/api/kegiatan`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        setKegiatan(response.data);
        setError(null);
      } catch (err) {
        setError(err.response?.data?.message || err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchKegiatan();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus Survei/Sensus ini?')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/api/kegiatan/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setKegiatan(prev => prev.filter(item => item.id !== id));
      
      // Hapus dari cache subkegiatan
      const newSubMap = { ...subKegiatanMap };
      delete newSubMap[id];
      setSubKegiatanMap(newSubMap);
      
      alert('Survei/Sensus berhasil dihapus');
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    }
  };

  const handleRowClick = async (id) => {
    if (expandedRow === id) {
      setExpandedRow(null);
      return;
    }

    setExpandedRow(id);

    if (!subKegiatanMap[id]) {
      setLoadingSub(true);
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`${API_URL}/api/subkegiatan/kegiatan/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        setSubKegiatanMap(prev => ({ ...prev, [id]: res.data }));
      } catch (err) {
        console.error("Gagal ambil sub kegiatan:", err);
      } finally {
        setLoadingSub(false);
      }
    }
  };

  // Handler Navigasi ke Detail Sub Kegiatan
  const handleSubRowClick = (e, subId) => {
    e.stopPropagation(); 
    // Ini akan mengirim ID seperti 'sub1', 'sub2' yang benar
    navigate(`/admin/manage-kegiatan/detail/${subId}`);
  };

  if (loading) return <div className="p-8 text-center">Memuat data Survei/Sensus...</div>;
  if (error) return <div className="p-8 text-center text-red-600">Error: {error}</div>;

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Manajemen Survei/Sensus</h1>
        <Link
          to="/admin/manage-kegiatan/tambah"
          className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
        >
          + Tambah Survei/Sensus
        </Link>
      </div>

      <div className="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg bg-white">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama Survei/Sensus</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tahun</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Periode</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {kegiatan.length > 0 ? (
              kegiatan.map((item) => (
                <React.Fragment key={item.id}>
                  
                  {/* BARIS UTAMA (Induk) */}
                  <tr 
                    onClick={() => handleRowClick(item.id)}
                    className={`cursor-pointer transition ${expandedRow === item.id ? 'bg-indigo-50' : 'hover:bg-gray-50'}`}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <span className={`mr-2 transform transition-transform ${expandedRow === item.id ? 'rotate-90' : ''}`}>
                          ▶
                        </span>
                        <div>
                          <div className="text-sm font-bold text-gray-900">{item.nama_kegiatan}</div>
                          <div className="text-xs text-gray-500 truncate max-w-xs">{item.deskripsi}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {item.tahun_anggaran}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {new Date(item.tanggal_mulai).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} - 
                      {new Date(item.tanggal_selesai).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                      {/* LINK DETAIL LAMA DIHAPUS DI SINI AGAR TIDAK ERROR 404 */}
                      <Link
                        to={`/admin/manage-kegiatan/edit/${item.id}`}
                        className="text-indigo-600 hover:text-indigo-900"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Edit
                      </Link>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(item.id);
                        }}
                        className="text-red-600 hover:text-red-900"
                      >
                        Hapus
                      </button>
                    </td>
                  </tr>

                  {/* BARIS DROPDOWN (Anak/Sub) */}
                  {expandedRow === item.id && (
                    <tr className="bg-gray-50 shadow-inner">
                      <td colSpan="4" className="px-6 py-4">
                        <div className="pl-6 border-l-4 border-indigo-400">
                          <h3 className="text-sm font-bold text-gray-700 mb-3">
                            Rincian Tahapan (Klik untuk Detail)
                          </h3>

                          {loadingSub && !subKegiatanMap[item.id] ? (
                            <div className="text-sm text-gray-500 italic">Memuat sub kegiatan...</div>
                          ) : (
                            <>
                              {subKegiatanMap[item.id] && subKegiatanMap[item.id].length > 0 ? (
                                <div className="overflow-x-auto">
                                  <table className="min-w-full bg-white border border-gray-200 rounded-md text-sm">
                                    <tbody className="divide-y divide-gray-100">
                                      {subKegiatanMap[item.id].map((sub) => (
                                        <tr 
                                          key={sub.id}
                                          onClick={(e) => handleSubRowClick(e, sub.id)}
                                          className="cursor-pointer hover:bg-blue-100 transition duration-150"
                                          title={`Lihat detail ${sub.nama_sub_kegiatan}`}
                                        >
                                          <td className="px-4 py-2 font-medium text-indigo-700 hover:underline">
                                            {sub.nama_sub_kegiatan}
                                          </td>
                                          <td className="px-4 py-2 text-gray-500">{sub.deskripsi || '-'}</td>
                                          <td className="px-4 py-2 text-center">
                                            <span className={`px-2 py-0.5 rounded text-xs font-semibold ${sub.status === 'done' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                              {sub.status}
                                            </span>
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              ) : (
                                <p className="text-sm text-gray-500 italic">
                                  Tidak ada sub kegiatan. 
                                  <Link to={`/admin/manage-kegiatan/edit/${item.id}`} className="ml-2 text-indigo-600 hover:underline">
                                    + Tambah di Edit
                                  </Link>
                                </p>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}

                </React.Fragment>
              ))
            ) : (
              <tr>
                <td colSpan="4" className="px-6 py-4 text-center text-sm text-gray-500">
                  Belum ada data Survei/Sensus.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ManageKegiatan;