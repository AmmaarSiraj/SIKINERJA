import { Outlet, Link } from 'react-router-dom';

// --- Placeholder Komponen ---
// Anda bisa memisahkan ini ke file-file sendiri nanti
// (contoh: src/components/admin/AdminHeader.jsx, Sidebar.jsx, dll.)

const AdminHeader = () => (
  <header className="bg-white text-gray-800 p-4 shadow-md z-10">
    <div className="container mx-auto flex justify-between items-center">
      <h1 className="text-xl font-bold">Admin Panel SIKINERJA</h1>
      <div>
        <span className="mr-4">Selamat datang, Admin!</span>
        {/* Tambahkan tombol Logout di sini nanti */}
        <button className="bg-red-500 hover:bg-red-600 text-white py-1 px-3 rounded text-sm">
          Logout
        </button>
      </div>
    </div>
  </header>
);

const Sidebar = () => (
  <aside className="w-64 bg-gray-800 text-white p-5 shadow-lg">
    <nav>
      <ul className="space-y-2">
        <li>
          <Link
            to="/admin/dashboard"
            className="block py-2 px-4 rounded hover:bg-gray-700 transition-colors"
          >
            Dashboard
          </Link>
        </li>
        <li>
          <Link
            to="/admin/manage-users" // Contoh link lain
            className="block py-2 px-4 rounded hover:bg-gray-700 transition-colors"
          >
            Manajemen User
          </Link>
        </li>
        <li>
          <Link
            to="/admin/manage-kegiatan" // Path untuk manajemen kegiatan
            className="block py-2 px-4 rounded hover:bg-gray-700 transition-colors"
          >
            Manajemen Kegiatan
          </Link>
        </li>
        <li>
          <Link
            to="/admin/penugasan" // Path untuk manajemen penugasan
            className="block py-2 px-4 rounded hover:bg-gray-700 transition-colors"
          >
            Penugasan
          </Link>
        </li>
      </ul>
    </nav>
  </aside>
);

const AdminFooter = () => (
  <footer className="bg-white text-gray-600 p-4 text-center mt-auto shadow-inner">
    © 2025 SIKINERJA Admin Dashboard
  </footer>
);
// --- Akhir Placeholder Komponen ---


/**
 * AdminLayout
 * Layout khusus untuk semua halaman di dalam rute /admin/*
 */
const AdminLayout = () => {
  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <AdminHeader />
      <div className="flex flex-1">
        <Sidebar />
        <div className="flex flex-col flex-1">
          <main className="flex-1 p-6 md:p-8">
            {/* Konten halaman admin (seperti Dashboard.jsx dari /pages/admin/) 
              akan dirender di sini oleh <Outlet>
            */}
            <Outlet />
          </main>
          <AdminFooter />
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;