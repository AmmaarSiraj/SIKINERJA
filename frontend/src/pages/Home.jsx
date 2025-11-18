import { Link } from 'react-router-dom';
import PartDaftarKegiatan from '../components/PartDaftarKegiatan'; // <-- 1. IMPORT KOMPONEN

const Home = () => {
  return (
    // 2. Tambahkan padding bawah agar tidak terlalu mepet footer
    <div className="min-h-screen bg-gray-100 pb-16">

      {/* 4. Tampilkan Komponen Daftar Kegiatan */}
      <div className="mt-12 p-4">
        <PartDaftarKegiatan />
      </div>

    </div>
  );
};

export default Home;