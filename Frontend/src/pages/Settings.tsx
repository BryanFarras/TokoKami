import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../hooks/useTheme';
import { 
  User, Moon, Sun, LogOut, Mail, ShieldCheck, 
  CheckCircle2, Sparkles, Monitor
} from 'lucide-react';

const Settings = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  // Helper untuk inisial nama
  const getInitials = (name: string) => {
    return name 
      ? name.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase() 
      : 'U';
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            Settings
          </h1>
          <p className="mt-2 text-gray-500 dark:text-gray-400">
            Manage your account preferences and workspace appearance.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* --- LEFT COLUMN: PROFILE CARD (Real Data) --- */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden h-full flex flex-col transition-all hover:shadow-md">
            
            {/* Artistic Header Pattern (CSS only, no external image) */}
            <div className="h-40 bg-gradient-to-br from-indigo-600 via-blue-600 to-blue-500 relative overflow-hidden">
               <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[radial-gradient(circle_at_1px_1px,#fff_1px,transparent_0)] [background-size:20px_20px]"></div>
               <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
            </div>

            <div className="px-8 pb-8 flex-1 relative">
              {/* Avatar yang menumpuk di atas banner */}
              <div className="-mt-14 mb-6 flex justify-between items-end">
                <div className="p-1.5 bg-white dark:bg-gray-800 rounded-2xl shadow-lg">
                  <div className="h-28 w-28 bg-gray-100 dark:bg-gray-700 rounded-xl flex items-center justify-center text-4xl font-bold text-gray-400 dark:text-gray-500 border border-gray-200 dark:border-gray-600">
                    {user?.name ? getInitials(user.name) : <User className="h-12 w-12" />}
                  </div>
                </div>
                
                {/* Role Badge (Real Data) */}
                <div className="mb-2 hidden sm:block">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-100 dark:border-blue-800">
                    <ShieldCheck className="w-3 h-3 mr-1.5" />
                    {user?.role ? user.role.toUpperCase() : 'USER'}
                  </span>
                </div>
              </div>

              {/* User Info */}
              <div className="space-y-4">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                    {user?.name || 'Guest User'}
                  </h2>
                  <div className="flex items-center text-gray-500 dark:text-gray-400 mt-1">
                    <Mail className="w-4 h-4 mr-2" />
                    <span>{user?.email || 'No email provided'}</span>
                  </div>
                </div>

                {/* Info Grid (Visual only, using real context data implied) */}
                <div className="grid grid-cols-2 gap-4 pt-6 mt-6 border-t border-gray-100 dark:border-gray-700">
                   <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-700/30 border border-gray-100 dark:border-gray-700">
                      <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Account Type</p>
                      <p className="font-medium text-gray-900 dark:text-white mt-1 capitalize">{user?.role || 'Standard'}</p>
                   </div>
                   <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-700/30 border border-gray-100 dark:border-gray-700">
                      <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Status</p>
                      <div className="flex items-center mt-1">
                        <div className="h-2 w-2 rounded-full bg-green-500 mr-2 animate-pulse"></div>
                        <p className="font-medium text-gray-900 dark:text-white">Active</p>
                      </div>
                   </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* --- RIGHT COLUMN: ACTIONS --- */}
        <div className="space-y-8 flex flex-col">
          
          {/* 1. Appearance / Theme */}
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 flex-1">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-300 rounded-lg">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Appearance</h3>
                <p className="text-xs text-gray-500">Customize UI theme</p>
              </div>
            </div>

            <div className="space-y-3">
              {/* Light Option */}
              <button
                onClick={() => theme === 'dark' && toggleTheme()}
                className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all duration-200 group ${
                  theme !== 'dark' 
                    ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-900/10' 
                    : 'border-gray-100 dark:border-gray-700 hover:border-blue-300 dark:hover:border-gray-600'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full ${theme !== 'dark' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500 dark:bg-gray-700'}`}>
                    <Sun className="h-5 w-5" />
                  </div>
                  <span className={`font-semibold ${theme !== 'dark' ? 'text-blue-900 dark:text-blue-100' : 'text-gray-600 dark:text-gray-300'}`}>
                    Light Mode
                  </span>
                </div>
                {theme !== 'dark' && <CheckCircle2 className="h-5 w-5 text-blue-600" />}
              </button>

              {/* Dark Option */}
              <button
                onClick={() => theme !== 'dark' && toggleTheme()}
                className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all duration-200 group ${
                  theme === 'dark' 
                    ? 'border-blue-500 bg-gray-700' 
                    : 'border-gray-100 dark:border-gray-700 hover:border-blue-300 dark:hover:border-gray-600'
                }`}
              >
                <div className="flex items-center gap-3">
                   <div className={`p-2 rounded-full ${theme === 'dark' ? 'bg-blue-500/20 text-blue-300' : 'bg-gray-100 text-gray-500 dark:bg-gray-700'}`}>
                    <Moon className="h-5 w-5" />
                  </div>
                  <span className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-600 dark:text-gray-300'}`}>
                    Dark Mode
                  </span>
                </div>
                {theme === 'dark' && <CheckCircle2 className="h-5 w-5 text-blue-400" />}
              </button>
            </div>
          </div>

          {/* 2. Logout / Danger Zone */}
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
             <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-300 rounded-lg">
                <LogOut className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Session</h3>
                <p className="text-xs text-gray-500">Securely sign out</p>
              </div>
            </div>
            
            <button
              onClick={logout}
              className="w-full py-3 px-4 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/30 text-red-700 dark:text-red-300 font-semibold rounded-xl transition-colors border border-red-100 dark:border-red-900/50 flex items-center justify-center gap-2"
            >
              Sign Out
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Settings;