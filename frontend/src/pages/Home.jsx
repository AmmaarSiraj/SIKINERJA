// src/pages/Home.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios'; // Pastikan axios diimport
import { FaChartLine, FaUsers, FaClipboardList, FaArrowDown, FaUserCheck } from 'react-icons/fa';
import PartDaftarKegiatan from '../components/PartDaftarKegiatan';
import Footer from '../components/Footer';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const Home = () => {
  // State untuk menyimpan data statistik
  const [stats, setStats] = useState({
    kegiatan_aktif: 0,
    total_mitra: 0,
    mitra_aktif: 0
  });

  const scrollToContent = () => {
    const element = document.getElementById('konten-kegiatan');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Fetch data dari API saat komponen dimuat
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('token');
        // Jika endpoint public, hapus header Authorization. Jika butuh login, biarkan.
        const res = await axios.get(`${API_URL}/api/dashboard/stats`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        setStats(res.data);
      } catch (error) {
        console.error("Gagal memuat statistik:", error);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="relative w-full min-h-screen font-sans">
      
      {/* --- LAYER 1: BACKGROUND --- */}
      <div className="fixed inset-0 z-0">
        <img 
          src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=2070&auto=format&fit=crop" 
          alt="Background SIKINERJA"
          className="w-full h-full object-cover scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/50 to-blue-900/40"></div>
      </div>

      {/* --- LAYER 2: MAIN WRAPPER --- */}
      <div className="relative z-10 flex flex-col min-h-screen">
        
        {/* HERO SECTION */}
        <div className="relative flex flex-col items-center justify-center min-h-[85vh] px-4 text-center">
          <div className="animate-fade-in-up space-y-6 max-w-4xl mx-auto">
            <span className="inline-block py-1 px-3 rounded-full bg-white/10 border border-white/20 text-blue-200 text-xs font-bold tracking-wider uppercase backdrop-blur-md mb-2">
              Badan Pusat Statistik
            </span>
            <h1 className="text-5xl md:text-7xl font-extrabold text-white tracking-tight drop-shadow-2xl leading-tight">
              Optimalkan Kinerja <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-200">
                Mitra Statistik
              </span>
            </h1>
            <p className="text-gray-200 text-lg md:text-xl max-w-2xl mx-auto font-light leading-relaxed">
              Sistem Informasi Manajemen Kinerja Mitra Statistik untuk pengelolaan data yang lebih akurat, transparan, dan efisien.
            </p>
            <div className="pt-8">
              <button 
                onClick={scrollToContent}
                className="group relative inline-flex items-center gap-3 px-8 py-4 bg-[#1A2A80] text-white text-sm font-bold uppercase tracking-widest rounded-full hover:bg-blue-800 transition-all duration-300 shadow-[0_0_20px_rgba(26,42,128,0.5)] hover:shadow-[0_0_30px_rgba(26,42,128,0.8)] hover:-translate-y-1"
              >
                Jelajahi Kegiatan
                <FaArrowDown className="group-hover:translate-y-1 transition-transform" />
              </button>
            </div>
          </div>
        </div>

        {/* WAVE SEPARATOR */}
        <div className="relative w-full overflow-hidden leading-none rotate-180 -mt-1 -mb-1">
            <svg className="relative block w-full h-[100px] md:h-[150px]" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none">
                <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z" className="fill-white"></path>
            </svg>
        </div>

        {/* KONTEN UTAMA */}
        <div id="konten-kegiatan" className="bg-white w-full flex-grow flex flex-col relative">
          
          {/* STATS CARDS (DATA REAL DARI API) */}
          <div className="container mx-auto px-4 -mt-24 md:-mt-32 relative z-20 mb-12">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Card 1: Kegiatan Aktif Bulan Ini */}
              <div className="bg-white p-6 rounded-2xl shadow-xl border-b-4 border-[#1A2A80] hover:transform hover:-translate-y-2 transition duration-300">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-50 text-[#1A2A80] rounded-xl text-2xl">
                    <FaClipboardList />
                  </div>
                  <div>
                    <h3 className="text-gray-500 text-sm font-bold uppercase">Kegiatan Aktif (Bln Ini)</h3>
                    <p className="text-2xl font-extrabold text-gray-800">
                      {stats.kegiatan_aktif} <span className="text-sm font-normal text-gray-400">Kegiatan</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Card 2: Total Mitra Tahun Ini */}
              <div className="bg-white p-6 rounded-2xl shadow-xl border-b-4 border-yellow-400 hover:transform hover:-translate-y-2 transition duration-300">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-yellow-50 text-yellow-600 rounded-xl text-2xl">
                    <FaUsers />
                  </div>
                  <div>
                    <h3 className="text-gray-500 text-sm font-bold uppercase">Total Mitra ({new Date().getFullYear()})</h3>
                    <p className="text-2xl font-extrabold text-gray-800">
                       {stats.total_mitra} <span className="text-sm font-normal text-gray-400">Orang</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Card 3: Mitra Aktif Bulan Ini */}
              <div className="bg-white p-6 rounded-2xl shadow-xl border-b-4 border-green-500 hover:transform hover:-translate-y-2 transition duration-300">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-green-50 text-green-600 rounded-xl text-2xl">
                    <FaUserCheck />
                  </div>
                  <div>
                    <h3 className="text-gray-500 text-sm font-bold uppercase">Mitra Aktif (Bln Ini)</h3>
                    <p className="text-2xl font-extrabold text-gray-800">
                       {stats.mitra_aktif} <span className="text-sm font-normal text-gray-400">Orang</span>
                    </p>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* LIST KEGIATAN */}
          <div className="container mx-auto px-4 md:px-8 flex-grow pb-16">
            <div className="text-center mb-10">
              <span className="text-[#1A2A80] font-bold tracking-wider text-sm uppercase">Daftar</span>
              <h2 className="text-3xl font-extrabold text-gray-800 mt-2">Survei & Kegiatan</h2>
              <div className="w-16 h-1.5 bg-yellow-400 mx-auto mt-4 rounded-full"></div>
            </div>
            
            <PartDaftarKegiatan />
          </div>

          <div className="mt-auto w-full bg-gray-50 border-t border-gray-100">
            <Footer />
          </div>
          
        </div>

      </div>

    </div>
  );
};

export default Home;