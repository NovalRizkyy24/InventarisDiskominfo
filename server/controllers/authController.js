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

const getAllUsers = async (req, res) => {
  const { role, search } = req.query;
  try {
    let queryText = 'SELECT id, nama, username, role, jabatan, nip FROM users';
    const queryParams = [];
    let whereClauses = [];

    if (role && role !== 'Semua') {
      queryParams.push(role);
      whereClauses.push(`role = $${queryParams.length}`);
    }

    if (search) {
      queryParams.push(`%${search}%`);
      whereClauses.push(`(nama ILIKE $${queryParams.length} OR username ILIKE $${queryParams.length})`);
    }

    if (whereClauses.length > 0) {
      queryText += ` WHERE ${whereClauses.join(' AND ')}`;
    }

    queryText += ' ORDER BY id ASC';

    const allUsers = await pool.query(queryText, queryParams);
    res.json(allUsers.rows);
  } catch (error) {
    console.error('Error saat mengambil data pengguna:', error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server' });
  }
};

const deleteUser = async (req, res) => {
  const { id } = req.params;
  try {
    const deleteQuery = await pool.query('DELETE FROM users WHERE id = $1 RETURNING *', [id]);
    if (deleteQuery.rowCount === 0) {
      return res.status(404).json({ message: 'Pengguna tidak ditemukan' });
    }
    res.json({ message: 'Pengguna berhasil dihapus' });
  } catch (error) {
    console.error('Error saat menghapus pengguna:', error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server' });
  }
};

const getUserById = async (req, res) => {
  const { id } = req.params;
  try {
    const userQuery = await pool.query('SELECT id, nama, username, role, jabatan, nip FROM users WHERE id = $1', [id]);
    // const userQuery = await pool.query('SELECT id, nama, username, role FROM users WHERE id = $1', [id]);
    if (userQuery.rows.length === 0) {
      return res.status(404).json({ message: 'Pengguna tidak ditemukan' });
    }
    res.json(userQuery.rows[0]);
  } catch (error) {
    console.error('Error saat mengambil data pengguna:', error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server' });
  }
};

const updateUser = async (req, res) => {
  const { id } = req.params;
  const { nama, username, role, password, jabatan, nip } = req.body;
  // const { nama, username, role, password } = req.body;

  if (!nama || !username || !role) {
    return res.status(400).json({ message: 'Nama, username, dan peran harus diisi' });
  }

  try {
    const queryParams = [nama, username, role, jabatan, nip];
    let querySetters = 'nama = $1, username = $2, role = $3, jabatan = $4, nip = $5';
    
    // Jika ada password baru, hash dan tambahkan ke query
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      queryParams.push(hashedPassword);
      querySetters += `, password = $${queryParams.length}`;
    }
    
    queryParams.push(id);
    const queryString = `UPDATE users SET ${querySetters} WHERE id = $${queryParams.length} RETURNING id, nama, username, role, jabatan, nip`;

    const updateQuery = await pool.query(queryString, queryParams);

    if (updateQuery.rowCount === 0) {
      return res.status(404).json({ message: 'Pengguna tidak ditemukan' });
    }

    res.json({ message: 'Data pengguna berhasil diperbarui', user: updateQuery.rows[0] });
  } catch (error) {
    console.error('Error saat memperbarui pengguna:', error);
    if (error.code === '23505') {
        return res.status(409).json({ message: `Username '${username}' sudah digunakan.` });
    }
    res.status(500).json({ message: 'Terjadi kesalahan pada server' });
  }
};

const createUser = async (req, res) => {
  // const { nama, username, password, role } = req.body;
  const { nama, username, password, role, jabatan, nip } = req.body;

  if (!nama || !username || !password || !role) {
    return res.status(400).json({ message: 'Semua field harus diisi' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUserQuery = await pool.query(
      'INSERT INTO users (nama, username, password, role, jabatan, nip) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, nama, username, role, jabatan, nip',
      [nama, username, hashedPassword, role, jabatan, nip] 
    );

    res.status(201).json({ message: 'Pengguna baru berhasil dibuat', user: newUserQuery.rows[0] });
  } catch (error) {
    console.error('Error saat membuat pengguna:', error);
    if (error.code === '23505') { // Error untuk username duplikat
        return res.status(409).json({ message: `Username '${username}' sudah digunakan.` });
    }
    res.status(500).json({ message: 'Terjadi kesalahan pada server' });
  }
};

// @desc    Get users by role
// @route   GET /api/users/role/:role
// @access  Private
const getUsersByRole = async (req, res) => {
  const { role } = req.params;
  try {
    const { rows } = await pool.query('SELECT id, nama FROM users WHERE role = $1 ORDER BY nama ASC', [role]);
    res.json(rows);
  } catch (error) {
    console.error('Error saat mengambil pengguna berdasarkan peran:', error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server' });
  }
};

const logoutUser = (req, res) => {
  res.status(200).json({ message: "Logout berhasil." });
};

module.exports = {
  loginUser,
  getAllUsers,
  deleteUser,
  getUserById,
  updateUser,
  createUser, 
  getUsersByRole,
  logoutUser,
};