const { Pool } = require('pg');
require('dotenv').config();

// FIX: Menggunakan string koneksi langsung dari DATABASE_URL di .env
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    // Menambahkan konfigurasi SSL yang sering dibutuhkan Render untuk koneksi aman
    ssl: {
        rejectUnauthorized: false
    }
});

pool.connect()
    .then(() => console.log('Database connected to Render (PostgreSQL)'))
    .catch(err => console.error('CONNECTION ERROR to Render DB:', err.stack));

module.exports = pool;