import React, { useState, useEffect } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

/**
 * Komponen ini mengelola (fetch, create, update, delete)
 * sub-kegiatan yang terkait dengan sebuah kegiatanId.
 *
 * Props:
 * - kegiatanId: ID dari kegiatan induk
 */
const PartEditSubKegiatan = ({ kegiatanId }) => {
  const [subKegiatans, setSubKegiatans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Fungsi untuk mengambil data sub-kegiatan
  const fetchSubKegiatans = async () => {
    if (!kegiatanId) return;
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Token tidak ditemukan');

      // Asumsi endpoint: GET /api/subkegiatan/kegiatan/:kegiatanId
      const response = await fetch(`${API_URL}/api/subkegiatan/kegiatan/${kegiatanId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || 'Gagal memuat sub-kegiatan');
      }

      const data = await response.json();
      // Tambahkan properti isNew: false untuk membedakan dengan item baru
      const existingSubs = (data.data || data).map(sub => ({ ...sub, isNew: false, isLoading: false }));
      setSubKegiatans(existingSubs);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 1. Ambil data saat komponen dimuat
  useEffect(() => {
    fetchSubKegiatans();
  }, [kegiatanId]);

  // 2. Handler untuk mengubah input
  const handleChange = (id, e) => {
    const { name, value } = e.target;
    setSubKegiatans(subs =>
      subs.map(sub => (sub.id === id ? { ...sub, [name]: value } : sub))
    );
    // Hapus pesan error/sukses jika user mulai mengetik
    if (error) setError(null);
    if (success) setSuccess(null);
  };

  // 3. Handler untuk menambah field sub-kegiatan baru (di lokal)
  const addSubKegiatan = () => {
    setSubKegiatans([
      ...subKegiatans,
      { 
        id: Date.now(), // ID sementara untuk React key
        nama_sub_kegiatan: '', 
        deskripsi: '',
        isNew: true, // Tandai sebagai item baru
        isLoading: false
      } 
    ]);
  };

  // 4. Handler untuk menghapus field sub-kegiatan baru (dari lokal)
  const removeLocalSubKegiatan = (id) => {
    setSubKegiatans(subKegiatans.filter(sub => sub.id !== id));
  };
  
  // 5. Handler untuk MENYIMPAN sub-kegiatan baru
  const handleSaveNew = async (tempId) => {
    setError(null);
    setSuccess(null);
    
    const subToSave = subKegiatans.find(s => s.id === tempId);
    if (!subToSave || !subToSave.nama_sub_kegiatan) {
      setError('Nama sub kegiatan baru tidak boleh kosong.');
      return;
    }

    setSubKegiatans(subs => 
      subs.map(s => s.id === tempId ? { ...s, isLoading: true } : s)
    );

    try {
      const token = localStorage.getItem('token');
      const payload = {
        nama_sub_kegiatan: subToSave.nama_sub_kegiatan,
        deskripsi: subToSave.deskripsi,
        kegiatan_id: parseInt(kegiatanId, 10),
      };

      const response = await fetch(`${API_URL}/api/subkegiatan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || 'Gagal menambah kegiatan');
      }

      setSuccess('kegiatan baru berhasil ditambahkan!');
      await fetchSubKegiatans(); // Ambil ulang daftar untuk mendapat ID asli
      
    } catch (err) {
      setError(err.message);
      // Jika error, biarkan item tetap di form
      setSubKegiatans(subs => 
        subs.map(s => s.id === tempId ? { ...s, isLoading: false } : s)
      );
    }
    // 'finally' tidak diperlukan karena fetchSubKegiatans() sudah me-reset state
  };

  // 6. Handler untuk UPDATE sub-kegiatan yang ada
  const handleUpdate = async (id) => {
    setError(null);
    setSuccess(null);
    
    const subToUpdate = subKegiatans.find(s => s.id === id);
    if (!subToUpdate || !subToUpdate.nama_sub_kegiatan) {
      setError('Nama Kegiatan tidak boleh kosong.');
      return;
    }
    
    setSubKegiatans(subs => 
      subs.map(s => s.id === id ? { ...s, isLoading: true } : s)
    );

    try {
      const token = localStorage.getItem('token');
      const payload = {
        nama_sub_kegiatan: subToUpdate.nama_sub_kegiatan,
        deskripsi: subToUpdate.deskripsi,
      };

      const response = await fetch(`${API_URL}/api/subkegiatan/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || 'Gagal update Kegiatan');
      }

      setSuccess(`Kegiatan #${id} berhasil diperbarui.`);
      // Set isLoading: false secara manual agar tidak ada "lompatan" UI
      setSubKegiatans(subs => 
        subs.map(s => s.id === id ? { ...s, isLoading: false } : s)
      );
      
    } catch (err) {
      setError(err.message);
      setSubKegiatans(subs => 
        subs.map(s => s.id === id ? { ...s, isLoading: false } : s)
      );
    }
  };

  // 7. Handler untuk HAPUS sub-kegiatan (dari DB)
  const handleRemove = async (id) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus Kegiatan ini?')) {
      return;
    }
    setError(null);
    setSuccess(null);
    
    setSubKegiatans(subs => 
      subs.map(s => s.id === id ? { ...s, isLoading: true } : s)
    );
    
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${API_URL}/api/subkegiatan/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || 'Gagal menghapus Kegiatan');
      }

      setSuccess(`Kegiatan #${id} berhasil dihapus.`);
      // Hapus item dari state secara lokal
      removeLocalSubKegiatan(id);
      
    } catch (err) {
      setError(err.message);
      setSubKegiatans(subs => 
        subs.map(s => s.id === id ? { ...s, isLoading: false } : s)
      );
    }
  };


  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-xl font-semibold mb-4">Kelola Kegiatan</h2>
      
      {/* Notifikasi Global */}
      {error && <div className="text-red-600 mb-4">Error: {error}</div>}
      {success && <div className="text-green-600 mb-4">{success}</div>}
      
      {/* Daftar Sub Kegiatan (Mirip PartSubKegiatan) */}
      <div className="space-y-4 mb-4">
        {loading && <p>Memuat Kegiatan...</p>}
        
        {!loading && subKegiatans.length === 0 && (
          <p className="text-gray-500 text-center py-4">Belum ada Kegiatan.</p>
        )}

        {subKegiatans.map((sub, index) => (
          <div key={sub.id} className={`p-4 border rounded-md relative ${sub.isNew ? 'bg-indigo-50 border-indigo-200' : ''}`}>
            <h3 className="font-medium text-gray-800 mb-2">
              Kegiatan #{index + 1} {sub.isNew ? '(Baru)' : `(ID: ${sub.id})`}
            </h3>
            
            <div className="mb-2">
              <label htmlFor={`nama_sub_kegiatan_${sub.id}`} className="block text-sm font-medium text-gray-700">
                Nama Kegiatan (Wajib)
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
                value={sub.deskripsi || ''}
                onChange={(e) => handleChange(sub.id, e)}
                rows="2"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              ></textarea>
            </div>
            
            {/* Tombol Aksi per Item */}
            <div className="flex items-center justify-end gap-2 mt-3">
              {sub.isNew ? (
                <>
                  <button
                    type="button"
                    onClick={() => removeLocalSubKegiatan(sub.id)}
                    disabled={sub.isLoading}
                    className="text-sm text-red-600 hover:underline disabled:text-gray-400"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSaveNew(sub.id)}
                    disabled={sub.isLoading}
                    className="px-3 py-1 text-sm border border-transparent rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400"
                  >
                    {sub.isLoading ? 'Menyimpan...' : 'Simpan Baru'}
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => handleRemove(sub.id)}
                    disabled={sub.isLoading}
                    className="text-sm text-red-600 hover:underline disabled:text-gray-400"
                  >
                    {sub.isLoading ? '...' : 'Hapus'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleUpdate(sub.id)}
                    disabled={sub.isLoading}
                    className="px-3 py-1 text-sm border border-transparent rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-gray-400"
                  >
                    {sub.isLoading ? 'Menyimpan...' : 'Update'}
                  </button>
                </>
              )}
            </div>

          </div>
        ))}
      </div>

      {/* Tombol Tambah di Bawah */}
      <button
        type="button"
        onClick={addSubKegiatan}
        disabled={loading}
        className="w-full py-2 px-4 border border-dashed border-gray-400 text-gray-700 rounded-md hover:bg-gray-50"
      >
        + Tambah Kegiatan Lain
      </button>
    </div>
  );
};

export default PartEditSubKegiatan;