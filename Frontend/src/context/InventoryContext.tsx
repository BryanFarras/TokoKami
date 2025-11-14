import React, { createContext, useContext, useEffect, useState } from "react";
import { api } from "../api";

export interface RawMaterial {
  id: string;
  name: string;
  unit?: string;
  stock: number;
  price?: number;
  unitCost?: number;
  supplier?: string;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: any;
}

interface InventoryContextType {
  rawMaterials: RawMaterial[];
  loading: boolean;
  error: string | null;
  fetchRawMaterials: () => Promise<void>;
  addRawMaterial: (m: Omit<RawMaterial, "id">) => Promise<void>;
  updateRawMaterial: (id: string, m: Partial<RawMaterial>) => Promise<void>;
  deleteRawMaterial: (id: string) => Promise<void>;
}

export const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

export const useInventory = () => {
  const ctx = useContext(InventoryContext);
  if (!ctx) throw new Error("useInventory must be used within InventoryProvider");
  return ctx;
};

export const InventoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [rawMaterials, setRawMaterials] = useState<RawMaterial[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mapFromApi = (r: any): RawMaterial => {
    const price = r.price ?? r.unit_cost ?? 0;
    return {
      id: String(r.id),
      name: r.name,
      unit: r.unit,
      stock: Number(r.stock ?? 0),
      price: Number(price),
      unitCost: Number(r.unit_cost ?? r.unitCost ?? r.price ?? 0),
      supplier: r.supplier ?? r.vendor ?? "",
      createdAt: r.created_at ?? r.createdAt,
      updatedAt: r.updated_at ?? r.updatedAt,
      ...r,
    };
  };

  const mapToApi = (m: Partial<RawMaterial>) => {
    const price = typeof m.unitCost !== "undefined" ? Number(m.unitCost) : (typeof m.price !== "undefined" ? Number(m.price) : undefined);
    const payload: any = {
      name: m.name,
      unit: m.unit,
      stock: typeof m.stock !== "undefined" ? Number(m.stock) : undefined,
      supplier: m.supplier,
    };
    if (typeof price !== "undefined") {
      payload.price = price;
      payload.unit_cost = price;
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

  useEffect(() => {
    fetchRawMaterials();
  }, []);

  return (
    <InventoryContext.Provider value={{ rawMaterials, loading, error, fetchRawMaterials, addRawMaterial, updateRawMaterial, deleteRawMaterial }}>
      {children}
    </InventoryContext.Provider>
  );
};