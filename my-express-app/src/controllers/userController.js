const { pool } = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const XLSX = require('xlsx');
const fs = require('fs');

const registerUser = async (req, res) => {
  try {
    const { username, email, password, role } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ message: 'username, email, dan password wajib diisi' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const sql = `
      INSERT INTO users (username, email, role, password) 
      VALUES (?, ?, ?, ?)
    `;
    
    const [result] = await pool.query(sql, [
      username,
      email,
      role || 'user',
      hashedPassword,
    ]);

    const [rows] = await pool.query(
      'SELECT id, username, email, role, created_at FROM users WHERE id = ?',
      [result.insertId]
    );

    return res.status(201).json({
      message: 'User registered successfully',
      user: rows[0],
    });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ message: 'Username atau email sudah digunakan' });
    }
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'email dan password wajib diisi' });
    }

    const sql = 'SELECT id, username, email, role, password FROM users WHERE email = ?';
    const [users] = await pool.query(sql, [email]);

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
      { expiresIn: '3h' }
    );

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

const getUsers = async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, username, email, role, created_at FROM users ORDER BY created_at DESC'
    );
    return res.json(rows);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Gagal mengambil data user' });
  }
};

const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await pool.query(
      'SELECT id, username, email, role, created_at FROM users WHERE id = ?',
      [id]
    );

    if (!rows || rows.length === 0) {
      return res.status(404).json({ message: 'User tidak ditemukan' });
    }

    return res.json(rows[0]);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

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

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ message: 'Tidak ada data yang diperbarui' });
    }

    const [result] = await pool.query('UPDATE users SET ? WHERE id = ?', [updateData, id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'User tidak ditemukan' });
    }
    
    const [rows] = await pool.query(
      'SELECT id, username, email, role, created_at FROM users WHERE id = ?',
      [id]
    );

    return res.json({
      message: 'User updated successfully',
      user: rows[0],
    });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ message: 'Username atau email sudah digunakan' });
    }
    console.error(err);
    return res.status(500).json({ message: 'Gagal update user' });
  }
};

const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await pool.query('DELETE FROM users WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'User tidak ditemukan' });
    }

    return res.json({ message: 'User deleted successfully' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Gagal menghapus user' });
  }
};

const importUsers = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'File tidak ditemukan.' });
  }

  let connection;
  try {
    const workbook = XLSX.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: "" });

    if (data.length === 0) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ message: 'File kosong.' });
    }

    connection = await pool.getConnection();

    let successCount = 0;
    let failCount = 0;
    let errors = [];

    console.log(`[IMPORT USERS] Memproses ${data.length} baris...`);

    for (const [index, row] of data.entries()) {
      const rowNum = index + 2;
      
      // Normalisasi Key (Lowercase & Trim)
      const cleanRow = {};
      Object.keys(row).forEach(key => cleanRow[key.trim().toLowerCase()] = row[key]);

      // Ambil Kolom: username, email, password, role
      const username = cleanRow['username'];
      const email = cleanRow['email'];
      const rawPassword = cleanRow['password']; // Password mentah
      let role = cleanRow['role'] ? cleanRow['role'].toLowerCase() : 'user';

      // Validasi Dasar
      if (!username || !email || !rawPassword) {
        failCount++;
        errors.push(`Baris ${rowNum}: Username, Email, atau Password kosong.`);
        continue;
      }

      // Validasi Role (Hanya boleh 'admin' atau 'user')
      if (role !== 'admin' && role !== 'user') {
        role = 'user'; // Default ke user jika typo
      }

      try {
        // 1. Cek Duplikasi Email/Username
        const [existing] = await connection.query(
          'SELECT id FROM users WHERE email = ? OR username = ?', 
          [email, username]
        );
        
        if (existing.length > 0) {
          throw new Error(`Username atau Email sudah terdaftar.`);
        }

        // 2. Hash Password (PENTING!)
        const hashedPassword = await bcrypt.hash(String(rawPassword), 10);

        // 3. Insert ke Database
        await connection.query(
          'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)',
          [username, email, hashedPassword, role]
        );

        successCount++;

      } catch (rowErr) {
        failCount++;
        errors.push(`Baris ${rowNum} (${username}): ${rowErr.message}`);
      }
    }

    fs.unlinkSync(req.file.path);
    res.json({
        message: 'Proses import user selesai.',
        successCount,
        failCount,
        errors
    });

  } catch (error) {
    console.error(error);
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    res.status(500).json({ message: 'Terjadi kesalahan server.', details: error.message });
  } finally {
    if (connection) connection.release();
  }
};

module.exports = {
  registerUser,
  loginUser,
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  importUsers,
};