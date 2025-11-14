import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

// 1. Impor layout Anda
import Layout from "./layouts/Layout";

// 2. Impor komponen proteksi rute
import RequireAuth from "./components/RequireAuth";

// 3. Impor halaman-halaman Anda
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard"; // Ini dashboard publik/user
import Login from "./auth/Login";
import Register from "./auth/Register";
import AdminDashboard from "./pages/admin/Dashboard"; // Ini dashboard admin

function App() {
  // Definisikan role yang diizinkan untuk area admin
  const adminRoles = ["admin", "superadmin"];

  return (
    <Router>
      <Routes>
        {/* Rute publik TANPA layout (Header/Footer) */}
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Rute DENGAN layout (Header/Footer) */}
        <Route element={<Layout />}>
          
          {/* Rute publik di dalam layout */}
          <Route path="/home" element={<Home />} />
          <Route path="/dashboard" element={<Dashboard />} />
          
          {/* Rute admin yang dilindungi di dalam layout */}
          <Route
            path="/admin/dashboard"
            element={
              <RequireAuth allowedRoles={adminRoles}>
                <AdminDashboard />
              </RequireAuth>
            }
          />
          {/* Anda bisa tambahkan rute admin lainnya di sini */}

        </Route>
      </Routes>
    </Router>
  );
}

export default App;