import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { FaUser, FaEnvelope, FaLock } from 'react-icons/fa';
import logoSikinerja from '../assets/logo.png'; 

const API_URL = 'http://localhost:3000/api/users';

const AuthPage = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const navigate = useNavigate();

  // --- STATE LOGIN ---
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  
  // --- STATE REGISTER ---
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirm, setRegConfirm] = useState('');

  // --- STATE UI ---
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // HANDLER LOGIN
  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/login`, { 
        email: loginEmail, 
        password: loginPassword 
      });
      
      // Pastikan respon memiliki token
      if (response.data && response.data.token) {
        const { token, user } = response.data;
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));

        if (user.role === 'admin' || user.role === 'superadmin') {
          navigate('/admin/dashboard');
        } else {
          navigate('/home');
        }
      } else {
        throw new Error("Token tidak diterima dari server.");
      }
    } catch (err) {
      console.error("Login Error:", err);
      setError(err.response?.data?.message || "Login gagal. Periksa koneksi atau kredensial Anda.");
    } finally {
      setLoading(false);
    }
  };

  // HANDLER REGISTER
  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    
    if (regPassword !== regConfirm) {
      setError("Password konfirmasi tidak cocok.");
      return;
    }

    setLoading(true);
    try {
      await axios.post(`${API_URL}/register`, {
        username: regUsername,
        email: regEmail,
        password: regPassword,
        role: 'user' // Default role
      });
      
      alert("Registrasi berhasil! Silakan login.");
      setIsSignUp(false); // Geser panel kembali ke login
      
      // Reset form
      setRegUsername(''); 
      setRegEmail(''); 
      setRegPassword(''); 
      setRegConfirm(''); 
    } catch (err) {
      console.error("Register Error:", err);
      setError(err.response?.data?.message || "Registrasi gagal.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4 font-sans overflow-hidden">
      
      {/* CONTAINER UTAMA */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl min-h-[600px] overflow-hidden">
        
        {/* --- FORM REGISTER (Sign Up) --- */}
        <div 
          className={`absolute top-0 h-full transition-all duration-700 ease-in-out w-full md:w-1/2 left-0 
          ${isSignUp ? "translate-x-full opacity-100 z-20" : "opacity-0 z-0"}`}
        >
          <form onSubmit={handleRegister} className="bg-white flex flex-col items-center justify-center h-full px-10 text-center">
            <h1 className="text-3xl font-bold text-[#1A2A80] mb-4">Buat Akun</h1>
            <p className="text-sm text-gray-400 mb-6">Gunakan email Anda untuk mendaftar</p>
            
            <div className="w-full space-y-3">
              <div className="bg-gray-100 p-3 rounded-lg flex items-center">
                <FaUser className="text-gray-400 mr-2" />
                <input type="text" placeholder="Username" className="bg-transparent outline-none text-sm flex-1" value={regUsername} onChange={e => setRegUsername(e.target.value)} required />
              </div>
              <div className="bg-gray-100 p-3 rounded-lg flex items-center">
                <FaEnvelope className="text-gray-400 mr-2" />
                <input type="email" placeholder="Email" className="bg-transparent outline-none text-sm flex-1" value={regEmail} onChange={e => setRegEmail(e.target.value)} required />
              </div>
              <div className="bg-gray-100 p-3 rounded-lg flex items-center">
                <FaLock className="text-gray-400 mr-2" />
                <input type="password" placeholder="Password" className="bg-transparent outline-none text-sm flex-1" value={regPassword} onChange={e => setRegPassword(e.target.value)} required />
              </div>
              <div className="bg-gray-100 p-3 rounded-lg flex items-center">
                <FaLock className="text-gray-400 mr-2" />
                <input type="password" placeholder="Konfirmasi Password" className="bg-transparent outline-none text-sm flex-1" value={regConfirm} onChange={e => setRegConfirm(e.target.value)} required />
              </div>
            </div>

            {error && isSignUp && <p className="text-red-500 text-xs mt-3 bg-red-50 p-2 rounded w-full">{error}</p>}

            <button type="submit" disabled={loading} className="mt-6 bg-[#1A2A80] text-white font-bold py-3 px-10 rounded-full uppercase text-xs tracking-wider transform transition-transform active:scale-95 hover:shadow-lg disabled:opacity-50">
              {loading ? 'Proses...' : 'Daftar'}
            </button>
            
            {/* Tombol Switch Mobile */}
            <p className="mt-4 text-sm text-gray-600 md:hidden">
              Sudah punya akun? <button type="button" onClick={() => setIsSignUp(false)} className="text-[#1A2A80] font-bold underline">Login</button>
            </p>
          </form>
        </div>

        {/* --- FORM LOGIN (Sign In) --- */}
        <div 
          className={`absolute top-0 h-full transition-all duration-700 ease-in-out w-full md:w-1/2 left-0 z-10 
          ${isSignUp ? "translate-x-full opacity-0" : "opacity-100"}`}
        >
          <form onSubmit={handleLogin} className="bg-white flex flex-col items-center justify-center h-full px-10 text-center">
            <div className="mb-6">
               {/* Ganti dengan path logo yang benar dari public folder */}
               <img src={logoSikinerja} alt="Logo SIKINERJA" className="w-24 h-auto mx-auto object-contain" />
            </div>
            <h1 className="text-3xl font-bold text-[#1A2A80] mb-2">Login SIKINERJA</h1>
            <p className="text-sm text-gray-400 mb-8">Masuk untuk mengelola data mitra</p>
            
            <div className="w-full space-y-4">
              <div className="bg-gray-100 p-3 rounded-lg flex items-center border border-transparent focus-within:border-[#1A2A80] transition-colors">
                <FaEnvelope className="text-gray-400 mr-2" />
                <input type="email" placeholder="Email" className="bg-transparent outline-none text-sm flex-1 text-gray-700" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} required />
              </div>
              <div className="bg-gray-100 p-3 rounded-lg flex items-center border border-transparent focus-within:border-[#1A2A80] transition-colors">
                <FaLock className="text-gray-400 mr-2" />
                <input type="password" placeholder="Password" className="bg-transparent outline-none text-sm flex-1 text-gray-700" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} required />
              </div>
            </div>

            <div className="my-4 w-full text-right">
                <a href="#" className="text-xs text-gray-500 hover:text-[#1A2A80] transition-colors">Lupa Password?</a>
            </div>

            {error && !isSignUp && <p className="text-red-500 text-xs mb-4 bg-red-50 p-2 rounded w-full">{error}</p>}

            <button type="submit" disabled={loading} className="bg-[#1A2A80] text-white font-bold py-3 px-10 rounded-full uppercase text-xs tracking-wider transform transition-transform active:scale-95 hover:shadow-lg disabled:opacity-50">
              {loading ? 'Masuk...' : 'Masuk'}
            </button>

            {/* Tombol Switch Mobile */}
            <p className="mt-6 text-sm text-gray-600 md:hidden">
              Belum punya akun? <button type="button" onClick={() => setIsSignUp(true)} className="text-[#1A2A80] font-bold underline">Daftar</button>
            </p>
          </form>
        </div>

        {/* --- OVERLAY CONTAINER (Panel Biru Bergerak) --- */}
        <div 
          className={`absolute top-0 left-1/2 w-1/2 h-full overflow-hidden transition-transform duration-700 ease-in-out z-50 hidden md:block 
          ${isSignUp ? "-translate-x-full" : ""}`}
        >
          <div 
            className={`bg-[#1A2A80] text-white relative -left-full h-full w-[200%] transform transition-transform duration-700 ease-in-out 
            ${isSignUp ? "translate-x-1/2" : "translate-x-0"}`}
          >
            
            {/* Overlay Kiri (Muncul saat SignUp aktif -> Mengajak Login) */}
            <div className={`absolute top-0 flex flex-col items-center justify-center w-1/2 h-full px-10 text-center space-y-6 transform transition-transform duration-700 ease-in-out ${isSignUp ? "translate-x-0" : "-translate-x-[20%]"}`}>
              <h1 className="text-4xl font-bold">Sudah Punya Akun?</h1>
              <p className="text-blue-100 leading-relaxed">
                Silakan masuk kembali untuk melanjutkan pekerjaan dan manajemen kinerja Anda.
              </p>
              <button 
                onClick={() => setIsSignUp(false)}
                className="bg-transparent border-2 border-white text-white font-bold py-3 px-10 rounded-full uppercase text-xs tracking-wider hover:bg-white hover:text-[#1A2A80] transition-all duration-300 transform active:scale-95"
              >
                Masuk di sini
              </button>
            </div>

            {/* Overlay Kanan (Muncul saat Login aktif -> Mengajak Register) */}
            <div className={`absolute top-0 right-0 flex flex-col items-center justify-center w-1/2 h-full px-10 text-center space-y-6 transform transition-transform duration-700 ease-in-out ${isSignUp ? "translate-x-[20%]" : "translate-x-0"}`}>
              <h1 className="text-4xl font-bold">Halo, Mitra!</h1>
              <p className="text-blue-100 leading-relaxed">
                Bergabunglah bersama kami. Masukkan data diri Anda untuk memulai perjalanan baru.
              </p>
              <button 
                onClick={() => setIsSignUp(true)}
                className="bg-transparent border-2 border-white text-white font-bold py-3 px-10 rounded-full uppercase text-xs tracking-wider hover:bg-white hover:text-[#1A2A80] transition-all duration-300 transform active:scale-95"
              >
                Daftar di sini
              </button>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};

export default AuthPage;