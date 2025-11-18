import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

// Tentukan API URL, sesuaikan dengan backend Anda
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const Register = () => {
  const [formData, setFormData] = useState({
    // --- PERUBAHAN 1: Ganti 'name' menjadi 'username' ---
    username: '', 
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  // --- PERUBAHAN 2: Sesuaikan destructuring ---
  const { username, email, password, confirmPassword } = formData;

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (password !== confirmPassword) {
      setError('Password dan Konfirmasi Password tidak cocok.');
      return;
    }

    // --- PERUBAHAN 3: Implementasi API call yang sebenarnya ---
    try {
      // Data yang dikirim ke backend harus cocok dengan userController
      const payload = {
        username,
        email,
        password,
        // role tidak perlu dikirim, backend akan default ke 'user'
      };

      // Ganti simulasi dengan axios.post
      await axios.post(
        `${API_URL}/api/users/register`, // Endpoint dari userRoutes.js
        payload
      );
      
      // Jika sukses
      setSuccess("Registrasi berhasil! Anda akan diarahkan ke halaman login.");
      setTimeout(() => {
        navigate('/'); // Arahkan ke halaman Login (sesuai App.jsx)
      }, 2000);

    } catch (err) {
      console.error("Registrasi gagal:", err);
      // Menampilkan pesan error dari backend (spt 'Username atau email sudah digunakan')
      setError(err.response?.data?.message || "Registrasi gagal. Silakan coba lagi.");
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2">
      
      {/* Bagian Kiri: Branding */}
      <div className="hidden lg:block relative">
        <img
          className="absolute inset-0 w-full h-full object-cover"
          src="https://source.unsplash.com/random/1200x900?community,growth" 
          alt="Branding"
        />
        <div className="absolute inset-0 bg-green-800 opacity-60"></div>
        <div className="absolute inset-0 flex flex-col justify-center items-center text-white p-12 z-10">
          <h1 className="text-4xl font-bold mb-4 text-center">
            Bergabunglah Dengan Kami
          </h1>
          <p className="text-xl text-center">
            Buat akun baru untuk mulai mengelola data Anda hari ini.
          </p>
        </div>
      </div>

      {/* Bagian Kanan: Form Register */}
      <div className="w-full flex items-center justify-center bg-gray-100 p-8 lg:p-12">
        <div className="max-w-md w-full space-y-8">
          
          <div>
            <img
              className="mx-auto h-12 w-auto"
              src="/logo.png"
              alt="Logo Aplikasi"
            />
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Buat Akun Baru
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Sudah punya akun?{' '}
              <Link to="/" className="font-medium text-blue-600 hover:text-blue-500">
                Login di sini
              </Link>
            </p>
          </div>

          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              
              {/* --- PERUBAHAN 4: Ganti input 'name' menjadi 'username' --- */}
              <div>
                <label htmlFor="username" className="sr-only">Username</label>
                <input
                  id="username"
                  name="username" // Ganti
                  type="text"
                  autoComplete="username" // Ganti
                  required
                  className="appearance-none rounded-md relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Username" // Ganti
                  value={username} // Ganti
                  onChange={handleChange}
                />
              </div>
              
              {/* Input Email (Tetap) */}
              <div>
                <label htmlFor="email-address" className="sr-only">Alamat Email</label>
                <input
                  id="email-address"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="appearance-none rounded-md relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Alamat Email"
                  value={email}
                  onChange={handleChange}
                />
              </div>

              {/* Input Password (Tetap) */}
              <div>
                <label htmlFor="password" className="sr-only">Password</label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  className="appearance-none rounded-md relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Password"
                  value={password}
                  onChange={handleChange}
                />
              </div>

              {/* Input Konfirmasi Password (Tetap) */}
              <div>
                <label htmlFor="confirm-password" className="sr-only">Konfirmasi Password</label>
                <input
                  id="confirm-password"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  className="appearance-none rounded-md relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Konfirmasi Password"
                  value={confirmPassword}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* Tampilkan pesan error atau sukses */}
            {error && (
              <div className="text-red-600 text-sm text-center">
                {error}
              </div>
            )}
            {success && (
              <div className="text-green-600 text-sm text-center">
                {success}
              </div>
            )}

            {/* Tombol Submit */}
            <div>
              <button
                type="submit"
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-150 ease-in-out"
              >
                Daftar
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Register;