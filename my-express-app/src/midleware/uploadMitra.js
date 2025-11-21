const multer = require('multer');
const fs = require('fs');

// 1. Tentukan folder tujuan
const uploadDir = 'uploads/';

// Buat folder jika belum ada (opsional, agar tidak error)
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// 2. Konfigurasi Storage (Penyimpanan)
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir); // Folder penyimpanan
  },
  filename: function (req, file, cb) {
    // Memberi nama file unik (timestamp + nama asli) agar tidak tertimpa
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

// 3. Filter File (Hanya Excel)
const fileFilter = (req, file, cb) => {
  if (
    file.mimetype.includes('excel') || 
    file.mimetype.includes('spreadsheetml') ||
    file.originalname.match(/\.(xlsx|xls)$/)
  ) {
    cb(null, true);
  } else {
    cb(new Error('Hanya diperbolehkan upload file Excel (.xlsx, .xls)!'), false);
  }
};

// 4. Inisialisasi Multer
const uploadMitra = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // Batas ukuran file 5MB (opsional)
});

module.exports = uploadMitra;