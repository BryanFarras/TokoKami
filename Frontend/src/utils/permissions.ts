// Role definitions
export type UserRole = 'admin' | 'cashier';

// Define which routes each role can access
export const rolePermissions: Record<UserRole, string[]> = {
  admin: [
    '/dashboard',
    '/dashboard/products',
    '/dashboard/pos',
    '/dashboard/reports',
    '/dashboard/raw-materials',
    '/dashboard/purchases',
    '/dashboard/settings',
  ],
  cashier: [
    '/dashboard',
    '/dashboard/products',
    '/dashboard/pos',
    '/dashboard/settings',
  ],
};

// Helper function to check if user can access a route
export const canAccessRoute = (role: UserRole | undefined, path: string): boolean => {
  if (!role) return false;
  
  const permissions = rolePermissions[role];
  if (!permissions) return false;
  
  // Check if the path is in the allowed routes
  return permissions.includes(path);
};

// Helper function to get allowed navigation items for a role
export const getAllowedNavItems = (role: UserRole | undefined) => {
  if (!role) return [];
  
  const routeMap: Record<string, string> = {
    '/dashboard': 'Dashboard',
    '/dashboard/products': 'Products',
    '/dashboard/pos': 'Point of Sale',
    '/dashboard/reports': 'Reports',
    '/dashboard/raw-materials': 'Raw Materials',
    '/dashboard/purchases': 'Purchases',
    '/dashboard/settings': 'Settings',
  };
  
  const permissions = rolePermissions[role];
  return permissions.map(route => routeMap[route]).filter(Boolean);
};
