// src/midleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const { pool } = require('../config/db');

exports.protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      const [rows] = await pool.query(
        'SELECT id, username, email, role FROM users WHERE id = ?', 
        [decoded.id]
      );

      if (!rows || rows.length === 0) {
        return res.status(401).json({ message: 'User tidak ditemukan, otorisasi gagal' });
      }

      req.user = rows[0];
      next();

    } catch (error) {
      console.error(error);
      return res.status(401).json({ message: 'Tidak terotorisasi, token gagal' });
    }
  }

  if (!token) {
    return res.status(401).json({ message: 'Tidak terotorisasi, tidak ada token' });
  }
};

exports.admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Tidak diizinkan, hanya untuk admin' });
  }
};