// src/pages/admin/CetakSPK.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const CetakSPK = () => {
  const { periode, id_mitra } = useParams();
  const navigate = useNavigate();
  
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/spk/print/${periode}/${id_mitra}`);
        setData(res.data);
      } catch (err) {
        setError("Gagal memuat data surat.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [periode, id_mitra]);

  const handlePrint = () => {
    window.print();
  };

  const formatRupiah = (num) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);
  };

  const formatDateIndo = (dateStr) => {
    if (!dateStr) return '...';
    const date = new Date(dateStr);
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  };

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

  const formatTerbilang = (nilai) => {
    return getTerbilang(nilai).trim() + ' rupiah';
  };

  if (loading) return <div className="p-10 text-center">Memuat dokumen...</div>;
  if (error || !data) return <div className="p-10 text-center text-red-500">{error || "Data tidak ditemukan"}</div>;

  const { mitra, setting, tasks } = data;
  
  // Hitung total dari kolom 'total_honor'
  const totalHonor = tasks.reduce((acc, curr) => acc + Number(curr.total_honor || 0), 0);
  
  const tahunAnggaran = setting.tanggal_surat ? new Date(setting.tanggal_surat).getFullYear() : new Date().getFullYear();
  const tglSuratObj = new Date(setting.tanggal_surat);
  
  const hariIndo = tglSuratObj.toLocaleDateString('id-ID', { weekday: 'long' });
  const tglIndo = tglSuratObj.toLocaleDateString('id-ID', { day: 'numeric' });
  const blnIndo = tglSuratObj.toLocaleDateString('id-ID', { month: 'long' });
  const thnIndoText = getTerbilang(tglSuratObj.getFullYear()).trim(); 

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center p-8 print:p-0 print:bg-white">
      
      {/* CSS Cetak */}
      <style>{`
        @page { 
          margin: 15mm; 
          size: A4;
        }
        @media print {
          body { 
            -webkit-print-color-adjust: exact; 
          }
          @page { margin: 0; }
          body { margin: 1.6cm; }
        }
      `}</style>

      {/* Toolbar Atas (Hidden saat Print) */}
      <div className="w-full max-w-[210mm] flex justify-between mb-6 print:hidden">
        <button 
          onClick={() => navigate(-1)}
          className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded shadow font-bold"
        >
          &larr; Kembali
        </button>
        <button 
          onClick={handlePrint}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded shadow font-bold flex items-center gap-2"
        >
          Cetak PDF
        </button>
      </div>

      {/* KONTEN SURAT A4 */}
      <div className="bg-white w-[210mm] p-[10mm] shadow-2xl text-black font-serif text-[11pt] leading-relaxed print:shadow-none print:w-full print:p-0">
        
        {/* === HALAMAN 1: PERJANJIAN (Pasal 1 - 3) === */}
        <div className="print:break-after-page relative pb-10">
            <div className="text-center font-bold mb-6">
                <h3 className="uppercase text-lg">PERJANJIAN KERJA</h3>
                <h3 className="uppercase text-lg">PETUGAS PENDATAAN LAPANGAN</h3>
                <h3 className="uppercase text-lg">KEGIATAN SURVEI/SENSUS TAHUN {tahunAnggaran}</h3>
                <h3 className="uppercase">PADA BADAN PUSAT STATISTIK KOTA SALATIGA</h3>
                <p className="font-normal mt-1">NOMOR: {setting.nomor_surat_format || '.../SPK.MITRA/...'}</p>
            </div>

            <div className="text-justify mb-4">
                <p>
                    Pada hari ini {hariIndo}, tanggal {getTerbilang(tglSuratObj.getDate()).trim()}, bulan {blnIndo} tahun {thnIndoText},
                    bertempat di BPS Kota Salatiga, yang bertandatangan di bawah ini:
                </p>
            </div>

            <table className="w-full mb-6 align-top">
                <tbody>
                    <tr>
                        <td className="w-6 text-center align-top">1.</td>
                        <td className="w-40 align-top font-bold">{setting.nama_ppk}</td>
                        <td className="w-4 align-top">:</td>
                        <td className="align-top text-justify">
                            {setting.jabatan_ppk} Badan Pusat Statistik Kota Salatiga, 
                            berkedudukan di BPS Kota Salatiga, bertindak untuk dan atas nama Badan Pusat Statistik Kota Salatiga 
                            berkedudukan di Jl. Hasanudin KM 01, Dukuh, Sidomukti, Salatiga, selanjutnya disebut sebagai 
                            <strong> PIHAK PERTAMA</strong>.
                        </td>
                    </tr>
                    <tr>
                        <td className="w-6 text-center align-top pt-4">2.</td>
                        <td className="w-40 align-top font-bold pt-4">{mitra.nama_lengkap}</td>
                        <td className="w-4 align-top pt-4">:</td>
                        <td className="align-top pt-4 text-justify">
                            Mitra Statistik, berkedudukan di {mitra.alamat}, bertindak untuk dan atas nama diri sendiri, 
                            selanjutnya disebut <strong> PIHAK KEDUA</strong>.
                        </td>
                    </tr>
                </tbody>
            </table>

            <div className="text-justify mb-4">
                <p>
                    Bahwa PIHAK PERTAMA dan PIHAK KEDUA yang secara bersama-sama disebut PARA PIHAK, sepakat untuk mengikatkan diri 
                    dalam Perjanjian Kerja Petugas Pendataan Lapangan Kegiatan Survei/Sensus Tahun {tahunAnggaran} pada Badan Pusat Statistik Kota Salatiga, 
                    yang selanjutnya disebut Perjanjian, dengan ketentuan-ketentuan sebagai berikut:
                </p>
            </div>

            {/* PASAL 1 - 3 */}
            <div className="space-y-4">
                <div className="text-center"><h4 className="font-bold">Pasal 1</h4></div>
                <p className="text-justify">
                    PIHAK PERTAMA memberikan pekerjaan kepada PIHAK KEDUA dan PIHAK KEDUA menerima pekerjaan dari PIHAK PERTAMA 
                    sebagai Petugas Pendataan Lapangan Kegiatan Survei/Sensus Tahun {tahunAnggaran} pada Badan Pusat Statistik Kota Salatiga, 
                    dengan lingkup pekerjaan yang ditetapkan oleh PIHAK PERTAMA.
                </p>

                <div className="text-center"><h4 className="font-bold">Pasal 2</h4></div>
                <p className="text-justify">
                    Ruang lingkup pekerjaan dalam Perjanjian ini mengacu pada wilayah kerja dan beban kerja sebagaimana tertuang dalam lampiran Perjanjian, 
                    Pedoman Petugas Pendataan Lapangan Wilayah Kegiatan Survei/Sensus Tahun {tahunAnggaran} pada Badan Pusat Statistik Kota Salatiga, 
                    dan ketentuan-ketentuan yang ditetapkan oleh PIHAK PERTAMA.
                </p>

                <div className="text-center"><h4 className="font-bold">Pasal 3</h4></div>
                <p className="text-justify">
                    Jangka Waktu Perjanjian terhitung sejak tanggal {formatDateIndo(setting.tanggal_surat)} sampai dengan selesainya periode kegiatan bulan ini.
                </p>
            </div>
        </div>

        {/* === HALAMAN 2: PASAL 4 - PASAL 9 === */}
        <div className="print:break-before-page relative pt-8 print:break-after-page"> 
             <div className="space-y-4">
                <div className="text-center"><h4 className="font-bold">Pasal 4</h4></div>
                <p className="text-justify">
                    PIHAK KEDUA berkewajiban melaksanakan seluruh pekerjaan yang diberikan oleh PIHAK PERTAMA sampai selesai, 
                    sesuai ruang lingkup pekerjaan sebagaimana dimaksud dalam Pasal 2 di wilayah kerja masing-masing.
                </p>

                <div className="text-center"><h4 className="font-bold">Pasal 5</h4></div>
                <p className="text-justify">
                    (1) PIHAK KEDUA berhak untuk mendapatkan honorarium petugas dari PIHAK PERTAMA sebesar 
                    <strong> {formatRupiah(totalHonor)} </strong> 
                    (<i>{formatTerbilang(totalHonor)}</i>) 
                    untuk pekerjaan sebagaimana dimaksud dalam Pasal 2, termasuk 
                    {setting.komponen_honor ? ` ${setting.komponen_honor}` : ' biaya pajak, bea materai, dan jasa pelayanan keuangan'}.
                </p>
                <p className="text-justify mt-2">
                    (2) PIHAK KEDUA tidak diberikan honorarium tambahan apabila melakukan kunjungan di luar jadwal atau terdapat tambahan waktu pelaksanaan pekerjaan lapangan.
                </p>

                <div className="text-center"><h4 className="font-bold">Pasal 6</h4></div>
                <p className="text-justify">
                    (1) Pembayaran honorarium sebagaimana dimaksud dalam Pasal 5 dilakukan setelah PIHAK KEDUA menyelesaikan dan menyerahkan seluruh hasil pekerjaan sebagaimana dimaksud dalam Pasal 2 kepada PIHAK PERTAMA.
                </p>
                <p className="text-justify mt-2">
                    (2) Pembayaran sebagaimana dimaksud pada ayat (1) dilakukan oleh PIHAK PERTAMA kepada PIHAK KEDUA sesuai dengan ketentuan peraturan perundang-undangan.
                </p>

                <div className="text-center"><h4 className="font-bold">Pasal 7</h4></div>
                <p className="text-justify">
                    Penyerahan hasil pekerjaan lapangan sebagaimana dimaksud dalam Pasal 2 dilakukan secara bertahap dan selambat-lambatnya 
                    seluruh hasil pekerjaan lapangan diserahkan sesuai jadwal yang tercantum dalam Lampiran, yang dinyatakan dalam Berita Acara Serah Terima Hasil Pekerjaan yang ditandatangani oleh PARA PIHAK.
                </p>

                <div className="text-center"><h4 className="font-bold">Pasal 8</h4></div>
                <p className="text-justify">
                    PIHAK PERTAMA dapat memutuskan Perjanjian ini secara sepihak sewaktu-waktu dalam hal PIHAK KEDUA tidak dapat melaksanakan kewajibannya sebagaimana dimaksud dalam Pasal 4, dengan menerbitkan Surat Pemutusan Perjanjian Kerja.
                </p>

                <div className="text-center"><h4 className="font-bold">Pasal 9</h4></div>
                <p className="text-justify">
                    (1) Apabila PIHAK KEDUA mengundurkan diri pada saat/setelah pelaksanaan pekerjaan lapangan dengan tidak menyelesaikan pekerjaan yang menjadi tanggungjawabnya, maka PIHAK PERTAMA akan memberikan Surat Pemutusan Perjanjian Kerja kepada PIHAK KEDUA.
                </p>
                <p className="text-justify mt-2">
                    (2) Dalam hal terjadi peristiwa sebagaimana dimaksud pada ayat (1), PIHAK PERTAMA membayarkan honorarium kepada PIHAK KEDUA secara proporsional sesuai pekerjaan yang telah dilaksanakan.
                </p>
             </div>
        </div>

        {/* === HALAMAN 3: PASAL 10 - TANDA TANGAN === */}
        <div className="print:break-before-page relative pt-8">
             <div className="space-y-4">
                <div className="text-center"><h4 className="font-bold">Pasal 10</h4></div>
                <p className="text-justify">
                    (1) Apabila terjadi Keadaan Kahar, yang meliputi bencana alam dan bencana sosial, PIHAK KEDUA memberitahukan kepada PIHAK PERTAMA dalam waktu paling lambat 7 (tujuh) hari sejak mengetahui atas kejadian Keadaan Kahar dengan menyertakan bukti.
                </p>
                <p className="text-justify mt-2">
                    (2) Pada saat terjadi Keadaan Kahar, pelaksanaan pekerjaan oleh PIHAK KEDUA dihentikan sementara dan dilanjutkan kembali setelah Keadaan Kahar berakhir, namun apabila akibat Keadaan Kahar tidak memungkinkan dilanjutkan/diselesaikannya pelaksanaan pekerjaan, PIHAK KEDUA berhak menerima honorarium secara proporsional sesuai pekerjaan yang telah dilaksanakan.
                </p>

                <div className="text-center"><h4 className="font-bold">Pasal 11</h4></div>
                <p className="text-justify">
                    Segala sesuatu yang belum atau tidak cukup diatur dalam Perjanjian ini, dituangkan dalam perjanjian tambahan/addendum dan merupakan bagian tidak terpisahkan dari perjanjian ini.
                </p>

                <div className="text-center"><h4 className="font-bold">Pasal 12</h4></div>
                <p className="text-justify">
                    (1) Segala perselisihan atau perbedaan pendapat yang timbul sebagai akibat adanya Perjanjian ini akan diselesaikan secara musyawarah untuk mufakat.
                </p>
                <p className="text-justify mt-2">
                    (2) Apabila perselisihan tidak dapat diselesaikan sebagaimana dimaksud pada ayat (1), PARA PIHAK sepakat menyelesaikan perselisihan dengan memilih kedudukan/domisili hukum di Panitera Pengadilan Negeri Kota Salatiga.
                </p>

                <p className="text-justify mt-6">
                    Demikian Perjanjian ini dibuat dan ditandatangani oleh PARA PIHAK dalam 2 (dua) rangkap asli bermeterai cukup, tanpa paksaan dari PIHAK manapun dan untuk dilaksanakan oleh PARA PIHAK.
                </p>
             </div>

             {/* TANDA TANGAN */}
             <div className="mt-12 flex justify-between px-4">
                <div className="text-center w-64">
                    <p className="font-bold mb-20">PIHAK KEDUA,</p>
                    <p className="font-bold border-b border-black inline-block uppercase">{mitra.nama_lengkap}</p>
                </div>
                <div className="text-center w-64">
                    <p className="font-bold mb-20">PIHAK PERTAMA,</p>
                    <p className="font-bold border-b border-black inline-block">{setting.nama_ppk}</p>
                    <p>NIP. {setting.nip_ppk}</p>
                </div>
             </div>
        </div>

        {/* === HALAMAN 4: LAMPIRAN TABEL === */}
        <div className="print:break-before-page min-h-[297mm] pt-10">
            <div className="text-center font-bold mb-8">
                <h3 className="uppercase">LAMPIRAN</h3>
                <h3 className="uppercase">PERJANJIAN KERJA PETUGAS PENCACAHAN/PENDATAAN LAPANGAN</h3>
                <h3 className="uppercase">KEGIATAN SURVEI/SENSUS TAHUN {tahunAnggaran}</h3>
                <h3 className="uppercase">PADA BADAN PUSAT STATISTIK KOTA SALATIGA</h3>
                <p className="font-normal mt-1">NOMOR: {setting.nomor_surat_format}</p>
            </div>

            <h4 className="font-bold mb-4 uppercase text-center text-sm">DAFTAR URAIAN TUGAS, JANGKA WAKTU, NILAI PERJANJIAN, DAN BEBAN ANGGARAN</h4>

            {/* TABEL RINCIAN TUGAS (Sesuai PDF Referensi) */}
            <table className="w-full border-collapse border border-black text-sm">
                <thead>
                    <tr className="bg-gray-100">
                        <th className="border border-black px-2 py-2 w-10 text-center">No</th>
                        <th className="border border-black px-3 py-2 text-left">Uraian Tugas</th>
                        <th className="border border-black px-3 py-2 text-center w-32">Jangka Waktu</th>
                        <th className="border border-black px-3 py-2 text-center w-16">Target Volume</th>
                        <th className="border border-black px-3 py-2 text-center w-20">Pekerjaan Satuan</th>
                        <th className="border border-black px-3 py-2 text-right w-24">Harga Satuan</th>
                        <th className="border border-black px-3 py-2 text-right w-28">Nilai Perjanjian</th>
                        <th className="border border-black px-3 py-2 text-center w-24">Beban Anggaran</th>
                    </tr>
                </thead>
                <tbody>
                    {tasks.map((task, index) => (
                        <tr key={index}>
                            <td className="border border-black px-2 py-2 text-center align-top">{index + 1}</td>
                            
                            {/* Uraian Tugas: Nama Sub Kegiatan */}
                            <td className="border border-black px-3 py-2 align-top">
                                <span className="font-bold block">{task.nama_sub_kegiatan}</span>
                            </td>
                            
                            {/* Jangka Waktu */}
                            <td className="border border-black px-3 py-2 text-center align-top text-xs">
                                {formatDateIndo(task.tanggal_mulai)} s.d. <br/> {formatDateIndo(task.tanggal_selesai)}
                            </td>
                            
                            {/* Target Volume (Individual) */}
                            <td className="border border-black px-3 py-2 text-center align-top">
                                {task.target_volume}
                            </td>
                            
                            {/* Satuan */}
                            <td className="border border-black px-3 py-2 text-center align-top">
                                {task.nama_satuan}
                            </td>
                            
                            {/* Harga Satuan */}
                            <td className="border border-black px-3 py-2 text-right align-top">
                                {formatRupiah(task.harga_satuan)}
                            </td>
                            
                            {/* Nilai Perjanjian (Total) */}
                            <td className="border border-black px-3 py-2 text-right align-top">
                                {formatRupiah(task.total_honor)}
                            </td>
                            
                            {/* Beban Anggaran (Placeholder / Kosong) */}
                            <td className="border border-black px-3 py-2 text-center align-top text-xs">
                                -
                            </td>
                        </tr>
                    ))}
                </tbody>
                <tfoot>
                    {/* Baris Total Terbilang */}
                    <tr>
                        <td colSpan="6" className="border border-black px-3 py-3 font-bold text-center italic bg-gray-50">
                            Terbilang: {formatTerbilang(totalHonor)}
                        </td>
                        <td className="border border-black px-3 py-3 text-right font-bold bg-gray-50">
                            {formatRupiah(totalHonor)}
                        </td>
                        <td className="border border-black px-3 py-3 bg-gray-50"></td>
                    </tr>
                </tfoot>
            </table>
        </div>

      </div>
    </div>
  );
};

export default CetakSPK;