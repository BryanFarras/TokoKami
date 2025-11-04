const express = require('express');
const db = require('./db'); // Import koneksi database MySQL
const cors = require('cors'); 
require('dotenv').config({ path: './.env' }); // Pastikan path .env benar

const app = express();
const PORT = process.env.PORT || 5000; 

// Middleware
app.use(cors()); // Izinkan Frontend (misalnya port 5173) mengakses Backend
app.use(express.json());

// --- ENDPOINT UMUM: MENGAMBIL DATA PRODUK (Untuk POS/Inventory Page) ---
app.get('/api/products', async (req, res) => {
    try {
        const [rows] = await db.execute('SELECT id, name, price, stock, cost FROM products');
        res.json(rows);
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ message: 'Gagal mengambil data produk' });
    }
});

// =========================================================================
//                  ENDPOINT UNTUK REPORTS DASHBOARD
// =========================================================================

// ENDPOINT 1: RINGKASAN LAPORAN (Total Sales, Total Orders, Total Stock)
app.get('/api/reports/summary', async (req, res) => {
    try {
        // Query 1: Total Penjualan dan Jumlah Transaksi
        const [salesResult] = await db.execute(`
            SELECT SUM(total) AS total_sales, COUNT(id) AS total_transactions 
            FROM Transactions 
            WHERE type = 'sale';
        `);
        
        // Query 2: Total Stok
        const [inventoryResult] = await db.execute('SELECT SUM(stock) AS total_stock FROM Products');

        res.json({
            total_sales: parseFloat(salesResult[0].total_sales) || 0,
            total_transactions: salesResult[0].total_transactions || 0,
            total_stock: inventoryResult[0].total_stock || 0
        });
    } catch (error) {
        console.error('Error fetching reports summary:', error);
        res.status(500).json({ message: 'Gagal mengambil ringkasan laporan' });
    }
});


// ENDPOINT 2: SALES TREND (Data untuk Area Chart / Bar Chart)
app.get('/api/reports/sales-trend', async (req, res) => {
    // Ambil parameter range (week/month/year) dari frontend
    const { range = 'month' } = req.query; 

    // Tentukan format grouping berdasarkan range
    let dateFormat;
    switch (range) {
        case 'year':
            dateFormat = '%Y-%m'; // Grouping per bulan
            break;
        case 'week':
        default: 
            dateFormat = '%Y-%m-%d'; // Grouping per hari
            break;
    }

    try {
        const query = `
            SELECT 
                DATE_FORMAT(transaction_date, '${dateFormat}') AS date,
                SUM(total) AS sales
            FROM Transactions
            WHERE type = 'sale'
            GROUP BY date
            ORDER BY date;
        `;
        const [rows] = await db.execute(query);
        res.json(rows);
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
        const [rows] = await db.execute(query);
        res.json(rows);
    } catch (error) {
        console.error('Error fetching top products:', error);
        res.status(500).json({ message: 'Gagal mengambil data produk teratas' });
    }
});


// ENDPOINT 4: FINANCIALS & INVENTORY DETAILS (Data Detail)
app.get('/api/reports/details', async (req, res) => {
    try {
        // Query 1: Hitung Revenue, Cost, dan Profit dari Transaksi Penjualan
        const [financialsResult] = await db.execute(`
            SELECT
                SUM(ti.quantity * ti.price) AS revenue,
                SUM(ti.quantity * p.cost) AS expenses 
            FROM Transaction_Items ti
            JOIN Products p ON ti.product_id = p.id;
        `);

        // Query 2: Ambil Transaksi Terbaru (5 teratas)
        const [recentTransactions] = await db.execute(`
            SELECT id, total, type, transaction_date AS date
            FROM Transactions
            ORDER BY transaction_date DESC
            LIMIT 5;
        `);

        // Query 3: Ambil Stok Produk (untuk Stock Levels)
        const [stockLevels] = await db.execute(`
            SELECT name, stock AS stock, cost AS cost_price 
            FROM Products 
            ORDER BY stock ASC;
        `);
        
        // --- Pemrosesan Data di Server ---
        const revenue = parseFloat(financialsResult[0].revenue) || 0;
        const expenses = parseFloat(financialsResult[0].expenses) || 0; // Menggunakan COGS sebagai expenses
        const profit = revenue - expenses;
        
        // Pemrosesan Inventory
        const LOW_STOCK_THRESHOLD = 10;
        let totalInventoryValue = 0;
        
        const processedStockLevels = stockLevels.map(p => {
             // Hitung nilai total inventori (stok * harga modal)
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
                recentTransactions: recentTransactions.map(t => ({
                    ...t, 
                    total: parseFloat(t.total), // Pastikan format number
                    date: t.date // date sudah diformat di SQL
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
