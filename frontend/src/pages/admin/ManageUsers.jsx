import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const ManageUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(''); // State untuk pesan sukses

  // Fungsi untuk mengambil data user
  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError('');
      // setSuccess(''); // Opsional: hapus pesan sukses saat refresh
      
      const token = localStorage.getItem('token');
      if (!token) {
        setError("Anda tidak terautentikasi. Silakan login kembali.");
        setLoading(false);
        return;
      }

      const response = await axios.get(
        'http://localhost:3000/api/users', 
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );
      
      setUsers(response.data);
    } catch (err) {
      console.error("Gagal mengambil data users:", err);
      setError(err.response?.data?.message || "Gagal mengambil data users.");
    } finally {
      setLoading(false);
    }
  };

  // useEffect untuk memuat data saat komponen pertama kali render
  useEffect(() => {
    fetchUsers();
  }, []); // [] dependency array berarti hanya berjalan sekali

  
  // --- FUNGSI BARU UNTUK DELETE ---
  const handleDelete = async (userId, username) => {
    // 1. Tampilkan konfirmasi
    if (!window.confirm(`Apakah Anda yakin ingin menghapus user "${username}"?`)) {
      return; // Batalkan jika user menekan "Cancel"
    }

    try {
      setError('');
      setSuccess('');
      
      const token = localStorage.getItem('token');
      if (!token) {
        setError("Autentikasi gagal. Silakan login kembali.");
        return;
      }

      // 2. Panggil endpoint DELETE /api/users/:id
      const response = await axios.delete(
        `http://localhost:3000/api/users/${userId}`, //
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );

      // 3. Tampilkan pesan sukses dari backend
      setSuccess(response.data.message || 'User berhasil dihapus.'); //

      // 4. Update state di frontend untuk menghapus user dari daftar
      // Ini lebih efisien daripada memanggil fetchUsers() lagi
      setUsers(users.filter(user => user.id !== userId));

    } catch (err) {
      console.error("Gagal menghapus user:", err);
      setError(err.response?.data?.message || "Gagal menghapus user.");
    }
  };
  // --- AKHIR FUNGSI BARU ---


  // Tampilkan pesan loading
  if (loading) {
    return <div className="text-center p-10">Loading data user...</div>;
  }

  return (
    <div className="container mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Manajemen User</h1>
      
      <div className="mb-4">
        <Link
          to="/admin/add-user"
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          + Tambah User Baru
        </Link>
      </div>

      {/* Tampilkan pesan error jika ada */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
          Error: {error}
        </div>
      )}

      {/* Tampilkan pesan sukses jika ada */}
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4" role="alert">
          {success}
        </div>
      )}

      {/* Tabel untuk menampilkan data user */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full leading-normal">
          <thead>
            <tr className="bg-gray-200 text-gray-600 uppercase text-sm">
              <th className="py-3 px-5 text-left">Username</th>
              <th className="py-3 px-5 text-left">Email</th>
              <th className="py-3 px-5 text-left">Role</th>
              <th className="py-3 px-5 text-left">Tanggal Bergabung</th>
              <th className="py-3 px-5 text-left">Aksi</th>
            </tr>
          </thead>
          <tbody className="text-gray-700">
            {users.map((user) => (
              <tr key={user.id} className="border-b border-gray-200 hover:bg-gray-100">
                <td className="py-4 px-5">
                  <p className="font-medium">{user.username}</p>
                </td>
                <td className="py-4 px-5">
                  <p>{user.email}</p>
                </td>
                <td className="py-4 px-5">
                  <span 
                    className={`py-1 px-3 rounded-full text-xs font-medium ${
                      user.role === 'admin' 
                        ? 'bg-blue-200 text-blue-800' 
                        : 'bg-green-200 text-green-800'
                    }`}
                  >
                    {user.role}
                  </span>
                </td>
                <td className="py-4 px-5">
                  {new Date(user.created_at).toLocaleDateString('id-ID', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </td>
                <td className="py-4 px-5">
                  <Link
                    to={`/admin/edit-user/${user.id}`}
                    className="text-sm bg-yellow-500 hover:bg-yellow-600 text-white py-1 px-3 rounded mr-2"
                  >
                    Edit
                  </Link>
                  
                  {/* --- TOMBOL DELETE DIPERBARUI --- */}
                  <button 
                    onClick={() => handleDelete(user.id, user.username)} //
                    className="text-sm bg-red-500 hover:bg-red-600 text-white py-1 px-3 rounded"
                  >
                    Delete
                  </button>
                  {/* --- AKHIR PERUBAHAN TOMBOL --- */}

                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {users.length === 0 && !loading && (
        <p className="text-center text-gray-500 mt-10">Belum ada data user.</p>
      )}
    </div>
  );
};

export default ManageUsers;