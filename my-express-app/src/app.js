// src/app.js
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());

const userRoutes = require('./routes/userRoutes');

app.use('/api/users', userRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'Backend is running 🚀' });
});

module.exports = app;
