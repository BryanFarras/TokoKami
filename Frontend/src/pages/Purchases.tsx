import React, { useState, useEffect } from 'react';
import { useInventory } from '../context/InventoryContext';
import { api } from '../api';
import { 
  Plus, Search, Filter, Edit, Trash2, X, Save, Loader2,
  ArrowUp, ArrowDown, DollarSign, Calendar, ArrowDownRight
} from 'lucide-react';
import toast from 'react-hot-toast';
import { formatCurrency } from "../utils/currency";

type PurchaseItem = {
  rawMaterialId: string;
  quantity: number;
  unitCost: number;
  total: number;
  [key: string]: any;
};

type Purchase = {
  id?: string;
  date: string;
  supplier: string;
  items: PurchaseItem[];
  totalAmount: number;
  notes?: string;
  [key: string]: any;
};

const Purchases = () => {
  const { rawMaterials, loading: inventoryLoading, addPurchase } = useInventory();
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSupplier, setSelectedSupplier] = useState<string | null>(null);
  const [sortField, setSortField] = useState<'date' | 'supplier' | 'totalAmount'>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState<Purchase>({
    date: new Date().toISOString().split('T')[0],
    supplier: '',
    items: [],
    totalAmount: 0,
    notes: ''
  });

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await api<any[]>('/purchases');
        setPurchases((data || []).map(d => ({
          id: d.id,
          date: d.date ?? d.created_at ?? new Date().toISOString(),
          supplier: d.supplier ?? '',
          items: (d.items || d.line_items || []).map((it: any) => ({
            rawMaterialId: it.raw_material_id ?? it.rawMaterialId ?? it.id,
            quantity: Number(it.quantity ?? 0),
            unitCost: Number(it.unit_cost ?? it.unitCost ?? it.cost ?? 0),
            total: Number(it.total ?? it.quantity * (it.unit_cost ?? it.unitCost ?? 0)),
          })),
          // Pastikan mengambil totalAmount atau total
          totalAmount: Number(d.totalAmount ?? d.total ?? 0),
          notes: d.notes ?? d.comment ?? '',
        })));
      } catch (err) {
        console.error(err);
        toast.error('Failed to load purchases');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [addPurchase]); // Tambahkan addPurchase ke dependency array jika diperlukan

  const suppliers = ['All', ...Array.from(new Set(purchases.map(p => p.supplier).filter(Boolean)))];

  const handleAddPurchase = () => {
    setFormData({
      date: new Date().toISOString().split('T')[0],
      supplier: '',
      items: [],
      totalAmount: 0,
      notes: ''
    });
    setIsModalOpen(true);
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddItem = () => {
    // Pastikan ada materialID default
    const defaultMaterialId = rawMaterials.length > 0 ? rawMaterials[0].id : '';
    
    setFormData(prev => {
        const newItems = [...prev.items, { rawMaterialId: defaultMaterialId, quantity: 1, unitCost: 0, total: 0 }];
        // Di sini kita TIDAK perlu menghitung total lagi, karena akan dilakukan di handleItemChange berikutnya 
        // atau jika user langsung klik submit.
        return { ...prev, items: newItems };
    });
  };

  const handleRemoveItem = (index: number) => {
    setFormData(prev => {
        const newItems = prev.items.filter((_, i) => i !== index);
        const newTotalAmount = newItems.reduce((sum, item) => sum + (item.total || 0), 0);
        return { 
            ...prev, 
            items: newItems,
            totalAmount: newTotalAmount 
        };
    });
  };

  // --- FUNGSI PERBAIKAN UTAMA DI SINI ---
  const handleItemChange = (index: number, field: keyof PurchaseItem, value: string | number) => {
    setFormData(prev => {
        const newItems = [...prev.items];
        let item = { ...newItems[index] };
        
        let currentQuantity = item.quantity;
        let currentUnitCost = item.unitCost;

        if (field === 'rawMaterialId') {
            item.rawMaterialId = String(value);
        } else if (field === 'quantity' || field === 'unitCost') {
            const num = parseFloat(String(value)) || 0;
            
            // Perbarui nilai item yang spesifik
            item = { ...item, [field]: num };

            // Ambil nilai yang sudah diperbarui
            currentQuantity = field === 'quantity' ? num : item.quantity;
            currentUnitCost = field === 'unitCost' ? num : item.unitCost;
            
            // Hitung total item yang diperbarui
            item.total = currentQuantity * currentUnitCost;
        }
        
        newItems[index] = item;

        // Hitung Ulang Total Jumlah Pembelian dari SEMUA item
        const newTotalAmount = newItems.reduce((sum, currentItem) => sum + (currentItem.total || 0), 0);
        
        // Perbarui state formData, termasuk totalAmount
        return { 
            ...prev, 
            items: newItems,
            totalAmount: newTotalAmount 
        };
    });
  };

  // Kita bisa hapus fungsi calculateTotal karena sekarang totalAmount ada di state formData
  // const calculateTotal = () => formData.items.reduce((sum, item) => sum + (item.total || 0), 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      // Validasi
      if (!formData.supplier.trim()) throw new Error('Supplier is required');
      if (formData.items.length === 0) throw new Error('At least one item is required');
      for (const item of formData.items) {
        if (item.quantity <= 0) throw new Error('Quantity must be > 0');
        if (item.unitCost <= 0) throw new Error('Unit cost must be > 0');
      }

      // Pastikan totalAmount diambil dari state yang sudah diperbarui (formData.totalAmount)
      const payload = {
        date: formData.date,
        supplier: formData.supplier,
        items: formData.items.map(it => ({
          raw_material_id: it.rawMaterialId,
          quantity: it.quantity,
          unit_cost: it.unitCost,
          total: it.total
        })),
        // GUNAKAN TOTAL AMOUNT DARI STATE (SUDAH DIHITUNG DI handleItemChange)
        totalAmount: formData.totalAmount, 
        notes: formData.notes || undefined
      };

      if (typeof addPurchase === 'function') {
        await addPurchase(payload as any);
      } else {
        await api('/purchases', { method: 'POST', body: payload });
      }

      toast.success('Purchase recorded successfully');
      setIsModalOpen(false);
      // reload purchases
      const data = await api<any[]>('/purchases');
      setPurchases((data || []).map(d => ({
        id: d.id,
        date: d.date ?? d.created_at ?? new Date().toISOString(),
        supplier: d.supplier ?? '',
        items: (d.items || d.line_items || []).map((it: any) => ({
          rawMaterialId: it.raw_material_id ?? it.rawMaterialId ?? it.id,
          quantity: Number(it.quantity ?? 0),
          unitCost: Number(it.unit_cost ?? it.unitCost ?? it.cost ?? 0),
          total: Number(it.total ?? it.quantity * (it.unit_cost ?? it.unitCost ?? 0)),
        })),
        totalAmount: Number(d.totalAmount ?? d.total ?? 0), // Memuat totalAmount yang benar
        notes: d.notes ?? d.comment ?? '',
      })));
    } catch (error: any) {
      // Tangkap error dari validasi atau API
      toast.error(error?.message ?? 'An error occurred during submission');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ... (handleSort dan getSortedPurchases tidak perlu diubah)
  const handleSort = (field: 'date' | 'supplier' | 'totalAmount') => {
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
              {loading || inventoryLoading ? (
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
                              {material?.name}: {item.quantity} {material?.unit} @ {formatCurrency(item.unitCost)}
                            </div>
                          );
                        })}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {formatCurrency(purchase.totalAmount)}
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
                                    <span className="text-gray-500 dark:text-gray-400 sm:text-sm">Rp</span>
                                  </div>
                                  <input
                                    type="number"
                                    min="0"
                                    step="0.001"
                                    value={item.unitCost}
                                    onChange={(e) => handleItemChange(index, 'unitCost', e.target.value)}
                                    className="block w-full pl-8 pr-2 py-1.5 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
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
                          Total: {formatCurrency(formData.totalAmount)}
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