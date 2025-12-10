import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Logo from '../assets/design.svg';

const AuthLayout = () => {
  const { user } = useAuth();

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 to-indigo-800 p-4">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-xl shadow-xl p-8">
        <div className="flex flex-col items-center mb-6">
          <div className="h-16 w-16 bg-white-600 rounded-full flex items-center justify-center mb-4">
            <img src={Logo} alt="Logo" className="h-48 w-48" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white text-center">
            Tokokami
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-center mt-2">
            Operational management system for your business
          </p>
        </div>
        <Outlet />
      </div>
    </div>
  );
};

export default AuthLayout;