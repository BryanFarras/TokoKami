import { useState, useEffect } from 'react';
import axios from 'axios';

interface SalesTrendItem { date: string; sales: number; }
interface TopProductItem { name: string; value: number; }
interface ReportSummary { totalSales: number; totalOrders: number; averageOrderValue: number; }
interface StockLevelItem { name: string; stock: number; isLow: boolean; }
interface ReportInventory { stockLevels: StockLevelItem[]; totalValue: number; lowStockItems: number; }
interface TransactionItem { id: number; date: string; total: number; type: "sale" | "expense" | "return"; }
interface ReportFinancials {
    revenue: number;
    expenses: number;
    profit: number;
    recentTransactions: TransactionItem[];
}

interface ReportData {
  salesData: SalesTrendItem[];
  topProducts: TopProductItem[];
  summary: ReportSummary;
  inventory: ReportInventory;
  financials: ReportFinancials;
  isLoading: boolean;
  isError: boolean;
}

const defaultData: ReportData = {
  salesData: [],
  topProducts: [],
  summary: { totalSales: 0, totalOrders: 0, averageOrderValue: 0 },
  inventory: { stockLevels: [], totalValue: 0, lowStockItems: 0 },
  financials: { revenue: 0, expenses: 0, profit: 0, recentTransactions: [] },
  isLoading: true,
  isError: false,
};

const API_BASE_URL = 'http://localhost:5000/api'; 
type DateRange = 'week' | 'month' | 'year';

export const useReports = (dateRange: DateRange): ReportData => {
  // Ganti semua useState lama dengan satu state utama
  const [data, setData] = useState<ReportData>(defaultData); 

  useEffect(() => {
    const fetchAllReports = async () => {
      setData({ ...defaultData, isLoading: true });

      try {
        // --- PANGGILAN API 1: RINGKASAN PENJUALAN ---
        // Ini menggunakan endpoint /api/reports/summary yang sudah kita buat di backend
        const summaryRes = await axios.get(`${API_BASE_URL}/reports/summary`, {
            params: { range: dateRange }
        });
        const summaryApiData = summaryRes.data;
        
        const totalSales = parseFloat(summaryApiData.total_sales) || 0;
        const totalOrders = summaryApiData.total_transactions || 0;
        const averageOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;
        
        // --- PANGGILAN API 2: DATA DETAIL (Mockup Sisa) ---
        // Karena endpoint detail (sales trend, top products, dll.) belum dibuat, 
        // kita akan menggunakan data mockup AMAN di sini yang bergantung pada totalSales.
        
        const mockInventory: ReportInventory = {
            stockLevels: [{ name: "Kopi Susu", stock: 80, isLow: false }],
            totalValue: 5000000,
            lowStockItems: 1,
        };
        const mockFinancials: ReportFinancials = {
            revenue: totalSales,
            expenses: totalSales * 0.4, 
            profit: totalSales * 0.6,
            recentTransactions: [
                { id: 101, date: new Date().toISOString(), total: 150000, type: 'sale' },
            ]
        };
        
        // --- UPDATE STATE ---
        setData({
            isLoading: false,
            isError: false,
            salesData: [{ date: "Hari Ini", sales: totalSales }], // Data trend sederhana
            topProducts: [{ name: "Produk Teratas", value: 10 }],
            inventory: mockInventory,
            summary: { totalSales, totalOrders, averageOrderValue },
            financials: mockFinancials,
        });

      } catch (err) {
        console.error("Gagal mengambil data laporan dari API:", err);
        // Set error state jika gagal
        setData({ ...defaultData, isLoading: false, isError: true });
      }
    };

    fetchAllReports();
  }, [dateRange]);

  return data;
};