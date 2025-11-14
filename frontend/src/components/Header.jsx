import { Link } from 'react-router-dom';

const Header = () => {
  return (
    <header className="bg-white shadow-md w-full">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo atau Nama Web */}
          <div className="flex-shrink-0">
            <Link to="/" className="text-2xl font-bold text-blue-600">
              ProjectApp
            </Link>
          </div>
          
          {/* Menu Navigasi */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              <Link
                to="/"
                className="text-gray-700 hover:bg-gray-100 px-3 py-2 rounded-md text-sm font-medium"
              >
                Home
              </Link>
              <Link
                to="/dashboard"
                className="text-gray-700 hover:bg-gray-100 px-3 py-2 rounded-md text-sm font-medium"
              >
                Dashboard
              </Link>
              {/* Tambahkan link lain di sini */}
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Header;