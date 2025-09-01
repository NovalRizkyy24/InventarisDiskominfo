// server/server.js

require('dotenv').config();
const express = require('express');
const cors = require('cors');

// Impor rute yang ada
const authRoutes = require('./routes/authRoutes');

// Impor rute-rute baru
const barangRoutes = require('./routes/barangRoutes');
const pengadaanRoutes = require('./routes/pengadaanRoutes');
const peminjamanRoutes = require('./routes/peminjamanRoutes');
const penghapusanRoutes = require('./routes/penghapusanRoutes');
const kategoriRoutes = require('./routes/kategoriRoutes');
const lokasiRoutes = require('./routes/lokasiRoutes');
const laporanRoutes = require('./routes/laporanRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use('/api', authRoutes);
app.use('/api', barangRoutes);
app.use('/api', pengadaanRoutes);
app.use('/api', peminjamanRoutes);
app.use('/api', penghapusanRoutes);
app.use('/api', kategoriRoutes);
app.use('/api', lokasiRoutes);
app.use('/api', laporanRoutes);
app.use('/api', dashboardRoutes);
app.use('/uploads', express.static('uploads'));

app.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT}`);
});