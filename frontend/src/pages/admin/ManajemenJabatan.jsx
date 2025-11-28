import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ManajemenJabatan = () => {
  const [jabatanList, setJabatanList] = useState([]);
  const [formData, setFormData] = useState({
    kode_jabatan: '',
    nama_jabatan: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // 1. Fetch Data Jabatan saat halaman dimuat
  useEffect(() => {
    fetchJabatan();
  }, []);

  const fetchJabatan = async () => {
    try {
      setLoading(true);
      // Endpoint sesuai backend
      const response = await axios.get('http://localhost:3000/api/jabatan-mitra');
      setJabatanList(response.data);
      setLoading(false);
    } catch (err) {
      console.error("Gagal mengambil data:", err);
      setLoading(false);
    }
  };

  // 2. Handle Input Form
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // 3. Simpan Jabatan Baru
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.kode_jabatan || !formData.nama_jabatan) {
      setError("Kode dan Nama Jabatan wajib diisi!");
      return;
    }

    try {
      await axios.post('http://localhost:3000/api/jabatan-mitra', formData);
      setSuccess('Jabatan berhasil ditambahkan.');
      setFormData({ kode_jabatan: '', nama_jabatan: '' }); // Reset form
      fetchJabatan(); // Refresh tabel
    } catch (err) {
      const msg = err.response?.data?.error || "Terjadi kesalahan saat menyimpan.";
      setError(msg);
    }
  };

  // 4. Hapus Jabatan
  const handleDelete = async (kode) => {
    if (!window.confirm(`Apakah Anda yakin ingin menghapus jabatan dengan kode ${kode}?`)) return;

    try {
      await axios.delete(`http://localhost:3000/api/jabatan-mitra/${kode}`);
      setSuccess('Jabatan berhasil dihapus.');
      fetchJabatan();
    } catch (err) {
      alert("Gagal menghapus jabatan. Pastikan jabatan tidak sedang digunakan di tabel lain.");
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">Manajemen Jabatan Mitra</h1>

      {/* --- BAGIAN FORM INPUT --- */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-lg font-semibold mb-4 text-gray-700">Tambah Jabatan Baru</h2>
        
        {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">{error}</div>}
        {success && <div className="mb-4 p-3 bg-green-100 text-green-700 rounded">{success}</div>}

        <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-4 items-end">
          <div className="w-full md:w-1/3">
            <label className="block text-sm font-medium text-gray-700 mb-1">Kode Jabatan</label>
            <input
              type="text"
              name="kode_jabatan"
              value={formData.kode_jabatan}
              onChange={handleChange}
              placeholder="Contoh: PPL-01"
              className="w-full border border-gray-300 px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">*Harus unik</p>
          </div>

          <div className="w-full md:w-1/3">
            <label className="block text-sm font-medium text-gray-700 mb-1">Nama Jabatan</label>
            <input
              type="text"
              name="nama_jabatan"
              value={formData.nama_jabatan}
              onChange={handleChange}
              placeholder="Contoh: Petugas Pencacah Lapangan"
              className="w-full border border-gray-300 px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="w-full md:w-auto">
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded transition duration-200"
            >
              Simpan
            </button>
          </div>
        </form>
      </div>

      {/* --- BAGIAN TABEL DATA --- */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-700">Daftar Jabatan Tersedia</h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full text-left">
            <thead className="bg-gray-100 border-b">
              <tr>
                <th className="px-6 py-3 text-xs font-bold text-gray-600 uppercase tracking-wider">No</th>
                <th className="px-6 py-3 text-xs font-bold text-gray-600 uppercase tracking-wider">Kode Jabatan</th>
                <th className="px-6 py-3 text-xs font-bold text-gray-600 uppercase tracking-wider">Nama Jabatan</th>
                <th className="px-6 py-3 text-xs font-bold text-gray-600 uppercase tracking-wider text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="4" className="text-center py-6 text-gray-500">Memuat data...</td>
                </tr>
              ) : jabatanList.length === 0 ? (
                <tr>
                  <td colSpan="4" className="text-center py-6 text-gray-500">Belum ada data jabatan.</td>
                </tr>
              ) : (
                jabatanList.map((item, index) => (
                  <tr key={item.kode_jabatan} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-gray-700">{index + 1}</td>
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{item.kode_jabatan}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-700">{item.nama_jabatan}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <button
                        onClick={() => handleDelete(item.kode_jabatan)}
                        className="bg-red-100 text-red-600 hover:bg-red-200 px-3 py-1 rounded text-sm font-medium transition"
                      >
                        Hapus
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ManajemenJabatan;