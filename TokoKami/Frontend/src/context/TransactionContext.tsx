import React, { createContext, useContext, useState, useEffect } from 'react';
import { useProducts, Product } from './ProductContext';
import { useInventory } from './InventoryContext';

export interface Transaction {
  id: string;
  date: string;
  items: TransactionItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  profit: number;
  paymentMethod: 'cash' | 'card' | 'other';
  cashierName: string;
  customerName?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TransactionItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  costPrice: number;
  totalPrice: number;
  profit: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

interface TransactionContextType {
  transactions: Transaction[];
  cart: CartItem[];
  loading: boolean;
  error: string | null;
  addToCart: (product: Product, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  updateCartItemQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  cartSubtotal: number;
  checkout: (paymentData: {
    discount: number;
    tax: number;
    paymentMethod: 'cash' | 'card' | 'other';
    cashierName: string;
    customerName?: string;
    notes?: string;
  }) => Promise<Transaction>;
  getTransaction: (id: string) => Transaction | undefined;
  getTransactionsByDateRange: (startDate: string, endDate: string) => Transaction[];
}

const TransactionContext = createContext<TransactionContextType | undefined>(undefined);

export const useTransactions = () => {
  const context = useContext(TransactionContext);
  if (context === undefined) {
    throw new Error('useTransactions must be used within a TransactionProvider');
  }
  return context;
};

// Sample transactions data
const initialTransactions: Transaction[] = [
  {
    id: '1',
    date: '2023-04-15T09:30:00.000Z',
    items: [
      {
        productId: '1',
        productName: 'Espresso',
        quantity: 2,
        unitPrice: 3.5,
        costPrice: 1.2,
        totalPrice: 7.0,
        profit: 4.6,
      },
      {
        productId: '4',
        productName: 'Iced Tea',
        quantity: 1,
        unitPrice: 3.0,
        costPrice: 1.0,
        totalPrice: 3.0,
        profit: 2.0,
      },
    ],
    subtotal: 10.0,
    discount: 0,
    tax: 0.5,
    total: 10.5,
    profit: 6.6,
    paymentMethod: 'cash',
    cashierName: 'John Doe',
    createdAt: '2023-04-15T09:30:00.000Z',
    updatedAt: '2023-04-15T09:30:00.000Z',
  },
  {
    id: '2',
    date: '2023-04-15T14:45:00.000Z',
    items: [
      {
        productId: '2',
        productName: 'Cappuccino',
        quantity: 3,
        unitPrice: 4.5,
        costPrice: 2.0,
        totalPrice: 13.5,
        profit: 7.5,
      },
    ],
    subtotal: 13.5,
    discount: 1.5,
    tax: 0.6,
    total: 12.6,
    profit: 7.5,
    paymentMethod: 'card',
    cashierName: 'Jane Smith',
    customerName: 'Regular Customer',
    createdAt: '2023-04-15T14:45:00.000Z',
    updatedAt: '2023-04-15T14:45:00.000Z',
  },
];

interface TransactionProviderProps {
  children: React.ReactNode;
}

export const TransactionProvider: React.FC<TransactionProviderProps> = ({ children }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { products, updateProductStock } = useProducts();
  const { updateRawMaterialStock } = useInventory();

  // Calculate cart subtotal
  const cartSubtotal = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);

  useEffect(() => {
    const fetchTransactions = async () => {
      setLoading(true);
      try {
        // In a real app, this would be an API call
        // For demo, we'll use the sample data or localStorage
        const savedTransactions = localStorage.getItem('transactions');
        
        if (savedTransactions) {
          setTransactions(JSON.parse(savedTransactions));
        } else {
          setTransactions(initialTransactions);
          localStorage.setItem('transactions', JSON.stringify(initialTransactions));
        }
      } catch (err) {
        setError('Failed to fetch transactions');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, []);

  const addToCart = (product: Product, quantity: number) => {
    setCart(prevCart => {
      const existingItemIndex = prevCart.findIndex(item => item.product.id === product.id);
      
      if (existingItemIndex >= 0) {
        // Update existing item
        const updatedCart = [...prevCart];
        updatedCart[existingItemIndex] = {
          ...updatedCart[existingItemIndex],
          quantity: updatedCart[existingItemIndex].quantity + quantity
        };
        return updatedCart;
      } else {
        // Add new item
        return [...prevCart, { product, quantity }];
      }
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prevCart => prevCart.filter(item => item.product.id !== productId));
  };

  const updateCartItemQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    
    setCart(prevCart => 
      prevCart.map(item => 
        item.product.id === productId 
          ? { ...item, quantity } 
          : item
      )
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  const checkout = async (paymentData: {
    discount: number;
    tax: number;
    paymentMethod: 'cash' | 'card' | 'other';
    cashierName: string;
    customerName?: string;
    notes?: string;
  }): Promise<Transaction> => {
    try {
      if (cart.length === 0) {
        throw new Error('Cart is empty');
      }

      // Calculate transaction details
      const transactionItems: TransactionItem[] = cart.map(item => ({
        productId: item.product.id,
        productName: item.product.name,
        quantity: item.quantity,
        unitPrice: item.product.price,
        costPrice: item.product.costPrice,
        totalPrice: item.product.price * item.quantity,
        profit: (item.product.price - item.product.costPrice) * item.quantity,
      }));

      const subtotal = transactionItems.reduce((sum, item) => sum + item.totalPrice, 0);
      const profit = transactionItems.reduce((sum, item) => sum + item.profit, 0);
      const total = subtotal - paymentData.discount + paymentData.tax;

      const newTransaction: Transaction = {
        id: Date.now().toString(),
        date: new Date().toISOString(),
        items: transactionItems,
        subtotal,
        discount: paymentData.discount,
        tax: paymentData.tax,
        total,
        profit,
        paymentMethod: paymentData.paymentMethod,
        cashierName: paymentData.cashierName,
        customerName: paymentData.customerName,
        notes: paymentData.notes,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Update product stock and raw material stock
      for (const item of cart) {
        // Update product stock
        await updateProductStock(item.product.id, item.quantity);
        
        // Update raw material stock for each ingredient
        for (const ingredient of item.product.ingredients) {
          await updateRawMaterialStock(
            ingredient.rawMaterialId, 
            ingredient.amount * item.quantity
          );
        }
      }

      // Save transaction
      const updatedTransactions = [...transactions, newTransaction];
      setTransactions(updatedTransactions);
      localStorage.setItem('transactions', JSON.stringify(updatedTransactions));

      // Clear cart
      clearCart();

      return newTransaction;
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to process checkout');
      }
      throw err;
    }
  };

  const getTransaction = (id: string) => {
    return transactions.find(transaction => transaction.id === id);
  };

  const getTransactionsByDateRange = (startDate: string, endDate: string) => {
    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime();
    
    return transactions.filter(transaction => {
      const transactionDate = new Date(transaction.date).getTime();
      return transactionDate >= start && transactionDate <= end;
    });
  };

  return (
    <TransactionContext.Provider 
      value={{ 
        transactions, 
        cart,
        loading, 
        error, 
        addToCart,
        removeFromCart,
        updateCartItemQuantity,
        clearCart,
        cartSubtotal,
        checkout,
        getTransaction,
        getTransactionsByDateRange
      }}
    >
      {children}
    </TransactionContext.Provider>
  );
};

export { TransactionContext };