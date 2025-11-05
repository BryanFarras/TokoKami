import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api'; // Ganti jika Anda deploy

// --- DEFINISI TIPE DATA SESUAI POSTGRES ---
export interface Product {
  id: number; // ID sekarang adalah NUMBER (SERIAL)
  name: string;
  price: number;
  cost: number; // costPrice diganti menjadi cost
  stock: number;
  sku: string; // Tambahkan SKU dari skema DB
  // createdAt dan updatedAt dihapus dari interface karena tidak dibutuhkan di Context level ini
  // Bahan baku (ingredients) tidak ada di tabel products, jadi dihapus
}

interface ProductContextType {
  products: Product[];
  isLoading: boolean;
  isError: boolean;
  refetchProducts: () => Promise<void>;
  getProduct: (id: number) => Product | undefined;
  
  // Fungsi CRUD (Ini memerlukan endpoint POST/PUT/DELETE baru di backend!)
  addProduct: (product: Omit<Product, 'id' | 'stock'>) => Promise<void>;
  updateProduct: (id: number, updates: Partial<Omit<Product, 'id'>>) => Promise<void>;
  deleteProduct: (id: number) => Promise<void>;
  updateProductStock: (id: number, quantity: number) => Promise<void>;
}

export const ProductContext = createContext<ProductContextType | undefined>(undefined);

// =======================================================
//                   PRODUCT PROVIDER UTAMA
// =======================================================

export const ProductProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  // --- FUNGSI READ (FETCH) ---
  const fetchProducts = async () => {
    setIsLoading(true);
    setIsError(false);
    try {
      const response = await axios.get(`${API_BASE_URL}/products`);
      
      // Mapping data dari API (DB mengembalikan string/numeric)
      const mappedProducts: Product[] = response.data.map((p: any) => ({
        id: p.id,
        name: p.name,
        price: parseFloat(p.price) || 0,
        cost: parseFloat(p.cost) || 0,
        stock: parseInt(p.stock) || 0,
        sku: p.sku || '',
      }));

      setProducts(mappedProducts);
    } catch (error) {
      console.error("Error fetching products from API:", error);
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Fungsi untuk mendapatkan produk berdasarkan ID
  const getProduct = (id: number) => {
    return products.find(product => product.id === id);
  };
  
  // --- FUNGSI CRUD MOCK API ---
  // Catatan: Endpoint API untuk CRUD (POST/PUT/DELETE) harus dibuat di backend.
  // Saat ini, fungsi ini hanya me-refresh data (fetchProducts) setelah aksi disimulasikan.

  const addProduct = async (product: Omit<Product, 'id' | 'stock'>) => {
    // API Call: axios.post(`${API_BASE_URL}/products`, product);
    // Kita simulasi refresh setelah sukses
    await fetchProducts(); 
  };

  const updateProduct = async (id: number, updates: Partial<Omit<Product, 'id'>>) => {
    // API Call: axios.put(`${API_BASE_URL}/products/${id}`, updates);
    await fetchProducts();
  };

  const deleteProduct = async (id: number) => {
    // API Call: axios.delete(`${API_BASE_URL}/products/${id}`);
    await fetchProducts();
  };
  
  const updateProductStock = async (id: number, quantity: number) => {
      // Endpoint ini sudah dicover oleh endpoint transaksi di server.js
      // Jika butuh endpoint stock update terpisah, ini contoh API call-nya:
      // API Call: axios.patch(`${API_BASE_URL}/products/${id}/stock`, { quantity });
      await fetchProducts();
  };


  const contextValue: ProductContextType = {
    products,
    isLoading,
    isError,
    refetchProducts: fetchProducts,
    addProduct,
    updateProduct,
    deleteProduct,
    getProduct,
    updateProductStock,
  };

  return (
    <ProductContext.Provider value={contextValue}>
      {children}
    </ProductContext.Provider>
  );
};

// Custom hook untuk mengakses context
export const useProducts = () => {
  const context = useContext(ProductContext);
  if (context === undefined) {
    throw new Error('useProducts must be used within a ProductProvider');
  }
  return context;
};