import { Outlet } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';

const Layout = () => {
  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      {/* 1. Header (Statis) */}
      <Header />

      {/* 2. Isi Halaman (Dinamis dari <Outlet />) */}
      <main className="flex-grow">
        {/* <Outlet> akan me-render komponen rute anak (Home, Dashboard, dll) */}
        <Outlet />
      </main>

      {/* 3. Footer (Statis) */}
      <Footer />
    </div>
  );
};

export default Layout;