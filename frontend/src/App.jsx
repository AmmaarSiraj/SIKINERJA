// Di dalam frontend/src/App.jsx (atau file routing Anda)
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Import Halaman
import Login from './auth/Login';
import Register from './auth/Register';
import Home from './pages/Home';
import AdminDashboard from './pages/admin/Dashboard'; // 
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
import LengkapiProfile from './pages/LengkapiProfile';
// Import Layout
import Layout from './layouts/Layout';
import AdminLayout from './layouts/AdminLayout'; // <-- IMPORT LAYOUT BARU

import RequireAuth from './components/RequireAuth'; // [cite: 13]

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        {/* === Rute Publik (Login/Register) === */}
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* === Rute User Biasa (menggunakan Layout utama) === */}
        <Route element={<Layout />}>
          <Route path="/home" element={<Home />} />
          <Route path="/lengkapi-profil" element={<LengkapiProfile />} />
        </Route>

        {/* === Rute Admin (menggunakan AdminLayout BARU) === */}
        <Route element={<AdminLayout />}>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/manage-users" element={<ManageUsers />} />
          <Route path="/admin/add-user" element={<AddUser />} />
          <Route path="/admin/edit-user/:id" element={<EditUser />} />
          <Route path="/admin/users/:id/detail" element={<DetailUser />} />
          <Route path="/admin/manage-kegiatan" element={<ManageKegiatan />} />
          <Route path="/admin/manage-kegiatan/tambah" element={<AddKegiatan />} />
          <Route path="/admin/manage-kegiatan/edit/:id" element={<EditKegiatan />} />
          <Route path="/admin/manage-kegiatan/detail/:id" element={<DetailKegiatan />} />
          <Route path="/admin/penugasan" element={<Penugasan />} />
          <Route path="/admin/penugasan/detail/:id" element={<DetailPenugasan />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default AppRoutes;