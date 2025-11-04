import { useState } from "react";
import { Tab } from "@headlessui/react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer,
} from "recharts";
import { motion } from "framer-motion";
import { format } from "date-fns";
// Pastikan useReports diimpor dengan benar dari path yang tepat
import { useReports } from "../hooks/useReports"; 
import { ArrowTrendingUpIcon, ExclamationCircleIcon } from "@heroicons/react/24/outline";

const COLORS = ["#4F46E5", "#10B981", "#F59E0B", "#EF4444"];

const Reports = () => {
  const [dateRange, setDateRange] = useState("month");
  
  // Destructuring AMAN dengan nilai fallback default dari hook
  const { 
      salesData, 
      topProducts, 
      summary, 
      inventory, 
      financials, 
      isLoading,
      isError
  } = useReports(dateRange as "week" | "month" | "year");

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(value);

  // --- LOADING DAN ERROR SCREEN ---
  if (isLoading) {
    return (
        <div className="p-6 min-h-screen flex items-center justify-center">
            <p className="text-xl font-medium text-indigo-600">
                Loading Reports Data...
            </p>
        </div>
    );
  }
  
  if (isError) {
    return (
        <div className="p-6 min-h-screen flex items-center justify-center bg-red-50">
            <div className="text-center p-8 border border-red-300 rounded-xl bg-white shadow-lg">
                <ExclamationCircleIcon className="w-10 h-10 text-red-500 mx-auto" />
                <h2 className="text-xl font-semibold text-gray-800 mt-2">Error Loading Data</h2>
                <p className="text-gray-600 mt-1">Gagal terhubung ke Server Backend (port 5000) atau terjadi kesalahan query database.</p>
                <p className="text-sm text-red-400 mt-2">Pastikan server backend Anda berjalan dengan perintah 'npm start'.</p>
            </div>
        </div>
    );
  }
  // --- END LOADING DAN ERROR SCREEN ---


  return (
    <div className="p-6 min-h-screen bg-gradient-to-br from-gray-50 to-white">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-semibold text-gray-800 flex items-center gap-2">
            <ArrowTrendingUpIcon className="w-7 h-7 text-indigo-600" />
            Reports Dashboard
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Monitor real-time performance and insights
          </p>
        </div>
        <select
          className="bg-white border border-gray-200 shadow-sm rounded-lg px-4 py-2 text-gray-700 focus:ring-2 focus:ring-indigo-500 transition-all"
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value)}
        >
          <option value="week">Last Week</option>
          <option value="month">Last Month</option>
          <option value="year">Last Year</option>
        </select>
      </div>

      {/* Tabs */}
      <Tab.Group>
        <Tab.List className="flex gap-2 mb-6 bg-gray-100 rounded-xl p-1">
          {["Sales", "Inventory", "Financial"].map((tab, idx) => (
            <Tab
              key={idx}
              className={({ selected }) =>
                `w-full py-2.5 text-sm font-medium rounded-lg transition-all ${
                  selected
                    ? "bg-indigo-600 text-white shadow"
                    : "text-gray-600 hover:bg-white hover:text-indigo-600"
                }`
              }
            >
              {tab} Reports
            </Tab>
          ))}
        </Tab.List>

        <Tab.Panels>
          {/* Sales Reports */}
          <Tab.Panel>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <motion.div
                whileHover={{ scale: 1.01 }}
                className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100"
              >
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  Sales Trend
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  {/* Chart memerlukan data, dan SalesData dipastikan array kosong jika error */}
                  <AreaChart data={salesData}>
                    <defs>
                      <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366F1" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip formatter={(v) => formatCurrency(Number(v))} />
                    <Area
                      type="monotone"
                      dataKey="sales"
                      stroke="#6366F1"
                      fill="url(#colorSales)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.01 }}
                className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100"
              >
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  Top Products
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={topProducts}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={90}
                      label={({ name, value }) => `${name} (${value})`}
                    >
                      {topProducts.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.01 }}
                className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 lg:col-span-2"
              >
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  Summary
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {[
                    {
                      title: "Total Sales",
                      value: formatCurrency(summary.totalSales),
                      color: "bg-indigo-50 text-indigo-600",
                    },
                    {
                      title: "Total Orders",
                      value: summary.totalOrders,
                      color: "bg-green-50 text-green-600",
                    },
                    {
                      title: "Avg Order Value",
                      value: formatCurrency(summary.averageOrderValue),
                      color: "bg-purple-50 text-purple-600",
                    },
                  ].map((s, i) => (
                    <div
                      key={i}
                      className={`p-5 rounded-xl ${s.color} text-center font-semibold shadow-inner`}
                    >
                      <p className="text-sm text-gray-600">{s.title}</p>
                      <p className="text-2xl mt-1">{s.value}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
          </Tab.Panel>

          {/* Inventory Reports */}
          <Tab.Panel>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <motion.div
                whileHover={{ scale: 1.01 }}
                className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100"
              >
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  Stock Levels
                </h3>
                <div className="space-y-4 max-h-[400px] overflow-y-auto">
                  {/* Pastikan map berjalan pada array yang ada (stockLevels) */}
                  {inventory.stockLevels.map((item, i) => (
                    <div
                      key={i}
                      className="p-4 rounded-xl border bg-gray-50 hover:bg-gray-100 transition"
                    >
                      <div className="flex justify-between mb-2">
                        <span className="font-medium">{item.name}</span>
                        <span
                          className={`text-sm ${
                            item.isLow ? "text-red-500" : "text-green-600"
                          }`}
                        >
                          {item.isLow ? "Low Stock" : "Healthy"}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div
                          className={`h-2.5 rounded-full transition-all duration-500 ${
                            item.isLow ? "bg-red-500" : "bg-green-500"
                          }`}
                          style={{ width: `${item.stock}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.01 }}
                className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100"
              >
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  Inventory Value
                </h3>
                <div className="space-y-4">
                  <div className="p-4 bg-indigo-50 rounded-xl">
                    <p className="text-sm text-gray-600">Total Inventory</p>
                    <p className="text-2xl font-bold text-indigo-600">
                      {formatCurrency(inventory.totalValue)}
                    </p>
                  </div>
                  <div className="p-4 bg-yellow-50 rounded-xl">
                    <p className="text-sm text-gray-600">Low Stock Items</p>
                    <p className="text-2xl font-bold text-yellow-600">
                      {inventory.lowStockItems} items
                    </p>
                  </div>
                </div>
              </motion.div>
            </div>
          </Tab.Panel>

          {/* Financial Reports */}
          <Tab.Panel>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <motion.div
                whileHover={{ scale: 1.01 }}
                className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 lg:col-span-2"
              >
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  Financial Overview
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {[
                    {
                      title: "Revenue",
                      value: formatCurrency(financials.revenue),
                      color: "bg-green-50 text-green-600",
                    },
                    {
                      title: "Expenses",
                      value: formatCurrency(financials.expenses),
                      color: "bg-red-50 text-red-600",
                    },
                    {
                      title: "Profit",
                      value: formatCurrency(financials.profit),
                      color: "bg-blue-50 text-blue-600",
                    },
                  ].map((item, i) => (
                    <div
                      key={i}
                      className={`p-5 rounded-xl ${item.color} text-center font-semibold shadow-inner`}
                    >
                      <p className="text-sm text-gray-600">{item.title}</p>
                      <p className="text-2xl mt-1">{item.value}</p>
                    </div>
                  ))}
                </div>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.01 }}
                className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100"
              >
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  Revenue Breakdown
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={salesData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip formatter={(v) => formatCurrency(Number(v))} />
                    <Bar dataKey="sales" fill="#10B981" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.01 }}
                className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100"
              >
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  Recent Transactions
                </h3>
                <div className="space-y-3 max-h-[400px] overflow-y-auto">
                  {/* Pastikan map berjalan pada array yang ada (recentTransactions) */}
                  {financials.recentTransactions.map((t, i) => (
                    <div
                      key={i}
                      className="flex justify-between items-center p-4 bg-gray-50 rounded-xl border hover:bg-gray-100 transition"
                    >
                      <div>
                        <p className="font-medium">#{t.id}</p>
                        <p className="text-sm text-gray-500">
                          {format(new Date(t.date), "dd MMM yyyy")}
                        </p>
                      </div>
                      <span
                        className={`font-semibold ${
                          t.type === "expense"
                            ? "text-red-500"
                            : "text-green-600"
                        }`}
                      >
                        {t.type === "expense" ? "- " : "+ "}
                        {formatCurrency(t.total)}
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
          </Tab.Panel>
        </Tab.Panels>
      </Tab.Group>
    </div>
  );
};


export default Reports;