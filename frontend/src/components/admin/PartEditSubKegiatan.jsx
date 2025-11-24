// src/components/admin/PartEditSubKegiatan.jsx
import React, { useState, useEffect } from 'react';
import { 
  FaTrash, 
  FaPlus, 
  FaCalendarAlt, 
  FaBullhorn, 
  FaClipboardList, 
  FaAlignLeft,
  FaSave,
  FaSyncAlt,
  FaTimes
} from 'react-icons/fa';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const formatDateForInput = (isoDate) => {
  if (!isoDate) return '';
  try {
    return new Date(isoDate).toISOString().split('T')[0];
  } catch (error) {
    return '';
  }
};

const PartEditSubKegiatan = ({ kegiatanId }) => {
  const [subKegiatans, setSubKegiatans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const fetchSubKegiatans = async () => {
    if (!kegiatanId) return;
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/subkegiatan/kegiatan/${kegiatanId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      const formattedData = (data.data || data).map(sub => ({
        ...sub,
        isNew: false,
        isLoading: false,
        tanggal_mulai: formatDateForInput(sub.tanggal_mulai),
        tanggal_selesai: formatDateForInput(sub.tanggal_selesai),
        open_req: formatDateForInput(sub.open_req),
        close_req: formatDateForInput(sub.close_req),
      }));
      setSubKegiatans(formattedData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubKegiatans();
  }, [kegiatanId]);

  const handleChange = (id, e) => {
    const { name, value } = e.target;
    setSubKegiatans(subs =>
      subs.map(sub => (sub.id === id ? { ...sub, [name]: value } : sub))
    );
    if (error) setError(null);
    if (success) setSuccess(null);
  };

  const addSubKegiatan = () => {
    setSubKegiatans([
      ...subKegiatans,
      { 
        id: Date.now(), 
        nama_sub_kegiatan: '', 
        deskripsi: '',
        periode: new Date().getFullYear().toString(),
        tanggal_mulai: '',
        tanggal_selesai: '',
        open_req: '',
        close_req: '',
        isNew: true, 
        isLoading: false
      } 
    ]);
  };

  const removeLocalSubKegiatan = (id) => {
    setSubKegiatans(subKegiatans.filter(sub => sub.id !== id));
  };
  
  const handleSaveNew = async (tempId) => {
    const subToSave = subKegiatans.find(s => s.id === tempId);
    setSubKegiatans(subs => subs.map(s => s.id === tempId ? { ...s, isLoading: true } : s));
    try {
      const token = localStorage.getItem('token');
      const payload = {
        kegiatan_id: parseInt(kegiatanId, 10),
        nama_sub_kegiatan: subToSave.nama_sub_kegiatan,
        deskripsi: subToSave.deskripsi,
        periode: subToSave.periode,
        tanggal_mulai: subToSave.tanggal_mulai,
        tanggal_selesai: subToSave.tanggal_selesai,
        open_req: subToSave.open_req,
        close_req: subToSave.close_req
      };
      await fetch(`${API_URL}/api/subkegiatan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      setSuccess('Berhasil ditambahkan!');
      await fetchSubKegiatans(); 
    } catch (err) {
      setError("Gagal menyimpan.");
      setSubKegiatans(subs => subs.map(s => s.id === tempId ? { ...s, isLoading: false } : s));
    }
  };

  const handleUpdate = async (id) => {
    const subToUpdate = subKegiatans.find(s => s.id === id);
    setSubKegiatans(subs => subs.map(s => s.id === id ? { ...s, isLoading: true } : s));
    try {
      const token = localStorage.getItem('token');
      await fetch(`${API_URL}/api/subkegiatan/${id}/info`, { 
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(subToUpdate),
      });
      setSuccess(`Data berhasil diperbarui.`);
      setSubKegiatans(subs => subs.map(s => s.id === id ? { ...s, isLoading: false } : s));
    } catch (err) {
      setError("Gagal update.");
      setSubKegiatans(subs => subs.map(s => s.id === id ? { ...s, isLoading: false } : s));
    }
  };

  const handleRemove = async (id) => {
    if (!window.confirm('Hapus permanen?')) return;
    try {
      const token = localStorage.getItem('token');
      await fetch(`${API_URL}/api/subkegiatan/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      setSuccess('Berhasil dihapus.');
      removeLocalSubKegiatan(id);
    } catch (err) {
      setError("Gagal menghapus.");
    }
  };

  return (
    <div className="bg-white shadow-sm rounded-xl border border-gray-100 overflow-hidden">
      
      {/* Header Global */}
      <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
        <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          <span className="text-[#1A2A80]"><FaClipboardList /></span>
          Kelola Rincian Sub Kegiatan
        </h2>
        <span className="text-xs font-bold text-[#1A2A80] bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
          Total: {subKegiatans.length}
        </span>
      </div>

      {/* Notifikasi */}
      {error && <div className="mx-6 mt-4 bg-red-50 text-red-600 px-4 py-2 rounded-lg border border-red-100 text-sm">{error}</div>}
      {success && <div className="mx-6 mt-4 bg-green-50 text-green-600 px-4 py-2 rounded-lg border border-green-100 text-sm">{success}</div>}
      
      <div className="p-6 space-y-6">
        {!loading && subKegiatans.map((sub, index) => (
          <div 
            key={sub.id} 
            className={`border rounded-xl relative transition-all duration-300 ${sub.isNew ? 'bg-blue-50/30 border-blue-200 shadow-md' : 'bg-white border-gray-200 hover:border-blue-300 shadow-sm'}`}
          >
            
            {/* HEADER ITEM */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
               <div className="flex items-center gap-3">
                 <span className={`w-8 h-8 flex items-center justify-center rounded-full text-xs font-bold ${sub.isNew ? 'bg-[#1A2A80] text-white' : 'bg-blue-100 text-[#1A2A80]'}`}>
                    {index + 1}
                 </span>
                 <h3 className="font-bold text-gray-800 text-sm">
                    Sub Kegiatan {sub.isNew ? '(Baru)' : `(ID: ${sub.id})`}
                 </h3>
               </div>

               {/* Tombol Hapus / Batal */}
               {sub.isNew ? (
                  <button onClick={() => removeLocalSubKegiatan(sub.id)} className="text-red-500 hover:bg-red-50 p-2 rounded-full transition" title="Batal">
                    <FaTimes />
                  </button>
               ) : (
                  <button onClick={() => handleRemove(sub.id)} className="text-gray-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-full transition" title="Hapus Permanen">
                    <FaTrash size={14} />
                  </button>
               )}
            </div>

            {/* BODY ITEM (INPUTS - VERTIKAL) */}
            <div className="p-6 flex flex-col gap-5">
                
                {/* Nama Kegiatan */}
                <div>
                    <label className="block text-xs font-bold text-gray-600 uppercase mb-1.5">Nama Kegiatan</label>
                    <input
                        type="text"
                        name="nama_sub_kegiatan"
                        value={sub.nama_sub_kegiatan}
                        onChange={(e) => handleChange(sub.id, e)}
                        className="block w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1A2A80] focus:border-[#1A2A80] text-sm transition outline-none bg-white"
                    />
                </div>

                {/* Tahun Periode */}
                <div>
                    <label className="block text-xs font-bold text-gray-600 uppercase mb-1.5">Tahun Periode</label>
                    <input
                        type="number"
                        name="periode"
                        value={sub.periode || ''}
                        onChange={(e) => handleChange(sub.id, e)}
                        className="block w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1A2A80] focus:border-[#1A2A80] text-sm transition outline-none bg-white"
                    />
                </div>

                {/* Deskripsi */}
                <div>
                    <label className="block text-xs font-bold text-gray-600 uppercase mb-1.5 flex items-center gap-1">
                        <FaAlignLeft className="text-gray-400"/> Deskripsi
                    </label>
                    <textarea
                        name="deskripsi"
                        rows="2"
                        value={sub.deskripsi || ''}
                        onChange={(e) => handleChange(sub.id, e)}
                        className="block w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1A2A80] focus:border-[#1A2A80] text-sm transition outline-none resize-none bg-white"
                    />
                </div>

                {/* Jadwal Pelaksanaan */}
                <div className="bg-gray-50 p-5 rounded-xl border border-gray-200 mt-2">
                    <p className="text-xs font-bold text-gray-700 mb-4 uppercase flex items-center gap-2 border-b border-gray-200 pb-2">
                        <FaCalendarAlt className="text-[#1A2A80]" /> Jadwal Pelaksanaan
                    </p>
                    <div className="space-y-4">
                        <div>
                            <label className="text-xs text-gray-500 font-semibold mb-1 block">Mulai</label>
                            <input type="date" name="tanggal_mulai" value={sub.tanggal_mulai || ''} onChange={(e) => handleChange(sub.id, e)} className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#1A2A80] text-sm bg-white" />
                        </div>
                        <div>
                            <label className="text-xs text-gray-500 font-semibold mb-1 block">Selesai</label>
                            <input type="date" name="tanggal_selesai" value={sub.tanggal_selesai || ''} onChange={(e) => handleChange(sub.id, e)} className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#1A2A80] text-sm bg-white" />
                        </div>
                    </div>
                </div>

                {/* Jadwal Rekrutmen */}
                <div className="bg-blue-50 p-5 rounded-xl border border-blue-100">
                    <p className="text-xs font-bold text-[#1A2A80] mb-4 uppercase flex items-center gap-2 border-b border-blue-200 pb-2">
                        <FaBullhorn /> Open Recruitment
                    </p>
                    <div className="space-y-4">
                        <div>
                            <label className="text-xs text-blue-700 font-semibold mb-1 block">Buka</label>
                            <input type="date" name="open_req" value={sub.open_req || ''} onChange={(e) => handleChange(sub.id, e)} className="block w-full px-3 py-2 border border-blue-200 rounded-lg focus:ring-[#1A2A80] text-sm bg-white" />
                        </div>
                        <div>
                            <label className="text-xs text-blue-700 font-semibold mb-1 block">Tutup</label>
                            <input type="date" name="close_req" value={sub.close_req || ''} onChange={(e) => handleChange(sub.id, e)} className="block w-full px-3 py-2 border border-blue-200 rounded-lg focus:ring-[#1A2A80] text-sm bg-white" />
                        </div>
                    </div>
                </div>

            </div>

            {/* FOOTER ITEM (ACTION BUTTONS) */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 rounded-b-xl flex justify-end">
                {sub.isNew ? (
                    <button onClick={() => handleSaveNew(sub.id)} disabled={sub.isLoading} className="flex items-center gap-2 bg-[#1A2A80] text-white px-5 py-2 rounded-lg text-sm font-bold hover:bg-blue-900 transition shadow-sm disabled:opacity-50">
                        {sub.isLoading ? '...' : <><FaSave /> Simpan Baru</>}
                    </button>
                ) : (
                    <button onClick={() => handleUpdate(sub.id)} disabled={sub.isLoading} className="flex items-center gap-2 bg-green-600 text-white px-5 py-2 rounded-lg text-sm font-bold hover:bg-green-700 transition shadow-sm disabled:opacity-50">
                        {sub.isLoading ? '...' : <><FaSyncAlt /> Update Data</>}
                    </button>
                )}
            </div>

          </div>
        ))}

        <button
            type="button"
            onClick={addSubKegiatan}
            className="w-full py-4 px-6 border-2 border-dashed border-[#1A2A80]/30 text-[#1A2A80] font-bold rounded-xl hover:bg-blue-50 hover:border-[#1A2A80] transition flex items-center justify-center gap-2 group"
        >
            <span className="bg-[#1A2A80] text-white rounded-full p-1 group-hover:scale-110 transition-transform">
                <FaPlus size={10} />
            </span>
            Tambah Sub Kegiatan Lain
        </button>
      </div>
    </div>
  );
};

export default PartEditSubKegiatan;