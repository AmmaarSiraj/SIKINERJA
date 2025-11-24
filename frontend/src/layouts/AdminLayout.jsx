// src/layouts/AdminLayout.jsx
import { useState } from 'react'; // Import useState
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  FaHome, 
  FaUsers, 
  FaClipboardList, 
  FaHandshake, 
  FaFileAlt, 
  FaSignOutAlt, 
  FaSearch,
  FaUserCheck,
  FaBars // Import icon hamburger menu
} from 'react-icons/fa';

// 1. IMPORT GAMBAR (Sesuaikan nama file)
import logoSikinerja from '../assets/bpslogo.png'; 

// Daftar Menu
const menuItems = [
  { path: "/admin/dashboard", label: "Dashboard", icon: <FaHome /> },
  { path: "/admin/manage-users", label: "Manajemen User", icon: <FaUsers /> },
  { path: "/admin/manage-kegiatan", label: "Survei/Sensus", icon: <FaClipboardList /> },
  { path: "/admin/penugasan", label: "Penugasan", icon: <FaHandshake /> },
  { path: "/admin/pengajuan-mitra", label: "Manajemen Mitra", icon: <FaUserCheck /> },
  { path: "/admin/laporan", label: "Template Laporan", icon: <FaFileAlt /> },
];

// Komponen Header (Menerima props toggleSidebar)
const AdminHeader = ({ title, toggleSidebar }) => {
  const currentDate = new Date().toLocaleDateString('id-ID', { 
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
  });

  return (
    <header className="flex justify-between items-center py-5 px-4 md:px-8 bg-transparent">
      <div className="flex items-center gap-4">
        {/* Tombol Hamburger (Hanya muncul di Mobile) */}
        <button 
          onClick={toggleSidebar}
          className="md:hidden text-gray-600 hover:text-[#1A2A80] text-2xl focus:outline-none"
        >
          <FaBars />
        </button>

        <div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-gray-800 tracking-tight">{title}</h2>
          <p className="text-xs md:text-sm text-gray-500 mt-1 font-medium">{currentDate}</p>
        </div>
      </div>
      
      <div className="hidden md:flex items-center bg-gray-50 rounded-full px-5 py-2.5 shadow-sm border border-gray-200 w-72 transition-all focus-within:ring-2 focus-within:ring-[#1A2A80] focus-within:bg-white">
        <span className="text-gray-400 mr-3"><FaSearch /></span>
        <input 
          type="text" 
          placeholder="Cari data..." 
          className="bg-transparent outline-none text-sm text-gray-600 w-full placeholder-gray-400"
        />
      </div>
    </header>
  );
};

