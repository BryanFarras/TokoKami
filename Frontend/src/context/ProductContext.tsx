import React, { createContext, useContext, useEffect, useState } from "react";
import { api } from "../api";

export interface Product {
  id: string;
  name: string;
  price: number;
  costPrice: number;
  stock: number;
  category: string;
  image?: string;
  ingredients: ProductIngredient[];
  createdAt: string;
  updatedAt: string;
}

export interface ProductIngredient {
  rawMaterialId: string;
  amount: number;
}

interface ProductContextType {
  products: Product[];
  loading: boolean;
  error: string | null;
  addProduct: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateProduct: (id: string, product: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  getProduct: (id: string) => Product | undefined;
  updateProductStock: (id: string, quantity: number) => Promise<void>;
}

export const ProductContext = createContext<ProductContextType | undefined>(undefined);

export const useProducts = () => {
  const context = useContext(ProductContext);
  if (context === undefined) {
    throw new Error('useProducts must be used within a ProductProvider');
  }
  return context;
};

interface ProductProviderProps {
  children: React.ReactNode;
}

const mapFromApi = (p: any): Product => ({
  id: String(p.id),
  name: p.name,
  price: Number(p.price || 0),
  costPrice: Number(p.cost_price ?? p.costPrice ?? 0),
  stock: Number(p.stock || 0),
  category: p.category ?? "",
  image: p.image ?? undefined,
  ingredients: p.ingredients ?? [],
  createdAt: p.created_at ?? p.createdAt ?? new Date().toISOString(),
  updatedAt: p.updated_at ?? p.updatedAt ?? new Date().toISOString(),
});

const mapToApi = (p: Partial<Product>) => ({
  name: p.name,
  category: p.category,
  price: p.price,
  cost_price: p.costPrice,
  stock: p.stock,
  image: p.image,
  // send ingredients if backend supports it
  ingredients: p.ingredients?.map(i => ({
    raw_material_id: i.rawMaterialId,
    amount: i.amount,
  })),
});

export const ProductProvider: React.FC<ProductProviderProps> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const data = await api<any[]>("/products");
      setProducts((data || []).map(mapFromApi));
      setError(null);
    } catch (err) {
      console.error("Failed to load products", err);
      setError("Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const addProduct = async (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      setLoading(true);
      await api("/products", {
        method: "POST",
        body: JSON.stringify(mapToApi(product)),
      });
      await fetchProducts();
      setError(null);
    } catch (err) {
      console.error(err);
      setError("Failed to add product");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateProduct = async (id: string, productData: Partial<Product>) => {
    try {
      setLoading(true);
      await api(`/products/${id}`, {
        method: "PUT",
        body: JSON.stringify(mapToApi(productData)),
      });
      await fetchProducts();
      setError(null);
    } catch (err) {
      console.error(err);
      setError("Failed to update product");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteProduct = async (id: string) => {
    try {
      setLoading(true);
      await api(`/products/${id}`, { method: "DELETE" });
      await fetchProducts();
      setError(null);
    } catch (err) {
      console.error(err);
      setError("Failed to delete product");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getProduct = (id: string) => {
    return products.find(product => product.id === id);
  };

  const updateProductStock = async (id: string, quantity: number) => {
    try {
      const product = getProduct(id);
      if (!product) throw new Error("Product not found");
      const newStock = product.stock - quantity;
      if (newStock < 0) throw new Error("Insufficient stock");
      await updateProduct(id, { stock: newStock });
    } catch (err: any) {
      console.error(err);
      setError(err?.message ?? "Failed to update stock");
      throw err;
    }
  };

  return (
    <ProductContext.Provider 
      value={{ 
        products, 
        loading, 
        error, 
        addProduct, 
        updateProduct, 
        deleteProduct, 
        getProduct,
        updateProductStock
      }}
    >
      {children}
    </ProductContext.Provider>
  );
};