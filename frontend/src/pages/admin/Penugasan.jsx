import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const getToken = () => localStorage.getItem('token');

const Penugasan = () => {
  // Data Utama
  const [groupedPenugasan, setGroupedPenugasan] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  // State untuk Dropdown (Accordion)
  const [expandedTaskId, setExpandedTaskId] = useState(null); // ID penugasan yang sedang dibuka
  const [membersCache, setMembersCache] = useState({}); // Cache data anggota agar tidak fetch ulang terus
  const [loadingMembers, setLoadingMembers] = useState(false);

  // 1. Fetch & Group Data Penugasan
  useEffect(() => {
    const fetchPenugasan = async () => {
      setIsLoading(true);
      try {
        const token = getToken();
        const config = { headers: { Authorization: `Bearer ${token}` } };
        const response = await axios.get(`${API_URL}/api/penugasan`, config);
        
        // Grouping berdasarkan Nama Kegiatan
        const grouped = response.data.reduce((acc, item) => {
          const key = item.nama_kegiatan;
          if (!acc[key]) {
            acc[key] = [];
          }
          acc[key].push(item);
          return acc;
        }, {});

        setGroupedPenugasan(grouped);
      } catch (err) {
        console.error("Gagal load data:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPenugasan();
  }, []);

  // 2. Handle Klik Baris (Toggle Dropdown)
  const toggleRow = async (id_penugasan) => {
    // Jika baris yang sama diklik, tutup (collapse)
    if (expandedTaskId === id_penugasan) {
      setExpandedTaskId(null);
      return;
    }

    // Buka baris baru
    setExpandedTaskId(id_penugasan);

    // Cek apakah data anggota sudah ada di cache?
    if (!membersCache[id_penugasan]) {
      setLoadingMembers(true);
      try {
        const token = getToken();
        // Ambil data anggota & jabatan dari backend
        const res = await axios.get(`${API_URL}/api/penugasan/${id_penugasan}/anggota`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        // Simpan ke cache
        setMembersCache(prev => ({ ...prev, [id_penugasan]: res.data }));
      } catch (err) {
        console.error("Gagal ambil anggota:", err);
      } finally {
        setLoadingMembers(false);
      }
    }
  };

  if (isLoading) return <div className="p-8 text-center text-gray-500">Memuat data penugasan...</div>;

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Manajemen Penugasan</h1>
          <p className="text-gray-500 mt-1">Klik baris sub kegiatan untuk melihat daftar mitra yang bertugas.</p>
        </div>
        <Link
          to="/admin/penugasan/tambah" 
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-6 rounded shadow transition"
        >
          + Buat Penugasan
        </Link>
      </div>

      <div className="space-y-8">
        {Object.keys(groupedPenugasan).length === 0 ? (
          <div className="text-center py-10 bg-gray-50 rounded border border-dashed text-gray-400">
            Belum ada penugasan yang dibuat.
          </div>
        ) : (
          Object.entries(groupedPenugasan).map(([kegiatanName, subItems]) => (
            <div key={kegiatanName} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              
              {/* HEADER: KEGIATAN INDUK */}
              <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex items-center gap-3">
                <div className="bg-indigo-100 text-indigo-700 p-2 rounded-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                  </svg>
                </div>
                <h2 className="text-lg font-bold text-gray-800">{kegiatanName}</h2>
                <span className="text-xs font-medium bg-gray-200 text-gray-600 px-2 py-1 rounded-full">
                  {subItems.length} Sub Kegiatan
                </span>
              </div>

              {/* LIST SUB KEGIATAN (TABEL) */}
              <div className="divide-y divide-gray-100">
                {subItems.map((task) => {
                  const isOpen = expandedTaskId === task.id_penugasan;
                  const members = membersCache[task.id_penugasan] || [];
                  
                  return (
                    <div key={task.id_penugasan} className="group">
                      {/* BARIS UTAMA (Klik untuk Expand) */}
                      <div 
                        onClick={() => toggleRow(task.id_penugasan)}
                        className={`px-6 py-4 cursor-pointer transition flex items-center justify-between hover:bg-indigo-50 ${isOpen ? 'bg-indigo-50 border-l-4 border-indigo-500' : 'bg-white'}`}
                      >
                        <div className="flex-1">
                          <h3 className={`font-semibold text-sm ${isOpen ? 'text-indigo-700' : 'text-gray-800'}`}>
                            {task.nama_sub_kegiatan}
                          </h3>
                          <div className="text-xs text-gray-500 mt-1 flex gap-4">
                            <span>👤 Pengawas: {task.nama_pengawas}</span>
                            <span>📊 Kapasitas: {task.jumlah_max_mitra} Orang</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                           {/* Indikator Jumlah Anggota (jika sudah di-load) */}
                           {membersCache[task.id_penugasan] && (
                             <span className="text-xs font-medium text-gray-500 bg-white border px-2 py-1 rounded">
                               {members.length} Anggota
                             </span>
                           )}
                           
                           {/* Ikon Panah */}
                           <svg 
                             className={`w-5 h-5 text-gray-400 transform transition-transform duration-200 ${isOpen ? 'rotate-180 text-indigo-600' : ''}`} 
                             fill="none" viewBox="0 0 24 24" stroke="currentColor"
                           >
                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                           </svg>
                        </div>
                      </div>

                      {/* AREA DROPDOWN (Daftar Mitra) */}
                      {isOpen && (
                        <div className="bg-gray-50 px-6 py-4 border-t border-gray-100 shadow-inner animate-fade-in-down">
                          {loadingMembers && !membersCache[task.id_penugasan] ? (
                            <div className="text-center text-sm text-gray-500 py-2">Memuat anggota...</div>
                          ) : (
                            <>
                              {members.length === 0 ? (
                                <div className="text-center py-4">
                                  <p className="text-sm text-gray-500 italic mb-2">Belum ada mitra yang ditugaskan.</p>
                                  <Link 
                                    to={`/admin/penugasan/detail/${task.id_penugasan}`}
                                    className="text-xs font-bold text-indigo-600 hover:underline"
                                  >
                                    + Kelola Anggota
                                  </Link>
                                </div>
                              ) : (
                                <div className="overflow-x-auto">
                                  <table className="w-full text-left text-sm">
                                    <thead className="text-xs text-gray-400 uppercase border-b border-gray-200">
                                      <tr>
                                        <th className="pb-2 font-medium">Nama Mitra</th>
                                        <th className="pb-2 font-medium">Jabatan</th>
                                        <th className="pb-2 font-medium">Kontak</th>
                                        <th className="pb-2 text-right">Detail</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                      {members.map((m) => (
                                        <tr key={m.id_mitra}>
                                          <td className="py-2 pr-4 font-medium text-gray-800">
                                            {m.nama_lengkap}
                                            <span className="block text-[10px] text-gray-400 font-mono">{m.nik}</span>
                                          </td>
                                          <td className="py-2 pr-4">
                                            <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                                              m.nama_jabatan === 'Belum ditentukan' 
                                                ? 'bg-gray-200 text-gray-500' 
                                                : 'bg-green-100 text-green-700'
                                            }`}>
                                              {m.nama_jabatan}
                                            </span>
                                          </td>
                                          <td className="py-2 pr-4 text-gray-600 text-xs">
                                            {m.no_hp}
                                          </td>
                                          <td className="py-2 text-right">
                                             <Link 
                                               to={`/admin/mitra/${m.id_mitra}`}
                                               className="text-indigo-600 hover:text-indigo-800 text-xs font-semibold"
                                             >
                                               Lihat
                                             </Link>
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                  
                                  <div className="mt-3 text-right">
                                    <Link 
                                      to={`/admin/penugasan/detail/${task.id_penugasan}`}
                                      className="text-xs font-bold text-indigo-600 hover:underline bg-white border border-indigo-200 px-3 py-1 rounded hover:bg-indigo-50"
                                    >
                                      ⚙ Kelola Tim Ini
                                    </Link>
                                  </div>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Penugasan;