import React, { useState } from 'react';
import { useInventory, Purchase, PurchaseItem } from '../context/InventoryContext';
import { 
  Plus, Search, Filter, Edit, Trash2, X, Save, Loader2,
  ArrowUp, ArrowDown, DollarSign, Calendar
} from 'lucide-react';
import toast from 'react-hot-toast';

type SortField = 'date' | 'supplier' | 'totalAmount';
type SortDirection = 'asc' | 'desc';

const Purchases = () => {
  const { purchases, rawMaterials, loading, addPurchase } = useInventory();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSupplier, setSelectedSupplier] = useState<string | null>(null);
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    supplier: '',
    items: [] as PurchaseItem[],
    notes: ''
  });
  
  // Get unique suppliers for filtering
  const suppliers = ['All', ...Array.from(new Set(purchases.map(purchase => purchase.supplier)))];
  
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };
  
  const getSortedPurchases = () => {
    return [...purchases]
      .filter(purchase => {
        const matchesSearch = purchase.supplier.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesSupplier = selectedSupplier === null || selectedSupplier === 'All' || purchase.supplier === selectedSupplier;
        return matchesSearch && matchesSupplier;
      })
      .sort((a, b) => {
        if (sortField === 'date') {
          return sortDirection === 'asc' 
            ? new Date(a.date).getTime() - new Date(b.date).getTime()
            : new Date(b.date).getTime() - new Date(a.date).getTime();
        } else if (sortField === 'supplier') {
          return sortDirection === 'asc' 
            ? a.supplier.localeCompare(b.supplier)
            : b.supplier.localeCompare(a.supplier);
        } else if (sortField === 'totalAmount') {
          return sortDirection === 'asc' 
            ? a.totalAmount - b.totalAmount
            : b.totalAmount - a.totalAmount;
        }
        return 0;
      });
  };
  
  const handleAddPurchase = () => {
    setFormData({
      date: new Date().toISOString().split('T')[0],
      supplier: '',
      items: [],
      notes: ''
    });
    setIsModalOpen(true);
  };
  
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleAddItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [
        ...prev.items,
        {
          rawMaterialId: rawMaterials[0]?.id || '',
          quantity: 0,
          unitCost: 0,
          total: 0
        }
      ]
    }));
  };
  
  const handleRemoveItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };
  
  const handleItemChange = (index: number, field: keyof PurchaseItem, value: string | number) => {
    setFormData(prev => {
      const newItems = [...prev.items];
      const item = { ...newItems[index] };
      
      if (field === 'rawMaterialId') {
        item.rawMaterialId = value as string;
      } else if (field === 'quantity' || field === 'unitCost') {
        const numValue = parseFloat(value as string) || 0;
        item[field] = numValue;
        item.total = item.quantity * item.unitCost;
      }
      
      newItems[index] = item;
      return {
        ...prev,
        items: newItems
      };
    });
  };
  
  const calculateTotal = () => {
    return formData.items.reduce((sum, item) => sum + item.total, 0);
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Validation
      if (!formData.supplier.trim()) {
        throw new Error('Supplier is required');
      }
      
      if (formData.items.length === 0) {
        throw new Error('At least one item is required');
      }
      
      for (const item of formData.items) {
        if (item.quantity <= 0) {
          throw new Error('Quantity must be greater than 0');
        }
        if (item.unitCost <= 0) {
          throw new Error('Unit cost must be greater than 0');
        }
      }
      
      await addPurchase({
        date: formData.date,
        supplier: formData.supplier,
        items: formData.items,
        totalAmount: calculateTotal(),
        notes: formData.notes || undefined
      });
      
      toast.success('Purchase recorded successfully');
      setIsModalOpen(false);
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error('An error occurred');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold">Purchases</h1>
        <button
          onClick={handleAddPurchase}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <Plus className="h-4 w-4 mr-2" />
          Record Purchase
        </button>
      </div>
      
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search by supplier..."
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="flex-none">
              <div className="relative inline-block w-full md:w-auto">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Filter className="h-5 w-5 text-gray-400" />
                </div>
                <select
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  value={selectedSupplier || 'All'}
                  onChange={(e) => setSelectedSupplier(e.target.value === 'All' ? null : e.target.value)}
                >
                  {suppliers.map((supplier) => (
                    <option key={supplier} value={supplier}>
                      {supplier}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('date')}
                >
                  <div className="flex items-center">
                    Date
                    {sortField === 'date' && (
                      sortDirection === 'asc' ? <ArrowUp className="h-4 w-4 ml-1" /> : <ArrowDown className="h-4 w-4 ml-1" />
                    )}
                  </div>
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('supplier')}
                >
                  <div className="flex items-center">
                    Supplier
                    {sortField === 'supplier' && (
                      sortDirection === 'asc' ? <ArrowUp className="h-4 w-4 ml-1" /> : <ArrowDown className="h-4 w-4 ml-1" />
                    )}
                  </div>
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Items
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('totalAmount')}
                >
                  <div className="flex items-center">
                    Total Amount
                    {sortField === 'totalAmount' && (
                      sortDirection === 'asc' ? <ArrowUp className="h-4 w-4 ml-1" /> : <ArrowDown className="h-4 w-4 ml-1" />
                    )}
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-center">
                    <Loader2 className="h-8 w-8 mx-auto text-blue-500 animate-spin" />
                  </td>
                </tr>
              ) : getSortedPurchases().length > 0 ? (
                getSortedPurchases().map((purchase) => (
                  <tr key={purchase.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                          <Calendar className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {new Date(purchase.date).toLocaleDateString()}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {new Date(purchase.date).toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">{purchase.supplier}</div>
                      {purchase.notes && (
                        <div className="text-sm text-gray-500 dark:text-gray-400">{purchase.notes}</div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {purchase.items.map((item, index) => {
                          const material = rawMaterials.find(m => m.id === item.rawMaterialId);
                          return (
                            <div key={index} className="mb-1">
                              {material?.name}: {item.quantity} {material?.unit} @ ${item.unitCost.toFixed(3)}
                            </div>
                          );
                        })}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        ${purchase.totalAmount.toFixed(2)}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                    No purchases found matching your search
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Purchase Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 dark:bg-gray-900 opacity-75"></div>
            </div>
            
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            
            <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Record Purchase
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              
              <form onSubmit={handleSubmit}>
                <div className="px-6 py-4">
                  <div className="grid grid-cols-1 gap-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Date
                        </label>
                        <input
                          type="date"
                          id="date"
                          name="date"
                          value={formData.date}
                          onChange={handleFormChange}
                          className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                          required
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="supplier" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Supplier
                        </label>
                        <input
                          type="text"
                          id="supplier"
                          name="supplier"
                          value={formData.supplier}
                          onChange={handleFormChange}
                          className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                          required
                        />
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Items
                        </label>
                        <button
                          type="button"
                          onClick={handleAddItem}
                          className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 dark:text-blue-400 dark:bg-blue-900/30 dark:hover:bg-blue-900/50"
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Add Item
                        </button>
                      </div>
                      
                      <div className="border border-gray-200 dark:border-gray-700 rounded-md p-3 space-y-3 max-h-60 overflow-y-auto">
                        {formData.items.length > 0 ? (
                          formData.items.map((item, index) => (
                            <div key={index} className="grid grid-cols-12 gap-2 items-start">
                              <div className="col-span-5">
                                <select
                                  value={item.rawMaterialId}
                                  onChange={(e) => handleItemChange(index, 'rawMaterialId', e.target.value)}
                                  className="block w-full py-1.5 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                >
                                  {rawMaterials.map((material) => (
                                    <option key={material.id} value={material.id}>
                                      {material.name} ({material.unit})
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <div className="col-span-3">
                                <input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={item.quantity}
                                  onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                                  className="block w-full py-1.5 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                  placeholder="Qty"
                                />
                              </div>
                              <div className="col-span-3">
                                <div className="relative">
                                  <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                                    <span className="text-gray-500 dark:text-gray-400 sm:text-sm">$</span>
                                  </div>
                                  <input
                                    type="number"
                                    min="0"
                                    step="0.001"
                                    value={item.unitCost}
                                    onChange={(e) => handleItemChange(index, 'unitCost', e.target.value)}
                                    className="block w-full pl-5 pr-2 py-1.5 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    placeholder="Cost"
                                  />
                                </div>
                              </div>
                              <div className="col-span-1">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveItem(index)}
                                  className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                                >
                                  <Trash2 className="h-5 w-5" />
                                </button>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-3 text-gray-500 dark:text-gray-400">
                            No items added yet
                          </div>
                        )}
                      </div>
                      
                      {formData.items.length > 0 && (
                        <div className="mt-2 text-right text-sm font-medium text-gray-700 dark:text-gray-300">
                          Total: ${calculateTotal().toFixed(2)}
                        </div>
                      )}
                    </div>
                    
                    <div>
                      <label htmlFor="notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Notes (Optional)
                      </label>
                      <textarea
                        id="notes"
                        name="notes"
                        rows={3}
                        value={formData.notes}
                        onChange={handleFormChange}
                        className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      ></textarea>
                    </div>
                  </div>
                </div>
                
                <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700 flex flex-row-reverse">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex justify-center items-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 ml-3"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Record Purchase
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Purchases;