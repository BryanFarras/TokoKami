import { useState, useEffect, useContext } from 'react';
import { ProductContext } from '../context/ProductContext';
import { InventoryContext } from '../context/InventoryContext';
import { TransactionContext, TransactionItem } from '../context/TransactionContext';

export const useReports = (dateRange: 'week' | 'month' | 'year') => {
  const [salesData, setSalesData] = useState<{ date: string; sales: number }[]>([]);
  const [topProducts, setTopProducts] = useState<{ name: string; value: number }[]>([]);
  const [summary, setSummary] = useState({
    totalSales: 0,
    totalOrders: 0,
    averageOrderValue: 0,
  });
  const [inventory, setInventory] = useState({
    stockLevels: [],
    totalValue: 0,
    lowStockItems: 0,
  });
  const [financials, setFinancials] = useState({
    revenue: 0,
    expenses: 0,
    profit: 0,
    recentTransactions: [] as { date: string; total: number; type?: string }[],
  });
  const { transactions } = useContext(TransactionContext as unknown as React.Context<{ transactions: any[] }>);
  const { products } = useContext(ProductContext) || { products: [] };
  const inventoryItems = useContext(InventoryContext)?.inventoryItems || [];

  useEffect(() => {
    if (transactions && products && inventoryItems) {
      // Calculate sales data
      const salesByDate = transactions.reduce((acc, transaction) => {
        const date = new Date(transaction.date);
        const key = date.toISOString().split('T')[0];
        acc[key] = (acc[key] || 0) + transaction.total;
        return acc;
      }, {});

      setSalesData(Object.entries(salesByDate).map(([date, sales]) => ({
        date,
        sales: sales as number,
      })));

      // Calculate top products
      const productSales: { [key: string]: number } = {};
      transactions.forEach(transaction => {
        transaction.items.forEach((item: { productId: string | number; quantity: number; }) => {
          productSales[item.productId] = (productSales[item.productId] || 0) + item.quantity;
        });
      });

      const topProductsList = Object.entries(productSales)
        .map(([productId, quantity]) => ({
          name: products.find(p => p.id === productId)?.name || 'Unknown',
          value: quantity,
        }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 4);

      setTopProducts(topProductsList);

      // Calculate summary
      const totalSales = transactions.reduce((sum, t) => sum + t.total, 0);
      setSummary({
        totalSales,
        totalOrders: transactions.length,
        averageOrderValue: totalSales / transactions.length,
      });

      // Calculate inventory stats
      const lowStockThreshold = 10; // Adjust as needed
      const stockLevels = inventoryItems.map((item: { name: any; quantity: number; }) => ({
        name: item.name,
        stock: item.quantity,
        isLow: item.quantity < lowStockThreshold,
      }));

      setInventory({
        stockLevels,
        totalValue: inventoryItems.reduce((sum: number, item: { quantity: number; cost: number; }) => sum + (item.quantity * item.cost), 0),
        lowStockItems: stockLevels.filter((item: { isLow: any; }) => item.isLow).length,
      });

      // Calculate financials
      const revenue = totalSales;
      const expenses = transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.total, 0);

      setFinancials({
        revenue,
        expenses,
        profit: revenue - expenses,
        recentTransactions: transactions
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
          .slice(0, 3),
      });
    }
  }, [transactions, products, inventoryItems, dateRange]);

  return {
    salesData,
    topProducts,
    summary,
    inventory,
    financials,
  };
};