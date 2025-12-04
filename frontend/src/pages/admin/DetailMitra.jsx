import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  FaArrowLeft, FaTrash, FaUserTie, FaIdCard, FaPhone, FaEnvelope, 
  FaCoins, FaBriefcase, FaCalendarAlt, FaExclamationCircle,
  FaHistory, FaChevronDown, FaChevronUp, FaVenusMars, FaGraduationCap, FaIdBadge
} from 'react-icons/fa';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const DetailMitra = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [mitra, setMitra] = useState(null);
  const [tasks, setTasks] = useState([]);
  
  // State Keuangan (Kalkulasi Honor)
  const [totalPendapatan, setTotalPendapatan] = useState(0);
  const [limitPendapatan, setLimitPendapatan] = useState(0);
  const [currentPeriodLabel, setCurrentPeriodLabel] = useState('');

  // State Riwayat
  const [historyData, setHistoryData] = useState({});
  const [expandedHistory, setExpandedHistory] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        const headers = { Authorization: `Bearer ${token}` };

        const now = new Date();
        const currentPeriod = now.toISOString().slice(0, 7); 
        setCurrentPeriodLabel(now.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }));

        const [resMitra, resKelompok, resPenugasan, resSub, resHonor, resJabatan, resAturan] = await Promise.all([
          axios.get(`${API_URL}/api/mitra/${id}`, { headers }),
          axios.get(`${API_URL}/api/kelompok-penugasan`, { headers }),
          axios.get(`${API_URL}/api/penugasan`, { headers }),
          axios.get(`${API_URL}/api/subkegiatan`, { headers }),
          axios.get(`${API_URL}/api/honorarium`, { headers }),
          axios.get(`${API_URL}/api/jabatan-mitra`, { headers }),
          axios.get(`${API_URL}/api/aturan-periode`, { headers })
        ]);

        setMitra(resMitra.data);

        // 1. Map Data Pendukung
        const jobMap = {};
        resJabatan.data.forEach(j => { jobMap[j.kode_jabatan] = j.nama_jabatan; });

        const subMap = {};
        resSub.data.forEach(s => {
            subMap[s.id] = { 
                nama: s.nama_sub_kegiatan, 
                induk: s.nama_kegiatan, 
                periode: s.periode 
            };
        });

        const penugasanMap = {}; 
        resPenugasan.data.forEach(p => penugasanMap[p.id_penugasan] = p.id_subkegiatan);

        // Map Aturan Periode (Periode -> Limit)
        const ruleMap = {};
        resAturan.data.forEach(r => { ruleMap[r.periode] = Number(r.batas_honor); });

        // Set Limit Periode Ini
        setLimitPendapatan(ruleMap[currentPeriod] || 0);

        // 2. Filter & Grouping Tugas
        const currentTasksArr = [];
        let currentTotal = 0;
        const historyGroup = {};

        resKelompok.data.forEach(k => {
            if (String(k.id_mitra) !== String(id)) return;

            const idSub = penugasanMap[k.id_penugasan];
            if (!idSub) return;
            const subInfo = subMap[idSub];
            if (!subInfo) return;

            const honorRule = resHonor.data.find(h => h.id_subkegiatan == idSub && h.kode_jabatan === k.kode_jabatan);
            const tarif = honorRule ? Number(honorRule.tarif) : 0;
            const namaJabatan = jobMap[k.kode_jabatan] || k.kode_jabatan || 'Anggota';

            const taskItem = {
                id: k.id_kelompok,
                kegiatan: subInfo.nama,
                induk: subInfo.induk,
                jabatan: namaJabatan,
                tarif: tarif
            };

            if (subInfo.periode === currentPeriod) {
                currentTasksArr.push(taskItem);
                currentTotal += tarif;
            } else {
                if (!historyGroup[subInfo.periode]) {
                    historyGroup[subInfo.periode] = { 
                        tasks: [], 
                        total: 0,
                        limit: ruleMap[subInfo.periode] || 0 
                    };
                }
                historyGroup[subInfo.periode].tasks.push(taskItem);
                historyGroup[subInfo.periode].total += tarif;
            }
        });

        setTasks(currentTasksArr);
        setTotalPendapatan(currentTotal);
        setHistoryData(historyGroup);

      } catch (err) {
        console.error(err);
        setError(err.response?.data?.error || 'Gagal memuat data.');
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchData();
  }, [id]);

  const handleDelete = async () => {
    if (!window.confirm("Yakin hapus mitra ini?")) return;
    try {
        const token = localStorage.getItem('token');
        await axios.delete(`${API_URL}/api/mitra/${id}`, { headers: { Authorization: `Bearer ${token}` } });
        navigate('/admin/pengajuan-mitra');
    } catch (err) { alert("Gagal menghapus."); }
  };

  const toggleHistory = (periode) => {
    setExpandedHistory(expandedHistory === periode ? null : periode);
  };

  const formatPeriodeLabel = (periodeStr) => {
    if (!periodeStr) return 'Periode Lama';
    const parts = periodeStr.split('-');
    if (parts.length === 2) {
      const date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1);
      return date.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
    }
    return periodeStr;
  };

  // --- Helper Baru untuk Format Gender ---
  const formatGender = (val) => {
    if (val === 'Lk') return 'Laki-laki';
    if (val === 'Pr') return 'Perempuan';
    return val || '-';
  };
  // -------------------------------------

  const getProgressColor = (percent) => {
    if (percent >= 100) return 'bg-red-600';
    if (percent >= 80) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  if (loading) return <div className="text-center py-10 text-gray-500">Memuat detail...</div>;
  if (error) return <div className="text-center py-10 text-red-600">{error}</div>;
  if (!mitra) return <div className="text-center py-10 text-gray-500">Data tidak ditemukan.</div>;

  const percentage = limitPendapatan > 0 ? Math.min((totalPendapatan / limitPendapatan) * 100, 100) : 0;

  return (
    <div className="max-w-5xl mx-auto w-full pb-20">
      
      <div className="mb-6">
        <Link to="/admin/pengajuan-mitra" className="inline-flex items-center gap-2 text-gray-500 hover:text-[#1A2A80] transition font-medium">
          <FaArrowLeft size={14} /> Kembali ke Daftar Mitra
        </Link>
      </div>

      {/* CARD 1: INFORMASI PROFIL & LATAR BELAKANG */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-8">
        
        {/* Header Profil */}
        <div className="px-8 py-6 bg-gray-50/50 border-b border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center text-[#1A2A80] text-3xl shadow-sm border border-blue-100"><FaUserTie /></div>
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">{mitra.nama_lengkap}</h1>
                    <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                        <span className="flex items-center gap-1 bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-xs font-bold">
                            {mitra.sobat_id ? `SOBAT ID: ${mitra.sobat_id}` : 'Mitra Statistik'}
                        </span>
                    </div>
                </div>
            </div>
            <div className="text-right hidden sm:block">
                 <span className="bg-gray-200 text-gray-600 px-3 py-1 rounded text-xs font-mono font-bold">System ID: {mitra.id}</span>
            </div>
        </div>

        {/* Content Grid */}
        <div className="p-8 grid grid-cols-1 lg:grid-cols-2 gap-12">
            
            {/* KOLOM KIRI: Data Pribadi */}
            <div>
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-5 flex items-center gap-2 border-b border-gray-100 pb-2"><FaIdCard /> Data Pribadi</h3>
                <div className="space-y-4">
                    <div className="bg-gray-50 p-3 rounded border border-dashed border-gray-200">
                        <label className="block text-xs text-gray-500 mb-1 font-bold">NIK</label>
                        <div className="text-base font-bold text-gray-800 font-mono tracking-wide">{mitra.nik}</div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs text-gray-500 mb-1 font-medium flex items-center gap-1"><FaVenusMars size={12}/> Jenis Kelamin</label>
                            {/* Menggunakan helper formatGender di sini */}
                            <p className="text-sm font-medium text-gray-900">{formatGender(mitra.jenis_kelamin)}</p>
                        </div>
                        <div>
                            <label className="block text-xs text-gray-500 mb-1 font-medium flex items-center gap-1"><FaIdBadge size={12}/> ID Sobat</label>
                            <p className="text-sm font-medium text-gray-900">{mitra.sobat_id || '-'}</p>
                        </div>
                    </div>

                    <div><label className="block text-xs text-gray-500 mb-1 font-medium flex items-center gap-1"><FaPhone size={12}/> No. Handphone</label><p className="text-base font-medium text-gray-900">{mitra.no_hp}</p></div>
                    <div><label className="block text-xs text-gray-500 mb-1 font-medium flex items-center gap-1"><FaEnvelope size={12}/> Email</label><p className="text-base font-medium text-gray-900">{mitra.email || '-'}</p></div>
                    <div><label className="block text-xs text-gray-500 mb-1 font-medium">Alamat Domisili</label><p className="text-sm font-medium text-gray-700 leading-relaxed">{mitra.alamat}</p></div>
                </div>
            </div>

            {/* KOLOM KANAN: Latar Belakang & Status */}
            <div>
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-5 flex items-center gap-2 border-b border-gray-100 pb-2"><FaBriefcase /> Latar Belakang & Performa</h3>
                
                <div className="space-y-6">
                    {/* Info Pendidikan & Pekerjaan */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs text-gray-500 mb-1 font-medium flex items-center gap-1"><FaGraduationCap size={12}/> Pendidikan</label>
                            <p className="text-sm font-bold text-gray-800">{mitra.pendidikan || '-'}</p>
                        </div>
                        <div>
                            <label className="block text-xs text-gray-500 mb-1 font-medium flex items-center gap-1"><FaBriefcase size={12}/> Pekerjaan Utama</label>
                            <p className="text-sm font-bold text-gray-800">{mitra.pekerjaan || '-'}</p>
                        </div>
                    </div>
                    {mitra.deskripsi_pekerjaan_lain && (
                        <div>
                            <label className="block text-xs text-gray-500 mb-1 font-medium">Keterangan Pekerjaan Lain</label>
                            <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">{mitra.deskripsi_pekerjaan_lain}</p>
                        </div>
                    )}

                    {/* Progress Honor Periode Ini */}
                    <div className="mt-6 pt-6 border-t border-gray-100">
                        <label className="block text-xs text-gray-500 mb-3 font-medium flex justify-between items-center">
                            <span className="flex items-center gap-1 uppercase font-bold text-gray-400"><FaCoins size={12} /> Akumulasi Honor ({currentPeriodLabel})</span>
                            {limitPendapatan > 0 && <span className="text-[10px] bg-blue-50 px-2 py-0.5 rounded text-blue-600 font-bold border border-blue-100">Max: Rp {limitPendapatan.toLocaleString('id-ID')}</span>}
                        </label>
                        
                        <div className="flex items-baseline gap-1 mb-2">
                            <span className="text-3xl font-extrabold text-gray-800">Rp {totalPendapatan.toLocaleString('id-ID')}</span>
                            <span className="text-xs text-gray-400 font-medium">dari estimasi tugas</span>
                        </div>

                        {limitPendapatan > 0 ? (
                            <div className="relative pt-1">
                                <div className="overflow-hidden h-3 text-xs flex rounded-full bg-gray-200">
                                    <div style={{ width: `${percentage}%` }} className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center transition-all duration-500 ${getProgressColor(percentage)}`}></div>
                                </div>
                                <div className="flex justify-between text-[10px] text-gray-400 mt-1 font-medium">
                                    <span>0%</span>
                                    <span className={`${percentage > 100 ? 'text-red-500 font-bold' : ''}`}>{percentage.toFixed(1)}% Terpakai</span>
                                    <span>100%</span>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 text-xs text-yellow-600 bg-yellow-50 p-2 rounded border border-yellow-100"><FaExclamationCircle /> Batas honor periode ini belum diatur.</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
        
        <div className="bg-gray-50 px-8 py-5 border-t border-gray-100 flex justify-end">
             <button onClick={handleDelete} className="flex items-center gap-2 px-5 py-2.5 bg-white text-red-600 border border-red-200 rounded-lg hover:bg-red-50 hover:border-red-300 text-sm font-bold transition shadow-sm"><FaTrash size={12} /> Hapus Mitra</button>
        </div>
      </div>

      {/* CARD 2: TABEL TUGAS PERIODE INI */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-8">
        <div className="px-8 py-5 border-b border-gray-100 bg-gray-50 flex items-center gap-3">
            <FaCalendarAlt className="text-[#1A2A80]" />
            <h3 className="font-bold text-gray-800">Daftar Tugas Periode Ini ({currentPeriodLabel})</h3>
        </div>
        <div className="overflow-x-auto">
            <table className="min-w-full text-sm text-left">
                <thead className="bg-white border-b border-gray-100">
                    <tr>
                        <th className="px-8 py-3 font-bold text-gray-500">Nama Kegiatan / Sub</th>
                        <th className="px-8 py-3 font-bold text-gray-500">Peran / Jabatan</th>
                        <th className="px-8 py-3 font-bold text-gray-500 text-right">Estimasi Honor</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                    {tasks.length === 0 ? (
                        <tr><td colSpan="3" className="px-8 py-8 text-center text-gray-400 italic">Belum ada tugas periode ini.</td></tr>
                    ) : (
                        tasks.map((task, idx) => (
                            <tr key={idx} className="hover:bg-blue-50/30 transition-colors">
                                <td className="px-8 py-4 font-medium text-gray-800">{task.kegiatan}<div className="text-[10px] text-gray-400 font-normal">{task.induk}</div></td>
                                <td className="px-8 py-4"><span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"><FaBriefcase size={10} /> {task.jabatan}</span></td>
                                <td className="px-8 py-4 text-right font-bold text-green-600">Rp {task.tarif.toLocaleString('id-ID')}</td>
                            </tr>
                        ))
                    )}
                </tbody>
                {tasks.length > 0 && (
                    <tfoot className="bg-gray-50 border-t border-gray-200">
                        <tr><td colSpan="2" className="px-8 py-3 text-right font-bold text-gray-600">Total:</td><td className="px-8 py-3 text-right font-extrabold text-green-700">Rp {totalPendapatan.toLocaleString('id-ID')}</td></tr>
                    </tfoot>
                )}
            </table>
        </div>
      </div>

      {/* CARD 3: RIWAYAT PENUGASAN (ACCORDION) */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-gray-700 flex items-center gap-2 px-2"><FaHistory /> Riwayat Penugasan Sebelumnya</h3>
        
        {Object.keys(historyData).length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400 italic shadow-sm">Belum ada riwayat penugasan masa lalu.</div>
        ) : (
            Object.keys(historyData).sort().reverse().map(periodeKey => {
                const group = historyData[periodeKey];
                const isOpen = expandedHistory === periodeKey;

                return (
                    <div key={periodeKey} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                        
                        <div 
                            onClick={() => toggleHistory(periodeKey)}
                            className={`px-6 py-4 flex justify-between items-center cursor-pointer transition-colors ${isOpen ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
                        >
                            <div className="flex items-center gap-4">
                                <div className={`p-2 rounded-lg ${isOpen ? 'bg-[#1A2A80] text-white' : 'bg-gray-200 text-gray-500'}`}>
                                    <FaCalendarAlt />
                                </div>
                                <div>
                                    <h4 className="font-bold text-gray-800 text-lg">{formatPeriodeLabel(periodeKey)}</h4>
                                    <p className="text-xs text-gray-500">{group.tasks.length} Kegiatan Selesai</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-sm font-bold text-green-600">
                                    Rp {group.total.toLocaleString('id-ID')} 
                                    <span className="text-gray-400 text-xs font-normal ml-1">
                                       / Batas: {group.limit > 0 ? `Rp ${group.limit.toLocaleString('id-ID')}` : '-'}
                                    </span>
                                </p>
                                <div className="text-gray-400 mt-1 flex justify-end">{isOpen ? <FaChevronUp /> : <FaChevronDown />}</div>
                            </div>
                        </div>

                        {isOpen && (
                            <div className="border-t border-gray-100 animate-fade-in-down">
                                <table className="min-w-full text-sm text-left">
                                    <thead className="bg-gray-50 text-gray-500">
                                        <tr>
                                            <th className="px-6 py-3 font-semibold">Nama Kegiatan</th>
                                            <th className="px-6 py-3 font-semibold">Jabatan</th>
                                            <th className="px-6 py-3 font-semibold text-right">Honor</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {group.tasks.map((task, idx) => (
                                            <tr key={idx} className="hover:bg-gray-50">
                                                <td className="px-6 py-3 text-gray-800">
                                                    <span className="font-medium">{task.kegiatan}</span>
                                                    <span className="block text-[10px] text-gray-400">{task.induk}</span>
                                                </td>
                                                <td className="px-6 py-3 text-blue-600">{task.jabatan}</td>
                                                <td className="px-6 py-3 text-right font-mono text-gray-600">Rp {task.tarif.toLocaleString('id-ID')}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                );
            })
        )}
      </div>

    </div>
  );
};

export default DetailMitra;