// src/pages/PreviewTemplateSPKUser.jsx
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaArrowLeft, FaPrint } from 'react-icons/fa';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const PreviewTemplateSPKUser = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const [previewData, setPreviewData] = useState(null);

  const sampleTasks = [
    { 
      nama_sub_kegiatan: 'Pendataan Lapangan Susenas', 
      tanggal_mulai: '2025-03-01', 
      tanggal_selesai: '2025-03-31', 
      target_volume: 50, 
      nama_satuan: 'Rumah Tangga', 
      harga_satuan: 20000, 
      total_honor: 1000000 
    },
    { 
      nama_sub_kegiatan: 'Pengolahan Dokumen', 
      tanggal_mulai: '2025-04-01', 
      tanggal_selesai: '2025-04-15', 
      target_volume: 25, 
      nama_satuan: 'Dokumen', 
      harga_satuan: 15000, 
      total_honor: 375000 
    }
  ];

  const getTerbilang = (nilai) => {
    const angka = Math.abs(nilai);
    const baca = ['', 'satu', 'dua', 'tiga', 'empat', 'lima', 'enam', 'tujuh', 'delapan', 'sembilan', 'sepuluh', 'sebelas'];
    let terbilang = '';

    if (angka < 12) {
      terbilang = ' ' + baca[angka];
    } else if (angka < 20) {
      terbilang = getTerbilang(angka - 10) + ' belas';
    } else if (angka < 100) {
      terbilang = getTerbilang(Math.floor(angka / 10)) + ' puluh' + getTerbilang(angka % 10);
    } else if (angka < 200) {
      terbilang = ' seratus' + getTerbilang(angka - 100);
    } else if (angka < 1000) {
      terbilang = getTerbilang(Math.floor(angka / 100)) + ' ratus' + getTerbilang(angka % 100);
    } else if (angka < 2000) {
      terbilang = ' seribu' + getTerbilang(angka - 1000);
    } else if (angka < 1000000) {
      terbilang = getTerbilang(Math.floor(angka / 1000)) + ' ribu' + getTerbilang(angka % 1000);
    } else if (angka < 1000000000) {
      terbilang = getTerbilang(Math.floor(angka / 1000000)) + ' juta' + getTerbilang(angka % 1000000);
    }
    return terbilang;
  };

  const formatRupiah = (num) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);
  };

  const formatDateIndo = (dateStr) => {
    if (!dateStr) return '...';
    const date = new Date(dateStr);
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const formatTerbilang = (nilai) => {
    return getTerbilang(nilai).trim() + ' rupiah';
  };

  const getTanggalTerbilangHariIni = () => {
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    
    const now = new Date();
    const hari = days[now.getDay()];
    const tanggal = getTerbilang(now.getDate()).trim();
    const bulan = months[now.getMonth()];
    const tahunAngka = now.getFullYear();
    const tahun = getTerbilang(tahunAngka).trim();

    return `${hari}, tanggal ${tanggal}, bulan ${bulan} tahun ${tahun}`;
  };

  const generateLampiranHTML = (tasks) => {
    const totalHonor = tasks.reduce((acc, curr) => acc + curr.total_honor, 0);
    const tahun = previewData?.tahun_anggaran || new Date().getFullYear();
    const nomorSurat = previewData?.nomor_surat || '...';

    const rows = tasks.map((task, index) => `
      <tr>
          <td class="border border-black px-2 py-2 text-center align-top">${index + 1}</td>
          <td class="border border-black px-3 py-2 align-top"><span class="font-bold block">${task.nama_sub_kegiatan}</span></td>
          <td class="border border-black px-3 py-2 text-center align-top text-xs">${formatDateIndo(task.tanggal_mulai)} s.d. <br/> ${formatDateIndo(task.tanggal_selesai)}</td>
          <td class="border border-black px-3 py-2 text-center align-top">${task.target_volume}</td>
          <td class="border border-black px-3 py-2 text-center align-top">${task.nama_satuan}</td>
          <td class="border border-black px-3 py-2 text-right align-top">${formatRupiah(task.harga_satuan)}</td>
          <td class="border border-black px-3 py-2 text-right align-top">${formatRupiah(task.total_honor)}</td>
          <td class="border border-black px-3 py-2 text-center align-top text-xs">-</td>
      </tr>
    `).join('');

    return `
      <div class="print:break-before-page pt-10 mt-10">
          <div class="text-center font-bold mb-8">
              <h3 class="uppercase">LAMPIRAN</h3>
              <h3 class="uppercase">PERJANJIAN KERJA PETUGAS PENDATAAN LAPANGAN</h3>
              <h3 class="uppercase">KEGIATAN SURVEI/SENSUS TAHUN ${tahun}</h3>
              <h3 class="uppercase">PADA BADAN PUSAT STATISTIK KOTA SALATIGA</h3>
              <p class="font-normal mt-1">NOMOR: ${nomorSurat}</p>
          </div>

          <h4 class="font-bold mb-4 uppercase text-center text-sm">DAFTAR URAIAN TUGAS, JANGKA WAKTU, NILAI PERJANJIAN, DAN BEBAN ANGGARAN</h4>

          <table class="w-full border-collapse border border-black text-sm">
              <thead>
                  <tr class="bg-gray-100">
                      <th class="border border-black px-2 py-2 w-10 text-center">No</th>
                      <th class="border border-black px-3 py-2 text-left">Uraian Tugas</th>
                      <th class="border border-black px-3 py-2 text-center w-32">Jangka Waktu</th>
                      <th class="border border-black px-3 py-2 text-center w-16">Target Volume</th>
                      <th class="border border-black px-3 py-2 text-center w-20">Pekerjaan Satuan</th>
                      <th class="border border-black px-3 py-2 text-right w-24">Harga Satuan</th>
                      <th class="border border-black px-3 py-2 text-right w-28">Nilai Perjanjian</th>
                      <th class="border border-black px-3 py-2 text-center w-24">Beban Anggaran</th>
                  </tr>
              </thead>
              <tbody>
                  ${rows}
              </tbody>
              <tfoot>
                  <tr>
                      <td colspan="6" class="border border-black px-3 py-3 font-bold text-center italic bg-gray-50">
                          Terbilang: ${formatTerbilang(totalHonor)}
                      </td>
                      <td class="border border-black px-3 py-3 text-right font-bold bg-gray-50">
                          ${formatRupiah(totalHonor)}
                      </td>
                      <td class="border border-black px-3 py-3 bg-gray-50"></td>
                  </tr>
              </tfoot>
          </table>
      </div>
    `;
  };

  useEffect(() => {
    const fetchSampleData = async () => {
        const now = new Date();
        const periode = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        
        try {
            const res = await axios.get(`${API_URL}/api/spk/setting/${periode}`);
            const setting = res.data || {};

            setPreviewData({
                nama_ppk: setting.nama_ppk || '[NAMA PPK]',
                nip_ppk: setting.nip_ppk || '[NIP PPK]',
                jabatan_ppk: setting.jabatan_ppk || '[JABATAN PPK]',
                nomor_surat: setting.nomor_surat_format || '000/33730/SPK.MITRA/MM/YYYY',
                tanggal_surat: setting.tanggal_surat 
                    ? new Date(setting.tanggal_surat).toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'}) 
                    : new Date().toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'}),
                
                nama_mitra: 'BUDI SANTOSO',
                nik_mitra: '3373012345678901',
                alamat_mitra: 'Jl. Merdeka No. 45, Salatiga',
                
                total_honor: 'Rp 1.375.000',
                terbilang_honor: 'satu juta tiga ratus tujuh puluh lima ribu rupiah',
                
                tanggal_terbilang: getTanggalTerbilangHariIni(),
                tahun_anggaran: now.getFullYear()
            });

        } catch (err) {
            setPreviewData({
                nama_ppk: '[NAMA PPK]',
                nip_ppk: '[NIP PPK]',
                jabatan_ppk: '[JABATAN PPK]',
                nomor_surat: '[NOMOR SURAT]',
                tanggal_surat: '[TANGGAL]',
                nama_mitra: '[NAMA MITRA]',
                nik_mitra: '[NIK]',
                alamat_mitra: '[ALAMAT]',
                total_honor: '[RP ...]',
                terbilang_honor: '[... rupiah]',
                tanggal_terbilang: getTanggalTerbilangHariIni(),
                tahun_anggaran: new Date().getFullYear()
            });
        }
    };

    fetchSampleData();
  }, []);

  if (!state) return null;

  const { header, parts, articles, id } = state;

  const handleBackToEdit = () => {
    // Navigasi ini diarahkan kembali ke form edit untuk User
    // Pastikan rute ini juga ada di App.jsx
    const targetPath = id ? `/spk/templates/edit/${id}` : '/spk/templates/create';
    navigate(targetPath, { state: { header, parts, articles, fromPreview: true } });
  };

  const handlePrint = () => {
    window.print();
  };

  const replaceVariables = (text) => {
    if (!text || !previewData) return text;
    let result = text;

    result = result.replace(/{{NAMA_PPK}}/g, `<b>${previewData.nama_ppk}</b>`);
    result = result.replace(/{{NIP_PPK}}/g, previewData.nip_ppk);
    result = result.replace(/{{JABATAN_PPK}}/g, previewData.jabatan_ppk);
    result = result.replace(/{{NAMA_MITRA}}/g, `<b>${previewData.nama_mitra}</b>`);
    result = result.replace(/{{NIK}}/g, previewData.nik_mitra);
    result = result.replace(/{{ALAMAT_MITRA}}/g, previewData.alamat_mitra);
    result = result.replace(/{{TOTAL_HONOR}}/g, `<b>${previewData.total_honor}</b>`);
    result = result.replace(/{{TERBILANG}}/g, `<i>${previewData.terbilang_honor}</i>`);
    result = result.replace(/{{TANGGAL_SURAT}}/g, previewData.tanggal_surat);
    result = result.replace(/{{TANGGAL_TERBILANG}}/g, previewData.tanggal_terbilang);
    result = result.replace(/{{TAHUN}}/g, previewData.tahun_anggaran);
    result = result.replace(/{{NOMOR_SURAT}}/g, previewData.nomor_surat);
    
    if (result.includes('{{Lampiran}}')) {
        result = result.replace(/{{Lampiran}}/g, generateLampiranHTML(sampleTasks));
    }

    result = result.replace(
        /{{Break_Space}}/g, 
        '<div class="page-break-spacer"><span class="no-print text-gray-300 text-xs block text-center py-2 border-t border-dashed border-gray-300">-- Halaman Baru --</span></div>'
    );

    return result;
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8 flex flex-col items-center font-sans print:p-0 print:bg-white print:block">
      
      <style>{`
        @page { 
          size: A4; 
          margin: 0; 
        }
        @media print {
          html, body {
            width: 210mm;
            height: 297mm;
            margin: 0 !important;
            padding: 0 !important;
          }
          .no-print { 
            display: none !important; 
          }
          .print-content {
            box-shadow: none !important;
            margin: 0 !important;
            width: 100% !important;
            padding: 20mm !important; 
          }
          .page-break-spacer {
            page-break-before: always !important; 
            display: block !important;
            height: 20mm !important; 
            width: 100%;
            visibility: hidden; 
          }
        }
      `}</style>

      <div className="w-full max-w-[210mm] flex justify-between items-center mb-6 no-print">
        <button onClick={handleBackToEdit} className="flex items-center gap-2 text-gray-600 font-bold hover:text-[#1A2A80] bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-200 transition">
            <FaArrowLeft /> Kembali Edit
        </button>
        
        <div className="flex gap-3 items-center">
            <div className="bg-blue-100 text-blue-800 px-4 py-2 rounded-lg text-xs font-bold border border-blue-200 shadow-sm">
                MODE SIMULASI
            </div>
            <button 
                onClick={handlePrint} 
                className="flex items-center gap-2 bg-[#1A2A80] text-white font-bold px-5 py-2 rounded-lg shadow-md hover:bg-blue-900 transition"
            >
                <FaPrint /> Cetak Contoh
            </button>
        </div>
      </div>

      <div className="print-content bg-white w-[210mm] min-h-[297mm] p-[20mm] shadow-2xl text-black font-serif text-[11pt] leading-relaxed relative mx-auto">
        
        <div className="text-center font-bold mb-6 pt-0 mt-0"> 
            <h3 className="uppercase text-lg m-0 leading-tight">PERJANJIAN KERJA</h3>
            <h3 className="uppercase text-lg m-0 leading-tight">PETUGAS PENDATAAN LAPANGAN</h3>
            <h3 className="uppercase text-lg m-0 leading-tight">KEGIATAN SURVEI/SENSUS TAHUN {previewData?.tahun_anggaran}</h3>
            <h3 className="uppercase m-0 leading-tight">PADA BADAN PUSAT STATISTIK KOTA SALATIGA</h3>
            <p className="font-normal mt-2">NOMOR: {previewData?.nomor_surat}</p>
        </div>

        <div className="text-justify mb-4" dangerouslySetInnerHTML={{ __html: replaceVariables(parts.pembuka) }}></div>

        <table className="w-full mb-6 align-top">
            <tbody>
                <tr>
                    <td className="w-6 text-center align-top font-bold">1.</td>
                    <td className="w-40 align-top font-bold" dangerouslySetInnerHTML={{ __html: replaceVariables('{{NAMA_PPK}}') }}></td>
                    <td className="w-4 align-top">:</td>
                    <td className="align-top text-justify" dangerouslySetInnerHTML={{ __html: replaceVariables(parts.pihak_pertama) }}></td>
                </tr>
                <tr><td colSpan="4" className="h-4"></td></tr>
                <tr>
                    <td className="w-6 text-center align-top font-bold">2.</td>
                    <td className="w-40 align-top font-bold" dangerouslySetInnerHTML={{ __html: replaceVariables('{{NAMA_MITRA}}') }}></td>
                    <td className="w-4 align-top">:</td>
                    <td className="align-top text-justify" dangerouslySetInnerHTML={{ __html: replaceVariables(parts.pihak_kedua) }}></td>
                </tr>
            </tbody>
        </table>

        <div className="text-justify mb-4" dangerouslySetInnerHTML={{ __html: replaceVariables(parts.kesepakatan) }}></div>

        <div className="space-y-4">
            {articles.map((article, idx) => (
                <div key={idx}>
                    <div className="text-center font-bold">
                        Pasal {article.nomor_pasal}
                        {article.judul_pasal && <span className="block uppercase">{article.judul_pasal}</span>}
                    </div>
                    <div className="text-justify mt-1 whitespace-pre-line" dangerouslySetInnerHTML={{ __html: replaceVariables(article.isi_pasal) }}></div>
                </div>
            ))}
        </div>

        <div className="text-justify mt-6" dangerouslySetInnerHTML={{ __html: replaceVariables(parts.penutup) }}></div>

        <div className="mt-12 flex justify-between px-4 break-inside-avoid">
            <div className="text-center w-64">
                <p className="font-bold mb-20">PIHAK KEDUA,</p>
                <p className="font-bold border-b border-black inline-block uppercase" dangerouslySetInnerHTML={{ __html: replaceVariables('{{NAMA_MITRA}}') }}></p>
            </div>
            <div className="text-center w-64">
                <p className="font-bold mb-20">PIHAK PERTAMA,</p>
                <p className="font-bold border-b border-black inline-block" dangerouslySetInnerHTML={{ __html: replaceVariables('{{NAMA_PPK}}') }}></p>
                <p>NIP. {previewData?.nip_ppk}</p>
            </div>
        </div>

      </div>
    </div>
  );
};

export default PreviewTemplateSPKUser;