// src/config/db.js

// nanti di sini isi koneksi ke Supabase / PostgreSQL
// untuk sekarang dummy function
const connectDB = async () => {
  try {
    console.log('DB connected (dummy) ✅');
  } catch (error) {
    console.error('DB connection failed ❌', error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
