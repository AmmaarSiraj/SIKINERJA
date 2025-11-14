import { useState, useEffect } from 'react';
import axios from 'axios';

const AdminDashboard = () => {
  const [message, setMessage] = useState("Memuat status server...");

  useEffect(() => {
    // Panggil API backend kita
    // Gunakan proxy Vite, jadi cukup panggil '/api/halo'
    axios.get('/api/halo')
      .then(response => {
        setMessage(response.data.message);
      })
      .catch(error => {
        console.error("Error mengambil data:", error);
        setMessage("Gagal terhubung ke backend");
      });
  }, []); // Array kosong berarti efek ini hanya berjalan sekali

  // Data simulasi untuk dashboard
  const stats = [
    { title: "Total Pengguna", value: "1,204", change: "+12.5%" },
    { title: "Artikel Dipublish", value: "89", change: "+5" },
    { title: "Pengajuan Akun", value: "3", change: "Baru" }
  ];

  const recentActivity = [
    { user: "Andi", action: "menambahkan file baru", time: "2 jam lalu" },
    { user: "Budi", action: "mengajukan akun baru", time: "3 jam lalu" },
    { user: "Citra", action: "mengedit planning", time: "5 jam lalu" },
  ];

  return (
    <div className="p-8 bg-gray-50 min-h-full">
      {/* Header Dashboard */}
      <h1 className="text-4xl font-bold text-gray-900 mb-8">
        Admin Dashboard
      </h1>

      {/* Grid Kartu Statistik */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        
        {/* Kartu Statistik Dinamis (Simulasi) */}
        {stats.map((stat, index) => (
          <div key={index} className="bg-white p-6 rounded-xl shadow-lg transform transition duration-300 hover:scale-105">
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">
              {stat.title}
            </h3>
            <div className="mt-2 flex items-baseline">
              <p className="text-3xl font-semibold text-gray-900">
                {stat.value}
              </p>
              <span className="ml-2 text-sm font-medium text-green-600">
                {stat.change}
              </span>
            </div>
          </div>
        ))}
        
        {/* Kartu Status Server (dari API) */}
        <div className="bg-white p-6 rounded-xl shadow-lg md:col-span-1 lg:col-span-1">
          <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">
            Status Server Backend
          </h3>
          <p className="mt-2 font-mono text-base text-blue-700 break-words">
            {message}
          </p>
        </div>
      </div>

      {/* Tabel Aktivitas Terbaru (Simulasi) */}
      <div className="bg-white shadow-lg rounded-xl overflow-hidden">
        <h2 className="text-xl font-semibold text-gray-900 p-6 border-b border-gray-200">
          Aktivitas Terbaru
        </h2>
        <ul className="divide-y divide-gray-200">
          {recentActivity.map((activity, index) => (
            <li key={index} className="p-4 flex justify-between items-center hover:bg-gray-50 transition duration-150">
              <div>
                <span className="font-medium text-gray-900">{activity.user}</span>
                <span className="text-gray-600"> {activity.action}</span>
              </div>
              <span className="text-sm text-gray-500">{activity.time}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default AdminDashboard;