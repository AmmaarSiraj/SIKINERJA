import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

function DetailUser() {
  // Ambil ID user dari parameter URL
  const { id } = useParams(); 
  
  const [userData, setUserData] = useState(null);
  const [mitraDetail, setMitraDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUserDetails = async () => {
      setLoading(true);
      setError(null);
      setUserData(null);
      setMitraDetail(null);

      const API_BASE_URL = 'http://localhost:3000/api';

      try {
        // 1. Siapkan kedua permintaan (fetch) secara bersamaan
        const userPromise = fetch(`${API_BASE_URL}/users/un/${id}`);
        const mitraPromise = fetch(`${API_BASE_URL}/mitra/un/user/${id}`);

        // 2. Jalankan kedua permintaan secara paralel
        const [userRes, mitraRes] = await Promise.all([userPromise, mitraPromise]);

        // 3. Proses respons data user (ini wajib ada)
        if (!userRes.ok) {
          const errData = await userRes.json();
          // Jika user tidak ditemukan (404), lempar error
          throw new Error(errData.message || 'Gagal mengambil data user');
        }
        const userData = await userRes.json();
        setUserData(userData);

        // 4. Proses respons data mitra (ini opsional)
        if (mitraRes.ok) {
          // Jika sukses (200 OK), berarti user ini adalah mitra
          const mitraData = await mitraRes.json();
          setMitraDetail(mitraData);
        } else if (mitraRes.status === 404) {
          // Jika 404, berarti user ini bukan mitra. Ini normal, bukan error.
          setMitraDetail(null);
        } else {
          // Jika ada error lain (spt 500), anggap saja data mitra tidak ada
          console.warn('Gagal mengambil data mitra:', await mitraRes.text());
          setMitraDetail(null);
        }

      } catch (err) {
        // Error hanya akan di-set jika data user gagal diambil
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchUserDetails();
    }
  }, [id]); // Akan me-refresh data jika 'id' di URL berubah

  // --- Tampilan Render ---

  if (loading) {
    return <div style={{ padding: '2rem' }}>Memuat data user...</div>;
  }

  if (error) {
    return <div style={{ padding: '2rem', color: 'red' }}>Error: {error}</div>;
  }

  if (!userData) {
    return <div style={{ padding: '2rem' }}>User tidak ditemukan.</div>;
  }

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Detail User</h1>
      
      <div className="user-card" style={{ border: '1px solid #ccc', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>
        <h3>Data Akun</h3>
        <p><strong>Username:</strong> {userData.username}</p>
        <p><strong>Email:</strong> {userData.email}</p>
        <p><strong>Role:</strong> {userData.role}</p>
        <p><strong>User ID:</strong> {userData.id}</p>
        <p><strong>Bergabung pada:</strong> {new Date(userData.created_at).toLocaleDateString('id-ID')}</p>
      </div>

      <div className="mitra-card" style={{ border: '1px solid #ccc', padding: '1rem', borderRadius: '8px' }}>
        <h2>Detail Mitra</h2>
        {mitraDetail ? (
          <div>
            <p><strong>Nama Lengkap:</strong> {mitraDetail.nama_lengkap}</p>
            <p><strong>NIK:</strong> {mitraDetail.nik}</p>
            <p><strong>Alamat:</strong> {mitraDetail.alamat}</p>
            <p><strong>No. HP:</strong> {mitraDetail.no_hp}</p>
            <p><strong>Bank:</strong> {mitraDetail.nama_bank} - {mitraDetail.no_rekening}</p>
            <p>
              <strong>Batas Honor Bulanan:</strong> 
              Rp {Number(mitraDetail.batas_honor_bulanan).toLocaleString('id-ID')}
            </p>
          </div>
        ) : (
          // Ini akan ditampilkan jika user bukan mitra (mitraRes 404)
          <p>User ini belum terdaftar sebagai data mitra.</p>
        )}
      </div>
    </div>
  );
}

export default DetailUser;