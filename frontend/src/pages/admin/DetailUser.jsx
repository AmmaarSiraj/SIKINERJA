import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

function DetailUser() {
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
        const userPromise = fetch(`${API_BASE_URL}/users/un/${id}`);
        const mitraPromise = fetch(`${API_BASE_URL}/mitra/un/user/${id}`);

        const [userRes, mitraRes] = await Promise.all([userPromise, mitraPromise]);

        if (!userRes.ok) {
          const errData = await userRes.json();
          throw new Error(errData.message || 'Gagal mengambil data user');
        }
        const userData = await userRes.json();
        setUserData(userData);

        if (mitraRes.ok) {
          const mitraData = await mitraRes.json();
          setMitraDetail(mitraData);
        } else if (mitraRes.status === 404) {
          setMitraDetail(null);
        } else {
          console.warn('Gagal mengambil data mitra:', await mitraRes.text());
          setMitraDetail(null);
        }

      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchUserDetails();
    }
  }, [id]);

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
            {/* --- BARIS INI YANG DITAMBAHKAN --- */}
            <p><strong>Jabatan:</strong> <span style={{ textTransform: 'capitalize' }}>{mitraDetail.jabatan}</span></p>
            {/* ---------------------------------- */}
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
          <p>User ini belum terdaftar sebagai data mitra.</p>
        )}
      </div>
    </div>
  );
}

export default DetailUser;