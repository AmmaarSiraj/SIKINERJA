import React from 'react';

/**
 * Komponen ini adalah "controlled component".
 * State-nya (array subKegiatans) dikelola oleh komponen induk (AddKegiatan.jsx).
 * Menerima props:
 * - subKegiatans: Array dari objek sub-kegiatan
 * - setSubKegiatans: Fungsi setter dari useState di induk
 */
const PartSubKegiatan = ({ subKegiatans, setSubKegiatans }) => {
  
  // Fungsi untuk menambah field sub-kegiatan baru
  const addSubKegiatan = () => {
    setSubKegiatans([
      ...subKegiatans,
      // id sementara hanya untuk React key, tidak akan dikirim ke DB
      { id: Date.now(), nama_sub_kegiatan: '', deskripsi: '' } 
    ]);
  };

  // Fungsi untuk menghapus field sub-kegiatan berdasarkan id sementaranya
  const removeSubKegiatan = (id) => {
    setSubKegiatans(subKegiatans.filter(sub => sub.id !== id));
  };

  // Fungsi untuk meng-update data di salah satu field
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
      <h2 className="text-xl font-semibold mb-4">Daftar Sub Kegiatan</h2>
      
      <div className="space-y-4 mb-4">
        {subKegiatans.map((sub, index) => (
          <div key={sub.id} className="p-4 border rounded-md relative">
            <h3 className="font-medium text-gray-800 mb-2">Sub Kegiatan #{index + 1}</h3>
            
            {/* Tombol Hapus */}
            {subKegiatans.length > 1 && ( // Hanya tampilkan jika lebih dari 1
              <button
                type="button"
                onClick={() => removeSubKegiatan(sub.id)}
                className="absolute top-2 right-2 text-red-500 hover:text-red-700 font-bold text-lg"
                title="Hapus Sub Kegiatan"
              >
                &times;
              </button>
            )}

            {/* Form Fields */}
            <div className="mb-2">
              <label htmlFor={`nama_sub_kegiatan_${sub.id}`} className="block text-sm font-medium text-gray-700">
                Nama Sub Kegiatan (Wajib)
              </label>
              <input
                type="text"
                id={`nama_sub_kegiatan_${sub.id}`}
                name="nama_sub_kegiatan"
                value={sub.nama_sub_kegiatan}
                onChange={(e) => handleChange(sub.id, e)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                required
              />
            </div>
            <div>
              <label htmlFor={`deskripsi_${sub.id}`} className="block text-sm font-medium text-gray-700">
                Deskripsi
              </label>
              <textarea
                id={`deskripsi_${sub.id}`}
                name="deskripsi"
                value={sub.deskripsi}
                onChange={(e) => handleChange(sub.id, e)}
                rows="2"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              ></textarea>
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={addSubKegiatan}
        className="w-full py-2 px-4 border border-dashed border-gray-400 text-gray-700 rounded-md hover:bg-gray-50"
      >
        + Tambah Sub Kegiatan Lain
      </button>
    </div>
  );
};

export default PartSubKegiatan;