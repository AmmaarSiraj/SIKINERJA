// Di dalam frontend/src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Import Halaman
import AuthPage from './auth/AuthPage';
import Home from './pages/Home';
import AdminDashboard from './pages/admin/Dashboard'; 
import ManageUsers from './pages/admin/ManageUsers';
import AddUser from './pages/admin/AddUser';
import EditUser from './pages/admin/EditUser';
import ManageKegiatan from './pages/admin/ManageKegiatan';
import AddKegiatan from './pages/admin/AddKegiatan';
import EditKegiatan from './pages/admin/EditKegiatan';
import DetailUser from './pages/admin/DetailUser';
import DetailKegiatan from './pages/admin/DetailKegiatan';
import Penugasan from './pages/admin/Penugasan';
import DetailPenugasan from './pages/admin/DetailPenugasan';
// --- 1. IMPORT KOMPONEN BARU ---
import TambahPenugasan from './pages/admin/TambahPenugasan'; 

import LengkapiProfile from './pages/LengkapiProfile';
import ManajemenMitra from './pages/admin/ManajemenMitra';
import DetailPengajuanMitra from './pages/admin/DetailPengajuanMitra';
import DaftarLaporan from './pages/admin/DaftarLaporan';
import SettingLaporan from './pages/admin/SettingLaporan';
import BuatTemplate from './pages/admin/BuatTemplate';
import DetailKegiatanUser from './pages/DetailKegiatanUser';
import DetailMitra from './pages/admin/DetailMitra';
import TemplatePenugasan from './pages/admin/TemplatePenugasan';
import ManajemenJabatan from './pages/admin/ManajemenJabatan';
import AddMitra from './pages/admin/AddMitra';

// Import Layout
import Layout from './layouts/Layout';
import AdminLayout from './layouts/AdminLayout'; 

import RequireAuth from './components/RequireAuth'; 

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AuthPage />} />
        
        {/* Redirect /register ke / agar user diarahkan ke AuthPage */}
        <Route path="/register" element={<Navigate to="/" replace />} /> 
        <Route path="/home" element={<Home />} />
        
        {/* === Rute User Biasa (menggunakan Layout utama) === */}
        <Route element={<Layout />}>
          <Route path="/lengkapi-profil" element={<LengkapiProfile />} />
          <Route path="/kegiatan/:id" element={<DetailKegiatanUser />} />
        </Route>

        {/* === Rute Admin (menggunakan AdminLayout) === */}
        <Route element={<AdminLayout />}>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/manage-users" element={<ManageUsers />} />
          <Route path="/admin/users/add" element={<AddUser />} />
          <Route path="/admin/edit-user/:id" element={<EditUser />} />
          <Route path="/admin/users/:id/detail" element={<DetailUser />} />
          <Route path="/admin/manage-kegiatan" element={<ManageKegiatan />} />
          <Route path="/admin/manage-kegiatan/tambah" element={<AddKegiatan />} />
          <Route path="/admin/manage-kegiatan/edit/:id" element={<EditKegiatan />} />
          <Route path="/admin/manage-kegiatan/detail/:id" element={<DetailKegiatan />} />
          <Route path="/admin/penugasan/preview" element={<TemplatePenugasan />} />
          <Route path="/admin/mitra/tambah" element={<AddMitra />} />
          {/* --- Manajemen Penugasan --- */}
          <Route path="/admin/penugasan" element={<Penugasan />} />
          {/* --- 2. RUTE BARU DITAMBAHKAN DI SINI --- */}
          <Route path="/admin/penugasan/tambah" element={<TambahPenugasan />} />
          <Route path="/admin/penugasan/detail/:id" element={<DetailPenugasan />} />

          <Route path="/admin/pengajuan-mitra" element={<ManajemenMitra />} />
          <Route path="/admin/pengajuan-mitra/:id" element={<DetailPengajuanMitra />} />
          <Route path="/admin/laporan" element={<DaftarLaporan />} />
          <Route path="/admin/laporan/setting/:id_kegiatan" element={<SettingLaporan />} />
          <Route path="/admin/laporan/buat" element={<BuatTemplate />} />
          <Route path="/admin/mitra/:id" element={<DetailMitra />} />
          <Route path="/admin/manajemen-jabatan" element={<ManajemenJabatan />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default AppRoutes;