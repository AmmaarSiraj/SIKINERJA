import { useLocation, Navigate } from "react-router-dom";

// --- INI HANYA SIMULASI ---
// Ganti ini dengan logika auth Anda yang sebenarnya,
// misalnya menggunakan Context API atau Redux/Zustand
const useAuth = () => {
  // Untuk pengetesan, anggap kita sudah login sebagai 'admin'
  // Di aplikasi nyata, data ini akan datang dari state, context, atau local storage
  const auth = {
    user: "User Admin",
    role: "admin" // Coba ganti ini menjadi "user" atau null untuk melihat efeknya
  };
  
  // Jika tidak ada user, anggap belum login
  if (!auth.user) {
    return { isLoggedIn: false, role: null };
  }
  
  return { isLoggedIn: true, role: auth.role };
};
// --- AKHIR SIMULASI ---


const RequireAuth = ({ allowedRoles, children }) => {
  const { isLoggedIn, role } = useAuth();
  const location = useLocation();

  if (!isLoggedIn) {
    // Jika belum login, redirect ke halaman login
    // `state={{ from: location }}` digunakan agar kita bisa kembali
    // ke halaman sebelumnya setelah berhasil login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    // Jika sudah login TAPI rolenya tidak diizinkan
    // Redirect ke halaman "Unauthorized" (atau kembali ke home/login)
    // Di sini kita kirim ke Home
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  // Jika sudah login dan role diizinkan, tampilkan komponen
  return children;
};

export default RequireAuth;