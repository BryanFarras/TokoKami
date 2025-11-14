import { useState, useEffect, useContext } from 'react';
import { ProductContext } from '../context/ProductContext';
import { InventoryContext } from '../context/InventoryContext';
import { TransactionContext } from '../context/TransactionContext';

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
        stockLevels: [] as any[],
        totalValue: 0,
        lowStockItems: 0,
    });
    const [financials, setFinancials] = useState({
        revenue: 0,
        expenses: 0,
        profit: 0,
        recentTransactions: [] as { id: number; date: string; total: number; type?: string }[],
    });
    
    const { transactions } = useContext(TransactionContext as unknown as React.Context<TransactionContextType>);
    const { products } = useContext(ProductContext) || { products: [] };
    
    // Mengambil rawMaterials dari InventoryContext
    const { rawMaterials } = useContext(InventoryContext) || { rawMaterials: [] };

    useEffect(() => {
        if (!transactions || !products || !rawMaterials) return;

        // --- 1. Tentukan Batas Waktu Berdasarkan dateRange ---
        const now = new Date();
        let startDate = new Date(now);
        startDate.setHours(0, 0, 0, 0); 

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
            return transactionDate >= startDate; 
        });

        // --- 3. Hitung Top Products ---
        const productSales: { [key: string]: number } = {};
        
        filteredTransactions.forEach(transaction => {
            const itemsArray = Array.isArray(transaction.items) 
                                ? transaction.items 
                                : Array.isArray(transaction.line_items) 
                                ? transaction.line_items 
                                : [];
            
            itemsArray.forEach((item: any) => {
                const itemId = String(item.productId || item.product_id || item.id);
                const itemQuantity = Number(item.quantity) || 0;

                if (itemId && itemQuantity > 0) {
                    productSales[itemId] = (productSales[itemId] || 0) + itemQuantity;
                }
            });
        });

        const topProductsList = Object.entries(productSales)
            .map(([productId, quantity]) => ({
                name: products.find(p => String(p.id) === String(productId))?.name || `Product ${productId}`,
                value: quantity, 
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

        // --- PERBAIKAN PENGURUTAN GRAFIK: Tertua ke Terbaru ---
        const sortedSalesData = Object.entries(salesByDate)
            .map(([date, sales]) => ({
                date,
                sales: sales as number,
            }))
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()); 

        setSalesData(sortedSalesData);
        // ----------------------------------------------------

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
        
        // Gabungkan Products dan Raw Materials untuk laporan inventaris
        const allInventoryItems = [
            ...products.map((p: any) => ({
                name: p.name,
                stock: Number(p.stock || 0),
                cost: Number(p.cost || p.unitCost || 0),
            })),
            ...rawMaterials.map((r: any) => ({
                name: r.name + ' (Raw)',
                stock: Number(r.stock || 0),
                cost: Number(r.unitCost || r.unit_cost || 0),
            })),
        ];

        const stockLevels = allInventoryItems.map((item: any) => ({
            name: item.name,
            stock: item.stock,
            isLow: item.stock < lowStockThreshold,
        }));
        
        const totalInventoryValue = allInventoryItems.reduce((sum: number, item: any) => 
            sum + (item.stock * item.cost), 0
        );

        const lowStockCount = stockLevels.filter((item: any) => item.isLow).length;
        
        setInventory({
            stockLevels,
            totalValue: totalInventoryValue,
            lowStockItems: lowStockCount,
        });

        // --- 7. Hitung Financials ---
        const revenue = totalSales;
        const expenses = filteredTransactions 
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + (Number(t.total) || 0), 0);
        
        const recentTransactions = filteredTransactions
            .sort((a, b) => new Date(b.date || b.createdAt).getTime() - new Date(a.date || a.createdAt).getTime())
            .slice(0, 3)
            .map(t => ({ 
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

    }, [transactions, products, rawMaterials, dateRange]);

    return {
        salesData,
        topProducts,
        summary,
        inventory,
        financials,
    };
};