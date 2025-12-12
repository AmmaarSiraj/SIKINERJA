import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FaBars, FaTimes, FaSignOutAlt, FaUserCircle, FaChevronDown } from 'react-icons/fa';
import logoSikinerja from '../assets/logo.png';

const Header = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMitraDropdownOpen, setIsMitraDropdownOpen] = useState(false);
  
  const location = useLocation();
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem('user')) || {};

  const handleLogout = () => {
    if (window.confirm('Apakah Anda yakin ingin keluar?')) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      navigate('/');
    }
  };

  const isActive = (path) => {
    return location.pathname === path
      ? "text-[#1A2A80] bg-blue-50 font-bold"
      : "text-gray-600 hover:text-[#1A2A80] hover:bg-gray-50 font-medium";
  };

  const isParentActive = (paths) => {
    return paths.includes(location.pathname) 
      ? "text-[#1A2A80] bg-blue-50 font-bold" 
      : "text-gray-600 hover:text-[#1A2A80] hover:bg-gray-50 font-medium";
  };

  return (
    <header className="bg-white shadow-sm w-full sticky top-0 z-50 border-b border-gray-100">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          
          <div className="flex-shrink-0 flex items-center gap-3">
            <Link to="/home" className="flex items-center gap-2">
              <img 
                src={logoSikinerja} 
                alt="Logo" 
                className="h-8 w-auto" 
              />
              <span className="text-xl font-extrabold text-[#1A2A80] tracking-tight">
                SIKINERJA
              </span>
            </Link>
          </div>
          
          <div className="hidden md:block">
            <div className="ml-10 flex items-center space-x-2">
              
              <Link to="/home" className={`px-4 py-2 rounded-lg text-sm transition-all duration-200 ${isActive('/home')}`}>
                Home
              </Link>

              <Link to="/daftar-kegiatan" className={`px-4 py-2 rounded-lg text-sm transition-all duration-200 ${isActive('/daftar-kegiatan')}`}>
                Survei & Sensus
              </Link>

              <Link to="/penugasan" className={`px-4 py-2 rounded-lg text-sm transition-all duration-200 ${isActive('/penugasan')}`}>
                Penugasan
              </Link>

              <Link to="/spk" className={`px-4 py-2 rounded-lg text-sm transition-all duration-200 ${isActive('/spk')}`}>
                SPK
              </Link>

              <div 
                className="relative group"
                onMouseEnter={() => setIsMitraDropdownOpen(true)}
                onMouseLeave={() => setIsMitraDropdownOpen(false)}
              >
                <button 
                    className={`flex items-center gap-1 px-4 py-2 rounded-lg text-sm transition-all duration-200 cursor-pointer ${isParentActive(['/daftar-mitra', '/transaksi-mitra'])}`}
                >
                    Mitra <FaChevronDown size={10} />
                </button>

                <div className={`absolute left-0 mt-0 w-48 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden transition-all duration-200 transform origin-top-left ${isMitraDropdownOpen ? 'opacity-100 scale-100 visible' : 'opacity-0 scale-95 invisible'}`}>
                    <div className="py-1">
                        <Link 
                            to="/daftar-mitra" 
                            className={`block px-4 py-2.5 text-sm hover:bg-blue-50 transition ${location.pathname === '/daftar-mitra' ? 'text-[#1A2A80] font-bold bg-blue-50' : 'text-gray-700'}`}
                        >
                            Master Mitra
                        </Link>
                        <Link 
                            to="/transaksi-mitra" 
                            className={`block px-4 py-2.5 text-sm hover:bg-blue-50 transition ${location.pathname === '/transaksi-mitra' ? 'text-[#1A2A80] font-bold bg-blue-50' : 'text-gray-700'}`}
                        >
                            Transaksi Mitra
                        </Link>
                    </div>
                </div>
              </div>

              <div className="h-6 w-px bg-gray-200 mx-2"></div>

              <div className="flex items-center gap-4 pl-2">
                <Link to="/lengkapi-profil" className="flex items-center gap-2 text-gray-700 hover:text-[#1A2A80] transition group" title="Lihat Profil Saya">
                    <FaUserCircle className="text-xl text-gray-400 group-hover:text-[#1A2A80]" />
                    <span className="text-sm font-semibold max-w-[100px] truncate">
                        {user.username || 'User'}
                    </span>
                </Link>
                
                <button onClick={handleLogout} className="flex items-center gap-2 bg-red-50 text-red-600 hover:bg-red-100 px-3 py-1.5 rounded-lg text-xs font-bold transition">
                  <FaSignOutAlt /> Keluar
                </button>
              </div>

            </div>
          </div>

          <div className="-mr-2 flex md:hidden">
            <button onClick={() => setIsOpen(!isOpen)} className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-[#1A2A80] hover:bg-gray-100 focus:outline-none transition">
              {isOpen ? <FaTimes size={20} /> : <FaBars size={20} />}
            </button>
          </div>
        </div>
      </nav>

      {isOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 absolute w-full shadow-lg h-screen overflow-y-auto pb-20">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            
            <Link to="/home" onClick={() => setIsOpen(false)} className={`block px-3 py-3 rounded-md text-base ${isActive('/home')}`}>
              Home
            </Link>

            <Link to="/daftar-kegiatan" onClick={() => setIsOpen(false)} className={`block px-3 py-3 rounded-md text-base ${isActive('/daftar-kegiatan')}`}>
              Survei & Sensus
            </Link>

            <Link to="/penugasan" onClick={() => setIsOpen(false)} className={`block px-3 py-3 rounded-md text-base ${isActive('/penugasan')}`}>
              Penugasan
            </Link>

            <Link to="/spk" onClick={() => setIsOpen(false)} className={`block px-3 py-3 rounded-md text-base ${isActive('/spk')}`}>
              SPK
            </Link>

            <div className="px-3 py-3 rounded-md text-base font-medium text-gray-600 bg-gray-50/50">
                <span className="block mb-2 text-xs font-bold text-gray-400 uppercase tracking-wider">Menu Mitra</span>
                <Link to="/daftar-mitra" onClick={() => setIsOpen(false)} className={`block pl-4 py-2 rounded-md text-sm mb-1 ${isActive('/daftar-mitra')}`}>
                    Manajemen Mitra
                </Link>
                <Link to="/transaksi-mitra" onClick={() => setIsOpen(false)} className={`block pl-4 py-2 rounded-md text-sm ${isActive('/transaksi-mitra')}`}>
                    Transaksi Mitra
                </Link>
            </div>

            <div className="border-t border-gray-100 my-2 pt-2">
                <Link to="/lengkapi-profil" onClick={() => setIsOpen(false)} className="px-3 py-2 flex items-center gap-2 text-gray-500 mb-2 hover:bg-gray-50 rounded-md transition">
                    <FaUserCircle /> <span>Profil Saya ({user.username})</span>
                </Link>
                <button onClick={handleLogout} className="w-full text-left flex items-center gap-2 px-3 py-3 text-red-600 hover:bg-red-50 rounded-md font-bold transition">
                    <FaSignOutAlt /> Keluar Aplikasi
                </button>
            </div>

          </div>
        </div>
      )}
    </header>
  );
};

export default Header;