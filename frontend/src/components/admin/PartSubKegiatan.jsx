// src/components/admin/PartSubKegiatan.jsx
import React from 'react';
import { 
  FaTrash, 
  FaPlus, 
  FaCalendarAlt, 
  FaBullhorn, 
  FaClipboardList, 
  FaAlignLeft 
} from 'react-icons/fa';

const PartSubKegiatan = ({ subKegiatans, setSubKegiatans }) => {
  
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
        close_req: ''  
      } 
    ]);
  };

  const removeSubKegiatan = (id) => {
    setSubKegiatans(subKegiatans.filter(sub => sub.id !== id));
  };

  const handleChange = (id, event) => {
    const { name, value } = event.target;
    setSubKegiatans(
      subKegiatans.map(sub => 
        sub.id === id ? { ...sub, [name]: value } : sub
      )
    );
  };

  return (
    <div className="bg-white shadow-sm rounded-xl border border-gray-100 overflow-hidden">
      
      {/* Header Bagian */}
      <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
        <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          <span className="text-[#1A2A80]"><FaClipboardList /></span>
          Rincian Sub Kegiatan
        </h2>
        <span className="text-xs font-bold text-[#1A2A80] bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
          Total: {subKegiatans.length}
        </span>
      </div>
      
      <div className="p-6 space-y-6">
        {subKegiatans.length === 0 && (
            <div className="text-center py-8 text-gray-400 italic border-2 border-dashed border-gray-100 rounded-xl">
                Belum ada sub kegiatan yang ditambahkan.
            </div>
        )}

        {subKegiatans.map((sub, index) => (
          <div key={sub.id} className="p-6 border border-gray-200 rounded-xl relative bg-white hover:border-blue-300 transition-colors shadow-sm group">
            
            {/* Header Item */}
            <div className="flex justify-between items-center mb-6 pb-3 border-b border-gray-100">
               <h3 className="font-bold text-md text-[#1A2A80] flex items-center gap-2">
                 <span className="bg-blue-100 text-[#1A2A80] w-6 h-6 flex items-center justify-center rounded-full text-xs">
                    {index + 1}
                 </span>
                 Data Sub Kegiatan
               </h3>
               <button
                 type="button"
                 onClick={() => removeSubKegiatan(sub.id)}
                 className="text-gray-400 hover:text-red-600 transition p-2 rounded-full hover:bg-red-50"
                 title="Hapus Sub Kegiatan"
               >
                 <FaTrash size={14} />
               </button>
            </div>

            {/* --- FORM INPUT (Semua Vertikal / Stack) --- */}
            <div className="flex flex-col gap-5">
                
                {/* Nama Kegiatan */}
                <div>
                    <label className="block text-xs font-bold text-gray-600 uppercase mb-1.5">Nama Kegiatan <span className="text-red-500">*</span></label>
                    <input
                        type="text"
                        name="nama_sub_kegiatan"
                        placeholder="Contoh: Pencacahan Lapangan"
                        value={sub.nama_sub_kegiatan}
                        onChange={(e) => handleChange(sub.id, e)}
                        className="block w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1A2A80] focus:border-[#1A2A80] text-sm transition outline-none"
                        required
                    />
                </div>

                {/* Tahun Periode */}
                <div>
                    <label className="block text-xs font-bold text-gray-600 uppercase mb-1.5">Tahun Periode</label>
                    <input
                        type="number"
                        name="periode"
                        placeholder="YYYY"
                        min="2000"
                        max="2099"
                        value={sub.periode}
                        onChange={(e) => handleChange(sub.id, e)}
                        className="block w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1A2A80] focus:border-[#1A2A80] text-sm transition outline-none"
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
                        placeholder="Jelaskan detail kegiatan ini..."
                        value={sub.deskripsi}
                        onChange={(e) => handleChange(sub.id, e)}
                        className="block w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1A2A80] focus:border-[#1A2A80] text-sm transition outline-none resize-none"
                    />
                </div>

                {/* Jadwal Pelaksanaan (Vertikal) */}
                <div className="bg-gray-50 p-5 rounded-xl border border-gray-200 mt-2">
                    <p className="text-xs font-bold text-gray-700 mb-4 uppercase flex items-center gap-2 border-b border-gray-200 pb-2">
                        <FaCalendarAlt className="text-[#1A2A80]" /> Jadwal Pelaksanaan
                    </p>
                    <div className="space-y-4">
                        <div>
                            <label className="text-xs text-gray-500 font-semibold mb-1 block">Tanggal Mulai</label>
                            <input
                                type="date"
                                name="tanggal_mulai"
                                value={sub.tanggal_mulai}
                                onChange={(e) => handleChange(sub.id, e)}
                                className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#1A2A80] focus:border-[#1A2A80] text-sm bg-white"
                            />
                        </div>
                        <div>
                            <label className="text-xs text-gray-500 font-semibold mb-1 block">Tanggal Selesai</label>
                            <input
                                type="date"
                                name="tanggal_selesai"
                                value={sub.tanggal_selesai}
                                onChange={(e) => handleChange(sub.id, e)}
                                className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#1A2A80] focus:border-[#1A2A80] text-sm bg-white"
                            />
                        </div>
                    </div>
                </div>

                {/* Jadwal Rekrutmen (Vertikal) */}
                <div className="bg-blue-50 p-5 rounded-xl border border-blue-100">
                    <p className="text-xs font-bold text-[#1A2A80] mb-4 uppercase flex items-center gap-2 border-b border-blue-200 pb-2">
                        <FaBullhorn /> Open Recruitment
                    </p>
                    <div className="space-y-4">
                        <div>
                            <label className="text-xs text-blue-700 font-semibold mb-1 block">Buka Pendaftaran</label>
                            <input
                                type="date"
                                name="open_req"
                                value={sub.open_req}
                                onChange={(e) => handleChange(sub.id, e)}
                                className="block w-full px-3 py-2 border border-blue-200 rounded-lg focus:ring-[#1A2A80] focus:border-[#1A2A80] text-sm bg-white"
                            />
                        </div>
                        <div>
                            <label className="text-xs text-blue-700 font-semibold mb-1 block">Tutup Pendaftaran</label>
                            <input
                                type="date"
                                name="close_req"
                                value={sub.close_req}
                                onChange={(e) => handleChange(sub.id, e)}
                                className="block w-full px-3 py-2 border border-blue-200 rounded-lg focus:ring-[#1A2A80] focus:border-[#1A2A80] text-sm bg-white"
                            />
                        </div>
                    </div>
                </div>

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

export default PartSubKegiatan;