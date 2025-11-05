import { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';
const LOW_STOCK_THRESHOLD = 10;

interface Stats {
  sales: number;
  profit: number;
  orders: number;
  averageOrder: number;
}

interface ProductDetail {
  id: number;
  name: string;
  stock: number;
  cost: number;
  price: number;
}

interface TopProduct {
  name: string;
  value: number; // Kuantitas terjual
  total: number; // Total revenue dari produk ini
}

interface DashboardData {
  stats: Stats;
  products: ProductDetail[]; 
  topProducts: TopProduct[];
  lowStockProducts: ProductDetail[];
  isLoading: boolean;
  isError: boolean;
}

const initialData: DashboardData = {
  stats: { sales: 0, profit: 0, orders: 0, averageOrder: 0 },
  products: [],
  topProducts: [],
  lowStockProducts: [],
  isLoading: true,
  isError: false,
};

export const useDashboardData = (timeRange: 'today' | 'week' | 'month'): DashboardData => {
  const [data, setData] = useState<DashboardData>(initialData);

  useEffect(() => {
    const fetchData = async () => {
      setData(prev => ({ ...prev, isLoading: true, isError: false }));

      try {
        // Panggilan API ke Backend
        const [summaryRes, productsRes, topProductsRes, detailsRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/reports/summary`), 
          axios.get(`${API_BASE_URL}/products`), 
          axios.get(`${API_BASE_URL}/reports/top-products`), 
          axios.get(`${API_BASE_URL}/reports/details`),
        ]);

        const totalSales = parseFloat(summaryRes.data.total_sales) || 0;
        const totalOrders = summaryRes.data.total_transactions || 0;
        const allProducts = productsRes.data.map((p: any) => ({
            ...p,
            cost: parseFloat(p.cost) || 0,
            price: parseFloat(p.price) || 0,
            stock: parseInt(p.stock) || 0,
            id: p.id
        }));
        
        // Ambil profit dari endpoint details
        const grossProfit = detailsRes.data.financials.profit || 0;
        
        // --- PERHITUNGAN DI FRONTEND ---
        
        // 1. Tentukan Low Stock Products
        const lowStock = allProducts
          .filter((p: ProductDetail) => p.stock < LOW_STOCK_THRESHOLD)
          .sort((a: ProductDetail, b: ProductDetail) => a.stock - b.stock);

        // 2. Map Top Products dari API
        const topProductsApi = topProductsRes.data.map((p: any) => {
            const product = allProducts.find((prod: ProductDetail) => prod.name === p.name);
            const totalRevenue = p.value * (product?.price || 0);
            return {
                name: p.name,
                value: p.value, // quantity
                total: totalRevenue, 
            };
        });


        setData({
          isLoading: false,
          isError: false,
          stats: {
            sales: totalSales,
            profit: grossProfit, 
            orders: totalOrders,
            averageOrder: totalOrders > 0 ? totalSales / totalOrders : 0,
          },
          products: allProducts,
          topProducts: topProductsApi,
          lowStockProducts: lowStock,
        });

      } catch (error) {
        console.error("Gagal mengambil data dashboard:", error);
        setData(prev => ({ ...prev, isLoading: false, isError: true }));
      }
    };

    fetchData();
  }, [timeRange]);

  return data;
};