// src/pages/admin/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
// 1. IMPORT ICON
import { 
  FaUserClock, 
  FaChartLine, 
  FaUsers, 
  FaPlus,
  FaHandshake,
  FaFileAlt,
  FaUserCog,
  FaChevronRight
} from 'react-icons/fa';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const AdminDashboard = () => {
  // State Statistik
  const [stats, setStats] = useState({
    pendingMitra: 0,
    activeKegiatan: 0,
    totalMitra: 0,
    totalKegiatan: 0
  });

  // State Data Mitra Aktif
  const [activeMitraList, setActiveMitraList] = useState([]);
  const [loading, setLoading] = useState(true);

  // State untuk Accordion
  const [expandedRowId, setExpandedRowId] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        const headers = { Authorization: `Bearer ${token}` };

        const [resPengajuan, resKegiatan, resMitra, resPenugasan, resKelompok] = await Promise.all([
          axios.get(`${API_URL}/api/pengajuan-mitra`, { headers }),
          axios.get(`${API_URL}/api/kegiatan`, { headers }),
          axios.get(`${API_URL}/api/mitra`, { headers }),
          axios.get(`${API_URL}/api/penugasan`, { headers }),
          axios.get(`${API_URL}/api/kelompok-penugasan`, { headers })
        ]);

        // Hitung Statistik
        const pendingCount = resPengajuan.data.filter(p => p.status === 'pending').length;
        
        const today = new Date();
        const currentYear = today.getFullYear();

        const activeKegiatanCount = resKegiatan.data.filter(k => {
            const start = new Date(k.tanggal_mulai);
            const end = new Date(k.tanggal_selesai);
            return today >= start && today <= end;
        }).length;

        setStats({
          pendingMitra: pendingCount,
          activeKegiatan: activeKegiatanCount,
          totalMitra: resMitra.data.length,
          totalKegiatan: resKegiatan.data.length
        });

        // Logika Mitra Aktif
        const activePenugasanIds = new Set();
        const penugasanMap = {}; 

        resPenugasan.data.forEach(task => {
            const start = new Date(task.tanggal_mulai);
            const end = new Date(task.tanggal_selesai);
            
            if (start.getFullYear() === currentYear || end.getFullYear() === currentYear) {
                activePenugasanIds.add(task.id_penugasan);
                penugasanMap[task.id_penugasan] = {
                    nama_sub_kegiatan: task.nama_sub_kegiatan,
                    tanggal: `${start.toLocaleDateString('id-ID')} - ${end.toLocaleDateString('id-ID')}`,
                    role_pengawas: task.nama_pengawas
                };
            }
        });

        const mitraActivityMap = {};

        resKelompok.data.forEach(kelompok => {
            if (activePenugasanIds.has(kelompok.id_penugasan)) {
                const mitraId = kelompok.id_mitra;
                
                if (!mitraActivityMap[mitraId]) {
                    mitraActivityMap[mitraId] = {
                        id: mitraId,
                        nama_mitra: kelompok.nama_mitra, 
                        kegiatan: []
                    };
                }
                
                if (penugasanMap[kelompok.id_penugasan]) {
                    mitraActivityMap[mitraId].kegiatan.push(penugasanMap[kelompok.id_penugasan]);
                }
            }
        });

        const mitraList = Object.values(mitraActivityMap);
        
        if (mitraList.length > 0 && !mitraList[0].nama_mitra) {
             const mitraDbMap = {};
             resMitra.data.forEach(m => mitraDbMap[m.id] = m.nama_lengkap);
             mitraList.forEach(m => m.nama_mitra = mitraDbMap[m.id] || 'Unknown Mitra');
        }

        setActiveMitraList(mitraList);

      } catch (err) {
        console.error("Gagal memuat dashboard:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const toggleRow = (id) => {
    if (expandedRowId === id) {
        setExpandedRowId(null); 
    } else {
        setExpandedRowId(id); 
    }
  };

  if (loading) return <div className="text-center py-10 text-gray-500">Memuat Dashboard...</div>;

  return (
    <div className="w-full">
      <p className="text-gray-500 mb-6">Ringkasan aktivitas SIKINERJA tahun {new Date().getFullYear()}.</p>

      {/* === BAGIAN 1: STATS CARDS === */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        
        {/* Card 1: Pengajuan Pending */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-1 h-full bg-yellow-400"></div>
          <div className="flex justify-between items-start">
            <div>
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Verifikasi Mitra</h3>
                <div className="mt-3 flex items-center gap-2">
                    <p className="text-3xl font-extrabold text-gray-800">{stats.pendingMitra}</p>
                    <span className="text-yellow-700 bg-yellow-50 px-2 py-1 rounded text-xs font-bold">Pending</span>
                </div>
            </div>
            <div className="p-3 bg-yellow-50 rounded-full text-yellow-600">
                <FaUserClock size={20} />
            </div>
          </div>
        </div>

        {/* Card 2: Kegiatan Aktif */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-1 h-full bg-green-500"></div>
          <div className="flex justify-between items-start">
            <div>
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Kegiatan Berjalan</h3>
                <div className="mt-3 flex items-center gap-2">
                    <p className="text-3xl font-extrabold text-gray-800">{stats.activeKegiatan}</p>
                    <span className="text-green-700 bg-green-50 px-2 py-1 rounded text-xs font-bold">Aktif</span>
                </div>
            </div>
            <div className="p-3 bg-green-50 rounded-full text-green-600">
                <FaChartLine size={20} />
            </div>
          </div>
        </div>

        {/* Card 3: Total Mitra */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-1 h-full bg-[#1A2A80]"></div>
          <div className="flex justify-between items-start">
            <div>
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Mitra</h3>
                <div className="mt-3">
                    <p className="text-3xl font-extrabold text-gray-800">{stats.totalMitra}</p>
                </div>
            </div>
            <div className="p-3 bg-blue-50 rounded-full text-[#1A2A80]">
                <FaUsers size={20} />
            </div>
          </div>
        </div>

         {/* Card 4: Shortcut */}
         <div className="bg-[#1A2A80] p-6 rounded-xl shadow-lg text-white flex flex-col justify-center items-center text-center transform hover:scale-[1.02] transition-transform relative overflow-hidden">
            {/* Dekorasi Icon Besar Transparan */}
            <FaPlus className="absolute -right-4 -bottom-4 text-white opacity-10 text-8xl" />
            
            <h3 className="font-bold mb-3 text-lg relative z-10">Buat Kegiatan Baru?</h3>
            <Link to="/admin/manage-kegiatan/tambah" className="px-5 py-2 bg-white text-[#1A2A80] rounded-full text-sm font-bold hover:bg-blue-50 transition shadow-sm relative z-10 flex items-center gap-2">
                <FaPlus size={12} /> Tambah Sekarang
            </Link>
        </div>
      </div>

      {/* === BAGIAN 2: KONTEN UTAMA === */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* TABEL MITRA AKTIF */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
            <div>
                <h2 className="text-lg font-bold text-gray-800">Mitra Aktif Periode Ini</h2>
                <p className="text-xs text-gray-500">Klik nama untuk melihat detail pekerjaan.</p>
            </div>
            <span className="bg-green-50 text-green-700 border border-green-100 px-3 py-1 rounded-full text-xs font-bold">
                {activeMitraList.length} Orang
            </span>
          </div>
          
          <div className="flex-1 overflow-x-auto">
            {activeMitraList.length === 0 ? (
                <div className="p-10 text-center text-gray-400 italic">Belum ada mitra yang aktif bekerja tahun ini.</div>
            ) : (
                <table className="min-w-full">
                    <thead className="bg-white border-b border-gray-100">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Nama Mitra</th>
                        <th className="px-6 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Total Beban Kerja</th>
                        <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                    {activeMitraList.map((item) => {
                        const isExpanded = expandedRowId === item.id;
                        return (
                        <React.Fragment key={item.id}>
                            <tr 
                                onClick={() => toggleRow(item.id)} 
                                className={`cursor-pointer transition-colors duration-200 ${isExpanded ? 'bg-blue-50/50' : 'hover:bg-gray-50'}`}
                            >
                                <td className="px-6 py-4 text-sm font-bold text-gray-800 flex items-center gap-3">
                                    <div className={`p-1 rounded-full transition-transform duration-200 ${isExpanded ? 'rotate-90 bg-blue-100 text-[#1A2A80]' : 'text-gray-400'}`}>
                                      <FaChevronRight size={12} />
                                    </div>
                                    {item.nama_mitra}
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-[#1A2A80] border border-blue-100">
                                        {item.kegiatan.length} Kegiatan
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right text-xs text-gray-400 italic">
                                    {isExpanded ? 'Menampilkan Detail' : 'Klik untuk detail'}
                                </td>
                            </tr>

                            {isExpanded && (
                                <tr className="bg-gray-50/30 animate-fade-in-down">
                                    <td colSpan="3" className="px-6 py-4 pl-14 border-b border-gray-100">
                                        <p className="text-xs font-bold text-gray-500 uppercase mb-3 tracking-wider">Daftar Pekerjaan Saat Ini:</p>
                                        {item.kegiatan.length === 0 ? (
                                            <p className="text-sm text-gray-500 italic">Tidak ada data detail.</p>
                                        ) : (
                                            <div className="grid gap-3">
                                                {item.kegiatan.map((keg, idx) => (
                                                    <div key={idx} className="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-white p-3 rounded-lg border border-gray-200 shadow-sm hover:border-blue-200 transition-colors">
                                                        <div>
                                                            <h4 className="text-sm font-bold text-[#1A2A80]">{keg.nama_sub_kegiatan}</h4>
                                                            <p className="text-xs text-gray-500 mt-1">
                                                                <span className="font-semibold text-gray-700">Pengawas:</span> {keg.role_pengawas || '-'}
                                                            </p>
                                                        </div>
                                                        <div className="mt-2 sm:mt-0">
                                                            <span className="text-xs font-mono bg-gray-100 border border-gray-200 px-2 py-1 rounded text-gray-600">
                                                                {keg.tanggal}
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            )}
                        </React.Fragment>
                        );
                    })}
                    </tbody>
                </table>
            )}
          </div>
        </div>

        {/* SIDEBAR QUICK LINKS */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 h-fit">
            <h2 className="text-lg font-bold text-gray-800 mb-4">Akses Cepat</h2>
            <div className="space-y-3">
                <Link to="/admin/penugasan" className="block w-full text-left px-4 py-3 bg-gray-50 hover:bg-blue-50 rounded-lg border border-gray-200 hover:border-blue-200 transition flex items-center gap-3 group">
                    <span className="bg-white p-2 rounded-full shadow-sm text-lg text-[#1A2A80] group-hover:scale-110 transition-transform">
                        <FaHandshake />
                    </span>
                    <div>
                        <p className="font-bold text-gray-700 group-hover:text-[#1A2A80] transition-colors">Manajemen Tim</p>
                        <p className="text-xs text-gray-500">Lihat seluruh penugasan</p>
                    </div>
                </Link>
                <Link to="/admin/laporan" className="block w-full text-left px-4 py-3 bg-gray-50 hover:bg-blue-50 rounded-lg border border-gray-200 hover:border-blue-200 transition flex items-center gap-3 group">
                    <span className="bg-white p-2 rounded-full shadow-sm text-lg text-[#1A2A80] group-hover:scale-110 transition-transform">
                        <FaFileAlt />
                    </span>
                    <div>
                        <p className="font-bold text-gray-700 group-hover:text-[#1A2A80] transition-colors">Template Laporan</p>
                        <p className="text-xs text-gray-500">Atur form pelaporan</p>
                    </div>
                </Link>
                <Link to="/admin/manage-users" className="block w-full text-left px-4 py-3 bg-gray-50 hover:bg-blue-50 rounded-lg border border-gray-200 hover:border-blue-200 transition flex items-center gap-3 group">
                    <span className="bg-white p-2 rounded-full shadow-sm text-lg text-[#1A2A80] group-hover:scale-110 transition-transform">
                        <FaUserCog />
                    </span>
                    <div>
                        <p className="font-bold text-gray-700 group-hover:text-[#1A2A80] transition-colors">Manajemen User</p>
                        <p className="text-xs text-gray-500">Tambah admin/staff</p>
                    </div>
                </Link>
            </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;