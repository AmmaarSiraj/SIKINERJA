import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const response = await axios.post(
        'http://localhost:3000/api/users/login',
        { email, password }
      );

      const { token, user } = response.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));

      if (user.role === 'admin' || user.role === 'superadmin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/home');
      }
    } catch (err) {
      console.error("Login gagal:", err);
      setError(err.response?.data?.message || "Login gagal. Silakan coba lagi.");
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2">
      
      {/* Bagian Kiri: Gambar/Branding (Tampil di Desktop) */}
      <div className="hidden lg:block relative">
        <img
          className="absolute inset-0 w-full h-full object-cover"
          // Ganti dengan gambar branding Anda. URL ini hanya placeholder.
          src="https://source.unsplash.com/random/1200x900?technology,abstract" 
          alt="Branding"
        />
        {/* Overlay untuk keterbacaan teks */}
        <div className="absolute inset-0 bg-blue-800 opacity-60"></div>
        <div className="absolute inset-0 flex flex-col justify-center items-center text-white p-12 z-10">
          <h1 className="text-4xl font-bold mb-4 text-center">
            Selamat Datang Kembali
          </h1>
          <p className="text-xl text-center">
            Masuk untuk mengakses dashboard dan melanjutkan pekerjaan Anda.
          </p>
        </div>
      </div>

      {/* Bagian Kanan: Form Login */}
      <div className="w-full flex items-center justify-center bg-gray-100 p-8 lg:p-12">
        <div className="max-w-md w-full space-y-8">
          
          {/* Header Form (Logo dan Judul) */}
          <div>
            <img
              className="mx-auto h-12 w-auto"
              src="/logo.png" // GANTI DENGAN PATH LOGO ANDA
              alt="Logo Aplikasi"
            />
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Login ke Akun Anda
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Belum punya akun?{' '}
              <Link to="/register" className="font-medium text-blue-600 hover:text-blue-500">
                Daftar di sini
              </Link>
            </p>
          </div>

          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            {/* Saya mengubah input dari 'stacked' (rounded-none) menjadi
              terpisah dengan 'space-y-4' untuk tampilan yang lebih modern.
            */}
            <div className="space-y-4">
              {/* Input Email */}
              <div>
                <label htmlFor="email-address" className="sr-only">
                  Alamat Email
                </label>
                <input
                  id="email-address"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="appearance-none rounded-md relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Alamat Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              
              {/* Input Password */}
              <div>
                <label htmlFor="password" className="sr-only">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  className="appearance-none rounded-md relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            {/* Tampilkan pesan error jika ada */}
            {error && (
              <div className="text-red-600 text-sm text-center">
                {error}
              </div>
            )}

            {/* Tombol Submit */}
            <div>
              <button
                type="submit"
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-150 ease-in-out"
              >
                Login
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;