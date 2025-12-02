import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  FaClipboardList, 
  FaCalendarAlt, 
  FaUserTie, 
  FaSearch,
  FaLayerGroup,
  FaChevronDown,
  FaChevronUp,
  FaUsers,
  FaSpinner
} from 'react-icons/fa';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const Penugasan = () => {
  // State Data Utama
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // State Pencarian
  const [searchTerm, setSearchTerm] = useState('');

  // State untuk Expand/Collapse & Data Anggota
  const [expandedId, setExpandedId] = useState(null);
  const [membersMap, setMembersMap] = useState({}); // Cache data anggota per penugasan
  const [loadingMembers, setLoadingMembers] = useState({}); // Status loading per item

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('token');
        const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};

        // Ambil SEMUA Data Penugasan
        const response = await axios.get(`${API_URL}/api/penugasan`, config);
        setTasks(response.data);

      } catch (err) {
        console.error(err);
        setError("Gagal memuat daftar penugasan.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Handler: Klik Baris untuk Expand/Collapse
  const handleToggle = async (id_penugasan) => {
    // 1. Jika sedang terbuka, tutup
    if (expandedId === id_penugasan) {
      setExpandedId(null);
      return;
    }

    // 2. Buka baris ini
    setExpandedId(id_penugasan);

    // 3. Cek apakah data anggota sudah ada di cache?
    if (!membersMap[id_penugasan]) {
      setLoadingMembers(prev => ({ ...prev, [id_penugasan]: true }));
      
      try {
        const token = localStorage.getItem('token');
        const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
        
        // Fetch data anggota khusus untuk penugasan ini
        const res = await axios.get(`${API_URL}/api/penugasan/${id_penugasan}/anggota`, config);
        
        // Simpan ke cache
        setMembersMap(prev => ({ ...prev, [id_penugasan]: res.data }));
        
      } catch (err) {
        console.error("Gagal load anggota:", err);
      } finally {
        setLoadingMembers(prev => ({ ...prev, [id_penugasan]: false }));
      }
    }
  };

  // Filter pencarian
  const filteredTasks = tasks.filter(task => 
    (task.nama_sub_kegiatan && task.nama_sub_kegiatan.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (task.nama_kegiatan && task.nama_kegiatan.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('id-ID', {
      day: 'numeric', month: 'long', year: 'numeric'
    });
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <FaClipboardList className="text-[#1A2A80]" /> Daftar Penugasan
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Klik pada kartu kegiatan untuk melihat daftar petugas.
          </p>
        </div>

        <div className="relative w-full md:w-64">
          <span className="absolute left-3 top-3 text-gray-400"><FaSearch /></span>
          <input 
            type="text" 
            placeholder="Cari kegiatan..." 
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1A2A80] outline-none text-sm transition"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* CONTENT */}
      {loading ? (
        <div className="text-center py-12 text-gray-500 animate-pulse">Sedang memuat data...</div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center text-red-600">{error}</div>
      ) : filteredTasks.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
          <FaLayerGroup className="mx-auto text-4xl text-gray-300 mb-3" />
          <p className="text-gray-500 font-medium">Tidak ada data penugasan yang ditemukan.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredTasks.map((item) => {
            const isOpen = expandedId === item.id_penugasan;
            const members = membersMap[item.id_penugasan] || [];
            const isLoadingMembers = loadingMembers[item.id_penugasan];

            return (
              <div 
                key={item.id_penugasan} 
                className={`bg-white rounded-xl shadow-sm border transition-all duration-300 overflow-hidden 
                  ${isOpen ? 'border-blue-300 ring-1 ring-blue-100' : 'border-gray-100 hover:shadow-md'}`}
              >
                {/* --- BAGIAN ATAS (KARTU UTAMA) --- */}
                <div 
                  onClick={() => handleToggle(item.id_penugasan)}
                  className="p-5 cursor-pointer flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-50 text-[#1A2A80] border border-blue-100">
                        {item.nama_kegiatan}
                      </span>
                    </div>
                    <h3 className={`text-lg font-bold transition-colors ${isOpen ? 'text-[#1A2A80]' : 'text-gray-800'}`}>
                      {item.nama_sub_kegiatan}
                    </h3>
                    
                    <div className="flex flex-wrap gap-3 mt-3 text-sm text-gray-500">
                      <div className="flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded border border-gray-100">
                          <FaUserTie className="text-gray-400" />
                          <span>Pengawas: <span className="font-medium text-gray-700">{item.nama_pengawas || '-'}</span></span>
                      </div>
                      <div className="flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded border border-gray-100">
                          <FaCalendarAlt className="text-gray-400" />
                          <span>{formatDate(item.tanggal_mulai)} - {formatDate(item.tanggal_selesai)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Icon Toggle */}
                  <div className={`text-gray-400 p-2 rounded-full transition-all duration-300 ${isOpen ? 'bg-blue-50 text-[#1A2A80] rotate-180' : 'bg-gray-50'}`}>
                     <FaChevronDown />
                  </div>
                </div>

                {/* --- BAGIAN BAWAH (DAFTAR ANGGOTA) --- */}
                {isOpen && (
                  <div className="bg-gray-50/50 border-t border-gray-100 p-5 animate-fade-in-down">
                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                      <FaUsers /> Petugas Lapangan ({isLoadingMembers ? '...' : members.length})
                    </h4>

                    {isLoadingMembers ? (
                      <div className="flex items-center justify-center py-4 text-gray-400 gap-2">
                        <FaSpinner className="animate-spin" /> Memuat data petugas...
                      </div>
                    ) : members.length === 0 ? (
                      <p className="text-sm text-gray-400 italic py-2">Belum ada petugas yang ditambahkan.</p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                        {members.map((member, idx) => (
                          <div key={idx} className="bg-white p-3 rounded-lg border border-gray-200 flex items-center gap-3 shadow-sm">
                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-[#1A2A80] font-bold text-xs">
                              {member.nama_lengkap ? member.nama_lengkap.charAt(0) : '?'}
                            </div>
                            <div className="overflow-hidden">
                              <p className="text-sm font-bold text-gray-700 truncate">{member.nama_lengkap}</p>
                              <p className="text-xs text-gray-500 truncate">{member.nama_jabatan || member.kode_jabatan || 'Anggota'}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Penugasan;