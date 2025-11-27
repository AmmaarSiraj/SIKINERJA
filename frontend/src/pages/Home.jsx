import React from 'react';
import PartDaftarKegiatan from '../components/PartDaftarKegiatan';
import Header from '../components/Header';
import Footer from '../components/Footer';

const Home = () => {
  return (
    // Wrapper utama
    <div className="relative w-full">
      
      {/* =========================================================
          LAYER 1 (BELAKANG): GAMBAR BACKGROUND
          z-index: 0, posisi: fixed (diam saat scroll)
      ========================================================= */}
      <div className="fixed inset-0 z-0 w-full h-full">
        <img 
          src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=2070&auto=format&fit=crop" 
          alt="Background SIKINERJA"
          className="w-full h-full object-cover"
        />
        {/* Overlay Hitam Transparan */}
        <div className="absolute inset-0 bg-black/60"></div>
      </div>

      {/* =========================================================
          LAYER 2 (DEPAN): KONTEN SCROLLABLE
          z-index: 10, posisi: relative
          min-h-screen agar background tertutup penuh
      ========================================================= */}
      <div className="relative z-10 flex flex-col min-h-screen">
        
        {/* 1. HEADER: POSISI PALING ATAS (Sticky) 
            Tanpa margin/padding luar agar rapat ke atas.
        */}
        <div className="sticky top-0 z-50 w-full">
           <Header />
        </div>

        {/* 2. HERO SECTION (Teks Selamat Datang)
            Menggunakan padding (py) untuk memberi jarak internal visual, 
            tapi tidak menggeser posisi Header.
        */}
        <div className="flex flex-col items-center justify-center py-24 px-4 text-center animate-fade-in-up">
          <h1 className="text-4xl md:text-6xl font-extrabold text-white tracking-tight drop-shadow-xl mb-4">
            Selamat Datang di Web <br />
            <span className="text-yellow-400">SIKINERJA</span>
          </h1>
          <p className="text-gray-200 text-lg md:text-xl max-w-2xl font-light">
            Sistem Informasi Manajemen Kinerja Mitra Statistik Badan Pusat Statistik
          </p>
        </div>

        {/* 3. WRAPPER KONTEN PUTIH & FOOTER 
            flex-grow: Mengisi sisa ruang ke bawah.
            flex-col: Menyusun Daftar Kegiatan dan Footer secara vertikal.
            rounded-t-[40px]: Efek melengkung hanya di atas.
        */}
        <div className="bg-white w-full flex-grow flex flex-col rounded-t-[40px] shadow-[0_-10px_40px_rgba(0,0,0,0.3)] overflow-hidden">
          
          {/* Konten Daftar Kegiatan */}
          <div className="container mx-auto px-4 py-12 md:px-8 flex-grow">
            <PartDaftarKegiatan />
          </div>

          {/* 4. FOOTER 
             mt-auto: Memaksa footer turun ke paling bawah jika konten sedikit.
             Tanpa padding bawah tambahan di wrapper induk.
          */}
          <div className="mt-auto w-full">
            <Footer />
          </div>
          
        </div>

      </div>

    </div>
  );
};

export default Home;