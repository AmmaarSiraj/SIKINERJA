import { Link } from 'react-router-dom';

const Home = () => {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white p-10 rounded-xl shadow-lg max-w-lg w-full text-center">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">
          Halaman Home (Publik)
        </h1>
        <p className="text-gray-600 mb-8 text-lg">
          Ini adalah halaman utama website Anda.
        </p>
        <nav>
          <Link
            to="/dashboard"
            className="inline-block bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold text-lg hover:bg-blue-700 transition duration-300 transform hover:-translate-y-1"
          >
            Pergi ke Dashboard
          </Link>
        </nav>
      </div>
    </div>
  );
};

export default Home;