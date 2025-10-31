import React, { createContext, useContext, useState, useEffect } from 'react';

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

const ProductContext = createContext<ProductContextType | undefined>(undefined);

export const useProducts = () => {
  const context = useContext(ProductContext);
  if (context === undefined) {
    throw new Error('useProducts must be used within a ProductProvider');
  }
  return context;
};

// Sample data
const initialProducts: Product[] = [
  {
    id: '1',
    name: 'Espresso',
    price: 3.5,
    costPrice: 1.2,
    stock: 100,
    category: 'Coffee',
    image: 'https://images.pexels.com/photos/312418/pexels-photo-312418.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
    ingredients: [
      { rawMaterialId: '1', amount: 18 }, // Coffee beans
      { rawMaterialId: '2', amount: 40 }, // Water
    ],
    createdAt: '2023-01-01T00:00:00.000Z',
    updatedAt: '2023-01-01T00:00:00.000Z',
  },
  {
    id: '2',
    name: 'Cappuccino',
    price: 4.5,
    costPrice: 2.0,
    stock: 80,
    category: 'Coffee',
    image: 'https://images.pexels.com/photos/350478/pexels-photo-350478.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
    ingredients: [
      { rawMaterialId: '1', amount: 18 }, // Coffee beans
      { rawMaterialId: '2', amount: 40 }, // Water
      { rawMaterialId: '3', amount: 100 }, // Milk
    ],
    createdAt: '2023-01-02T00:00:00.000Z',
    updatedAt: '2023-01-02T00:00:00.000Z',
  },
  {
    id: '3',
    name: 'Latte',
    price: 5.0,
    costPrice: 2.2,
    stock: 75,
    category: 'Coffee',
    image: 'https://images.pexels.com/photos/302899/pexels-photo-302899.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
    ingredients: [
      { rawMaterialId: '1', amount: 18 }, // Coffee beans
      { rawMaterialId: '2', amount: 40 }, // Water
      { rawMaterialId: '3', amount: 150 }, // Milk
    ],
    createdAt: '2023-01-03T00:00:00.000Z',
    updatedAt: '2023-01-03T00:00:00.000Z',
  },
  {
    id: '4',
    name: 'Iced Tea',
    price: 3.0,
    costPrice: 1.0,
    stock: 120,
    category: 'Tea',
    image: 'https://images.pexels.com/photos/792613/pexels-photo-792613.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
    ingredients: [
      { rawMaterialId: '4', amount: 5 }, // Tea
      { rawMaterialId: '2', amount: 200 }, // Water
      { rawMaterialId: '5', amount: 20 }, // Sugar
      { rawMaterialId: '6', amount: 50 }, // Ice
    ],
    createdAt: '2023-01-04T00:00:00.000Z',
    updatedAt: '2023-01-04T00:00:00.000Z',
  },
];

interface ProductProviderProps {
  children: React.ReactNode;
}

export const ProductProvider: React.FC<ProductProviderProps> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        // In a real app, this would be an API call
        // For demo, we'll use the sample data or localStorage
        const savedProducts = localStorage.getItem('products');
        if (savedProducts) {
          setProducts(JSON.parse(savedProducts));
        } else {
          setProducts(initialProducts);
          localStorage.setItem('products', JSON.stringify(initialProducts));
        }
      } catch (err) {
        setError('Failed to fetch products');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const addProduct = async (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const newProduct: Product = {
        ...product,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const updatedProducts = [...products, newProduct];
      setProducts(updatedProducts);
      localStorage.setItem('products', JSON.stringify(updatedProducts));
    } catch (err) {
      setError('Failed to add product');
      throw err;
    }
  };

  const updateProduct = async (id: string, productData: Partial<Product>) => {
    try {
      const updatedProducts = products.map(product => 
        product.id === id 
          ? { 
              ...product, 
              ...productData, 
              updatedAt: new Date().toISOString() 
            } 
          : product
      );
      
      setProducts(updatedProducts);
      localStorage.setItem('products', JSON.stringify(updatedProducts));
    } catch (err) {
      setError('Failed to update product');
      throw err;
    }
  };

  const deleteProduct = async (id: string) => {
    try {
      const updatedProducts = products.filter(product => product.id !== id);
      setProducts(updatedProducts);
      localStorage.setItem('products', JSON.stringify(updatedProducts));
    } catch (err) {
      setError('Failed to delete product');
      throw err;
    }
  };

  const getProduct = (id: string) => {
    return products.find(product => product.id === id);
  };

  const updateProductStock = async (id: string, quantity: number) => {
    try {
      const product = products.find(p => p.id === id);
      if (!product) {
        throw new Error('Product not found');
      }

      const newStock = product.stock - quantity;
      if (newStock < 0) {
        throw new Error('Insufficient stock');
      }

      await updateProduct(id, { stock: newStock });
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to update product stock');
      }
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