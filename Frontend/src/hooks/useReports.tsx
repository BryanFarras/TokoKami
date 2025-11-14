import { useState, useEffect, useContext } from 'react';
import { ProductContext } from '../context/ProductContext';
import { InventoryContext } from '../context/InventoryContext';
import { TransactionContext } from '../context/TransactionContext'; // Hapus import TransactionItem jika tidak terpakai

// Mendefinisikan tipe untuk context Transaction jika diperlukan
interface TransactionContextType {
    transactions: any[];
}

export const useReports = (dateRange: 'week' | 'month' | 'year') => {
    const [salesData, setSalesData] = useState<{ date: string; sales: number }[]>([]);
    const [topProducts, setTopProducts] = useState<{ name: string; value: number }[]>([]);
    const [summary, setSummary] = useState({
        totalSales: 0,
        totalOrders: 0,
        averageOrderValue: 0,
    });
    const [inventory, setInventory] = useState({
        stockLevels: [] as any[], // Lebih spesifik jika memungkinkan
        totalValue: 0,
        lowStockItems: 0,
    });
    const [financials, setFinancials] = useState({
        revenue: 0,
        expenses: 0,
        profit: 0,
        recentTransactions: [] as { id: number; date: string; total: number; type?: string }[],
    });
    
    // Menggunakan type assertion yang lebih aman jika context tidak diekspor dengan benar
    const { transactions } = useContext(TransactionContext as unknown as React.Context<TransactionContextType>);
    const { products } = useContext(ProductContext) || { products: [] };
    const inventoryItems = useContext(InventoryContext)?.inventoryItems || [];

    useEffect(() => {
        if (!transactions || !products || !inventoryItems) return;

        // --- 1. Tentukan Batas Waktu Berdasarkan dateRange ---
        const now = new Date();
        let startDate = new Date(now);
        startDate.setHours(0, 0, 0, 0); // Reset waktu untuk perbandingan yang konsisten

        if (dateRange === 'week') {
            startDate.setDate(now.getDate() - 7);
        } else if (dateRange === 'month') {
            startDate.setMonth(now.getMonth() - 1);
        } else if (dateRange === 'year') {
            startDate.setFullYear(now.getFullYear() - 1);
        }

        // --- 2. Filter Transaksi ---
        const filteredTransactions = transactions.filter((t: any) => {
            const transactionDate = new Date(t.date || t.createdAt || t.created_at);
            if (isNaN(transactionDate.getTime())) return false;
            // Hanya ambil transaksi yang terjadi setelah startDate
            return transactionDate >= startDate; 
        });

        // --- 3. Hitung Top Products (Perbaikan Utama) ---
        const productSales: { [key: string]: number } = {};
        
        filteredTransactions.forEach(transaction => {
            // Cek properti items yang mungkin berbeda (items/line_items) dan pastikan itu array
            const itemsArray = Array.isArray(transaction.items) 
                                ? transaction.items 
                                : Array.isArray(transaction.line_items) 
                                ? transaction.line_items 
                                : [];
            
            itemsArray.forEach((item: any) => {
                // Ambil ID produk yang fleksibel dan Quantity
                const itemId = String(item.productId || item.product_id || item.id);
                const itemQuantity = Number(item.quantity) || 0;

                if (itemId && itemQuantity > 0) {
                    productSales[itemId] = (productSales[itemId] || 0) + itemQuantity;
                }
            });
        });

        const topProductsList = Object.entries(productSales)
            .map(([productId, quantity]) => ({
                // Cari nama produk. Pastikan ID produk dicocokkan dengan benar.
                name: products.find(p => String(p.id) === String(productId))?.name || `Product ${productId}`,
                value: quantity, // Jumlah kuantitas terjual
            }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 4);

        setTopProducts(topProductsList);

        // --- 4. Hitung Sales Data (Sales Trend) ---
        const salesByDate = filteredTransactions.reduce((acc: Record<string, number>, transaction: any) => {
            const date = new Date(transaction.date || transaction.createdAt);
            const key = date.toISOString().split('T')[0];
            const total = Number(transaction.total) || 0;
            acc[key] = (acc[key] || 0) + total;
            return acc;
        }, {});

        setSalesData(Object.entries(salesByDate).map(([date, sales]) => ({
            date,
            sales: sales as number,
        })));

        // --- 5. Hitung Summary ---
        const totalSales = filteredTransactions.reduce((sum, t) => sum + (Number(t.total) || 0), 0);
        const totalOrders = filteredTransactions.length;
        const averageOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;
        
        setSummary({
            totalSales,
            totalOrders,
            averageOrderValue,
        });

        // --- 6. Hitung Inventory Stats ---
        const lowStockThreshold = 10;
        const stockLevels = inventoryItems.map((item: any) => ({
            name: item.name,
            stock: Number(item.quantity || item.stock || 0),
            isLow: (Number(item.quantity || item.stock || 0) < lowStockThreshold),
        }));
        
        // Asumsi inventoryItems memiliki properti cost/unitCost
        const totalInventoryValue = inventoryItems.reduce((sum: number, item: any) => 
            sum + (Number(item.quantity || item.stock || 0) * Number(item.cost || item.unitCost || 0)), 0
        );

        setInventory({
            stockLevels,
            totalValue: totalInventoryValue,
            lowStockItems: stockLevels.filter((item: any) => item.isLow).length,
        });

        // --- 7. Hitung Financials ---
        const revenue = totalSales;
        // Asumsi transaksi pengeluaran (expense) ditandai dengan t.type === 'expense'
        const expenses = filteredTransactions 
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + (Number(t.total) || 0), 0);
        
        const recentTransactions = filteredTransactions
            .sort((a, b) => new Date(b.date || b.createdAt).getTime() - new Date(a.date || a.createdAt).getTime())
            .slice(0, 3)
            .map(t => ({ // Format ulang untuk Financials
                id: t.id,
                date: t.date || t.createdAt,
                type: t.type || 'income',
                total: Number(t.total) || 0
            }));

        setFinancials({
            revenue,
            expenses,
            profit: revenue - expenses,
            recentTransactions,
        });

    }, [transactions, products, inventoryItems, dateRange]);

    return {
        salesData,
        topProducts,
        summary,
        inventory,
        financials,
    };
};