// src/pages/admin/SettingLaporan.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate, Link } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const SettingLaporan = () => {
  const { id_kegiatan } = useParams();
  const navigate = useNavigate();

  const [kegiatan, setKegiatan] = useState(null);
  const [subKegiatanList, setSubKegiatanList] = useState([]);
  
  // 'main' = Kegiatan Utama
  // 'ALL_SUB' = Template untuk semua sub kegiatan
  // 'sub1' = Override khusus sub1
  const [selectedTarget, setSelectedTarget] = useState('ALL_SUB'); // Default ke ALL_SUB agar lebih cepat

  const [judulLaporan, setJudulLaporan] = useState('');
  const [deskripsiForm, setDeskripsiForm] = useState('');
  const [items, setItems] = useState([
    { label: 'Foto Kegiatan', tipe_input: 'foto', wajib_diisi: true, opsi_pilihan: '' }
  ]);

  const [loadingInit, setLoadingInit] = useState(true);
  const [loadingForm, setLoadingForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // 1. FETCH DATA KEGIATAN & SUB LIST
  useEffect(() => {
    const fetchInitData = async () => {
      setLoadingInit(true);
      try {
        const token = localStorage.getItem('token');
        const headers = { Authorization: `Bearer ${token}` };

        const [resKegiatan, resSub] = await Promise.all([
          axios.get(`${API_URL}/api/kegiatan/${id_kegiatan}`, { headers }),
          axios.get(`${API_URL}/api/subkegiatan/kegiatan/${id_kegiatan}`, { headers })
        ]);

        setKegiatan(resKegiatan.data);
        setSubKegiatanList(resSub.data);
      } catch (err) {
        setError("Gagal memuat data kegiatan.");
      } finally {
        setLoadingInit(false);
      }
    };
    if (id_kegiatan) fetchInitData();
  }, [id_kegiatan]);

  // 2. FETCH FORM SETTINGS (Saat target berubah)
  useEffect(() => {
    const fetchFormConfig = async () => {
      if (!id_kegiatan) return;
      setLoadingForm(true);
      
      try {
        // Logic URL
        let url = `${API_URL}/api/laporan-form/kegiatan/${id_kegiatan}`;
        
        if (selectedTarget !== 'main') {
          // Kirim 'ALL_SUB' atau ID spesifik
          url += `?id_subkegiatan=${selectedTarget}`;
        }

        const res = await axios.get(url);
        const data = res.data;

        if (data) {
          // A. FORM SUDAH ADA
          setJudulLaporan(data.judul_laporan);
          setDeskripsiForm(data.deskripsi_form || '');
          const loadedItems = data.items.map(item => ({
            label: item.label,
            tipe_input: item.tipe_input,
            wajib_diisi: item.wajib_diisi === 1,
            opsi_pilihan: item.opsi_pilihan || ''
          }));
          setItems(loadedItems.length > 0 ? loadedItems : []);
        } else {
          // B. FORM BELUM ADA (Reset)
          let defaultTitle = "";
          if (selectedTarget === 'main') {
             defaultTitle = `Laporan Utama ${kegiatan?.nama_kegiatan || ''}`;
          } else if (selectedTarget === 'ALL_SUB') {
             defaultTitle = "Laporan Pelaksanaan Sub Kegiatan";
          } else {
             const sub = subKegiatanList.find(s => s.id === selectedTarget);
             defaultTitle = sub ? `Laporan ${sub.nama_sub_kegiatan}` : "Laporan";
          }

          setJudulLaporan(defaultTitle);
          setDeskripsiForm('');
          setItems([{ label: 'Foto Kegiatan', tipe_input: 'foto', wajib_diisi: true, opsi_pilihan: '' }]);
        }
      } catch (err) {
        console.error("Error fetch form:", err);
      } finally {
        setLoadingForm(false);
      }
    };

    if (!loadingInit) fetchFormConfig();
  }, [selectedTarget, id_kegiatan, loadingInit, kegiatan]);

  // HANDLERS
  const handleAddItem = () => setItems([...items, { label: '', tipe_input: 'text_short', wajib_diisi: false, opsi_pilihan: '' }]);
  const handleRemoveItem = (idx) => setItems(items.filter((_, i) => i !== idx));
  const handleItemChange = (idx, field, val) => {
    const newItems = [...items];
    newItems[idx][field] = val;
    setItems(newItems);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    if (!judulLaporan) { alert("Judul wajib diisi"); setSaving(false); return; }

    const payload = {
      id_kegiatan,
      id_subkegiatan: selectedTarget === 'main' ? null : selectedTarget,
      judul_laporan: judulLaporan,
      deskripsi_form: deskripsiForm,
      items: items
    };

    try {
      await axios.post(`${API_URL}/api/laporan-form`, payload);
      alert('Template berhasil disimpan!');
      navigate('/admin/laporan');
    } catch (err) {
      alert("Gagal menyimpan.");
    } finally {
      setSaving(false);
    }
  };

  if (loadingInit) return <div className="p-8 text-center">Memuat data...</div>;

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <Link to="/admin/laporan" className="text-indigo-600 mb-4 inline-block">&larr; Kembali</Link>
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Setting Template Laporan</h1>
      
      {/* PILIHAN TARGET */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
        <label className="block text-sm font-bold text-blue-800 mb-2">Template Laporan Ini Berlaku Untuk:</label>
        <select
          value={selectedTarget}
          onChange={(e) => setSelectedTarget(e.target.value)}
          className="block w-full md:w-1/2 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 font-medium"
        >
          <option value="main">◉ Kegiatan Utama Saja ({kegiatan?.nama_kegiatan})</option>
          
          {/* OPSI GLOBAL SUB KEGIATAN */}
          <option value="ALL_SUB" className="font-bold bg-yellow-50">
            ✪ SEMUA Sub Kegiatan (Berlaku Umum)
          </option>

          {/* OPSI SPESIFIK (OVERRIDE) */}
          {subKegiatanList.length > 0 && (
            <optgroup label="--- Khusus (Override per Sub) ---">
              {subKegiatanList.map(sub => (
                <option key={sub.id} value={sub.id}>➣ {sub.nama_sub_kegiatan}</option>
              ))}
            </optgroup>
          )}
        </select>
        <p className="text-xs text-blue-600 mt-2">
          * Pilih "SEMUA Sub Kegiatan" agar satu format laporan langsung berlaku untuk semua sub kegiatan di bawah {kegiatan?.nama_kegiatan}.
        </p>
      </div>

      {/* FORM BUILDER */}
      {loadingForm ? (
        <div className="py-10 text-center text-gray-500">Mengambil konfigurasi form...</div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Header Form */}
          <div className="bg-white shadow p-6 rounded-lg">
            <div className="grid gap-4">
              <div>
                <label className="block text-sm font-medium">Judul Form</label>
                <input 
                  type="text" className="w-full border rounded px-3 py-2"
                  value={judulLaporan} onChange={e => setJudulLaporan(e.target.value)} required 
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Instruksi</label>
                <textarea 
                  className="w-full border rounded px-3 py-2" rows="2"
                  value={deskripsiForm} onChange={e => setDeskripsiForm(e.target.value)} 
                />
              </div>
            </div>
          </div>

          {/* Item Questions */}
          <div className="space-y-4">
            {items.map((item, idx) => (
              <div key={idx} className="bg-white shadow p-6 rounded-lg relative">
                <button type="button" onClick={() => handleRemoveItem(idx)} className="absolute top-4 right-4 text-red-500 hover:text-red-700">Hapus</button>
                <span className="absolute top-4 left-4 bg-gray-200 w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold">{idx + 1}</span>
                
                <div className="ml-8 grid grid-cols-1 md:grid-cols-12 gap-4">
                  <div className="md:col-span-6">
                    <label className="text-xs font-bold text-gray-500">Pertanyaan / Label</label>
                    <input type="text" className="w-full border rounded px-2 py-1" value={item.label} onChange={e => handleItemChange(idx, 'label', e.target.value)} required />
                  </div>
                  <div className="md:col-span-4">
                    <label className="text-xs font-bold text-gray-500">Tipe Input</label>
                    <select className="w-full border rounded px-2 py-1" value={item.tipe_input} onChange={e => handleItemChange(idx, 'tipe_input', e.target.value)}>
                      <option value="text_short">Teks Pendek</option>
                      <option value="text_long">Teks Panjang</option>
                      <option value="number">Angka</option>
                      <option value="foto">Foto</option>
                      <option value="select">Pilihan (Dropdown)</option>
                    </select>
                  </div>
                  <div className="md:col-span-2 flex items-center pt-5">
                    <label className="flex items-center cursor-pointer">
                      <input type="checkbox" checked={item.wajib_diisi} onChange={e => handleItemChange(idx, 'wajib_diisi', e.target.checked)} className="mr-2" />
                      <span className="text-sm">Wajib</span>
                    </label>
                  </div>
                </div>
                {item.tipe_input === 'select' && (
                  <div className="ml-8 mt-2">
                    <input type="text" className="w-full border border-yellow-300 bg-yellow-50 rounded px-2 py-1 text-sm" placeholder="Opsi A, Opsi B, Opsi C" value={item.opsi_pilihan} onChange={e => handleItemChange(idx, 'opsi_pilihan', e.target.value)} />
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="flex justify-center py-4">
            <button type="button" onClick={handleAddItem} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded border">+ Tambah Pertanyaan</button>
          </div>

          <div className="flex justify-end border-t pt-4">
            <button type="submit" disabled={saving} className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded disabled:bg-gray-400">
              {saving ? 'Menyimpan...' : 'Simpan Template'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default SettingLaporan;