// Komponen Sidebar
const Sidebar = ({ handleLogout, closeSidebar }) => {
  const location = useLocation();
  const isActive = (path) => location.pathname === path;

  return (
    // UBAH WARNA DASAR SIDEBAR JADI #1A2A80
    <aside className="w-72 bg-[#1A2A80] text-white flex flex-col overflow-hidden relative z-20 h-full shadow-2xl md:shadow-none">
      
      {/* === BAGIAN LOGO & NAMA APLIKASI === */}
      <div className="p-8 text-center border-b border-white/10 z-10 relative">
        <div className="inline-block group">
          <div className="w-20 h-20 rounded-2xl bg-white mx-auto border-2 border-white/20 overflow-hidden shadow-lg p-2 flex items-center justify-center transition-transform duration-300 group-hover:scale-105">
            <img 
              src={logoSikinerja} 
              alt="Logo SIKINERJA" 
              className="w-full h-full object-contain" 
            />
          </div>
        </div>
        
        <h1 className="mt-4 text-2xl font-extrabold tracking-wider">SIKINERJA</h1>
        <p className="text-xs font-medium text-blue-200 mt-1">Sistem Manajemen Kinerja Mitra</p>
      </div>

      {/* Navigasi */}
      <nav className="flex-1 py-6 space-y-2 overflow-y-auto no-scrollbar relative z-10">
        <p className="px-8 text-xs font-bold text-blue-200 uppercase mb-4 tracking-wider">Menu Utama</p>
        
        {menuItems.map((item) => {
          const active = isActive(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={closeSidebar} // Tutup sidebar saat menu diklik (UX Mobile)
              className={`
                relative group flex items-center gap-4 px-8 py-4 transition-colors duration-300 overflow-hidden
                ${active 
                  ? "text-[#1A2A80]" // UBAH TEKS AKTIF JADI #1A2A80
                  : "text-blue-200 hover:text-white"
                }
              `}
              style={{
                marginLeft: '20px',
                marginRight: '0px',
                borderTopLeftRadius: '50px',
                borderBottomLeftRadius: '50px',
                borderTopRightRadius: '0px',
                borderBottomRightRadius: '0px',
              }}
            >
              {/* Background Animation (White) */}
              <div 
                className={`
                  absolute inset-0 bg-white z-0
                  transition-transform duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]
                  ${active ? 'translate-x-0' : 'translate-x-full'} 
                `}
              />

              {/* UBAH ICON AKTIF JADI #1A2A80 */}
              <span className={`relative z-10 text-lg transition-transform duration-300 ${active ? 'scale-110 text-[#1A2A80]' : ''}`}>
                {item.icon}
              </span>
              <span className={`relative z-10 text-sm font-medium transition-all duration-300 ${active ? 'font-bold translate-x-1' : ''}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="p-6 border-t border-white/10 z-10 bg-[#1A2A80]">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-4 py-3 text-blue-200 hover:text-white hover:bg-white/10 rounded-xl transition-colors group"
        >
          <span className="group-hover:-translate-x-1 transition-transform"><FaSignOutAlt /></span>
          <span className="font-medium text-sm">Keluar Aplikasi</span>
        </button>
      </div>
    </aside>
  );
};

const AdminLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // State untuk Mobile Sidebar

  const handleLogout = () => {
    if (window.confirm("Apakah Anda yakin ingin keluar?")) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      navigate('/');
    }
  };

  const currentItem = menuItems.find(item => item.path === location.pathname);
  const pageTitle = currentItem ? currentItem.label : "Admin Dashboard";

  return (
    <div className="flex h-screen bg-white font-sans overflow-hidden relative">
      
      {/* Dekorasi Background */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gray-50 rounded-full mix-blend-multiply filter blur-3xl opacity-60 pointer-events-none"></div>

      {/* === OVERLAY GELAP (MOBILE ONLY) === */}
      {/* Muncul saat sidebar terbuka di mobile untuk fokus */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 md:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}

      {/* === SIDEBAR CONTAINER === */}
      {/* - fixed: Agar mengambang di mobile
          - md:relative: Agar statis di desktop
          - translate-x: Mengatur visibilitas slide-in/slide-out
      */}
      <div className={`
        fixed inset-y-0 left-0 z-40 w-72 h-full transition-transform duration-300 ease-in-out
        md:relative md:translate-x-0 md:block
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <Sidebar 
          handleLogout={handleLogout} 
          closeSidebar={() => setIsSidebarOpen(false)} // Tutup sidebar saat menu diklik
        />
      </div>

      {/* === KONTEN UTAMA === */}
      <div className="flex-1 flex flex-col h-full relative z-10 pl-0 min-w-0">
        
        {/* Header dengan Toggle */}
        <AdminHeader 
          title={pageTitle} 
          toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} 
        />

        {/* Area Konten */}
        <main className="flex-1 overflow-y-auto p-4 md:pr-6 md:pb-6 md:pl-0 scrollbar-hide">
          <div className="bg-white rounded-3xl md:rounded-r-3xl md:rounded-l-[40px] min-h-full p-4 md:p-10 relative overflow-hidden border border-gray-50 shadow-sm">
             <div className="relative z-10">
               <Outlet />
             </div>
          </div>
        </main>
      </div>

    </div>
  );
};

export default AdminLayout;