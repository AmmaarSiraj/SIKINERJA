// src/controllers/userController.js
const supabase = require('../config/supabase');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// POST /api/users/register
const registerUser = async (req, res) => {
  try {
    const { username, email, password, role } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ message: 'username, email, dan password wajib diisi' });
    }

    // hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const { data, error } = await supabase
      .from('users')
      .insert([
        {
          username,
          email,
          role: role || 'user',
          password: hashedPassword,
        },
      ])
      .select('id, username, email, role, created_at')
      .single();

    if (error) {
      // duplicate (unique violation) biasanya code 23505
      if (error.code === '23505') {
        return res.status(400).json({ message: 'Username atau email sudah digunakan' });
      }
      console.error(error);
      return res.status(500).json({ message: 'Gagal mendaftarkan user' });
    }

    return res.status(201).json({
      message: 'User registered successfully',
      user: data,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// POST /api/users/login
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body; // bisa juga pakai username kalau mau

    if (!email || !password) {
      return res.status(400).json({ message: 'email dan password wajib diisi' });
    }

    const { data: users, error } = await supabase
      .from('users')
      .select('id, username, email, role, password')
      .eq('email', email);

    if (error) {
      console.error(error);
      return res.status(500).json({ message: 'Gagal mengambil data user' });
    }

    if (!users || users.length === 0) {
      return res.status(401).json({ message: 'Email atau password salah' });
    }

    const user = users[0];

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Email atau password salah' });
    }

    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    // jangan kirim password balik ke client
    delete user.password;

    return res.json({
      message: 'Login berhasil',
      token,
      user,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/users
const getUsers = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, username, email, role, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      console.error(error);
      return res.status(500).json({ message: 'Gagal mengambil data user' });
    }

    return res.json(data);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/users/:id
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('users')
      .select('id, username, email, role, created_at')
      .eq('id', id)
      .single();

    if (error) {
      console.error(error);
      return res.status(404).json({ message: 'User tidak ditemukan' });
    }

    return res.json(data);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// PUT /api/users/:id
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { username, email, role, password } = req.body;

    const updateData = {};
    if (username) updateData.username = username;
    if (email) updateData.email = email;
    if (role) updateData.role = role;

    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      updateData.password = hashedPassword;
    }

    const { data, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', id)
      .select('id, username, email, role, created_at')
      .single();

    if (error) {
      console.error(error);
      return res.status(500).json({ message: 'Gagal update user' });
    }

    return res.json({
      message: 'User updated successfully',
      user: data,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// DELETE /api/users/:id
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase.from('users').delete().eq('id', id);

    if (error) {
      console.error(error);
      return res.status(500).json({ message: 'Gagal menghapus user' });
    }

    return res.json({ message: 'User deleted successfully' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
};
