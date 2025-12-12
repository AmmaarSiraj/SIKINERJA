// src/components/PartDaftarKegiatan.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { 
  FaChevronDown, 
  FaClipboardList, 
  FaCalendarAlt, 
  FaCheckCircle,
  FaArrowRight
} from 'react-icons/fa';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const PartDaftarKegiatan = () => {
  const [kegiatanList, setKegiatanList] = useState([]);
  const [userTasks, setUserTasks] = useState(new Set());
  const [mitraData, setMitraData] = useState(null);
  
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [expandedRow, setExpandedRow] = useState(null);

  const navigate = useNavigate();

  // --- 1. FETCH DATA ---
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};

        // Ambil Data Kegiatan (Induk) & Sub-Kegiatan (Anak)
        const [resKegiatan, resSubKegiatan] = await Promise.all([
          axios.get(`${API_URL}/api/kegiatan`, config),
          axios.get(`${API_URL}/api/subkegiatan`, config)
        ]);

        const allInduk = resKegiatan.data || [];
        const allAnak = resSubKegiatan.data || [];

        // Gabungkan Sub ke Induk
        // Urutkan berdasarkan ID descending (terbaru di atas) jika perlu
        const sortedInduk = allInduk.sort((a, b) => b.id - a.id); 

        const mergedData = sortedInduk.map(induk => {
          const mySubs = allAnak.filter(sub => sub.id_kegiatan === induk.id);
          return { ...induk, sub_list: mySubs };
        });

        setKegiatanList(mergedData);

        // Cek User Login & Data Mitra
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          const user = JSON.parse(storedUser);
          try {
            const resMitra = await axios.get(`${API_URL}/api/mitra/un/user/${user.id}`);
            const myMitra = resMitra.data;
            if (myMitra) {
              setMitraData(myMitra);
              const resKelompok = await axios.get(`${API_URL}/api/kelompok-penugasan`, config);
              const myTasks = new Set(
                resKelompok.data
                  .filter(kp => kp.id_mitra === myMitra.id)
                  .map(kp => kp.id_penugasan)
              );
              setUserTasks(myTasks);
            }
          } catch (err) {
            // User belum terdaftar mitra
          }
        }
      } catch (err) {
        console.error("Gagal memuat data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // --- 2. HANDLERS ---
  const handleRowClick = (id) => {
    setExpandedRow(prev => (prev === id ? null : id));
  };

  const handleAmbilTugas = async (e, subItem) => {
    e.stopPropagation();

    if (!subItem.id_penugasan) {
      alert("Kegiatan ini belum dibuka penugasannya oleh Admin.");
      return;
    }

    if (!mitraData) {
      alert("Anda harus melengkapi profil Mitra terlebih dahulu.");
      navigate('/lengkapi-profile');
      return;
    }

    if (!confirm(`Daftar ke kegiatan "${subItem.nama_sub_kegiatan}"?`)) return;

    setProcessingId(subItem.id_penugasan);
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_URL}/api/kelompok-penugasan`, {
        id_penugasan: subItem.id_penugasan,
        id_mitra: mitraData.id,
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert("Berhasil mendaftar!");
      setUserTasks(prev => new Set(prev).add(subItem.id_penugasan));
    } catch (err) {
      alert(err.response?.data?.error || "Gagal mengambil pekerjaan.");
    } finally {
      setProcessingId(null);
    }
  };

  // --- 3. HELPERS UI ---
  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
  };

  const getStatusBadge = (start, end) => {
    const now = new Date();
    if (now < new Date(start)) return <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-[10px] font-bold">AKAN DATANG</span>;
    if (now > new Date(end)) return <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-[10px] font-bold">SELESAI</span>;
    return <span className="bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded text-[10px] font-bold">BERJALAN</span>;
  };

  // Logic Limitasi Data (Max 5 baris parent)
  const displayedList = kegiatanList.slice(0, 5);
  const hasMore = kegiatanList.length > 5;

  if (loading) return <div className="text-center p-8 text-gray-400 text-sm animate-pulse">Memuat data kegiatan...</div>;

  return (
    <div className="w-full bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      
      {/* Header Widget Dihapus sesuai permintaan user */}

      {/* List Content */}
      <div className="divide-y divide-gray-50">
        {displayedList.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-sm italic">
            Belum ada kegiatan yang tersedia.
          </div>
        ) : (
          displayedList.map((induk) => {
            const isExpanded = expandedRow === induk.id;
            const subCount = induk.sub_list ? induk.sub_list.length : 0;

            return (
              <div key={induk.id} className="bg-white transition-colors hover:bg-gray-50/50">
                
                {/* Parent Row (Clickable) */}
                <div 
                  onClick={() => handleRowClick(induk.id)} 
                  className="px-6 py-4 cursor-pointer flex justify-between items-center group"
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className={`p-1.5 rounded-full transition-transform duration-200 ${isExpanded ? 'bg-indigo-50 text-indigo-600 rotate-180' : 'bg-gray-100 text-gray-400 group-hover:bg-indigo-50 group-hover:text-indigo-500'}`}>
                      <FaChevronDown size={10} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className={`text-sm font-semibold truncate ${isExpanded ? 'text-indigo-700' : 'text-gray-700'}`}>
                        {induk.nama_kegiatan}
                      </h3>
                      <p className="text-[11px] text-gray-400 mt-0.5 truncate max-w-xs">
                        {induk.deskripsi || 'Kegiatan Statistik'}
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full whitespace-nowrap">
                    {subCount} Kegiatan
                  </span>
                </div>

                {/* Child Table (Expanded) */}
                {isExpanded && (
                  <div className="bg-gray-50 border-y border-gray-100 animate-fade-in-down">
                    {subCount > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left">
                          <tbody className="divide-y divide-gray-200/50">
                            {induk.sub_list.map((sub) => {
                               const isTerdaftar = userTasks.has(sub.id_penugasan);
                               
                               return (
                                <tr key={sub.id} className="hover:bg-white transition-colors">
                                  <td className="px-6 py-3">
                                    <div className="flex flex-col gap-1">
                                      <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                        <FaClipboardList className="text-gray-300 text-xs" />
                                        {sub.nama_sub_kegiatan}
                                      </div>
                                      <div className="flex items-center gap-2 text-[11px] text-gray-500">
                                        <FaCalendarAlt className="text-gray-300" />
                                        <span>{formatDate(sub.tanggal_mulai)} - {formatDate(sub.tanggal_selesai)}</span>
                                        {getStatusBadge(sub.tanggal_mulai, sub.tanggal_selesai)}
                                      </div>
                                    </div>
                                  </td>
                                  
                                  <td className="px-6 py-3 text-right align-middle">
                                    {/* Logic Tombol Aksi */}
                                    {!mitraData ? (
                                      <span className="text-[10px] text-gray-400 italic">Login sbg Mitra</span>
                                    ) : !sub.id_penugasan ? (
                                      <span className="text-[10px] text-gray-400 italic">Belum Dibuka</span>
                                    ) : isTerdaftar ? (
                                      <span className="inline-flex items-center gap-1 text-green-600 font-bold text-[10px] bg-green-50 px-2 py-1 rounded border border-green-200">
                                        <FaCheckCircle /> TERDAFTAR
                                      </span>
                                    ) : (
                                      <button
                                        onClick={(e) => handleAmbilTugas(e, sub)}
                                        disabled={processingId === sub.id_penugasan}
                                        className="text-[11px] bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded shadow-sm transition-transform active:scale-95 disabled:opacity-50"
                                      >
                                        {processingId === sub.id_penugasan ? '...' : 'Ambil Tugas'}
                                      </button>
                                    )}
                                  </td>
                                </tr>
                            )})}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="p-4 text-center text-xs text-gray-400 italic">
                        Tidak ada sub-kegiatan.
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Footer "Lihat Selengkapnya" - Hanya muncul jika data > 5 */}
      {hasMore && (
        <div className="bg-gray-50 border-t border-gray-100 p-3 text-center">
            <button 
                onClick={() => navigate('/manajemen-kegiatan')}
                className="inline-flex items-center gap-2 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors uppercase tracking-wide"
            >
                Lihat Selengkapnya <FaArrowRight />
            </button>
        </div>
      )}

    </div>
  );
};

export default PartDaftarKegiatan;