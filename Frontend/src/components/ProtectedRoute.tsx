import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { canAccessRoute } from '../utils/permissions';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: ('admin' | 'cashier')[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  allowedRoles 
}) => {
  const { user, loading } = useAuth();
  const currentPath = window.location.pathname;

  // Loading state
  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  // Not authenticated
  if (!user) {
    return <Navigate to="/" replace />;
  }

  // Check if user has access based on role
  const userRole = user.role as 'admin' | 'cashier' | undefined;
  
  if (allowedRoles && allowedRoles.length > 0) {
    // If specific roles are specified, check against them
    if (!allowedRoles.includes(userRole as any)) {
      return <Navigate to="/dashboard" replace />;
    }
  } else {
    // Otherwise use the permission system
    if (!canAccessRoute(userRole, currentPath)) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;
