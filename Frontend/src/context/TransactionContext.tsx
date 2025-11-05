import React, { createContext, useContext, useEffect, useState } from "react";
import { api } from "../api";

export interface TransactionItem { productId: string; quantity: number; price?: number; [key: string]: any; }
export interface Transaction { id: string; type?: string; items: TransactionItem[]; total: number; createdAt?: string; [key: string]: any; }

interface TransactionContextType {
  transactions: Transaction[];
  loading: boolean;
  error: string | null;
  fetchTransactions: () => Promise<void>;
  addTransaction: (t: Omit<Transaction, "id" | "createdAt">) => Promise<void>;
}

export const TransactionContext = createContext<TransactionContextType | undefined>(undefined);

export const useTransactions = () => {
  const ctx = useContext(TransactionContext);
  if (!ctx) throw new Error("useTransactions must be used within TransactionProvider");
  return ctx;
};

export const TransactionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mapFromApi = (t: any): Transaction => ({
    id: String(t.id),
    type: t.type,
    items: t.items ?? t.line_items ?? [],
    total: Number(t.total ?? 0),
    createdAt: t.created_at ?? t.createdAt,
    ...t,
  });

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const data = await api<any[]>("/transactions");
      setTransactions((data || []).map(mapFromApi));
      setError(null);
    } catch (err) {
      console.error(err);
      setError("Failed to load transactions");
    } finally {
      setLoading(false);
    }
  };

  const addTransaction = async (t: Omit<Transaction, "id" | "createdAt">) => {
    try {
      setLoading(true);
      // backend expects items[].productId and fields like payment_method, cashier_name, customer_name
      const payload = {
        type: t.type,
        items: t.items.map(it => ({
          productId: it.productId ?? it.product_id ?? it.id,
          quantity: it.quantity,
          price: it.price,
          ...it
        })),
        subtotal: (t as any).subtotal ?? t.total ?? 0,
        total: t.total,
        discount: (t as any).discount ?? 0,
        tax: (t as any).tax ?? 0,
        payment_method: (t as any).paymentMethod ?? (t as any).payment_method,
        cashier_name: (t as any).cashierName ?? (t as any).cashier_name,
        customer_name: (t as any).customerName ?? (t as any).customer_name,
        notes: (t as any).notes ?? undefined
      };

      // POST to the checkout route
      await api("/transactions/checkout", { method: "POST", body: payload });
      await fetchTransactions();
      setError(null);
    } catch (err) {
      console.error(err);
      setError("Failed to add transaction");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  return (
    <TransactionContext.Provider value={{ transactions, loading, error, fetchTransactions, addTransaction }}>
      {children}
    </TransactionContext.Provider>
  );
};