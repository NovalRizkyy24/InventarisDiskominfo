// server/config/seeddb.js
const pool = require('./db');
const bcrypt = require('bcrypt');

const users = [
  {
    username: 'admin',
    password: 'admin123',
    nama: 'Admin Sistem',
    role: 'Admin',
  },
  {
    username: 'pengurus',
    password: 'pengurus123',
    nama: 'Pengurus Barang',
    role: 'Pengurus Barang',
  },
  {
    username: 'penatausaha',
    password: 'penata123',
    nama: 'Penata Usaha Barang',
    role: 'Penata Usaha Barang',
  },
  {
    username: 'ppk',
    password: 'ppk123',
    nama: 'PPK',
    role: 'PPK',
  },
  {
    username: 'kepalabidang',
    password: 'bidang123',
    nama: 'Kepala Bidang',
    role: 'Kepala Bidang',
  },
  {
    username: 'kepaladinas',
    password: 'dinas123',
    nama: 'Kepala Dinas',
    role: 'Kepala Dinas',
  },
];

async function seedUsers() {
  try {
    for (const user of users) {
      const hashedPassword = await bcrypt.hash(user.password, 10);
      await pool.query(
        'INSERT INTO users (username, password, nama, role) VALUES ($1, $2, $3, $4) ON CONFLICT (username) DO NOTHING',
        [user.username, hashedPassword, user.nama, user.role]
      );
    }
    console.log('✅ Seeding selesai!');
  } catch (err) {
    console.error('❌ Gagal seeding user:', err);
  } finally {
    pool.end();
  }
}

seedUsers();
