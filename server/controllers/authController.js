const pool = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const loginUser = async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Username dan password harus diisi' });
  }

  try {
    const userQuery = await pool.query('SELECT * FROM users WHERE username = $1', [username]);

    if (userQuery.rows.length === 0) {
      return res.status(401).json({ message: 'Username atau password salah' });
    }

    const user = userQuery.rows[0];
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Username atau password salah' });
    }
    
    // HAPUS validasi peran 'Admin' dari sini
    // if (user.role !== 'Admin') { ... }

    // Buat token dengan peran apa pun yang dimiliki pengguna
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Kirim token dan data pengguna, termasuk perannya
    res.json({
      message: 'Login berhasil!',
      token: token,
      user: {
        id: user.id,
        nama: user.nama,
        username: user.username,
        role: user.role // Sangat penting untuk mengirim peran ke frontend
      }
    });

  } catch (error) {
    console.error('Error saat login:', error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server' });
  }
};

module.exports = {
  loginUser,
};
