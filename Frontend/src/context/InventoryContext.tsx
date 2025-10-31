import React, { createContext, useContext, useState, useEffect } from 'react';

export interface RawMaterial {
  id: string;
  name: string;
  unit: string;
  stock: number;
  unitCost: number;
  supplier: string;
  createdAt: string;
  updatedAt: string;
}

export interface Purchase {
  id: string;
  date: string;
  supplier: string;
  items: PurchaseItem[];
  totalAmount: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PurchaseItem {
  rawMaterialId: string;
  quantity: number;
  unitCost: number;
  total: number;
}

interface InventoryContextType {
  rawMaterials: RawMaterial[];
  purchases: Purchase[];
  loading: boolean;
  error: string | null;
  addRawMaterial: (material: Omit<RawMaterial, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateRawMaterial: (id: string, material: Partial<RawMaterial>) => Promise<void>;
  deleteRawMaterial: (id: string) => Promise<void>;
  getRawMaterial: (id: string) => RawMaterial | undefined;
  updateRawMaterialStock: (id: string, quantity: number) => Promise<void>;
  addPurchase: (purchase: Omit<Purchase, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

export const useInventory = () => {
  const context = useContext(InventoryContext);
  if (context === undefined) {
    throw new Error('useInventory must be used within an InventoryProvider');
  }
  return context;
};

// Sample data
const initialRawMaterials: RawMaterial[] = [
  {
    id: '1',
    name: 'Coffee Beans',
    unit: 'g',
    stock: 5000,
    unitCost: 0.05,
    supplier: 'Coffee Supplier Inc.',
    createdAt: '2023-01-01T00:00:00.000Z',
    updatedAt: '2023-01-01T00:00:00.000Z',
  },
  {
    id: '2',
    name: 'Water',
    unit: 'ml',
    stock: 50000,
    unitCost: 0.001,
    supplier: 'Local Water Supply',
    createdAt: '2023-01-01T00:00:00.000Z',
    updatedAt: '2023-01-01T00:00:00.000Z',
  },
  {
    id: '3',
    name: 'Milk',
    unit: 'ml',
    stock: 10000,
    unitCost: 0.003,
    supplier: 'Dairy Farm Inc.',
    createdAt: '2023-01-01T00:00:00.000Z',
    updatedAt: '2023-01-01T00:00:00.000Z',
  },
  {
    id: '4',
    name: 'Tea Leaves',
    unit: 'g',
    stock: 2000,
    unitCost: 0.04,
    supplier: 'Tea Supplier Co.',
    createdAt: '2023-01-01T00:00:00.000Z',
    updatedAt: '2023-01-01T00:00:00.000Z',
  },
  {
    id: '5',
    name: 'Sugar',
    unit: 'g',
    stock: 8000,
    unitCost: 0.002,
    supplier: 'Sweet Inc.',
    createdAt: '2023-01-01T00:00:00.000Z',
    updatedAt: '2023-01-01T00:00:00.000Z',
  },
  {
    id: '6',
    name: 'Ice',
    unit: 'g',
    stock: 15000,
    unitCost: 0.001,
    supplier: 'Local Ice Supply',
    createdAt: '2023-01-01T00:00:00.000Z',
    updatedAt: '2023-01-01T00:00:00.000Z',
  },
];

const initialPurchases: Purchase[] = [
  {
    id: '1',
    date: '2023-01-05T00:00:00.000Z',
    supplier: 'Coffee Supplier Inc.',
    items: [
      {
        rawMaterialId: '1',
        quantity: 2000,
        unitCost: 0.05,
        total: 100,
      },
    ],
    totalAmount: 100,
    notes: 'Monthly coffee beans supply',
    createdAt: '2023-01-05T00:00:00.000Z',
    updatedAt: '2023-01-05T00:00:00.000Z',
  },
  {
    id: '2',
    date: '2023-01-10T00:00:00.000Z',
    supplier: 'Dairy Farm Inc.',
    items: [
      {
        rawMaterialId: '3',
        quantity: 5000,
        unitCost: 0.003,
        total: 15,
      },
    ],
    totalAmount: 15,
    notes: 'Weekly milk supply',
    createdAt: '2023-01-10T00:00:00.000Z',
    updatedAt: '2023-01-10T00:00:00.000Z',
  },
];

interface InventoryProviderProps {
  children: React.ReactNode;
}

export const InventoryProvider: React.FC<InventoryProviderProps> = ({ children }) => {
  const [rawMaterials, setRawMaterials] = useState<RawMaterial[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInventory = async () => {
      setLoading(true);
      try {
        // In a real app, this would be an API call
        // For demo, we'll use the sample data or localStorage
        const savedRawMaterials = localStorage.getItem('rawMaterials');
        const savedPurchases = localStorage.getItem('purchases');
        
        if (savedRawMaterials) {
          setRawMaterials(JSON.parse(savedRawMaterials));
        } else {
          setRawMaterials(initialRawMaterials);
          localStorage.setItem('rawMaterials', JSON.stringify(initialRawMaterials));
        }
        
        if (savedPurchases) {
          setPurchases(JSON.parse(savedPurchases));
        } else {
          setPurchases(initialPurchases);
          localStorage.setItem('purchases', JSON.stringify(initialPurchases));
        }
      } catch (err) {
        setError('Failed to fetch inventory data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchInventory();
  }, []);

  const addRawMaterial = async (material: Omit<RawMaterial, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const newMaterial: RawMaterial = {
        ...material,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const updatedMaterials = [...rawMaterials, newMaterial];
      setRawMaterials(updatedMaterials);
      localStorage.setItem('rawMaterials', JSON.stringify(updatedMaterials));
    } catch (err) {
      setError('Failed to add raw material');
      throw err;
    }
  };

  const updateRawMaterial = async (id: string, materialData: Partial<RawMaterial>) => {
    try {
      const updatedMaterials = rawMaterials.map(material => 
        material.id === id 
          ? { 
              ...material, 
              ...materialData, 
              updatedAt: new Date().toISOString() 
            } 
          : material
      );
      
      setRawMaterials(updatedMaterials);
      localStorage.setItem('rawMaterials', JSON.stringify(updatedMaterials));
    } catch (err) {
      setError('Failed to update raw material');
      throw err;
    }
  };

  const deleteRawMaterial = async (id: string) => {
    try {
      const updatedMaterials = rawMaterials.filter(material => material.id !== id);
      setRawMaterials(updatedMaterials);
      localStorage.setItem('rawMaterials', JSON.stringify(updatedMaterials));
    } catch (err) {
      setError('Failed to delete raw material');
      throw err;
    }
  };

  const getRawMaterial = (id: string) => {
    return rawMaterials.find(material => material.id === id);
  };

  const updateRawMaterialStock = async (id: string, quantity: number) => {
    try {
      const material = rawMaterials.find(m => m.id === id);
      if (!material) {
        throw new Error('Raw material not found');
      }

      const newStock = material.stock - quantity;
      if (newStock < 0) {
        throw new Error('Insufficient stock for raw material: ' + material.name);
      }

      await updateRawMaterial(id, { stock: newStock });
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to update raw material stock');
      }
      throw err;
    }
  };

  const addPurchase = async (purchase: Omit<Purchase, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const newPurchase: Purchase = {
        ...purchase,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Update raw material stocks based on purchase items
      for (const item of purchase.items) {
        const material = rawMaterials.find(m => m.id === item.rawMaterialId);
        if (material) {
          await updateRawMaterial(item.rawMaterialId, {
            stock: material.stock + item.quantity,
            unitCost: item.unitCost, // Update cost with latest purchase price
          });
        }
      }

      const updatedPurchases = [...purchases, newPurchase];
      setPurchases(updatedPurchases);
      localStorage.setItem('purchases', JSON.stringify(updatedPurchases));
    } catch (err) {
      setError('Failed to add purchase');
      throw err;
    }
  };

  return (
    <InventoryContext.Provider 
      value={{ 
        rawMaterials, 
        purchases,
        loading, 
        error, 
        addRawMaterial, 
        updateRawMaterial, 
        deleteRawMaterial, 
        getRawMaterial,
        updateRawMaterialStock,
        addPurchase
      }}
    >
      {children}
    </InventoryContext.Provider>
  );
};