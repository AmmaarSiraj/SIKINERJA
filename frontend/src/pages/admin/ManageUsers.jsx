import React, { useEffect, useState, useRef } from 'react'; // Tambah useRef
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const API_URL = 'http://localhost:3000/api';
const getToken = () => localStorage.getItem('token');

const ManageUsers = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false); // State upload
    const [error, setError] = useState(null);
    const navigate = useNavigate();
    const fileInputRef = useRef(null); // Ref input file

    const fetchUsers = async () => {
        setLoading(true);
        setError(null);
        try {
            const token = getToken();
            const response = await axios.get(`${API_URL}/users`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setUsers(response.data);
        } catch (err) {
            console.error(err);
            if (err.response && err.response.status === 401) {
                setError('Akses ditolak. Silakan login kembali.');
                navigate('/login');
            } else {
                setError('Gagal memuat data pengguna.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Apakah Anda yakin ingin menghapus pengguna ini?')) return;
        try {
            const token = getToken();
            await axios.delete(`${API_URL}/users/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            fetchUsers();
        } catch (err) {
            alert('Gagal menghapus pengguna.');
        }
    };

    // --- LOGIC BARU: IMPORT & TEMPLATE ---
    const handleDownloadTemplate = () => {
        const csvHeader = "username,email,password,role";
        const csvRows = [
            "user_satu,user1@gmail.com,rahasia123,user",
            "admin_baru,admin@gmail.com,admin123,admin",
            "budi_santoso,budi@yahoo.com,katasandi,user"
        ];
        const csvContent = "data:text/csv;charset=utf-8," + csvHeader + "\n" + csvRows.join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "template_import_users.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleImportClick = () => {
        fileInputRef.current.click();
    };

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        setUploading(true);
        try {
            const token = getToken();
            const response = await axios.post(`${API_URL}/users/import`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'Authorization': `Bearer ${token}`
                }
            });

            const { successCount, failCount, errors } = response.data;
            let msg = `Import User Selesai!\n✅ Sukses: ${successCount}\n❌ Gagal: ${failCount}`;
            if (errors && errors.length > 0) {
                msg += `\n\nDetail Error:\n` + errors.slice(0, 3).join('\n') + (errors.length > 3 ? '\n...' : '');
            }
            alert(msg);
            fetchUsers(); // Refresh data

        } catch (err) {
            console.error(err);
            alert(err.response?.data?.message || "Gagal import user.");
        } finally {
            setUploading(false);
            e.target.value = null;
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const formatDate = (dateString) => {
        if (!dateString) return '';
        return new Date(dateString).toLocaleDateString('id-ID', {
            year: 'numeric', month: 'long', day: 'numeric',
        });
    };

    if (loading) return <div className="text-center py-8">Memuat data...</div>;
    if (error) return <div className="text-center py-8 text-red-600">Error: {error}</div>;

    return (
        <div className="container mx-auto p-4 max-w-6xl">
            {/* Input File Hidden */}
            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".csv, .xlsx, .xls" className="hidden" />

            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Manajemen Pengguna</h1>
                
                <div className="flex gap-2">
                    <button 
                        onClick={handleDownloadTemplate}
                        className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded text-sm font-medium border border-gray-300 transition"
                    >
                        📥 Template CSV
                    </button>
                    <button 
                        onClick={handleImportClick}
                        disabled={uploading}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded text-sm font-bold transition disabled:opacity-50"
                    >
                        {uploading ? 'Mengupload...' : '📤 Import Excel'}
                    </button>
                    <button
                        onClick={() => navigate('/admin/users/add')}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded text-sm transition"
                    >
                        + Tambah Manual
                    </button>
                </div>
            </div>

            <div className="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Username</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tanggal Daftar</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {users.map((user) => (
                            <tr key={user.id} onClick={() => navigate(`/admin/users/${user.id}/detail`)} className="hover:bg-gray-100 cursor-pointer">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm font-medium text-gray-900">{user.username}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm text-gray-900">{user.email}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.role === 'admin' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'} capitalize`}>
                                        {user.role}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {formatDate(user.created_at)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); navigate(`/admin/edit-user/${user.id}`); }}
                                        className="text-indigo-600 hover:text-indigo-900 mr-4"
                                    >
                                        Edit
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleDelete(user.id); }}
                                        className="text-red-600 hover:text-red-900"
                                    >
                                        Hapus
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ManageUsers;