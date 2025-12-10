import React, { useState } from 'react';
import { Tab } from '@headlessui/react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';
import { useReports } from '../hooks/useReports';
import { BarChart3, Package, DollarSign, TrendingUp, AlertTriangle } from 'lucide-react';

const COLORS = ['#1D4ED8', '#059669', '#F59E0B', '#EF4444', '#6D28D9']; // Palet warna yang lebih gelap

// Component Placeholder untuk Ikon
const ReportIcon = ({ category }: { category: string }) => {
    switch (category) {
        case 'Sales Reports': return <DollarSign className="h-5 w-5 mr-2 text-blue-600 dark:text-blue-400" />;
        case 'Inventory Reports': return <Package className="h-5 w-5 mr-2 text-green-600 dark:text-green-400" />;
        case 'Financial Reports': return <TrendingUp className="h-5 w-5 mr-2 text-purple-600 dark:text-purple-400" />;
        default: return null;
    }
};

const Reports = () => {
    const [dateRange, setDateRange] = useState('month');
    
    // Asumsi type definition useReports sudah benar
    const { salesData, topProducts, summary, inventory, financials } = useReports(dateRange as 'week' | 'month' | 'year');

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(value);
    };

    const tabClasses = (selected: boolean) =>
        `w-full rounded-lg py-2.5 text-sm font-semibold leading-5 transition-all duration-300
        ${selected
            ? 'bg-white dark:bg-gray-700 shadow-md text-blue-700 dark:text-white border border-blue-200 dark:border-gray-600'
            : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
        }`;

    return (
        <div className="p-8 min-h-screen bg-gray-50 dark:bg-gray-900">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Analytics & Reporting</h1>
                <div className="flex items-center space-x-3">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-400">Time Range:</span>
                    <select
                        className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm px-4 py-2 text-sm text-gray-800 dark:text-gray-200 focus:ring-blue-500 focus:border-blue-500"
                        value={dateRange}
                        onChange={(e) => setDateRange(e.target.value)}
                    >
                        <option value="week">Last 7 Days</option>
                        <option value="month">Last 30 Days</option>
                        <option value="year">Last 12 Months</option>
                    </select>
                </div>
            </div>

            <Tab.Group>
                <Tab.List className="flex space-x-2 rounded-xl bg-gray-200 dark:bg-gray-800 p-1 mb-8 shadow-inner">
                    {['Sales Reports', 'Inventory Reports', 'Financial Reports'].map((category) => (
                        <Tab key={category} className={({ selected }) => tabClasses(selected)}>
                            <div className="flex items-center justify-center">
                                <ReportIcon category={category} />
                                <span>{category}</span>
                            </div>
                        </Tab>
                    ))}
                </Tab.List>

                <Tab.Panels>
                    {/* -------------------- 1. SALES REPORTS TAB -------------------- */}
                    <Tab.Panel>
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            
                            {/* Sales Trend Chart (Area Chart) */}
                            <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
                                <h3 className="text-xl font-semibold mb-6 text-gray-800 dark:text-white flex items-center">
                                    <BarChart3 className="h-5 w-5 mr-2 text-blue-500" /> Sales Trend Analysis
                                </h3>
                                <div className="h-80">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={salesData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" className="dark:stroke-gray-700" />
                                            <XAxis 
                                                dataKey="date" 
                                                tickFormatter={(str) => format(new Date(str), 'dd/MM')} 
                                                stroke="#9ca3af" 
                                                className="text-xs"
                                            />
                                            <YAxis 
                                                tickFormatter={(val) => formatCurrency(Number(val))} 
                                                stroke="#9ca3af" 
                                                className="text-xs"
                                            />
                                            <Tooltip 
                                                contentStyle={{ backgroundColor: '#374151', border: 'none', borderRadius: '8px' }}
                                                formatter={(value) => [formatCurrency(Number(value)), 'Revenue']}
                                            />
                                            <Area type="monotone" dataKey="sales" stroke="#1D4ED8" fill="#3B82F6" fillOpacity={0.5} strokeWidth={2} />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            {/* Sales Summary Cards */}
                            <div className="lg:col-span-1 space-y-6">
                                <SummaryCard title="Total Revenue" value={formatCurrency(summary.totalSales)} color="text-blue-600" bgColor="bg-blue-50" />
                                <SummaryCard title="Total Transactions" value={summary.totalOrders.toLocaleString()} color="text-green-600" bgColor="bg-green-50" />
                                <SummaryCard title="Average Order Value" value={formatCurrency(summary.averageOrderValue)} color="text-purple-600" bgColor="bg-purple-50" />
                            </div>
                            
                            {/* Top Products Pie Chart */}
                            <div className="lg:col-span-1 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
                                <h3 className="text-xl font-semibold mb-6 text-gray-800 dark:text-white">Top Products by Quantity</h3>
                                <div className="h-80 flex justify-center items-center">
                                    {topProducts && topProducts.length > 0 ? (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={topProducts}
                                                    cx="50%"
                                                    cy="50%"
                                                    outerRadius={100}
                                                    dataKey="value"
                                                    labelLine={false}
                                                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                                                >
                                                    {topProducts.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                    ))}
                                                </Pie>
                                                <Tooltip 
                                                    formatter={(value, name, props) => [props.payload.value, props.payload.name]}
                                                    contentStyle={{ backgroundColor: '#374151', border: 'none', borderRadius: '8px', color: 'white' }}
                                                />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <div className="text-gray-500 dark:text-gray-400">No top product data.</div>
                                    )}
                                </div>
                            </div>
                            
                            {/* Empty space/placeholder in modern grid */}
                            <div className="lg:col-span-2 bg-gray-100 dark:bg-gray-700 p-6 rounded-xl shadow-inner border border-dashed border-gray-400 dark:border-gray-600 flex items-center justify-center">
                                <p className="text-gray-500 dark:text-gray-400">Space Reserved for Geographical Sales Map or Detailed Product List.</p>
                            </div>
                        </div>
                    </Tab.Panel>

                    {/* -------------------- 2. INVENTORY REPORTS TAB -------------------- */}
                    <Tab.Panel>
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            
                            {/* Inventory Value & Alerts */}
                            <div className="lg:col-span-1 space-y-6">
                                <SummaryCard title="Total Inventory Value" value={formatCurrency(inventory.totalValue)} color="text-blue-600" bgColor="bg-blue-50" />
                                <SummaryCard title="Critical Stock Items" value={`${inventory.lowStockItems} items`} color="text-red-600" bgColor="bg-red-50" Icon={AlertTriangle} />
                            </div>

                            {/* Stock Levels Visualization */}
                            <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
                                <h3 className="text-xl font-semibold mb-6 text-gray-800 dark:text-white">Detailed Stock Levels</h3>
                                <div className="space-y-4 max-h-[400px] overflow-y-auto">
                                    {inventory.stockLevels.length > 0 ? (
                                        inventory.stockLevels.map((item, index) => (
                                            <StockLevelBar key={index} item={item} />
                                        ))
                                    ) : (
                                        <div className="text-center py-12 text-gray-500 dark:text-gray-400">Inventory data not loaded or empty.</div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </Tab.Panel>

                    {/* -------------------- 3. FINANCIAL REPORTS TAB -------------------- */}
                    <Tab.Panel>
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            
                            {/* Financial Overview Cards */}
                            <div className="lg:col-span-1 space-y-6">
                                <SummaryCard title="Total Revenue" value={formatCurrency(financials.revenue)} color="text-green-600" bgColor="bg-green-50" />
                                <SummaryCard title="Total Expenses" value={formatCurrency(financials.expenses)} color="text-red-600" bgColor="bg-red-50" />
                                <SummaryCard title="Net Profit" value={formatCurrency(financials.profit)} color="text-blue-600" bgColor="bg-blue-50" />
                            </div>

                            {/* Revenue Breakdown (Bar Chart) */}
                            <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
                                <h3 className="text-xl font-semibold mb-6 text-gray-800 dark:text-white">Daily Revenue Breakdown</h3>
                                <div className="h-80">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={salesData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" className="dark:stroke-gray-700" />
                                            <XAxis 
                                                dataKey="date" 
                                                tickFormatter={(str) => format(new Date(str), 'dd/MM')} 
                                                stroke="#9ca3af" 
                                                className="text-xs"
                                            />
                                            <YAxis 
                                                tickFormatter={(val) => formatCurrency(Number(val))} 
                                                stroke="#9ca3af" 
                                                className="text-xs"
                                            />
                                            <Tooltip 
                                                contentStyle={{ backgroundColor: '#374151', border: 'none', borderRadius: '8px' }}
                                                formatter={(value) => [formatCurrency(Number(value)), 'Revenue']}
                                            />
                                            <Bar dataKey="sales" fill="#059669" radius={[4, 4, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                            
                            {/* Recent Transactions List */}
                            <div className="lg:col-span-3 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
                                <h3 className="text-xl font-semibold mb-6 text-gray-800 dark:text-white">Recent Transactions Log</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {financials.recentTransactions.length > 0 ? (
                                        financials.recentTransactions.map((transaction, index) => (
                                            <TransactionLog key={index} transaction={transaction} formatCurrency={formatCurrency} />
                                        ))
                                    ) : (
                                        <p className="text-gray-500 dark:text-gray-400 md:col-span-3">No recent transactions recorded.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </Tab.Panel>
                </Tab.Panels>
            </Tab.Group>
        </div>
    );
};

export default Reports;

// -------------------- UTILITY COMPONENTS --------------------

interface SummaryCardProps {
    title: string;
    value: string;
    color: string;
    bgColor: string;
    Icon?: React.ElementType;
}

const SummaryCard: React.FC<SummaryCardProps> = ({ title, value, color, bgColor, Icon }) => (
    <div className={`p-5 rounded-xl shadow-md ${bgColor} dark:bg-gray-700/50 border border-gray-200 dark:border-gray-700`}>
        <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
            {Icon && <Icon className={`h-5 w-5 ${color}`} />}
        </div>
        <p className={`text-3xl font-extrabold mt-1 ${color}`}>{value}</p>
    </div>
);

const StockLevelBar: React.FC<{ item: any }> = ({ item }) => {
    const maxStock = 50; // Asumsi level stok maksimum untuk visualisasi
    const percentage = Math.min((item.stock / maxStock) * 100, 100);
    const barColor = item.isLow ? "bg-red-600" : "bg-green-600";
    const statusText = item.isLow ? "Low" : "Good";

    return (
        <div className="p-3 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
            <div className="flex justify-between items-center mb-2">
                <span className="font-semibold text-gray-800 dark:text-white">{item.name}</span>
                <span className={`text-sm font-medium ${item.isLow ? "text-red-500" : "text-green-500"}`}>
                    {item.stock} units ({statusText})
                </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-600">
                <div 
                    className={`h-2.5 rounded-full ${barColor} transition-all duration-500`} 
                    style={{ width: `${percentage}%` }}
                ></div>
            </div>
        </div>
    );
};

interface TransactionLogProps {
    transaction: any;
    formatCurrency: (value: number) => string;
}

const TransactionLog: React.FC<TransactionLogProps> = ({ transaction, formatCurrency }) => {
    const isExpense = transaction.type === 'expense';
    const total = Number(transaction.total) || 0;
    const sign = isExpense ? '- ' : '+ ';
    const color = isExpense ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400';

    return (
        <div className="flex justify-between items-center p-4 bg-gray-100 dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600 hover:shadow-lg transition-shadow">
            <div>
                <p className="font-semibold text-sm text-gray-900 dark:text-white">
                    {isExpense ? 'Purchase' : 'Sale'} #{transaction.id}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                    {format(new Date(transaction.date), 'dd MMM, HH:mm')}
                </p>
            </div>
            <span className={`font-extrabold text-base ${color} flex-shrink-0`}>
                {sign}{formatCurrency(total)}
            </span>
        </div>
    );
};