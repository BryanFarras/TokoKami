import React, { useState, useEffect, useMemo } from 'react';
import { useProducts } from '../context/ProductContext';
import { useTransactions } from '../context/TransactionContext';
import { useInventory } from '../context/InventoryContext';
import { 
    AlertTriangle, TrendingUp, ShoppingCart, Package, DollarSign, 
    Calendar, ArrowUpRight, ArrowDownRight, Box, BarChart2 
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatCurrency } from "../utils/currency";

// --- Utility Functions (Tidak Berubah) ---

interface ChangeStat {
    percentage: number;
    isPositive: boolean;
}

const calculateChangePercentage = (currentValue: number, previousValue: number): ChangeStat => {
    if (previousValue === 0) {
        return { percentage: currentValue > 0 ? 100 : 0, isPositive: currentValue > 0 };
    }
    const change = currentValue - previousValue;
    const percentage = (change / previousValue) * 100;
    
    return { 
        percentage: Math.abs(percentage), 
        isPositive: percentage >= 0 
    };
};

// --- Sub-Component untuk Menampilkan Perubahan (Disederhanakan) ---

const StatChangeDisplay = React.memo(({ change }: { change: ChangeStat }) => {
    const colorClass = change.isPositive ? 'text-green-500' : 'text-red-500';
    
    return (
        <div className={`flex items-center text-xs font-medium ${colorClass} mt-1`}>
            {change.isPositive ? (
                <ArrowUpRight className="h-3 w-3 mr-1" />
            ) : (
                <ArrowDownRight className="h-3 w-3 mr-1" />
            )}
            <span className="mr-1">
                {change.isPositive ? '+' : '-'}
                {change.percentage.toFixed(1)}%
            </span>
            <span className="text-gray-500 dark:text-gray-400 font-normal">vs. Prev. Period</span>
        </div>
    );
});


