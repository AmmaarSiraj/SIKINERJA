import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

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
import TambahPenugasan from './pages/admin/TambahPenugasan';
import ManajemenMitra from './pages/admin/ManajemenMitra';
import DetailMitra from './pages/admin/DetailMitra';
import TemplatePenugasan from './pages/admin/TemplatePenugasan';
import ManajemenJabatan from './pages/admin/ManajemenJabatan';
import AddMitra from './pages/admin/AddMitra';
import ManajemenSPK from './pages/admin/ManajemenSPK';
import CetakSPK from './pages/admin/CetakSPK';
import EditMitra from './pages/admin/EditMitra';
import EditPenugasan from './pages/admin/EditPenugasan';
import TransaksiMitra from './pages/admin/TransaksiMitra';
import BatasHonor from './pages/admin/BatasHonor';
import TambahTemplate from './pages/admin/TambahTemplate';
import PreviewTemplate from './pages/admin/PreviewTemplate';

import LengkapiProfile from './pages/LengkapiProfile';
import DetailKegiatanUser from './pages/DetailKegiatanUser';
import PenugasanUser from './pages/Penugasan';
import MitraUser from './pages/Mitra';

import Layout from './layouts/Layout';
import AdminLayout from './layouts/AdminLayout';

import RequireAuth from './components/RequireAuth';
import AutoLogout from './components/AutoLogout';

function AppRoutes() {
  return (
    <BrowserRouter>
      <AutoLogout />
      <Routes>
        <Route path="/" element={<AuthPage />} />
        <Route path="/register" element={<Navigate to="/" replace />} />

        <Route element={<RequireAuth allowedRoles={['user', 'admin']} />}>
          <Route element={<Layout />}>
            <Route path="/home" element={<Home />} />
            <Route path="/lengkapi-profil" element={<LengkapiProfile />} />
            <Route path="/kegiatan/:id" element={<DetailKegiatanUser />} />
            <Route path="/penugasan" element={<PenugasanUser />} />
            <Route path="/daftar-mitra" element={<MitraUser />} />
          </Route>
        </Route>

        <Route element={<RequireAuth allowedRoles={['admin']} />}>
          <Route path="/admin/spk/print/:periode/:id_mitra" element={<CetakSPK />} />
          <Route path="/admin/spk/templates/preview" element={<PreviewTemplate />} />

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
            
            <Route path="/admin/penugasan" element={<Penugasan />} />
            <Route path="/admin/penugasan/tambah" element={<TambahPenugasan />} />
            <Route path="/admin/penugasan/detail/:id" element={<DetailPenugasan />} />

            <Route path="/admin/manajemen-mitra" element={<ManajemenMitra />} />
            <Route path="/admin/mitra/:id" element={<DetailMitra />} />
            <Route path="/admin/manajemen-jabatan" element={<ManajemenJabatan />} />
            <Route path="/admin/manajemen-spk" element={<ManajemenSPK />} />
            <Route path="/admin/mitra/edit/:id" element={<EditMitra />} />
            <Route path="/admin/penugasan/edit/:id" element={<EditPenugasan />} />
            <Route path="/admin/transaksi-mitra" element={<TransaksiMitra />} />
            <Route path="/admin/batas-honor" element={<BatasHonor />} />
            <Route path="/admin/spk/templates/create" element={<TambahTemplate />} />
            <Route path="/admin/spk/templates/edit/:id" element={<TambahTemplate />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
        
      </Routes>
    </BrowserRouter>
  );
}

export default AppRoutes;