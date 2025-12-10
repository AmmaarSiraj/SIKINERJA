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
        console.error(err);
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
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num || 0);
  };

  const formatDateIndo = (dateInput) => {
    if (!dateInput) return '...';
    const date = new Date(dateInput);
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

  const getTanggalTerbilang = (dateInput) => {
    if (!dateInput) return '...';
    const date = new Date(dateInput);
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    
    const hari = days[date.getDay()];
    const tgl = getTerbilang(date.getDate()).trim();
    const bln = months[date.getMonth()];
    const thn = getTerbilang(date.getFullYear()).trim();

    return `${hari}, tanggal ${tgl}, bulan ${bln} tahun ${thn}`;
  };

  const generateLampiranHTML = (tasks, totalHonor, tahun, nomorSurat) => {
    const rows = tasks.map((task, index) => `
      <tr class="text-[10px]">
          <td class="border border-black px-1 py-1 text-center align-top">${index + 1}</td>
          <td class="border border-black px-2 py-1 align-top">
            <span class="font-bold block">${task.nama_sub_kegiatan}</span>
            ${task.nama_jabatan ? `<span class="block text-[9px] italic">(${task.nama_jabatan})</span>` : ''}
          </td>
          <td class="border border-black px-2 py-1 text-center align-top whitespace-nowrap">${formatDateIndo(task.tanggal_mulai)} s.d. <br/> ${formatDateIndo(task.tanggal_selesai)}</td>
          <td class="border border-black px-2 py-1 text-center align-top">${task.target_volume}</td>
          <td class="border border-black px-2 py-1 text-center align-top">${task.nama_satuan || '-'}</td>
          <td class="border border-black px-2 py-1 text-right align-top whitespace-nowrap">${formatRupiah(task.harga_satuan)}</td>
          <td class="border border-black px-2 py-1 text-right align-top whitespace-nowrap">${formatRupiah(task.total_honor)}</td>
          <td class="border border-black px-2 py-1 text-center align-top">${task.beban_anggaran || '-'}</td>
      </tr>
    `).join('');

    return `
      <div class="print:break-before-page pt-10 mt-10">
          <div class="text-center font-bold mb-6">
              <h3 class="uppercase">LAMPIRAN</h3>
              <h3 class="uppercase">PERJANJIAN KERJA PETUGAS PENDATAAN LAPANGAN</h3>
              <h3 class="uppercase">KEGIATAN SURVEI/SENSUS TAHUN ${tahun}</h3>
              <h3 class="uppercase">PADA BADAN PUSAT STATISTIK KOTA SALATIGA</h3>
              <p class="font-normal mt-1">NOMOR: ${nomorSurat}</p>
          </div>
          <h4 class="font-bold mb-4 uppercase text-center text-xs">DAFTAR URAIAN TUGAS, JANGKA WAKTU, NILAI PERJANJIAN, DAN BEBAN ANGGARAN</h4>
          
          <table class="w-full border-collapse border border-black text-[10px]">
              <thead>
                  <tr class="bg-gray-100">
                      <th class="border border-black px-1 py-1 w-8 text-center">No</th>
                      <th class="border border-black px-2 py-1 text-left">Uraian Tugas</th>
                      <th class="border border-black px-2 py-1 text-center w-24">Jangka Waktu</th>
                      <th class="border border-black px-2 py-1 text-center w-10">Vol</th>
                      <th class="border border-black px-2 py-1 text-center w-16">Satuan</th>
                      <th class="border border-black px-2 py-1 text-right w-20">Harga Satuan</th>
                      <th class="border border-black px-2 py-1 text-right w-24">Nilai Perjanjian</th>
                      <th class="border border-black px-2 py-1 text-center w-24">Beban Anggaran</th>
                  </tr>
              </thead>
              <tbody>${rows}</tbody>
              <tfoot>
                  <tr>
                      <td colspan="6" class="border border-black px-2 py-2 font-bold text-center italic bg-gray-50">
                          Terbilang: ${formatTerbilang(totalHonor)}
                      </td>
                      <td class="border border-black px-2 py-2 text-right font-bold bg-gray-50 whitespace-nowrap">
                          ${formatRupiah(totalHonor)}
                      </td>
                      <td class="border border-black px-2 py-2 bg-gray-50"></td>
                  </tr>
              </tfoot>
          </table>
      </div>
    `;
  };

  const replaceVariables = (text) => {
    if (!text || !data) return text;
    const { mitra, setting, tasks } = data;
    const totalHonor = tasks.reduce((acc, curr) => acc + Number(curr.total_honor || 0), 0);
    const tahunAnggaran = setting.tanggal_surat ? new Date(setting.tanggal_surat).getFullYear() : new Date().getFullYear();

    const today = new Date();

    let result = text;

    result = result.replace(/{{NAMA_PPK}}/g, `<b>${setting.nama_ppk || '...'}</b>`);
    result = result.replace(/{{NIP_PPK}}/g, setting.nip_ppk || '...');
    result = result.replace(/{{JABATAN_PPK}}/g, setting.jabatan_ppk || '...');
    result = result.replace(/{{NAMA_MITRA}}/g, `<b>${mitra.nama_lengkap}</b>`);
    result = result.replace(/{{NIK}}/g, mitra.nik || '-');
    result = result.replace(/{{ALAMAT_MITRA}}/g, mitra.alamat || '-');
    result = result.replace(/{{TOTAL_HONOR}}/g, `<b>${formatRupiah(totalHonor)}</b>`);
    result = result.replace(/{{TERBILANG}}/g, `<i>${formatTerbilang(totalHonor)}</i>`);
    
    result = result.replace(/{{TANGGAL_SURAT}}/g, formatDateIndo(setting.tanggal_surat));
    result = result.replace(/{{TANGGAL_TERBILANG}}/g, getTanggalTerbilang(today));
    
    result = result.replace(/{{TAHUN}}/g, tahunAnggaran);
    result = result.replace(/{{NOMOR_SURAT}}/g, setting.nomor_surat_format || '...');
    
    if (result.includes('{{Lampiran}}')) {
        const lampiranHTML = generateLampiranHTML(tasks, totalHonor, tahunAnggaran, setting.nomor_surat_format);
        result = result.replace(/{{Lampiran}}/g, lampiranHTML);
    }

    result = result.replace(
        /{{Break_Space}}/g, 
        '<div class="page-break-spacer"><span class="no-print text-gray-300 text-xs block text-center py-2 border-t border-dashed border-gray-300">-- Halaman Baru --</span></div>'
    );

    return result;
  };

  if (loading) return <div className="p-10 text-center">Memuat dokumen...</div>;
  if (error || !data) return <div className="p-10 text-center text-red-500">{error || "Data tidak ditemukan"}</div>;

  const { mitra, setting, tasks, template } = data;
  const totalHonor = tasks.reduce((acc, curr) => acc + Number(curr.total_honor || 0), 0);
  const tahunAnggaran = setting.tanggal_surat ? new Date(setting.tanggal_surat).getFullYear() : new Date().getFullYear();
  
  const tglSekarang = new Date(); 
  const hariIndo = tglSekarang.toLocaleDateString('id-ID', { weekday: 'long' });
  const blnIndo = tglSekarang.toLocaleDateString('id-ID', { month: 'long' });
  const tglTerbilang = getTerbilang(tglSekarang.getDate()).trim();
  const thnTerbilang = getTerbilang(tglSekarang.getFullYear()).trim();

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center p-8 print:p-0 print:bg-white">
      
      <style>{`
        @page { 
          margin: 5mm; 
          size: A4 portrait;
        }
        @media print {
          body { -webkit-print-color-adjust: exact; margin: 0; }
          @page { margin: 0; }
          .print-content { 
            padding: 15mm 10mm !important; 
            width: 100% !important; 
            margin: 0 !important; 
            box-shadow: none !important; 
          }
          .no-print { display: none !important; }
          .page-break-spacer {
            page-break-before: always !important; 
            display: block !important;
            height: 20mm !important; 
            width: 100%;
            visibility: hidden; 
          }
        }
      `}</style>

      <div className="w-full max-w-[210mm] flex justify-between mb-6 print:hidden">
        <button onClick={() => navigate(-1)} className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded shadow font-bold">
          &larr; Kembali
        </button>
        <button onClick={handlePrint} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded shadow font-bold flex items-center gap-2">
          Cetak PDF
        </button>
      </div>

      <div className="print-content bg-white w-[210mm] min-h-[297mm] p-[10mm] shadow-2xl text-black font-serif text-[11pt] leading-relaxed relative mx-auto">
        
        {template ? (
            <>
                <div className="text-center font-bold mb-6 pt-0 mt-0"> 
                    <h3 className="uppercase text-lg m-0 leading-tight">PERJANJIAN KERJA</h3>
                    <h3 className="uppercase text-lg m-0 leading-tight">PETUGAS PENDATAAN LAPANGAN</h3>
                    <h3 className="uppercase text-lg m-0 leading-tight">KEGIATAN SURVEI/SENSUS TAHUN {tahunAnggaran}</h3>
                    <h3 className="uppercase m-0 leading-tight">PADA BADAN PUSAT STATISTIK KOTA SALATIGA</h3>
                    <p className="font-normal mt-2">NOMOR: {setting.nomor_surat_format}</p>
                </div>

                <div className="text-justify mb-4" dangerouslySetInnerHTML={{ __html: replaceVariables(template.parts.pembuka) }}></div>

                <table className="w-full mb-6 align-top">
                    <tbody>
                        <tr>
                            <td className="w-6 text-center align-top font-bold">1.</td>
                            <td className="w-40 align-top font-bold">{setting.nama_ppk}</td>
                            <td className="w-4 align-top">:</td>
                            <td className="align-top text-justify" dangerouslySetInnerHTML={{ __html: replaceVariables(template.parts.pihak_pertama) }}></td>
                        </tr>
                        <tr><td colSpan="4" className="h-4"></td></tr>
                        <tr>
                            <td className="w-6 text-center align-top font-bold">2.</td>
                            <td className="w-40 align-top font-bold">{mitra.nama_lengkap}</td>
                            <td className="w-4 align-top">:</td>
                            <td className="align-top text-justify" dangerouslySetInnerHTML={{ __html: replaceVariables(template.parts.pihak_kedua) }}></td>
                        </tr>
                    </tbody>
                </table>

                <div className="text-justify mb-4" dangerouslySetInnerHTML={{ __html: replaceVariables(template.parts.kesepakatan) }}></div>

                <div className="space-y-4">
                    {template.articles.map((article, idx) => (
                        <div key={idx}>
                            <div className="text-center font-bold">
                                Pasal {article.nomor_pasal}
                                {article.judul_pasal && <span className="block uppercase">{article.judul_pasal}</span>}
                            </div>
                            <div className="text-justify mt-1 whitespace-pre-line" dangerouslySetInnerHTML={{ __html: replaceVariables(article.isi_pasal) }}></div>
                        </div>
                    ))}
                </div>

                <div className="text-justify mt-6" dangerouslySetInnerHTML={{ __html: replaceVariables(template.parts.penutup) }}></div>

                <div className="mt-12 flex justify-between px-4 break-inside-avoid">
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
            </>
        ) : (
            <>
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
                            Pada hari ini {hariIndo}, tanggal {tglTerbilang}, bulan {blnIndo} tahun {thnTerbilang},
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

                <div className="print:break-before-page min-h-[297mm] pt-10">
                    <div className="text-center font-bold mb-8">
                        <h3 className="uppercase">LAMPIRAN</h3>
                        <h3 className="uppercase">PERJANJIAN KERJA PETUGAS PENCACAHAN/PENDATAAN LAPANGAN</h3>
                        <h3 className="uppercase">KEGIATAN SURVEI/SENSUS TAHUN {tahunAnggaran}</h3>
                        <h3 className="uppercase">PADA BADAN PUSAT STATISTIK KOTA SALATIGA</h3>
                        <p className="font-normal mt-1">NOMOR: {setting.nomor_surat_format}</p>
                    </div>

                    <h4 className="font-bold mb-4 uppercase text-center text-xs">DAFTAR URAIAN TUGAS, JANGKA WAKTU, NILAI PERJANJIAN, DAN BEBAN ANGGARAN</h4>

                    <table className="w-full border-collapse border border-black text-[10px]">
                        <thead>
                            <tr className="bg-gray-100">
                                <th className="border border-black px-1 py-1 w-8 text-center">No</th>
                                <th className="border border-black px-2 py-1 text-left">Uraian Tugas</th>
                                <th className="border border-black px-2 py-1 text-center w-24">Jangka Waktu</th>
                                <th className="border border-black px-2 py-1 text-center w-10">Vol</th>
                                <th className="border border-black px-2 py-1 text-center w-16">Satuan</th>
                                <th className="border border-black px-2 py-1 text-right w-20">Harga Satuan</th>
                                <th className="border border-black px-2 py-1 text-right w-24">Nilai Perjanjian</th>
                                <th className="border border-black px-2 py-1 text-center w-20">Beban Anggaran</th>
                            </tr>
                        </thead>
                        <tbody>
                            {tasks.map((task, index) => (
                                <tr key={index}>
                                    <td className="border border-black px-1 py-1 text-center align-top">{index + 1}</td>
                                    <td className="border border-black px-2 py-1 align-top">
                                        <span className="font-bold block">{task.nama_sub_kegiatan}</span>
                                        {task.nama_jabatan && <span className="block text-[9px] italic">({task.nama_jabatan})</span>}
                                    </td>
                                    <td className="border border-black px-2 py-1 text-center align-top whitespace-nowrap">{formatDateIndo(task.tanggal_mulai)} s.d. <br/> {formatDateIndo(task.tanggal_selesai)}</td>
                                    <td className="border border-black px-2 py-1 text-center align-top">{task.target_volume}</td>
                                    <td className="border border-black px-2 py-1 text-center align-top">{task.nama_satuan}</td>
                                    <td className="border border-black px-2 py-1 text-right align-top whitespace-nowrap">{formatRupiah(task.harga_satuan)}</td>
                                    <td className="border border-black px-2 py-1 text-right align-top whitespace-nowrap">{formatRupiah(task.total_honor)}</td>
                                    <td className="border border-black px-2 py-1 text-center align-top text-[9px]">{task.beban_anggaran || '-'}</td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr>
                                <td colSpan="6" className="border border-black px-2 py-2 font-bold text-center italic bg-gray-50">
                                    Terbilang: {formatTerbilang(totalHonor)}
                                </td>
                                <td className="border border-black px-2 py-2 text-right font-bold bg-gray-50 whitespace-nowrap">
                                    {formatRupiah(totalHonor)}
                                </td>
                                <td className="border border-black px-2 py-2 bg-gray-50"></td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </>
        )}

      </div>
    </div>
  );
};

export default CetakSPK;