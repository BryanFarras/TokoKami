import React from 'react';
import Logo from '../../assets/design.svg';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  Coffee, 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  FileText, 
  Box, 
  ShoppingBag, 
  Settings, 
  LogOut,
  X
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  isMobile: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, setIsOpen, isMobile }) => {
  const { logout } = useAuth();

  const navItems = [
    { path: '/dashboard', name: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
    { path: '/dashboard/products', name: 'Products', icon: <Package className="w-5 h-5" /> },
    { path: '/dashboard/pos', name: 'Point of Sale', icon: <ShoppingCart className="w-5 h-5" /> },
    { path: '/dashboard/reports', name: 'Reports', icon: <FileText className="w-5 h-5" /> },
    { path: '/dashboard/raw-materials', name: 'Raw Materials', icon: <Box className="w-5 h-5" /> },
    { path: '/dashboard/purchases', name: 'Purchases', icon: <ShoppingBag className="w-5 h-5" /> },
    { path: '/dashboard/settings', name: 'Settings', icon: <Settings className="w-5 h-5" /> },
  ];

  const handleLogout = () => {
    logout();
  };

  const handleCloseSidebar = () => {
    if (isMobile) {
      setIsOpen(false);
    }
  };

  return (
    <>
      {/* Overlay */}
      {isMobile && isOpen && (
        <div 
          className="fixed inset-0 z-20 bg-black bg-opacity-50 transition-opacity"
          onClick={() => setIsOpen(false)}
        ></div>
      )}

      {/* Sidebar */}
      <aside 
        className={`
          ${isOpen ? 'translate-x-0' : '-translate-x-full'} 
          ${isMobile ? 'fixed inset-y-0 left-0 z-30' : 'relative'}
          w-64 h-screen bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700
          transition-transform duration-300 ease-in-out
        `}
      >
        <div className="flex flex-col h-full">
          {/* Logo and close button */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <img src={Logo} alt="Logo" className="h-14 w-14" />
              <span className="ml-3 text-xl font-bold text-gray-900 dark:text-white">Tokokami</span>
            </div>
            {isMobile && (
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
              >
                <X className="h-6 w-6" />
              </button>
            )}
          </div>

          {/* Navigation links */}
          <nav className="flex-1 px-2 py-4 overflow-y-auto">
            <ul className="space-y-1">
              {navItems.map((item) => (
                <li key={item.path}>
                  <NavLink
                    to={item.path}
                    onClick={handleCloseSidebar}
                    className={({ isActive }) => `
                      flex items-center px-4 py-3 text-gray-700 dark:text-gray-300 rounded-md
                      ${isActive 
                        ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-200' 
                        : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                      }
                    `}
                  >
                    {item.icon}
                    <span className="ml-3">{item.name}</span>
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>

          {/* Logout button */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={handleLogout}
              className="flex items-center w-full px-4 py-3 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <LogOut className="w-5 h-5" />
              <span className="ml-3">Logout</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;