const Dashboard = () => {
    const { products } = useProducts();
    const { transactions } = useTransactions();
    const { rawMaterials } = useInventory();
    
    const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month'>('month'); // Default ke 'month' untuk analisis yang lebih luas
    const [stats, setStats] = useState({
        sales: 0,
        profit: 0,
        orders: 0,
        averageOrder: 0
    });

    const [changeStats, setChangeStats] = useState({
        salesChange: { percentage: 0, isPositive: true } as ChangeStat,
        profitChange: { percentage: 0, isPositive: true } as ChangeStat,
        ordersChange: { percentage: 0, isPositive: true } as ChangeStat,
        averageOrderChange: { percentage: 0, isPositive: true } as ChangeStat,
    });
    
    const [lowStockProducts, setLowStockProducts] = useState<any[]>([]);
    const [topProducts, setTopProducts] = useState<any[]>([]);
    
    // --- Hook Perhitungan Data (useMemo & useEffect) ---
    useEffect(() => {
        const now = new Date();
        now.setHours(23, 59, 59, 999); 
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0); 
        
        let currentStart: Date;
        let previousStart: Date;
        
        // Menghitung batas waktu (Start of Current Period & Start of Previous Period)
        if (timeRange === "today") {
            currentStart = today;
            previousStart = new Date(today);
            previousStart.setDate(previousStart.getDate() - 1);
        } else if (timeRange === "week") {
            currentStart = new Date(today);
            currentStart.setDate(currentStart.getDate() - 7);
            
            previousStart = new Date(currentStart);
            previousStart.setDate(previousStart.getDate() - 7);
        } else { // 'month'
            currentStart = new Date(today);
            currentStart.setMonth(currentStart.getMonth() - 1);
            
            previousStart = new Date(currentStart);
            previousStart.setMonth(previousStart.getMonth() - 1);
        }

        const filterTransactions = (start: Date, end: Date) => {
            return transactions.filter((transaction) => {
                const dStr = transaction.date ?? transaction.createdAt ?? transaction.created_at;
                const transactionDate = new Date(dStr);
                if (isNaN(transactionDate.getTime())) return false;
                
                return transactionDate >= start && transactionDate < end;
            });
        };

        // Filter: Current Period (dari currentStart sampai now) dan Previous Period (dari previousStart sampai currentStart)
        const currentTransactions = filterTransactions(currentStart, now);
        const previousTransactions = filterTransactions(previousStart, currentStart);

        // --- Statistik Current Period ---
        const totalSales = currentTransactions.reduce((sum, t) => sum + (Number(t.total) || 0), 0);
        const totalProfit = currentTransactions.reduce((sum, t) => sum + (Number(t.profit) || 0), 0);
        const orderCount = currentTransactions.length;
        const averageOrder = orderCount > 0 ? Number(totalSales) / orderCount : 0;

        setStats({ sales: totalSales, profit: totalProfit, orders: orderCount, averageOrder });

        // --- Statistik Previous Period ---
        const previousTotalSales = previousTransactions.reduce((sum, t) => sum + (Number(t.total) || 0), 0);
        const previousTotalProfit = previousTransactions.reduce((sum, t) => sum + (Number(t.profit) || 0), 0);
        const previousOrderCount = previousTransactions.length;
        const previousAverageOrder = previousOrderCount > 0 ? Number(previousTotalSales) / previousOrderCount : 0;

        // --- Persentase Perubahan ---
        setChangeStats({
            salesChange: calculateChangePercentage(totalSales, previousTotalSales),
            profitChange: calculateChangePercentage(totalProfit, previousTotalProfit),
            ordersChange: calculateChangePercentage(orderCount, previousOrderCount),
            averageOrderChange: calculateChangePercentage(averageOrder, previousAverageOrder),
        });

        // --- Top Products ---
        const productSales: Record<string, { id: string; name: string; quantity: number; total: number }> = {};
        currentTransactions.forEach((transaction) => {
            (transaction.items || []).forEach((item) => {
                const pid = item.productId ?? item.product_id ?? String(item.id ?? "unknown");
                const pname = item.productName ?? item.product_name ?? item.name ?? "Unknown";
                const qty = Number(item.quantity) || 0;
                const tot = Number(item.totalPrice ?? item.total ?? 0) || 0;

                if (!productSales[pid]) {
                    productSales[pid] = { id: pid, name: pname, quantity: 0, total: 0 };
                }
                productSales[pid].quantity += qty;
                productSales[pid].total += tot;
            });
        });

        const topSellingProducts = Object.values(productSales)
            .sort((a, b) => b.quantity - a.quantity)
            .slice(0, 5);
        setTopProducts(topSellingProducts);

    }, [timeRange, transactions, products]);

    // --- Low Stock Products (di luar useEffect utama karena hanya bergantung pada `products`) ---
    useEffect(() => {
        const lowStock = products
            .filter((product) => Number(product.stock || 0) < 10)
            .sort((a, b) => Number(a.stock || 0) - Number(b.stock || 0))
            .slice(0, 5);
        setLowStockProducts(lowStock);
    }, [products]);


    // --- RENDER KOMPONEN UTAMA ---
    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">Performance Overview</h1>
                <div className="flex items-center space-x-2 bg-gray-100 dark:bg-gray-800 rounded-lg p-1 border border-gray-200 dark:border-gray-700">
                    {['today', 'week', 'month'].map((range) => (
                         <button
                            key={range}
                            onClick={() => setTimeRange(range as 'today' | 'week' | 'month')}
                            className={`px-4 py-1.5 text-sm font-semibold capitalize rounded-md transition-colors duration-200 ${
                                timeRange === range
                                    ? 'bg-blue-600 text-white shadow-md'
                                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                            }`}
                        >
                            {range}
                        </button>
                    ))}
                </div>
            </div>

            <hr className="border-gray-200 dark:border-gray-700" />

            {/* FINANCIAL METRICS (KPI) */}
            <section>
                <h2 className="text-xl font-semibold mb-4 text-gray-700 dark:text-gray-200">Financial Metrics ({timeRange.charAt(0).toUpperCase() + timeRange.slice(1)})</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    
                    {/* 1. Total Sales Card */}
                    <MetricCard 
                        title="Total Revenue" 
                        value={formatCurrency(stats.sales)} 
                        change={changeStats.salesChange} 
                        Icon={DollarSign}
                        bgColor="bg-blue-50 dark:bg-blue-900/20"
                        iconColor="text-blue-600 dark:text-blue-400"
                    />
                    
                    {/* 2. Profit Card */}
                    <MetricCard 
                        title="Net Profit" 
                        value={formatCurrency(stats.profit)} 
                        change={changeStats.profitChange} 
                        Icon={TrendingUp}
                        bgColor="bg-green-50 dark:bg-green-900/20"
                        iconColor="text-green-600 dark:text-green-400"
                    />

                    {/* 3. Orders Card */}
                    <MetricCard 
                        title="Total Orders" 
                        value={stats.orders.toLocaleString()} 
                        change={changeStats.ordersChange} 
                        Icon={ShoppingCart}
                        bgColor="bg-purple-50 dark:bg-purple-900/20"
                        iconColor="text-purple-600 dark:text-purple-400"
                    />

                    {/* 4. Avg. Order Card */}
                    <MetricCard 
                        title="Average Transaction" 
                        value={formatCurrency(stats.averageOrder)} 
                        change={changeStats.averageOrderChange} 
                        Icon={Calendar}
                        bgColor="bg-orange-50 dark:bg-orange-900/20"
                        iconColor="text-orange-600 dark:text-orange-400"
                    />
                </div>
            </section>

            <hr className="border-gray-200 dark:border-gray-700" />

            {/* OPERATIONAL & INVENTORY INSIGHTS */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* TOP PRODUCTS - Column 1 (2/3 width) */}
                <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                            <BarChart2 className="h-5 w-5 mr-2 text-blue-500" />
                            Top Selling Products
                        </h3>
                        <Link
                            to="/dashboard/reports"
                            className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                        >
                            View Sales Report →
                        </Link>
                    </div>
                    <div className="p-6">
                        {topProducts.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                    <thead>
                                        <tr className="text-left">
                                            <th className="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Product</th>
                                            <th className="px-4 py-2 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Quantity Sold</th>
                                            <th className="px-4 py-2 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total Revenue</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                        {topProducts.map((product) => (
                                            <tr key={product.id} className="text-sm hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                                <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{product.name}</td>
                                                <td className="px-4 py-3 text-right text-gray-600 dark:text-gray-300">{product.quantity}</td>
                                                <td className="px-4 py-3 text-right font-medium text-gray-900 dark:text-white">{formatCurrency(product.total)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                                No sales data available for this period.
                            </div>
                        )}
                    </div>
                </div>

                {/* LOW STOCK ALERT - Column 2 (1/3 width) */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                                <AlertTriangle className="h-5 w-5 mr-2 text-red-500" />
                                Inventory Alerts
                            </h3>
                        </div>
                        <div className="p-6">
                            {lowStockProducts.length > 0 ? (
                                <div className="space-y-4">
                                    {lowStockProducts.map((product) => (
                                        <div
                                            key={product.id}
                                            className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-900"
                                        >
                                            <div className="flex items-center">
                                                <div className="ml-1">
                                                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                                                        {product.name}
                                                    </p>
                                                    <p className="text-xs text-red-600 dark:text-red-300 font-semibold">
                                                        Critical: Only {product.stock} left
                                                    </p>
                                                </div>
                                            </div>
                                            <Link
                                                to={`/dashboard/products`}
                                                className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline flex-shrink-0"
                                            >
                                                Manage →
                                            </Link>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                                    All finished products have sufficient stock.
                                </div>
                            )}
                            <div className="mt-4 text-right">
                                <Link
                                    to="/dashboard/raw-materials"
                                    className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                                >
                                    Check Raw Materials Inventory →
                                </Link>
                            </div>
                        </div>
                    </div>

                    {/* QUICK INVENTORY SUMMARY */}
                    <div className="grid grid-cols-2 gap-4">
                        <SimpleStatCard 
                            title="Total Products" 
                            value={products.length} 
                            Icon={Package} 
                            link="/dashboard/products"
                        />
                         <SimpleStatCard 
                            title="Total Raw Materials" 
                            value={rawMaterials.length} 
                            Icon={Box} 
                            link="/dashboard/raw-materials"
                        />
                    </div>
                </div>

            </div>
        </div>
    );
};

export default Dashboard;

// --- UTILITY COMPONENTS ---

interface MetricCardProps {
    title: string;
    value: string;
    change: ChangeStat;
    Icon: React.ElementType;
    bgColor: string;
    iconColor: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, change, Icon, bgColor, iconColor }) => (
    <div className={`rounded-xl shadow-lg p-6 border ${bgColor} dark:border-gray-700 transition-shadow hover:shadow-xl`}>
        <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
            <div className={`h-10 w-10 ${bgColor} ${iconColor} rounded-full flex items-center justify-center border border-current`}>
                <Icon className="h-5 w-5" />
            </div>
        </div>
        <h3 className="text-3xl font-bold mt-2 text-gray-900 dark:text-white">{value}</h3>
        <StatChangeDisplay change={change} />
    </div>
);

interface SimpleStatCardProps {
    title: string;
    value: number;
    Icon: React.ElementType;
    link: string;
}

const SimpleStatCard: React.FC<SimpleStatCardProps> = ({ title, value, Icon, link }) => (
    <Link to={link} className="block p-4 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors shadow-sm">
        <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">{title}</h4>
            <Icon className="h-4 w-4 text-blue-500" />
        </div>
        <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
    </Link>
);