import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../hooks/useTheme';
import { User, Moon, Sun, LogOut } from 'lucide-react';

const Settings = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Settings</h1>
      
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg divide-y divide-gray-200 dark:divide-gray-700">
        {/* Profile Section */}
        <div className="p-6">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Profile</h2>
          <div className="flex items-center">
            <div className="h-16 w-16 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
              <User className="h-8 w-8 text-gray-500 dark:text-gray-400" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">{user?.name}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">{user?.email}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">{user?.role}</p>
            </div>
          </div>
        </div>
        
        {/* Appearance Section */}
        <div className="p-6">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Appearance</h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-700 dark:text-gray-300">Dark Mode</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Switch between light and dark themes
              </p>
            </div>
            <button
              onClick={toggleTheme}
              className="p-2 rounded-md text-gray-500 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-700"
            >
              {theme === 'dark' ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>
        
        {/* Account Section */}
        <div className="p-6">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Account</h2>
          <button
            onClick={logout}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;