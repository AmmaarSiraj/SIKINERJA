// src/pages/admin/DetailMitra.jsx
import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  FaArrowLeft, FaTrash, FaUserTie, FaIdCard, FaPhone, FaEnvelope, 
  FaCoins, FaBriefcase, FaCalendarAlt, FaExclamationCircle,
  FaHistory, FaChevronDown, FaChevronUp, FaVenusMars, FaGraduationCap, FaIdBadge,
  FaChartLine, FaChevronRight
} from 'react-icons/fa';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const DetailMitra = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [mitra, setMitra] = useState(null);
  const [tasks, setTasks] = useState([]); // Tugas Bulan Ini
  
  // State Keuangan
  const [totalPendapatanTahunIni, setTotalPendapatanTahunIni] = useState(0); 
  const [totalPendapatanBulanIni, setTotalPendapatanBulanIni] = useState(0); 
  const [limitPendapatan, setLimitPendapatan] = useState(0);
  
  // Label Waktu
  const [currentYearLabel, setCurrentYearLabel] = useState('');
  const [currentMonthLabel, setCurrentMonthLabel] = useState('');

  // State Riwayat (Nested: Tahun -> Bulan -> Tasks)
  const [historyData, setHistoryData] = useState({});
  
  // State Accordion
  const [expandedYear, setExpandedYear] = useState(null); // String "YYYY"
  const [expandedMonth, setExpandedMonth] = useState(null); // String "YYYY-MM"

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        const headers = { Authorization: `Bearer ${token}` };

        // 1. Tentukan Waktu Saat Ini
        const now = new Date();
        const currentYear = now.getFullYear().toString(); 
        const currentMonthIdx = now.getMonth(); 
        const monthNames = [
            "Januari", "Februari", "Maret", "April", "Mei", "Juni", 
            "Juli", "Agustus", "September", "Oktober", "November", "Desember"
        ];
        
        setCurrentYearLabel(currentYear);
        setCurrentMonthLabel(monthNames[currentMonthIdx]);

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

        // 2. Map Data Pendukung
        const jobMap = {};
        resJabatan.data.forEach(j => { jobMap[j.kode_jabatan] = j.nama_jabatan; });

        const subMap = {};
        resSub.data.forEach(s => {
            const yearStr = s.tanggal_mulai ? new Date(s.tanggal_mulai).getFullYear().toString() : 'Unknown';
            subMap[s.id] = { 
                nama: s.nama_sub_kegiatan, 
                induk: s.nama_kegiatan, 
                periodeFull: s.periode, 
                tanggal_mulai: s.tanggal_mulai, 
                tahun: yearStr
            };
        });

        const penugasanMap = {}; 
        resPenugasan.data.forEach(p => penugasanMap[p.id_penugasan] = p.id_subkegiatan);

        // 3. Map Aturan Batas Honor (Key = TAHUN)
        const ruleMap = {};
        resAturan.data.forEach(r => { 
            const yearKey = r.tahun || r.periode;
            ruleMap[String(yearKey)] = Number(r.batas_honor); 
        });

        setLimitPendapatan(ruleMap[currentYear] || 0);

        // 4. Filter & Grouping Tugas (Nested)
        const currentMonthTasksArr = [];
        let calcYearlyTotal = 0;
        let calcMonthlyTotal = 0;
        
        // Struktur: { "2024": { limit: X, totalYear: Y, months: { "0": { name: "Jan", total: Z, tasks: [] } } } }
        const historyGroup = {};

        resKelompok.data.forEach(k => {
            if (String(k.id_mitra) !== String(id)) return;

            const idSub = penugasanMap[k.id_penugasan];
            if (!idSub) return;
            const subInfo = subMap[idSub];
            if (!subInfo) return;

            const honorRule = resHonor.data.find(h => h.id_subkegiatan == idSub && h.kode_jabatan === k.kode_jabatan);
            const tarifSatuan = honorRule ? Number(honorRule.tarif) : 0;
            
            const vol = k.volume_tugas ? Number(k.volume_tugas) : 0;
            const multiplier = vol > 0 ? vol : 1; 
            const totalHonorTugas = tarifSatuan * multiplier;

            const namaJabatan = jobMap[k.kode_jabatan] || k.kode_jabatan || 'Anggota';

            let taskYear = 'Unknown';
            let taskMonthIdx = -1;
            
            if (subInfo.tanggal_mulai) {
                const d = new Date(subInfo.tanggal_mulai);
                taskYear = d.getFullYear().toString();
                taskMonthIdx = d.getMonth();
            }

            const taskItem = {
                id: k.id_kelompok,
                kegiatan: subInfo.nama,
                induk: subInfo.induk,
                jabatan: namaJabatan,
                tarifSatuan: tarifSatuan,
                volume: vol,
                totalHonor: totalHonorTugas,
                tanggalMulai: subInfo.tanggal_mulai,
                periodeLabel: subInfo.tanggal_mulai ? new Date(subInfo.tanggal_mulai).toLocaleDateString('id-ID', {day: 'numeric', month: 'short', year: 'numeric'}) : '-'
            };

            // A. TUGAS TAHUN INI (Untuk Progress Bar Utama)
            if (taskYear === currentYear) {
                calcYearlyTotal += totalHonorTugas;
            }

            // B. KLASIFIKASI "BULAN INI" vs "RIWAYAT LAINNYA"
            const isCurrentMonthTask = (taskYear === currentYear && taskMonthIdx === currentMonthIdx);

            if (isCurrentMonthTask) {
                currentMonthTasksArr.push(taskItem);
                calcMonthlyTotal += totalHonorTugas;
            } else {
                // Masuk ke Riwayat (Nested Grouping)
                if (!historyGroup[taskYear]) {
                    historyGroup[taskYear] = {
                        limit: ruleMap[taskYear] || 0,
                        totalYear: 0,
                        months: {}
                    };
                }

                // Update Total Tahun di Riwayat
                historyGroup[taskYear].totalYear += totalHonorTugas;

                // Grouping per Bulan
                if (!historyGroup[taskYear].months[taskMonthIdx]) {
                    historyGroup[taskYear].months[taskMonthIdx] = {
                        name: monthNames[taskMonthIdx],
                        totalMonth: 0,
                        tasks: []
                    };
                }

                historyGroup[taskYear].months[taskMonthIdx].tasks.push(taskItem);
                historyGroup[taskYear].months[taskMonthIdx].totalMonth += totalHonorTugas;
            }
        });

        setTasks(currentMonthTasksArr);
        setTotalPendapatanTahunIni(calcYearlyTotal);
        setTotalPendapatanBulanIni(calcMonthlyTotal);
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
        navigate('/admin/transaksi-mitra');
    } catch (err) { alert("Gagal menghapus."); }
  };

  const toggleYear = (yearKey) => {
    setExpandedYear(expandedYear === yearKey ? null : yearKey);
    setExpandedMonth(null); // Reset bulan saat ganti tahun
  };

  const toggleMonth = (e, yearKey, monthIdx) => {
    e.stopPropagation(); // Mencegah toggle tahun tertutup
    const key = `${yearKey}-${monthIdx}`;
    setExpandedMonth(expandedMonth === key ? null : key);
  };

  const formatGender = (val) => {
    if (val === 'Lk') return 'Laki-laki';
    if (val === 'Pr') return 'Perempuan';
    return val || '-';
  };

  const getProgressColor = (percent) => {
    if (percent >= 100) return 'bg-red-600';
    if (percent >= 80) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const formatRupiah = (num) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);
  };

  if (loading) return <div className="text-center py-10 text-gray-500">Memuat detail...</div>;
  if (error) return <div className="text-center py-10 text-red-600">{error}</div>;
  if (!mitra) return <div className="text-center py-10 text-gray-500">Data tidak ditemukan.</div>;

  const percentage = limitPendapatan > 0 ? Math.min((totalPendapatanTahunIni / limitPendapatan) * 100, 100) : 0;

  return (
    <div className="max-w-5xl mx-auto w-full pb-20">
      
      <div className="mb-6">
        <Link to="/admin/transaksi-mitra" className="inline-flex items-center gap-2 text-gray-500 hover:text-[#1A2A80] transition font-medium">
          <FaArrowLeft size={14} /> Kembali ke Daftar Mitra
        </Link>
      </div>

      {/* CARD 1: INFORMASI PROFIL & LATAR BELAKANG */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-8">
        
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

            {/* KOLOM KANAN: Latar Belakang & Performa */}
            <div>
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-5 flex items-center gap-2 border-b border-gray-100 pb-2"><FaBriefcase /> Latar Belakang & Performa</h3>
                
                <div className="space-y-6">
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

                    {/* Progress Honor Tahun Ini */}
                    <div className="mt-6 pt-6 border-t border-gray-100">
                        <label className="block text-xs text-gray-500 mb-3 font-medium flex justify-between items-center">
                            <span className="flex items-center gap-1 uppercase font-bold text-gray-400"><FaCoins size={12} /> Honor Bulan {currentMonthLabel} {currentYearLabel}</span>
                        </label>
                        
                        <div className="flex items-baseline gap-1 mb-4">
                            <span className="text-3xl font-extrabold text-[#1A2A80]">{formatRupiah(totalPendapatanBulanIni)}</span>
                            <span className="text-xs text-gray-400 font-medium">pendapatan bulan ini</span>
                        </div>

                        {/* Progress Limit Tahunan */}
                        <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                            <div className="flex justify-between items-end mb-1">
                                <span className="text-[10px] font-bold text-gray-500 uppercase flex items-center gap-1"><FaChartLine /> Limit Tahunan ({currentYearLabel})</span>
                                {limitPendapatan > 0 && <span className="text-[10px] text-blue-600 font-bold bg-white px-2 py-0.5 rounded border border-blue-100">Batas: {formatRupiah(limitPendapatan)}</span>}
                            </div>

                            {limitPendapatan > 0 ? (
                                <>
                                    <div className="relative pt-1">
                                        <div className="overflow-hidden h-2.5 text-xs flex rounded-full bg-gray-200">
                                            <div style={{ width: `${percentage}%` }} className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center transition-all duration-500 ${getProgressColor(percentage)}`}></div>
                                        </div>
                                    </div>
                                    <div className="flex justify-between text-[10px] text-gray-400 mt-1 font-medium">
                                        <span>Terpakai: {formatRupiah(totalPendapatanTahunIni)}</span>
                                        <span className={`${percentage > 100 ? 'text-red-500 font-bold' : ''}`}>{percentage.toFixed(1)}%</span>
                                    </div>
                                </>
                            ) : (
                                <div className="flex items-center gap-2 text-xs text-yellow-600 mt-1"><FaExclamationCircle /> Batas honor tahunan belum diatur.</div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <div className="bg-gray-50 px-8 py-5 border-t border-gray-100 flex justify-end">
             <button onClick={handleDelete} className="flex items-center gap-2 px-5 py-2.5 bg-white text-red-600 border border-red-200 rounded-lg hover:bg-red-50 hover:border-red-300 text-sm font-bold transition shadow-sm"><FaTrash size={12} /> Hapus Mitra</button>
        </div>
      </div>

      {/* CARD 2: TABEL TUGAS BULAN INI */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-8">
        <div className="px-8 py-5 border-b border-gray-100 bg-gray-50 flex items-center gap-3">
            <FaCalendarAlt className="text-[#1A2A80]" />
            <h3 className="font-bold text-gray-800">Daftar Tugas Bulan Ini ({currentMonthLabel} {currentYearLabel})</h3>
        </div>
        <div className="overflow-x-auto">
            <table className="min-w-full text-sm text-left">
                <thead className="bg-white border-b border-gray-100">
                    <tr>
                        <th className="px-8 py-3 font-bold text-gray-500">Nama Kegiatan / Sub</th>
                        <th className="px-8 py-3 font-bold text-gray-500 text-center">Tanggal Mulai</th>
                        <th className="px-8 py-3 font-bold text-gray-500">Peran & Volume</th>
                        <th className="px-8 py-3 font-bold text-gray-500 text-right">Total Honor</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                    {tasks.length === 0 ? (
                        <tr><td colSpan="4" className="px-8 py-8 text-center text-gray-400 italic">Belum ada tugas untuk bulan ini.</td></tr>
                    ) : (
                        tasks.map((task, idx) => (
                            <tr key={idx} className="hover:bg-blue-50/30 transition-colors">
                                <td className="px-8 py-4 font-medium text-gray-800">
                                    {task.kegiatan}
                                    <div className="text-[10px] text-gray-400 font-normal">{task.induk}</div>
                                </td>
                                <td className="px-8 py-4 text-center">
                                    <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs font-mono">{task.periodeLabel}</span>
                                </td>
                                <td className="px-8 py-4">
                                    <span className="block font-bold text-blue-800">{task.jabatan}</span>
                                    <span className="text-xs text-gray-500">Vol: {task.volume} x {formatRupiah(task.tarifSatuan)}</span>
                                </td>
                                <td className="px-8 py-4 text-right font-bold text-green-600">{formatRupiah(task.totalHonor)}</td>
                            </tr>
                        ))
                    )}
                </tbody>
                {tasks.length > 0 && (
                    <tfoot className="bg-gray-50 border-t border-gray-200">
                        <tr>
                            <td colSpan="3" className="px-8 py-3 text-right font-bold text-gray-600">Total Bulan {currentMonthLabel}:</td>
                            <td className="px-8 py-3 text-right font-extrabold text-green-700">{formatRupiah(totalPendapatanBulanIni)}</td>
                        </tr>
                    </tfoot>
                )}
            </table>
        </div>
      </div>

      {/* CARD 3: RIWAYAT PENUGASAN LAINNYA (BERTINGKAT: TAHUN -> BULAN -> KEGIATAN) */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-gray-700 flex items-center gap-2 px-2"><FaHistory /> Riwayat Penugasan Lainnya</h3>
        
        {Object.keys(historyData).length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400 italic shadow-sm">Belum ada riwayat penugasan lainnya.</div>
        ) : (
            // LEVEL 1: TAHUN
            Object.keys(historyData).sort().reverse().map(yearKey => {
                const yearGroup = historyData[yearKey];
                const isYearOpen = expandedYear === yearKey;

                return (
                    <div key={yearKey} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-3">
                        
                        {/* Header Tahun */}
                        <div 
                            onClick={() => toggleYear(yearKey)}
                            className={`px-6 py-4 flex justify-between items-center cursor-pointer transition-colors ${isYearOpen ? 'bg-blue-50 border-b border-blue-100' : 'hover:bg-gray-50'}`}
                        >
                            <div className="flex items-center gap-4">
                                <div className={`p-2 rounded-lg ${isYearOpen ? 'bg-[#1A2A80] text-white' : 'bg-gray-200 text-gray-500'}`}>
                                    <FaCalendarAlt />
                                </div>
                                <div>
                                    <h4 className="font-bold text-gray-800 text-lg">Tahun {yearKey}</h4>
                                    <p className="text-xs text-gray-500">Total Pendapatan: <span className="font-bold">{formatRupiah(yearGroup.totalYear)}</span></p>
                                </div>
                            </div>
                            <div className="text-right flex items-center gap-3">
                                <span className="text-xs text-gray-400 font-mono hidden sm:inline">Batas Thn: {yearGroup.limit > 0 ? formatRupiah(yearGroup.limit) : '-'}</span>
                                <div className="text-gray-400">{isYearOpen ? <FaChevronUp /> : <FaChevronDown />}</div>
                            </div>
                        </div>

                        {/* LEVEL 2: DAFTAR BULAN */}
                        {isYearOpen && (
                            <div className="bg-gray-50/30 animate-fade-in-down">
                                {Object.keys(yearGroup.months).sort((a,b) => b - a).map(monthIdx => {
                                    const monthGroup = yearGroup.months[monthIdx];
                                    const monthKey = `${yearKey}-${monthIdx}`;
                                    const isMonthOpen = expandedMonth === monthKey;

                                    return (
                                        <div key={monthKey} className="border-b border-gray-100 last:border-none">
                                            {/* Header Bulan */}
                                            <div 
                                                onClick={(e) => toggleMonth(e, yearKey, monthIdx)}
                                                className={`px-6 py-3 pl-12 flex justify-between items-center cursor-pointer transition-colors hover:bg-blue-50/50 ${isMonthOpen ? 'bg-blue-50/50' : ''}`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <FaChevronRight className={`text-xs text-gray-400 transition-transform ${isMonthOpen ? 'rotate-90' : ''}`} />
                                                    <span className="font-bold text-gray-700 text-sm">{monthGroup.name}</span>
                                                </div>
                                                <div className="text-sm font-medium text-gray-600">
                                                    <span className="text-xs text-gray-400 mr-2">Pendapatan:</span>
                                                    <span className="font-bold text-[#1A2A80]">{formatRupiah(monthGroup.totalMonth)}</span>
                                                    <span className="text-xs text-gray-400 mx-1">/</span>
                                                    <span className="text-xs text-gray-400">Batas Thn: {yearGroup.limit > 0 ? formatRupiah(yearGroup.limit) : '-'}</span>
                                                </div>
                                            </div>

                                            {/* LEVEL 3: TABEL KEGIATAN */}
                                            {isMonthOpen && (
                                                <div className="px-6 pb-4 pl-16 animate-fade-in-down">
                                                    <table className="min-w-full text-xs text-left bg-white rounded-lg border border-gray-200 overflow-hidden">
                                                        <thead className="bg-gray-100 text-gray-500">
                                                            <tr>
                                                                <th className="px-4 py-2 font-semibold">Kegiatan</th>
                                                                <th className="px-4 py-2 font-semibold text-center">Tgl Mulai</th>
                                                                <th className="px-4 py-2 font-semibold">Peran</th>
                                                                <th className="px-4 py-2 font-semibold text-right">Honor</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-gray-100">
                                                            {monthGroup.tasks.map((task, idx) => (
                                                                <tr key={idx} className="hover:bg-gray-50">
                                                                    <td className="px-4 py-2 text-gray-800">
                                                                        <span className="font-bold block">{task.kegiatan}</span>
                                                                        <span className="text-[10px] text-gray-400">{task.induk}</span>
                                                                    </td>
                                                                    <td className="px-4 py-2 text-center text-gray-500 font-mono">{task.periodeLabel}</td>
                                                                    <td className="px-4 py-2 text-blue-600">
                                                                        {task.jabatan} <span className="text-gray-400">({task.volume} vol)</span>
                                                                    </td>
                                                                    <td className="px-4 py-2 text-right font-mono text-gray-600">{formatRupiah(task.totalHonor)}</td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
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