import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const DetailMitra = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [mitra, setMitra] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDetail = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API_URL}/api/mitra/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setMitra(response.data);
      } catch (err) {
        console.error(err);
        setError(err.response?.data?.error || 'Gagal memuat detail mitra.');
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchDetail();
  }, [id]);

  const handleDelete = async () => {
    if (!window.confirm("Yakin hapus mitra ini? Data tidak bisa dikembalikan.")) return;
    try {
        const token = localStorage.getItem('token');
        await axios.delete(`${API_URL}/api/mitra/${id}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        alert("Mitra berhasil dihapus.");
        navigate('/admin/pengajuan-mitra'); // Kembali ke daftar
    } catch (err) {
        alert("Gagal menghapus mitra.");
    }
  };

  if (loading) return <div className="p-8 text-center">Memuat detail...</div>;
  if (error) return <div className="p-8 text-center text-red-600">Error: {error}</div>;
  if (!mitra) return <div className="p-8 text-center">Data tidak ditemukan.</div>;

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <Link to="/admin/pengajuan-mitra" className="text-indigo-600 hover:underline mb-4 inline-block">
        &larr; Kembali ke Daftar Mitra
      </Link>

      <div className="bg-white shadow-lg rounded-xl overflow-hidden border border-gray-200">
        {/* Header Card */}
        <div className="bg-indigo-600 px-6 py-4 flex justify-between items-center text-white">
            <div>
                <h1 className="text-2xl font-bold">{mitra.nama_lengkap}</h1>
                <p className="text-indigo-200 text-sm mt-1">{mitra.jabatan || 'Mitra'}</p>
            </div>
            <div className="text-right">
                 <span className="bg-indigo-500 px-3 py-1 rounded text-xs font-mono">ID: {mitra.id}</span>
            </div>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Informasi Pribadi */}
            <div>
                <h3 className="text-gray-500 font-bold uppercase text-xs tracking-wider mb-3 border-b pb-2">Data Pribadi</h3>
                <dl className="space-y-3 text-sm">
                    <div>
                        <dt className="text-gray-500">NIK</dt>
                        <dd className="font-medium text-gray-900">{mitra.nik}</dd>
                    </div>
                    <div>
                        <dt className="text-gray-500">Alamat</dt>
                        <dd className="font-medium text-gray-900">{mitra.alamat}</dd>
                    </div>
                    <div>
                        <dt className="text-gray-500">No. HP</dt>
                        <dd className="font-medium text-gray-900">{mitra.no_hp}</dd>
                    </div>
                    <div>
                        <dt className="text-gray-500">Email</dt>
                        <dd className="font-medium text-gray-900">{mitra.email}</dd>
                    </div>
                </dl>
            </div>

            {/* Informasi Keuangan */}
            <div>
                <h3 className="text-gray-500 font-bold uppercase text-xs tracking-wider mb-3 border-b pb-2">Data Keuangan</h3>
                <dl className="space-y-3 text-sm">
                    <div>
                        <dt className="text-gray-500">Nama Bank</dt>
                        <dd className="font-medium text-gray-900">{mitra.nama_bank}</dd>
                    </div>
                    <div>
                        <dt className="text-gray-500">Nomor Rekening</dt>
                        <dd className="font-medium text-gray-900 bg-gray-50 p-2 rounded border border-gray-200 inline-block">
                            {mitra.no_rekening}
                        </dd>
                    </div>
                    <div>
                        <dt className="text-gray-500">Batas Honor Bulanan</dt>
                        <dd className="font-bold text-green-600 text-lg">
                            Rp {Number(mitra.batas_honor_bulanan).toLocaleString('id-ID')}
                        </dd>
                    </div>
                </dl>
            </div>
        </div>
        
        {/* Footer Actions */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
             {/* Jika ingin edit, bisa diarahkan ke halaman edit user atau buat popup */}
             <button 
                onClick={handleDelete}
                className="px-4 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200 text-sm font-bold transition"
             >
                Hapus Mitra
             </button>
        </div>
      </div>
    </div>
  );
};

export default DetailMitra;