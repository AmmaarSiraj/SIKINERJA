require('dotenv').config();
const express = require('express');
const cors = require('cors'); // Import cors

const app = express();
const PORT = process.env.PORT || 3001;

// === Middleware ===
// Mengizinkan frontend (di port lain) mengakses API ini
app.use(cors()); 
// Mengizinkan server membaca JSON dari body request
app.use(express.json()); 

// === Routes ===
app.get('/api/halo', (req, res) => {
  res.json({ message: "Halo dari server Express!" });
});

// === Start Server ===
app.listen(PORT, () => {
  console.log(`🚀 Server backend berjalan di http://localhost:${PORT}`);
});