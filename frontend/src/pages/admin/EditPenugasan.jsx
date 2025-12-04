import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';
import { FaSave, FaArrowLeft, FaUserTie, FaClipboardList } from 'react-icons/fa';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const EditPenugasan = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [penugasan, setPenugasan] = useState({});
  const [users, setUsers] = useState([]); // List user untuk pengawas

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        const headers = { Authorization: `Bearer ${token}` };

        const [resPenugasan, resUsers] = await Promise.all([
          axios.get(`${API_URL}/api/penugasan/${id}`, { headers }),
          axios.get(`${API_URL}/api/users`, { headers }) // Endpoint user (pastikan role admin)
        ]);

        setPenugasan(resPenugasan.data);
        setUsers(resUsers.data); // Filter admin/pengawas jika perlu
      } catch (err) {
        Swal.fire('Error', 'Gagal memuat data.', 'error');
        navigate('/admin/penugasan');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API_URL}/api/penugasan/${id}`, {
        id_pengawas: penugasan.id_pengawas
      }, { headers: { Authorization: `Bearer ${token}` } });

      Swal.fire('Berhasil', 'Data penugasan diperbarui.', 'success').then(() => {
        navigate('/admin/penugasan');
      });
    } catch (err) {
      Swal.fire('Gagal', err.response?.data?.error || 'Terjadi kesalahan.', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="text-center py-10">Memuat...</div>;

  return (
    <div className="max-w-2xl mx-auto pb-20">
      <div className="mb-6">
        <Link to="/admin/penugasan" className="flex items-center gap-2 text-gray-500 hover:text-blue-600 mb-2">
            <FaArrowLeft /> Kembali
        </Link>
        <h1 className="text-2xl font-bold text-gray-800">Edit Penugasan</h1>
      </div>

      <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
        <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Read Only Info */}
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Sub Kegiatan (Tetap)</label>
                <div className="flex items-center gap-2 text-gray-800 font-bold">
                    <FaClipboardList className="text-blue-600"/>
                    {penugasan.nama_sub_kegiatan}
                </div>
                <div className="text-xs text-gray-500 mt-1 ml-6">Induk: {penugasan.nama_kegiatan}</div>
            </div>

            {/* Edit Pengawas */}
            <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Pengawas / Ketua Tim</label>
                <div className="relative">
                    <FaUserTie className="absolute left-3 top-3 text-gray-400" />
                    <select 
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none"
                        value={penugasan.id_pengawas}
                        onChange={(e) => setPenugasan({...penugasan, id_pengawas: e.target.value})}
                    >
                        {users.map(u => (
                            <option key={u.id} value={u.id}>{u.username} ({u.role})</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="flex justify-end pt-4">
                <button type="submit" disabled={saving} className="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-bold hover:bg-blue-700 transition shadow-lg flex items-center gap-2 disabled:opacity-50">
                    {saving ? 'Menyimpan...' : <><FaSave /> Simpan Perubahan</>}
                </button>
            </div>
        </form>
      </div>
    </div>
  );
};

export default EditPenugasan;