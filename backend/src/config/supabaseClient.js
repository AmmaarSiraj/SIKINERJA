const { createClient } = require('@supabase/supabase-js');

// Ambil variabel lingkungan
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

// Buat dan ekspor klien Supabase
// Kita menggunakan service_role key di sini untuk operasi backend
const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = supabase;