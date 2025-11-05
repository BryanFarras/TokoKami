const pool = require('./db');
require('dotenv').config();

const migrationSQL = `
-- Hapus ENUM types dan tabel jika ada untuk fresh start
DROP TABLE IF EXISTS inventory_log;
DROP TABLE IF EXISTS transaction_items;
DROP TABLE IF EXISTS transactions;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS roles;
DROP TYPE IF EXISTS transaction_type;
DROP TYPE IF EXISTS payment_method_type;
DROP TYPE IF EXISTS change_type_enum;


-- 1. Tabel ROLES
CREATE TABLE roles (
    id SERIAL PRIMARY KEY, -- SERIAL adalah auto-increment di PostgreSQL
    name VARCHAR(50) NOT NULL UNIQUE
);

-- 2. Tabel USERS
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role_id INT REFERENCES roles(id),
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Tabel PRODUCTS
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    price NUMERIC(10,2) NOT NULL, -- NUMERIC untuk uang
    cost NUMERIC(10,2) NOT NULL,
    stock INT NOT NULL DEFAULT 0,
    sku VARCHAR(50) UNIQUE,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Tabel TRANSACTIONS (Membuat Tipe ENUM Khusus PostgreSQL)
CREATE TYPE payment_method_type AS ENUM ('cash', 'transfer', 'ewallet', 'other');
CREATE TYPE transaction_type AS ENUM ('sale', 'expense', 'return');

CREATE TABLE transactions (
    id SERIAL PRIMARY KEY,
    cashier_id INT REFERENCES users(id),
    total NUMERIC(10,2) NOT NULL,
    payment_method payment_method_type DEFAULT 'cash',
    type transaction_type DEFAULT 'sale',
    date TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Tabel TRANSACTION_ITEMS
CREATE TABLE transaction_items (
    id SERIAL PRIMARY KEY,
    transaction_id INT NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
    product_id INT NOT NULL REFERENCES products(id),
    quantity INT NOT NULL,
    price NUMERIC(10,2) NOT NULL
);

-- 6. Tabel INVENTORY_LOG
CREATE TYPE change_type_enum AS ENUM ('in', 'out', 'adjustment');

CREATE TABLE inventory_log (
    id SERIAL PRIMARY KEY,
    product_id INT NOT NULL REFERENCES products(id),
    change_type change_type_enum,
    quantity_change INT NOT NULL,
    note VARCHAR(255),
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- DATA AWAL (Seeding)
INSERT INTO roles (name) VALUES ('Owner'), ('Cashier') ON CONFLICT (name) DO NOTHING;
INSERT INTO users (name, email, password, role_id) VALUES ('Admin', 'admin@toko.com', 'dummy_hash_for_admin', 1) ON CONFLICT (email) DO NOTHING;

-- Dapatkan ID Admin yang baru dibuat
-- NOTE: Ini hanya contoh. Untuk production, ID harus diamankan.
INSERT INTO products (name, price, cost, stock) VALUES 
('Kopi Susu Signature', 25000.00, 15000.00, 50),
('Teh Lemon Dingin', 18000.00, 5000.00, 100);

`;

async function runMigration() {
    try {
        console.log('Menjalankan migrasi skema PostgreSQL di Render...');
        await pool.query(migrationSQL);
        console.log('✅ Skema PostgreSQL berhasil dibuat dan diisi data awal!');
        
        // Cek data (opsional)
        const res = await pool.query('SELECT name, price, stock FROM products LIMIT 3');
        console.log('Produk berhasil dimasukkan:', res.rows);
        
    } catch (err) {
        console.error('❌ GAGAL MENJALANKAN MIGRATION:', err.stack);
        console.log('Pastikan: 1. Server Render sudah "Available". 2. DATABASE_URL di .env sudah benar.');
    } finally {
        // Hentikan proses Node.js
        process.exit();
    }
}

// Tambahkan ON CONFLICT DO NOTHING untuk data seeding
const fixSeeding = (sql) => {
    return sql.replace(/ON DUPLICATE KEY UPDATE name=VALUES\(name\)/g, 'ON CONFLICT (name) DO NOTHING')
              .replace(/ON DUPLICATE KEY UPDATE name=VALUES\(name\)/g, 'ON CONFLICT (email) DO NOTHING');
}

runMigration();