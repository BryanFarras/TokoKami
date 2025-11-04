import React, { useState } from 'react';
import { Tab } from '@headlessui/react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { format } from 'date-fns';
import { useReports } from '../hooks/useReports';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const Reports = () => {
  const [dateRange, setDateRange] = useState('month');
  const { recentTransactions, salesData, topProducts, summary, inventory, financials }: {
    recentTransactions: { id: number; date: string; total: number; type: 'expense' | 'income' }[]
    salesData: { date: string; sales: number }[];
    topProducts: { name: string; value: number }[];
    summary: { totalSales: number; totalOrders: number; averageOrderValue: number };
    inventory: { stockLevels: { name: string; stock: number; isLow: boolean }[]; totalValue: number; lowStockItems: number };
    financials: { 
      revenue: number; 
      expenses: number; 
      profit: number; 
      recentTransactions: { id: number; date: string; type: 'expense' | 'income'; total: number }[] 
    };
  } = useReports(dateRange as 'week' | 'month' | 'year');

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">Reports</h1>
        <select 
          className="bg-white border border-gray-300 rounded-md px-3 py-2"
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value)}
        >
          <option value="week">Last Week</option>
          <option value="month">Last Month</option>
          <option value="year">Last Year</option>
        </select>
      </div>

      <Tab.Group>
        <Tab.List className="flex space-x-1 rounded-xl bg-blue-900/20 p-1 mb-6">
          <Tab className={({ selected }) =>
            `w-full rounded-lg py-2.5 text-sm font-medium leading-5
             ${selected 
               ? 'bg-white shadow text-blue-700' 
               : 'text-gray-600 hover:bg-white/[0.12] hover:text-blue-600'
             }`
          }>
            Sales Reports
          </Tab>
          <Tab className={({ selected }) =>
            `w-full rounded-lg py-2.5 text-sm font-medium leading-5
             ${selected 
               ? 'bg-white shadow text-blue-700' 
               : 'text-gray-600 hover:bg-white/[0.12] hover:text-blue-600'
             }`
          }>
            Inventory Reports
          </Tab>
          <Tab className={({ selected }) =>
            `w-full rounded-lg py-2.5 text-sm font-medium leading-5
             ${selected 
               ? 'bg-white shadow text-blue-700' 
               : 'text-gray-600 hover:bg-white/[0.12] hover:text-blue-600'
             }`
          }>
            Financial Reports
          </Tab>
        </Tab.List>

        <Tab.Panels>
          <Tab.Panel>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-4 rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-4">Sales Trend</h3>
                <AreaChart width={500} height={300} data={salesData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  <Area type="monotone" dataKey="sales" stroke="#8884d8" fill="#8884d8" />
                </AreaChart>
              </div>

              <div className="bg-white p-4 rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-4">Top Products</h3>
                <PieChart width={500} height={300}>
                  <Pie
                    data={topProducts}
                    cx={250}
                    cy={150}
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {topProducts.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </div>

              <div className="bg-white p-4 rounded-lg shadow md:col-span-2">
                <h3 className="text-lg font-semibold mb-4">Sales Summary</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-gray-600">Total Sales</p>
                    <p className="text-2xl font-bold text-blue-600">{formatCurrency(summary.totalSales)}</p>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg">
                    <p className="text-sm text-gray-600">Total Orders</p>
                    <p className="text-2xl font-bold text-green-600">{summary.totalOrders}</p>
                  </div>
                  <div className="p-4 bg-purple-50 rounded-lg">
                    <p className="text-sm text-gray-600">Average Order Value</p>
                    <p className="text-2xl font-bold text-purple-600">{formatCurrency(summary.averageOrderValue)}</p>
                  </div>
                </div>
              </div>
            </div>
          </Tab.Panel>

          <Tab.Panel>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-4 rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-4">Stock Levels</h3>
                <div className="space-y-4">
                  {inventory.stockLevels.map((item, index) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium">{item.name}</span>
                        <span className={item.isLow ? "text-red-500" : "text-green-500"}>
                          {item.isLow ? "Low Stock" : "Good"}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div 
                          className={`h-2.5 rounded-full ${item.isLow ? "bg-red-600" : "bg-green-600"}`} 
                          style={{ width: `${Math.min((item.stock / 100) * 100, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white p-4 rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-4">Inventory Value</h3>
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-gray-600">Total Inventory Value</p>
                    <p className="text-2xl font-bold text-blue-600">{formatCurrency(inventory.totalValue)}</p>
                  </div>
                  <div className="p-4 bg-yellow-50 rounded-lg">
                    <p className="text-sm text-gray-600">Low Stock Items</p>
                    <p className="text-2xl font-bold text-yellow-600">{inventory.lowStockItems} items</p>
                  </div>
                </div>
              </div>
            </div>
          </Tab.Panel>

          <Tab.Panel>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-4 rounded-lg shadow md:col-span-2">
                <h3 className="text-lg font-semibold mb-4">Financial Overview</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 bg-green-50 rounded-lg">
                    <p className="text-sm text-gray-600">Revenue</p>
                    <p className="text-2xl font-bold text-green-600">{formatCurrency(financials.revenue)}</p>
                  </div>
                  <div className="p-4 bg-red-50 rounded-lg">
                    <p className="text-sm text-gray-600">Expenses</p>
                    <p className="text-2xl font-bold text-red-600">{formatCurrency(financials.expenses)}</p>
                  </div>
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-gray-600">Profit</p>
                    <p className="text-2xl font-bold text-blue-600">{formatCurrency(financials.profit)}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-4 rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-4">Revenue Breakdown</h3>
                <BarChart width={500} height={300} data={salesData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  <Bar dataKey="sales" fill="#4CAF50" />
                </BarChart>
              </div>

              <div className="bg-white p-4 rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-4">Recent Transactions</h3>
                <div className="space-y-3">
                  {financials.recentTransactions.map((transaction, index) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">Transaction #{transaction.id}</p>
                        <p className="text-sm text-gray-600">{format(new Date(transaction.date), 'dd MMM yyyy')}</p>
                      </div>
                      <span className={`font-medium ${transaction.type === 'expense' ? 'text-red-600' : 'text-green-600'}`}>
                        {transaction.type === 'expense' ? '- ' : '+ '}
                        {formatCurrency(transaction.total)}
                      </span>
                    </div>
                  ))}
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