import { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useNavigate, useParams } from 'react-router-dom';

const EditUser = () => {
    // useParams untuk mengambil 'id' dari URL (/admin/edit-user/:id)
    const { id } = useParams();
    const navigate = useNavigate();

    // State untuk form
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [role, setRole] = useState('user');
    const [password, setPassword] = useState(''); // Hanya jika ingin ganti password

    // State untuk loading dan error
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(''); // Error untuk submit form
    const [loadError, setLoadError] = useState(''); // Error untuk fetch data awal

    // Efek ini berjalan saat komponen dimuat untuk mengambil data user
    useEffect(() => {
        const fetchUser = async () => {
            const token = localStorage.getItem('token');
            if (!token) {
                setLoadError("Autentikasi gagal. Silakan login kembali.");
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                // Panggil endpoint GET /api/users/:id
                const response = await axios.get(
                    `http://localhost:3000/api/users/${id}`, //
                    {
                        headers: { 'Authorization': `Bearer ${token}` }
                    }
                );

                // Isi state form dengan data yang didapat
                const user = response.data;
                setUsername(user.username);
                setEmail(user.email);
                setRole(user.role);

            } catch (err) {
                console.error("Gagal mengambil data user:", err);
                setLoadError(err.response?.data?.message || "Gagal memuat data user.");
            } finally {
                setLoading(false);
            }
        };

        fetchUser();
    }, [id]); // Dependensi [id] agar fetch ulang jika id berubah

    // Handle submit form
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        const token = localStorage.getItem('token');
        if (!token) {
            setError("Autentikasi gagal. Silakan login kembali.");
            return;
        }

        // Siapkan data untuk dikirim ke backend
        const updateData = {
            username,
            email,
            role,
        }; //

        // Hanya tambahkan password ke data jika diisi (tidak kosong)
        if (password) {
            updateData.password = password; //
        }

        try {
            // Panggil endpoint PUT /api/users/:id
            await axios.put(
                `http://localhost:3000/api/users/${id}`, //
                updateData,
                {
                    headers: { 'Authorization': `Bearer ${token}` }
                }
            );

            // Jika sukses, kembali ke halaman manajemen user
            navigate('/admin/manage-users');

        } catch (err) {
            console.error("Gagal update user:", err);
            setError(err.response?.data?.message || "Gagal update user.");
        }
    };

    // Tampilkan loading saat mengambil data
    if (loading) {
        return <div className="text-center p-10">Memuat data user...</div>;
    }

    // Tampilkan error jika data gagal diambil
    if (loadError) {
        return (
            <div className="text-center p-10 text-red-600">
                Error: {loadError}
                <div className="mt-4">
                    <Link
                        to="/admin/manage-users"
                        className="text-blue-600 hover:text-blue-800"
                    >
                        &larr; Kembali ke Daftar User
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto max-w-2xl">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-800">Edit User</h1>
                <Link
                    to="/admin/manage-users"
                    className="text-blue-600 hover:text-blue-800"
                >
                    &larr; Kembali ke Daftar User
                </Link>
            </div>

            <form
                onSubmit={handleSubmit}
                className="bg-white p-8 rounded-lg shadow-md space-y-6"
            >
                {/* Pesan Error Submit */}
                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                        {error}
                    </div>
                )}

                {/* Username */}
                <div>
                    <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                        Username
                    </label>
                    <input
                        type="text"
                        id="username"
                        className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                    />
                </div>

                {/* Email */}
                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                        Alamat Email
                    </label>
                    <input
                        type="email"
                        id="email"
                        className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                </div>

                {/* Password */}
                <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                        Password (Baru)
                    </label>
                    <input
                        type="password"
                        id="password"
                        className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        placeholder="Kosongkan jika tidak ingin diubah"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                </div>

                {/* Role */}
                <div>
                    <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                        Role
                    </label>
                    <select
                        id="role"
                        className="block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                    >
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                    </select>
                </div>

                {/* Tombol Submit */}
                <div>
                    <button
                        type="submit"
                        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
                    >
                        Simpan Perubahan
                    </button>
                </div>
            </form>
        </div>
    );
};

export default EditUser;