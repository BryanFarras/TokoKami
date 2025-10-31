import React from 'react';
import { Link } from 'react-router-dom';
import { Coffee, Home } from 'lucide-react';

const NotFound = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-900 px-4">
      <div className="text-center">
        <div className="flex justify-center mb-6">
          <div className="h-24 w-24 bg-blue-600 rounded-full flex items-center justify-center">
            <Coffee className="h-14 w-14 text-white" />
          </div>
        </div>
        
        <h1 className="text-6xl font-bold text-gray-900 dark:text-white mb-4">404</h1>
        <p className="text-2xl font-medium text-gray-700 dark:text-gray-300 mb-6">Page not found</p>
        <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-md mx-auto">
          The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
        </p>
        
        <Link
          to="/dashboard"
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <Home className="h-5 w-5 mr-2" />
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
};

export default NotFound;