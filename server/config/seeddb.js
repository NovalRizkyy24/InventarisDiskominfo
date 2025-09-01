// server/config/seeddb.js
const pool = require('./db');
const bcrypt = require('bcrypt');

const users = [
  {
    username: 'admin',
    password: '123',
    nama: 'Admin Sistem',
    jabatan: 'Administrator',
    nip: '199001012015011001',
    role: 'Admin',
  },
  {
    username: 'pengurus',
    password: '123',
    nama: 'Pengurus Barang Utama',
    jabatan: 'Staf Pengelola Aset',
    nip: '199203152016021003',
    role: 'Pengurus Barang',
  },
  {
    username: 'penatausaha',
    password: '123',
    nama: 'Penata Usaha Barang',
    jabatan: 'Kasubbag Umum & Kepegawaian',
    nip: '198805202014082001',
    role: 'Penata Usaha Barang',
  },
  {
    username: 'ppk',
    password: 'ppk123',
    nama: 'Pejabat Pembuat Komitmen',
    jabatan: 'PPK Bidang TIK',
    nip: '199111102015051002',
    role: 'PPK',
  },
  {
    username: 'kepalabidang',
    password: '123',
    nama: 'Kepala Bidang Infrastruktur',
    jabatan: 'Kepala Bidang',
    nip: '198507252010011005',
    role: 'Kepala Bidang',
  },
  {
    username: 'kepaladinas',
    password: '123',
    nama: 'Kepala Dinas',
    jabatan: 'Kepala Dinas Kominfo',
    nip: '198012012005011007',
    role: 'Kepala Dinas',
  },
];

async function seedUsers() {
  try {
    for (const user of users) {
      const hashedPassword = await bcrypt.hash(user.password, 10);
      await pool.query(
        'INSERT INTO users (username, password, nama, role, jabatan, nip) VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (username) DO NOTHING',
        [user.username, hashedPassword, user.nama, user.role, user.jabatan, user.nip]
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