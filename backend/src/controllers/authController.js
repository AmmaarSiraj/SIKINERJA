// Memuat klien supabase dari lokasi barunya
const supabase = require('../config/supabaseClient');

// 1. Logika Register
const registerUser = async (req, res) => {
  try {
    const { email, password, username, role } = req.body;

    if (!email || !password || !username) {
      return res.status(400).json({ error: "Email, password, dan username diperlukan" });
    }

    const { data, error } = await supabase.auth.signUp({
      email: email,
      password: password,
      options: {
        data: {
          username: username,
          role: role || 'user'
        }
      }
    });

    if (error) {
      console.error("Error Supabase signUp:", error.message);
      return res.status(400).json({ error: error.message });
    }
    
    res.status(201).json({ message: "User berhasil dibuat", data });

  } catch (err) {
    console.error("Error server:", err.message);
    res.status(500).json({ error: err.message });
  }
};

// 2. Logika Login
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email dan password diperlukan" });
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (error) {
      console.error("Error Supabase login:", error.message);
      return res.status(401).json({ error: error.message }); // 401 = Unauthorized
    }

    res.status(200).json({ message: "Login berhasil", data });

  } catch (err) {
    console.error("Error server:", err.message);
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  registerUser,
  loginUser,
};