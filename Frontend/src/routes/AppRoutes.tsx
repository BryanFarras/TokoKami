import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Layouts
import DashboardLayout from '../layouts/DashboardLayout';
import AuthLayout from '../layouts/AuthLayout';

// Components
import ProtectedRoute from '../components/ProtectedRoute';

// Pages
import Dashboard from '../pages/Dashboard';
import Login from '../pages/Login';
import Products from '../pages/Products';
import POS from '../pages/POS';
import Reports from '../pages/Reports';
import RawMaterials from '../pages/RawMaterials';
import Purchases from '../pages/Purchases';
import Settings from '../pages/Settings';
import NotFound from '../pages/NotFound';

const AppRoutes = () => {
  const { user } = useAuth();

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<AuthLayout />}>
        <Route index element={<Login />} />
      </Route>

      {/* Protected routes */}
      <Route 
        path="/dashboard" 
        element={
          user ? <DashboardLayout /> : <Navigate to="/" replace />
        }
      >
        {/* Available for both admin and cashier */}
        <Route 
          index 
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="products" 
          element={
            <ProtectedRoute>
              <Products />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="pos" 
          element={
            <ProtectedRoute>
              <POS />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="settings" 
          element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          } 
        />

        {/* Admin only routes */}
        <Route 
          path="reports" 
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <Reports />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="raw-materials" 
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <RawMaterials />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="purchases" 
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <Purchases />
            </ProtectedRoute>
          } 
        />
      </Route>

      {/* 404 route */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRoutes;