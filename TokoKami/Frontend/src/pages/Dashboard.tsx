import React, { useState } from 'react';
// Hapus import context lama yang tidak diperlukan lagi
// import { useProducts } from '../context/ProductContext';
// import { useTransactions } from '../context/TransactionContext';
// import { useInventory } from '../context/InventoryContext';
import { AlertTriangle, TrendingUp, ShoppingCart, Package, DollarSign, Calendar, ArrowUpRight, Box } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useDashboardData } from '../hooks/useDashboardData.tsx'; // Import hook API baru

const Dashboard = () => {
  // Hanya perlu state untuk rentang waktu
  const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month'>('today');

  // Ambil semua data dan status dari hook API
  const { stats, products, topProducts, lowStockProducts, isLoading, isError } = useDashboardData(timeRange);
  
  // Fungsi utilitas untuk memformat mata uang (gunakan IDR)
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(value);

  // --- TAMPILAN LOADING/ERROR ---
  if (isLoading) {
    return <div className="p-8 text-center text-xl text-blue-600">Loading Dashboard Data...</div>;
  }

  if (isError) {
    return <div className="p-8 text-center text-red-600 bg-red-100 rounded-lg">Error connecting to database. Please check your backend server.</div>;
  }
  // --- END LOADING/ERROR ---


  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <div className="flex items-center space-x-2 bg-white dark:bg-gray-800 rounded-lg shadow p-1">
          <button
            onClick={() => setTimeRange('today')}
            className={`px-3 py-1.5 text-sm rounded-md ${
              timeRange === 'today'
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            Today
          </button>
          <button
            onClick={() => setTimeRange('week')}
            className={`px-3 py-1.5 text-sm rounded-md ${
              timeRange === 'week'
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            Week
          </button>
          <button
            onClick={() => setTimeRange('month')}
            className={`px-3 py-1.5 text-sm rounded-md ${
              timeRange === 'month'
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            Month
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Sales */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Sales</p>
              <h3 className="text-2xl font-bold mt-1">{formatCurrency(stats.sales)}</h3>
            </div>
            <div className="h-12 w-12 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center">
              <DollarSign className="h-6 w-6" />
            </div>
          </div>
          <div className="flex items-center mt-4 text-sm text-green-600 dark:text-green-400">
            <ArrowUpRight className="h-4 w-4 mr-1" />
            <span>+{(Math.random() * 10).toFixed(1)}%</span>
            <span className="ml-1 text-gray-500 dark:text-gray-400">vs. previous period</span>
          </div>
        </div>
        
        {/* Profit */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Profit</p>
              <h3 className="text-2xl font-bold mt-1">{formatCurrency(stats.profit)}</h3>
            </div>
            <div className="h-12 w-12 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center">
              <TrendingUp className="h-6 w-6" />
            </div>
          </div>
          <div className="flex items-center mt-4 text-sm text-green-600 dark:text-green-400">
            <ArrowUpRight className="h-4 w-4 mr-1" />
            <span>+{(Math.random() * 8).toFixed(1)}%</span>
            <span className="ml-1 text-gray-500 dark:text-gray-400">vs. previous period</span>
          </div>
        </div>
        
        {/* Orders */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Orders</p>
              <h3 className="text-2xl font-bold mt-1">{stats.orders}</h3>
            </div>
            <div className="h-12 w-12 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-full flex items-center justify-center">
              <ShoppingCart className="h-6 w-6" />
            </div>
          </div>
          <div className="flex items-center mt-4 text-sm text-green-600 dark:text-green-400">
            <ArrowUpRight className="h-4 w-4 mr-1" />
            <span>+{(Math.random() * 12).toFixed(1)}%</span>
            <span className="ml-1 text-gray-500 dark:text-gray-400">vs. previous period</span>
          </div>
        </div>
        
        {/* Avg. Order */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Avg. Order</p>
              <h3 className="text-2xl font-bold mt-1">{formatCurrency(stats.averageOrder)}</h3>
            </div>
            <div className="h-12 w-12 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-full flex items-center justify-center">
              <Calendar className="h-6 w-6" />
            </div>
          </div>
          <div className="flex items-center mt-4 text-sm text-green-600 dark:text-green-400">
            <ArrowUpRight className="h-4 w-4 mr-1" />
            <span>+{(Math.random() * 5).toFixed(1)}%</span>
            <span className="ml-1 text-gray-500 dark:text-gray-400">vs. previous period</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Selling Products */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="font-medium">Top Selling Products</h3>
          </div>
          <div className="p-6">
            {topProducts.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead>
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Product
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Quantity
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Revenue
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {topProducts.map((product) => (
                      <tr key={product.id}>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                          {product.name}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-right text-sm text-gray-500 dark:text-gray-400">
                          {product.value}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-right text-sm text-gray-900 dark:text-white">
                          {formatCurrency(product.total)} 
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                No sales data available for this period
              </div>
            )}
            <div className="mt-4">
              <Link
                to="/dashboard/reports"
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                View all sales data →
              </Link>
            </div>
          </div>
        </div>

        {/* Low Stock Alert */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="font-medium">Low Stock Alert</h3>
          </div>
          <div className="p-6">
            {lowStockProducts.length > 0 ? (
              <div className="space-y-4">
                {lowStockProducts.map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg"
                  >
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-8 w-8 bg-red-200 dark:bg-red-800 rounded-full flex items-center justify-center">
                        <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-300" />
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {product.name}
                        </p>
                        <p className="text-xs text-red-600 dark:text-red-300">
                          Only {product.stock} left in stock
                        </p>
                      </div>
                    </div>
                    <Link
                      to={`/dashboard/products`}
                      className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      Manage
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                All products have sufficient stock
              </div>
            )}
            <div className="mt-4">
              <Link
                to="/dashboard/purchases"
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                Order inventory →
              </Link>
            </div>
          </div>
        </div>
        
        {/* Inventory Summary */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="font-medium">Inventory Summary</h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Card 1: Products */}
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Products</h4>
                  <Package className="h-5 w-5 text-blue-500" />
                </div>
                <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">{products.length}</p>
                <Link
                  to="/dashboard/products"
                  className="mt-2 inline-block text-sm text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Manage
                </Link>
              </div>
              
              {/* Card 2: Raw Materials (Data masih dari context lama, tidak terintegrasi) */}
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Raw Materials</h4>
                  <Box className="h-5 w-5 text-green-500" />
                </div>
                {/* Kita anggap N/A untuk sementara karena tidak ada endpoint untuk rawMaterials */}
                <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">N/A</p> 
                <Link
                  to="/dashboard/raw-materials"
                  className="mt-2 inline-block text-sm text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Manage
                </Link>
              </div>
              
              {/* Card 3: Low Stock Items */}
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Low Stock Items</h4>
                  <AlertTriangle className="h-5 w-5 text-orange-500" />
                </div>
                <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">{lowStockProducts.length}</p>
                <Link
                  to="/dashboard/products"
                  className="mt-2 inline-block text-sm text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Review
                </Link>
              </div>
              
              {/* Card 4: Total Sales Today (Gunakan stats.orders dari API summary) */}
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Orders</h4>
                  <ShoppingCart className="h-5 w-5 text-purple-500" />
                </div>
                <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.orders} orders
                </p>
                <Link
                  to="/dashboard/reports"
                  className="mt-2 inline-block text-sm text-blue-600 dark:text-blue-400 hover:underline"
                >
                  View reports
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;