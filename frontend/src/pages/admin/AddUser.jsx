import { useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom'; // 1. Import useNavigate

const AddUser = () => {
  const navigate = useNavigate(); // 2. Inisialisasi hook navigasi
  
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('user');
  
  const [error, setError] = useState('');
  
  // State 'success' sudah tidak diperlukan karena kita akan langsung redirect
  // const [success, setSuccess] = useState(''); 

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    // setSuccess(''); // Tidak perlu lagi

    // Validasi sederhana di frontend
    if (!username || !email || !password) {
      setError('Username, Email, dan Password wajib diisi.');
      return;
    }

    try {
      // Panggil endpoint register dari backend Anda
      await axios.post(
        'http://localhost:3000/api/users/register', 
        {
          username,
          email,
          password,
          role
        }
      );

      // 3. JIKA SUKSES: Langsung arahkan (redirect) kembali ke halaman manage-users
      navigate('/admin/manage-users');

    } catch (err) {
      // Tangani error dari API (seperti email duplikat)
      console.error("Gagal menambah user:", err);
      setError(err.response?.data?.message || "Gagal menambah user. Silakan coba lagi.");
    }
  };

  return (
    <div className="container mx-auto max-w-2xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Tambah User Baru</h1>
        <Link 
          to="/admin/manage-users" 
          className="text-blue-600 hover:text-blue-800"
        >
          &larr; Kembali ke Daftar User
        </Link>
      </div>

      <form 
        onSubmit={handleSubmit} 
        className="bg-white p-8 rounded-lg shadow-md space-y-6"
      >
        {/* Hapus pesan Sukses (karena kita langsung redirect) */}
        {/* {success && ( ... )} */}

        {/* Pesan Error */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
            {error}
          </div>
        )}

        {/* Username */}
        <div>
          <label 
            htmlFor="username" 
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Username
          </label>
          <input
            type="text"
            id="username"
            className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>

        {/* Email */}
        <div>
          <label 
            htmlFor="email" 
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Alamat Email
          </label>
          <input
            type="email"
            id="email"
            className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            placeholder="email@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        {/* Password */}
        <div>
          <label 
            htmlFor="password" 
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Password
          </label>
          <input
            type="password"
            id="password"
            className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            placeholder="Minimal 6 karakter"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {/* Role */}
        <div>
          <label 
            htmlFor="role" 
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Role
          </label>
          <select
            id="role"
            className="block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            value={role}
            onChange={(e) => setRole(e.target.value)}
          >
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>
        </div>

        {/* Tombol Submit */}
        <div>
          <button
            type="submit"
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Simpan User
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddUser;