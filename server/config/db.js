const { Pool } = require('pg');
const path = require('path'); // Impor modul 'path'

require('dotenv').config({ path: path.resolve(__dirname, '../../server/.env') });

const pool = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
});

module.exports = pool;