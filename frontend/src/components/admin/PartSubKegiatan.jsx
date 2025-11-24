import React from 'react';

const PartSubKegiatan = ({ subKegiatans, setSubKegiatans }) => {
  
  const addSubKegiatan = () => {
    setSubKegiatans([
      ...subKegiatans,
      { 
        id: Date.now(), 
        nama_sub_kegiatan: '', 
        deskripsi: '',
        open_req: '',  // Default kosong
        close_req: ''  // Default kosong
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
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-xl font-semibold mb-4">Daftar Kegiatan & Jadwal Rekrutmen</h2>
      
      <div className="space-y-4 mb-4">
        {subKegiatans.map((sub, index) => (
          <div key={sub.id} className="p-4 border rounded-md relative bg-gray-50">
            <h3 className="font-medium text-gray-800 mb-2">Kegiatan #{index + 1}</h3>
            
            {subKegiatans.length > 1 && (
              <button
                type="button"
                onClick={() => removeSubKegiatan(sub.id)}
                className="absolute top-2 right-2 text-red-500 hover:text-red-700 font-bold text-lg"
              >
                &times;
              </button>
            )}

            {/* Nama & Deskripsi */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Nama Kegiatan (Wajib)</label>
                    <input
                        type="text"
                        name="nama_sub_kegiatan"
                        value={sub.nama_sub_kegiatan}
                        onChange={(e) => handleChange(sub.id, e)}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        required
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Deskripsi</label>
                    <input
                        type="text"
                        name="deskripsi"
                        value={sub.deskripsi}
                        onChange={(e) => handleChange(sub.id, e)}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                </div>
            </div>

            {/* Jadwal Rekrutmen (NEW) */}
            <div className="bg-blue-50 p-3 rounded border border-blue-200">
                <p className="text-xs font-bold text-blue-700 mb-2 uppercase">Jadwal Open Recruitment (Pendaftaran)</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-medium text-gray-600">Buka Pendaftaran</label>
                        <input
                            type="date"
                            name="open_req"
                            value={sub.open_req}
                            onChange={(e) => handleChange(sub.id, e)}
                            className="mt-1 block w-full px-3 py-1.5 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500 text-sm"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-600">Tutup Pendaftaran</label>
                        <input
                            type="date"
                            name="close_req"
                            value={sub.close_req}
                            onChange={(e) => handleChange(sub.id, e)}
                            className="mt-1 block w-full px-3 py-1.5 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500 text-sm"
                        />
                    </div>
                </div>
            </div>

          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={addSubKegiatan}
        className="w-full py-2 px-4 border border-dashed border-gray-400 text-gray-700 rounded-md hover:bg-gray-50 transition"
      >
        + Tambah Kegiatan Lain
      </button>
    </div>
  );
};

export default PartSubKegiatan;