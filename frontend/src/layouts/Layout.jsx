import { Outlet, Link, useLocation } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const Layout = () => {
  const location = useLocation();
  const [showProfileAlert, setShowProfileAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState({
    text: '',
    link: '',
    type: 'yellow',
  });

  // LOGIK BARU: Cek apakah halaman saat ini adalah Home
  // Kita gunakan .startsWith atau regex agar lebih aman terhadap trailing slash
  const isHomePage = location.pathname.replace(/\/+$/, '') === '/home';

  useEffect(() => {
    const checkMitraStatus = async () => {
      try {
        const storedUser = localStorage.getItem('user');
        if (!storedUser) return;

        const user = JSON.parse(storedUser);

        if (user && user.role === 'user') {
          try {
            await axios.get(`${API_URL}/api/mitra/un/user/${user.id}`);
            setShowProfileAlert(false);
            return; 
          } catch (mitraErr) {
            if (mitraErr.response && mitraErr.response.status !== 404) {
              throw mitraErr; 
            }
          }

          try {
            const pengajuanRes = await axios.get(
              `${API_URL}/api/manajemen-mitra/user/${user.id}`
            );
            
            const { status } = pengajuanRes.data;
            
            if (status === 'pending') {
              setAlertMessage({
                text: 'Status: Pengajuan mitra Anda sedang ditinjau oleh Admin.',
                link: '/lengkapi-profil',
                type: 'blue',
              });
              setShowProfileAlert(true);
            } else if (status === 'rejected') {
              setAlertMessage({
                text: 'Status: Pengajuan mitra Anda ditolak.',
                link: '/lengkapi-profil',
                type: 'yellow',
              });
              setShowProfileAlert(true);
            }
            
          } catch (pengajuanErr) {
            if (pengajuanErr.response && pengajuanErr.response.status === 404) {
              setAlertMessage({
                text: 'Anda belum melengkapi profil mitra.',
                link: '/lengkapi-profil',
                type: 'yellow',
              });
              setShowProfileAlert(true);
            } else {
              throw pengajuanErr;
            }
          }
        }
      } catch (err) {
        console.error("Error checking mitra status:", err.message);
      }
    };

    checkMitraStatus();
  }, []);

  const alertClasses =
    alertMessage.type === 'yellow'
      ? 'bg-yellow-100 border-yellow-300 text-yellow-800'
      : 'bg-blue-100 border-blue-300 text-blue-800';

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      
      <Header />
      
      {showProfileAlert && (
        <div className={`border-b-2 text-center p-3 shadow-md ${alertClasses}`}>
          <p>
            <strong>
              {alertMessage.type === 'yellow' ? 'Perhatian:' : 'Info:'}
            </strong>
            <span className="ml-2">{alertMessage.text}</span>
            <Link
              to={alertMessage.link}
              className="font-bold underline ml-2 hover:opacity-80"
            >
              Klik di sini.
            </Link>
          </p>
        </div>
      )}

      <main className="flex-grow flex flex-col">
        <Outlet />
      </main>

      {/* RENDER KONDISIONAL: Footer Layout HANYA muncul jika BUKAN halaman Home */}
      {!isHomePage && <Footer />}
      
    </div>
  );
};

export default Layout;