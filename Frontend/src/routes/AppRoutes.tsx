import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Layouts
import DashboardLayout from '../layouts/DashboardLayout';
import AuthLayout from '../layouts/AuthLayout';

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
        <Route index element={<Dashboard />} />
        <Route path="products" element={<Products />} />
        <Route path="pos" element={<POS />} />
        <Route path="reports" element={<Reports />} />
        <Route path="raw-materials" element={<RawMaterials />} />
        <Route path="purchases" element={<Purchases />} />
        <Route path="settings" element={<Settings />} />
      </Route>

      {/* 404 route */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRoutes;