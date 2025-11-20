import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate, Link } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const DetailPengajuanMitra = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [data, setData] = useState(null);
  const [batasHonor, setBatasHonor] = useState('');
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/pengajuan-mitra/${id}`);
        setData(res.data);
      } catch (err) {
        setError('Gagal memuat detail pengajuan.');
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [id]);

  const handleApprove = async (e) => {
    e.preventDefault();
    if (!window.confirm('Apakah Anda yakin ingin menyetujui dan menjadikan user ini mitra resmi?')) return;
    
    setProcessing(true);
    setError('');

    try {
      // Kirim request approve ke backend
      await axios.post(`${API_URL}/api/pengajuan-mitra/${id}/approve`, {
        batas_honor_bulanan: parseFloat(batasHonor)
      });
      
      alert('Berhasil! User kini telah menjadi Mitra.');
      navigate('/admin/pengajuan-mitra'); // Kembali ke daftar
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Gagal melakukan approval.');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) return <div className="p-8 text-center">Memuat detail...</div>;
  if (!data) return <div className="p-8 text-center">Data tidak ditemukan.</div>;

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <Link to="/admin/pengajuan-mitra" className="text-indigo-600 hover:underline mb-4 inline-block">&larr; Kembali</Link>
      
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Detail Pengajuan</h1>
        <span className={`px-3 py-1 rounded-full text-sm font-bold capitalize
            ${data.status === 'approved' ? 'bg-green-100 text-green-800' : 
              data.status === 'rejected' ? 'bg-red-100 text-red-800' : 
              'bg-yellow-100 text-yellow-800'}`}>
            {data.status}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Kartu Informasi Diri */}
        <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4 border-b pb-2">Data Diri</h2>
            <div className="space-y-3">
                <p><span className="font-medium text-gray-600">Nama:</span> <br/>{data.nama_lengkap}</p>
                <p><span className="font-medium text-gray-600">NIK:</span> <br/>{data.nik}</p>
                <p><span className="font-medium text-gray-600">Alamat:</span> <br/>{data.alamat}</p>
                <p><span className="font-medium text-gray-600">No. HP:</span> <br/>{data.no_hp}</p>
                <p><span className="font-medium text-gray-600">Email:</span> <br/>{data.email}</p>
            </div>
        </div>

        {/* Kartu Informasi Bank & Approval */}
        <div className="space-y-6">
            <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4 border-b pb-2">Data Keuangan</h2>
                <div className="space-y-3">
                    <p><span className="font-medium text-gray-600">Bank:</span> <br/>{data.nama_bank}</p>
                    <p><span className="font-medium text-gray-600">No. Rekening:</span> <br/>{data.no_rekening}</p>
                </div>
            </div>

            {/* Form Approval hanya muncul jika status masih pending */}
            {data.status === 'pending' && (
                <div className="bg-blue-50 border border-blue-200 shadow rounded-lg p-6">
                    <h2 className="text-xl font-semibold mb-4 text-blue-800">Proses Persetujuan</h2>
                    
                    {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4 text-sm">{error}</div>}

                    <form onSubmit={handleApprove}>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Tentukan Batas Honor Bulanan (Rp)
                            </label>
                            <input 
                                type="number" 
                                value={batasHonor}
                                onChange={(e) => setBatasHonor(e.target.value)}
                                placeholder="Contoh: 2000000"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                required
                            />
                        </div>
                        <button 
                            type="submit" 
                            disabled={processing}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition disabled:bg-gray-400"
                        >
                            {processing ? 'Memproses...' : 'Terima & Jadikan Mitra'}
                        </button>
                    </form>
                </div>
            )}
            
            {data.status === 'approved' && (
                <div className="bg-green-50 border border-green-200 p-4 rounded text-center text-green-800">
                    Mitra ini sudah disetujui.
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default DetailPengajuanMitra;