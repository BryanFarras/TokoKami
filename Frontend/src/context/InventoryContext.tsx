import React, { createContext, useContext, useEffect, useState } from "react";
import { api } from "../api";

export interface RawMaterial {
  id: string;
  name: string;
  unit?: string;
  stock: number;
  price?: number;
  unitCost?: number; // Harga beli per unit (digunakan untuk perhitungan inventaris)
  supplier?: string;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: any;
}

interface Purchase {
  id?: string;
  date: string;
  supplier: string;
  items: any[];
  totalAmount: number;
  notes?: string;
  [key: string]: any;
}

interface InventoryContextType {
  rawMaterials: RawMaterial[];
  purchases: Purchase[]; // ADD
  loading: boolean;
  error: string | null;
  fetchRawMaterials: () => Promise<void>;
  addRawMaterial: (m: Omit<RawMaterial, "id">) => Promise<void>;
  updateRawMaterial: (id: string, m: Partial<RawMaterial>) => Promise<void>;
  deleteRawMaterial: (id: string) => Promise<void>;
  fetchPurchases?: () => Promise<void>; // optional
  addPurchase?: (p: Purchase) => Promise<void>; // optional
}

export const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

export const useInventory = () => {
  const ctx = useContext(InventoryContext);
  if (!ctx) throw new Error("useInventory must be used within InventoryProvider");
  return ctx;
};

export const InventoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [rawMaterials, setRawMaterials] = useState<RawMaterial[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]); // ADD
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mapFromApi = (r: any): RawMaterial => {
    // SOLUSI 1: Prioritas unitCost, konversi ke Number secara eksplisit
    const primaryCost = Number(r.unit_cost ?? r.unitCost ?? r.price ?? 0); 
    
    return {
      id: String(r.id),
      name: r.name,
      unit: r.unit,
      stock: Number(r.stock ?? 0),
      
      unitCost: primaryCost, 
      price: primaryCost, // Sinkronisasi harga jual/beli jika tidak ada pemisahan
      
      supplier: r.supplier ?? r.vendor ?? "",
      createdAt: r.created_at ?? r.createdAt,
      updatedAt: r.updated_at ?? r.updatedAt,
      ...r,
    };
  };

  const mapToApi = (m: Partial<RawMaterial>) => {
    // SOLUSI 2: Pastikan nilai 0 (Rp 0) dikirim ke API
    const rawPrice = m.unitCost ?? m.price;
    const price = typeof rawPrice !== "undefined" ? Number(rawPrice) : undefined;
    
    const payload: any = {
      name: m.name,
      unit: m.unit,
      stock: typeof m.stock !== "undefined" ? Number(m.stock) : undefined,
      supplier: m.supplier,
    };
    
    if (typeof price !== "undefined") {
      payload.price = price;
      payload.unit_cost = price; // Kirim unit_cost (snake_case) yang diekspektasikan backend
    }
    return payload;
  };

  const fetchRawMaterials = async () => {
    try {
      setLoading(true);
      const data = await api<any[]>("/raw-materials");
      setRawMaterials((data || []).map(mapFromApi));
      setError(null);
    } catch (err) {
      console.error(err);
      setError("Failed to load raw materials");
    } finally {
      setLoading(false);
    }
  };

  const addRawMaterial = async (m: Omit<RawMaterial, "id">) => {
    try {
      setLoading(true);
      await api("/raw-materials", { method: "POST", body: mapToApi(m) });
      await fetchRawMaterials();
      setError(null);
    } catch (err) {
      console.error(err);
      setError("Failed to add raw material");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateRawMaterial = async (id: string, m: Partial<RawMaterial>) => {
    try {
      setLoading(true);
      // merge with existing to avoid overwriting missing fields
      const existing = rawMaterials.find(r => r.id === id) ?? {};
      const merged = { ...existing, ...m };
      await api(`/raw-materials/${id}`, { method: "PUT", body: mapToApi(merged) });
      await fetchRawMaterials();
      setError(null);
    } catch (err) {
      console.error(err);
      setError("Failed to update raw material");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteRawMaterial = async (id: string) => {
    try {
      setLoading(true);
      await api(`/raw-materials/${id}`, { method: "DELETE" });
      await fetchRawMaterials();
      setError(null);
    } catch (err) {
      console.error(err);
      setError("Failed to delete raw material");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const fetchPurchases = async () => {
    try {
      setLoading(true);
      const data = await api<any[]>('/purchases');
      setPurchases((data || []).map(d => ({
        id: d.id,
        date: d.date ?? d.created_at ?? new Date().toISOString(),
        supplier: d.supplier ?? '',
        items: Array.isArray(d.items || d.line_items) ? (d.items || d.line_items) : [],
        totalAmount: Number(d.total_amount ?? d.totalAmount ?? d.total ?? 0),
        notes: d.notes ?? d.comment ?? '',
        ...d,
      })));
      setError(null);
    } catch (err) {
      console.error(err);
      setError('Failed to load purchases');
    } finally {
      setLoading(false);
    }
  };

  const addPurchase = async (p: Purchase) => {
    try {
      setLoading(true);
      await api('/purchases', { method: 'POST', body: p });
      await fetchPurchases();
      setError(null);
    } catch (err) {
      console.error(err);
      setError('Failed to add purchase');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRawMaterials();
    fetchPurchases(); // ADD
  }, []);

  return (
    <InventoryContext.Provider value={{
      rawMaterials,
      purchases, // ADD
      loading,
      error,
      fetchRawMaterials,
      addRawMaterial,
      updateRawMaterial,
      deleteRawMaterial,
      fetchPurchases, // optional
      addPurchase,    // optional
    }}>
      {children}
    </InventoryContext.Provider>
  );
};