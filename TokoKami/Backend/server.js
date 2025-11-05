const express = require('express');
const db = require('./db'); // Import koneksi PostgreSQL Pool
const cors = require('cors'); 
require('dotenv').config({ path: './.env' }); 

const app = express();
const PORT = process.env.PORT || 5000; 

// Middleware
app.use(cors()); 
app.use(express.json()); 

// =========================================================================
//                          ENDPOINTS UMUM & TRANSAKSI (POS)
// =========================================================================

// --- ENDPOINT UMUM: MENGAMBIL DATA PRODUK ---
app.get('/api/products', async (req, res) => {
    try {
        // FIX: Menggunakan db.query() dan mengakses result.rows
        const result = await db.query('SELECT id, name, price, stock, cost FROM products');
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ message: 'Gagal mengambil data produk' });
    }
});


// --- ENDPOINT: MENCATAT TRANSAKSI BARU (Kunci Alur POS) ---
app.post('/api/transactions', async (req, res) => {
    const { cashierId, totalAmount, paymentMethod, items } = req.body;
    if (!cashierId || !totalAmount || !paymentMethod || !items || items.length === 0) {
        return res.status(400).json({ message: 'Data transaksi tidak lengkap.' });
    }

    const client = await db.connect(); // Dapatkan client (koneksi) dari pool
    try {
        await client.query('BEGIN'); // Mulai transaksi database (PostgreSQL)

        // 1. Masukkan data ke tabel TRANSACTIONS
        // FIX: Menggunakan $1, $2, ... untuk placeholder PostgreSQL dan RETURNING id
        const transactionQuery = `
            INSERT INTO Transactions (cashier_id, total, payment_method, type, date) 
            VALUES ($1, $2, $3, $4, NOW()) RETURNING id;
        `;
        const transactionResult = await client.query(transactionQuery, [cashierId, totalAmount, paymentMethod, 'sale']);
        const transactionId = transactionResult.rows[0].id; // Ambil ID transaksi dari rows[0]

        // 2. Masukkan data ke tabel TRANSACTION_ITEMS & Update Stok
        for (const item of items) {
            // Masukkan item ke tabel detail
            await client.query(
                'INSERT INTO Transaction_Items (transaction_id, product_id, quantity, price) VALUES ($1, $2, $3, $4)',
                [transactionId, item.productId, item.quantity, item.price]
            );

            // Update Stok (mengurangi stok) di tabel PRODUCTS
            await client.query(
                'UPDATE Products SET stock = stock - $1 WHERE id = $2',
                [item.quantity, item.productId]
            );
        }

        await client.query('COMMIT'); // Selesaikan transaksi
        res.status(201).json({ message: 'Transaksi berhasil dicatat', transactionId });

    } catch (error) {
        await client.query('ROLLBACK'); // Batalkan semua jika ada error
        console.error('Error saat mencatat transaksi:', error);
        res.status(500).json({ message: 'Gagal mencatat transaksi', error: error.message });
    } finally {
        client.release(); // Selalu bebaskan koneksi
    }
});


// =========================================================================
//                          ENDPOINT UNTUK REPORTS DASHBOARD
// =========================================================================

// ENDPOINT 1: RINGKASAN LAPORAN (Total Sales, Total Orders, Total Stock)
app.get('/api/reports/summary', async (req, res) => {
    try {
        // FIX: Menggunakan db.query()
        const salesQuery = `
            SELECT SUM(total) AS total_sales, COUNT(id) AS total_transactions 
            FROM Transactions 
            WHERE type = 'sale';
        `;
        const inventoryQuery = 'SELECT SUM(stock) AS total_stock FROM Products';

        const salesResult = await db.query(salesQuery);
        const inventoryResult = await db.query(inventoryQuery);

        res.json({
            // Data ada di rows[0]
            total_sales: parseFloat(salesResult.rows[0].total_sales) || 0,
            total_transactions: salesResult.rows[0].total_transactions || 0,
            total_stock: inventoryResult.rows[0].total_stock || 0
        });
    } catch (error) {
        console.error('Error fetching reports summary:', error);
        res.status(500).json({ message: 'Gagal mengambil ringkasan laporan' });
    }
});


