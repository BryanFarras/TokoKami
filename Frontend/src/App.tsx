import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import AppRoutes from './routes/AppRoutes';
import { AuthProvider } from './context/AuthContext';
import { ProductProvider } from './context/ProductContext';
import { TransactionProvider } from './context/TransactionContext';
import { InventoryProvider } from './context/InventoryContext';

function App() {
  return (
    <AuthProvider>
      <ProductProvider>
        <InventoryProvider>
          <TransactionProvider>
            <Router>
              <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
                <Toaster position="top-right" />
                <AppRoutes />
              </div>
            </Router>
          </TransactionProvider>
        </InventoryProvider>
      </ProductProvider>
    </AuthProvider>
  );
}

export default App;