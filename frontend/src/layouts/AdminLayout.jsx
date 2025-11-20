import { Outlet, Link, useNavigate } from 'react-router-dom';

const AdminHeader = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  return (
    <header className="bg-white text-gray-800 p-4 shadow-md z-10">
      <div className="container mx-auto flex justify-between items-center">
        <h1 className="text-xl font-bold">Admin Panel SIKINERJA</h1>
        <div>
          <span className="mr-4">Selamat datang, Admin!</span>
          <button
            onClick={handleLogout}
            className="bg-red-500 hover:bg-red-600 text-white py-1 px-3 rounded text-sm cursor-pointer"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
};

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
            to="/admin/manage-users"
            className="block py-2 px-4 rounded hover:bg-gray-700 transition-colors"
          >
            Manajemen User
          </Link>
        </li>
        <li>
          <Link
            to="/admin/manage-kegiatan"
            className="block py-2 px-4 rounded hover:bg-gray-700 transition-colors"
          >
            Manajemen Survei/Sensus
          </Link>
        </li>
        <li>
          <Link
            to="/admin/penugasan"
            className="block py-2 px-4 rounded hover:bg-gray-700 transition-colors"
          >
            Penugasan
          </Link>
        </li>
        <li>
          <Link
            to="/admin/pengajuan-mitra"
            className="block py-2 px-4 rounded hover:bg-gray-700 transition-colors"
          >
            Pengajuan Mitra
          </Link>
        </li>
        <li>
          <Link
            to="/admin/laporan"
            className="block py-2 px-4 rounded hover:bg-gray-700 transition-colors"
          >
            Template Laporan
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

const AdminLayout = () => {
  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <AdminHeader />
      <div className="flex flex-1">
        <Sidebar />
        <div className="flex flex-col flex-1">
          <main className="flex-1 p-6 md:p-8">
            <Outlet />
          </main>
          <AdminFooter />
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;