// ENDPOINT 2: SALES TREND (Data untuk Area Chart / Bar Chart)
app.get('/api/reports/sales-trend', async (req, res) => {
    const { range = 'month' } = req.query; 

    // PostgreSQL menggunakan TO_CHAR untuk format tanggal
    let dateFormat;
    switch (range) {
        case 'year':
            dateFormat = 'YYYY-MM'; 
            break;
        case 'week':
        default: 
            dateFormat = 'YYYY-MM-DD'; 
            break;
    }

    try {
        const query = `
            SELECT 
                TO_CHAR(date, '${dateFormat}') AS date,
                SUM(total) AS sales
            FROM Transactions
            WHERE type = 'sale'
            GROUP BY date
            ORDER BY date;
        `;
        const result = await db.query(query); // FIX: Menggunakan db.query()
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching sales trend:', error);
        res.status(500).json({ message: 'Gagal mengambil tren penjualan' });
    }
});


// ENDPOINT 3: TOP PRODUCTS (Data untuk Pie Chart)
app.get('/api/reports/top-products', async (req, res) => {
    try {
        const query = `
            SELECT 
                p.name AS name,
                SUM(ti.quantity) AS value
            FROM Transaction_Items ti
            JOIN Products p ON ti.product_id = p.id
            GROUP BY p.name
            ORDER BY value DESC
            LIMIT 5;
        `;
        const result = await db.query(query); // FIX: Menggunakan db.query()
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching top products:', error);
        res.status(500).json({ message: 'Gagal mengambil data produk teratas' });
    }
});


// ENDPOINT 4: FINANCIALS & INVENTORY DETAILS (Data Detail)
app.get('/api/reports/details', async (req, res) => {
    try {
        // Query 1: Hitung Revenue, Cost, dan Profit dari Transaksi Penjualan
        const financialsQuery = `
            SELECT
                SUM(ti.quantity * ti.price) AS revenue,
                SUM(ti.quantity * p.cost) AS expenses 
            FROM Transaction_Items ti
            JOIN Products p ON ti.product_id = p.id;
        `;
        const [financialsResult, recentTransactionsResult, stockLevelsResult] = await Promise.all([
            db.query(financialsQuery),
            // Query 2: Ambil Transaksi Terbaru (5 teratas)
            db.query(`SELECT id, total, type, date AS date FROM Transactions ORDER BY date DESC LIMIT 5;`),
            // Query 3: Ambil Stok Produk (untuk Stock Levels)
            db.query(`SELECT name, stock AS stock, cost AS cost_price FROM Products ORDER BY stock ASC;`)
        ]);

        const revenue = parseFloat(financialsResult.rows[0].revenue) || 0;
        const expenses = parseFloat(financialsResult.rows[0].expenses) || 0; 
        const profit = revenue - expenses;
        
        // Pemrosesan Inventory
        const LOW_STOCK_THRESHOLD = 10;
        let totalInventoryValue = 0;
        
        const processedStockLevels = stockLevelsResult.rows.map(p => {
             totalInventoryValue += (p.stock * parseFloat(p.cost_price)); 
             return {
                 name: p.name,
                 stock: p.stock,
                 isLow: p.stock < LOW_STOCK_THRESHOLD,
             }
        });
        
        const lowStockItems = processedStockLevels.filter(p => p.isLow).length;
        
        // --- Kirim Respons ---
        res.json({
            financials: {
                revenue,
                expenses,
                profit,
                recentTransactions: recentTransactionsResult.rows.map(t => ({
                    ...t, 
                    total: parseFloat(t.total), 
                    date: t.date 
                })),
            },
            inventory: {
                stockLevels: processedStockLevels,
                totalValue: totalInventoryValue,
                lowStockItems: lowStockItems,
            }
        });

    } catch (error) {
        console.error('Error fetching details:', error);
        res.status(500).json({ message: 'Gagal mengambil data detail' });
    }
});


// Jalankan Server
app.listen(PORT, () => {
    console.log(`Server Backend berjalan di http://localhost:${PORT}`);
});