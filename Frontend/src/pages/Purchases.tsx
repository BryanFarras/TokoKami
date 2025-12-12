import React, { useState, useEffect } from 'react';
import { useInventory } from '../context/InventoryContext';
import { api } from '../api';
import { 
  Plus, Search, Filter, Edit, Trash2, X, Save, Loader2,
  ArrowUp, ArrowDown, DollarSign, Calendar, Package, TrendingUp, Store
} from 'lucide-react';
import toast from 'react-hot-toast';
import { formatCurrency } from "../utils/currency";

// --- Types (Sama seperti sebelumnya) ---
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

// --- Sub-Component untuk Kartu Ringkasan (Modern Touch) ---
const StatCard = ({ title, value, icon: Icon, color }: { title: string, value: string, icon: any, color: string }) => (
  <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow duration-200">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
        <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
      </div>
      <div className={`p-3 rounded-lg ${color} bg-opacity-10`}>
        <Icon className={`h-6 w-6 ${color.replace('bg-', 'text-')}`} />
      </div>
    </div>
  </div>
);

const Purchases = () => {
  const { rawMaterials, loading: inventoryLoading, addPurchase } = useInventory();
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(false);

  // States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSupplier, setSelectedSupplier] = useState<string | null>(null);
  const [sortField, setSortField] = useState<'date' | 'supplier' | 'totalAmount'>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState<Purchase>({
    date: new Date().toISOString().split('T')[0],
    supplier: '',
    items: [],
    totalAmount: 0,
    notes: ''
  });

  // --- Logic Load Data (Sama) ---
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
          totalAmount: Number(d.total_amount ?? d.totalAmount ?? d.total ?? 0),
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
  }, [addPurchase]);

  const suppliers = ['All', ...Array.from(new Set(purchases.map(p => p.supplier).filter(Boolean)))];

  // --- Logic Handlers (Sama persis agar fungsi tidak rusak) ---
  const handleAddPurchase = () => {
    setFormData({ date: new Date().toISOString().split('T')[0], supplier: '', items: [], totalAmount: 0, notes: '' });
    setIsModalOpen(true);
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddItem = () => {
    const defaultMaterialId = rawMaterials.length > 0 ? rawMaterials[0].id : '';
    setFormData(prev => ({ ...prev, items: [...prev.items, { rawMaterialId: defaultMaterialId, quantity: 1, unitCost: 0, total: 0 }] }));
  };

  const handleRemoveItem = (index: number) => {
    setFormData(prev => {
        const newItems = prev.items.filter((_, i) => i !== index);
        const newTotalAmount = newItems.reduce((sum, item) => sum + (item.total || 0), 0);
        return { ...prev, items: newItems, totalAmount: newTotalAmount };
    });
  };

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
            item = { ...item, [field]: num };
            currentQuantity = field === 'quantity' ? num : item.quantity;
            currentUnitCost = field === 'unitCost' ? num : item.unitCost;
            item.total = currentQuantity * currentUnitCost;
        }
        newItems[index] = item;
        const newTotalAmount = newItems.reduce((sum, currentItem) => sum + (currentItem.total || 0), 0);
        return { ...prev, items: newItems, totalAmount: newTotalAmount };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (!formData.supplier.trim()) throw new Error('Supplier is required');
      if (formData.items.length === 0) throw new Error('At least one item is required');
      
      const payload = {
        date: formData.date,
        supplier: formData.supplier,
        items: formData.items.map(it => ({
          raw_material_id: it.rawMaterialId,
          quantity: it.quantity,
          unit_cost: it.unitCost,
          total: it.total
        })),
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
      
      // Reload logic (simplified for brevity)
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
          totalAmount: Number(d.total_amount ?? d.totalAmount ?? d.total ?? 0),
          notes: d.notes ?? d.comment ?? '',
        })));
    } catch (error: any) {
      toast.error(error?.message ?? 'An error occurred during submission');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSort = (field: 'date' | 'supplier' | 'totalAmount') => {
    if (sortField === field) setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDirection('desc'); }
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
          return sortDirection === 'asc' ? new Date(a.date).getTime() - new Date(b.date).getTime() : new Date(b.date).getTime() - new Date(a.date).getTime();
        } else if (sortField === 'supplier') {
          return sortDirection === 'asc' ? a.supplier.localeCompare(b.supplier) : b.supplier.localeCompare(a.supplier);
        } else if (sortField === 'totalAmount') {
          return sortDirection === 'asc' ? a.totalAmount - b.totalAmount : b.totalAmount - a.totalAmount;
        }
        return 0;
      });
  };

  // --- Perhitungan Summary untuk Dashboard ---
  const totalSpend = purchases.reduce((sum, p) => sum + p.totalAmount, 0);
  const totalTransactions = purchases.length;
  const uniqueSuppliers = new Set(purchases.map(p => p.supplier)).size;

  return (
    <div className="space-y-8 pb-10">
      {/* 1. Header Section dengan Summary Cards */}
      <div className="flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Purchase History</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">Manage and track your raw material procurement.</p>
          </div>
          <button
            onClick={handleAddPurchase}
            className="inline-flex items-center px-5 py-2.5 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 transform hover:scale-[1.02]"
          >
            <Plus className="h-5 w-5 mr-2" />
            Record Purchase
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard 
            title="Total Spending" 
            value={formatCurrency(totalSpend)} 
            icon={DollarSign} 
            color="bg-green-500 text-green-600" 
          />
          <StatCard 
            title="Transactions" 
            value={totalTransactions.toString()} 
            icon={TrendingUp} 
            color="bg-blue-500 text-blue-600" 
          />
          <StatCard 
            title="Active Suppliers" 
            value={uniqueSuppliers.toString()} 
            icon={Store} 
            color="bg-purple-500 text-purple-600" 
          />
        </div>
      </div>
      
      {/* 2. Main Content Area */}
      <div className="bg-white dark:bg-gray-800 shadow-sm rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Toolbar */}
        <div className="p-5 border-b border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
              </div>
              <input
                type="text"
                placeholder="Search by supplier name..."
                className="block w-full pl-10 pr-3 py-2.5 border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="flex-none">
              <div className="relative inline-block w-full md:w-auto">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Filter className="h-4 w-4 text-gray-500" />
                </div>
                <select
                  className="block w-full pl-10 pr-10 py-2.5 border-gray-300 rounded-lg leading-5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white appearance-none cursor-pointer"
                  value={selectedSupplier || 'All'}
                  onChange={(e) => setSelectedSupplier(e.target.value === 'All' ? null : e.target.value)}
                >
                  {suppliers.map((supplier) => (
                    <option key={supplier} value={supplier}>{supplier}</option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <ArrowDown className="h-4 w-4 text-gray-400" />
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                {[
                  { id: 'date', label: 'Date' },
                  { id: 'supplier', label: 'Supplier' },
                  { id: 'items', label: 'Purchased Items', noSort: true },
                  { id: 'totalAmount', label: 'Total Amount' }
                ].map((col) => (
                  <th 
                    key={col.id}
                    scope="col" 
                    className={`px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider ${!col.noSort ? 'cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors' : ''}`}
                    onClick={!col.noSort ? () => handleSort(col.id as any) : undefined}
                  >
                    <div className="flex items-center gap-2">
                      {col.label}
                      {!col.noSort && sortField === col.id && (
                        sortDirection === 'asc' ? <ArrowUp className="h-3 w-3 text-blue-500" /> : <ArrowDown className="h-3 w-3 text-blue-500" />
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
              {loading || inventoryLoading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center">
                    <Loader2 className="h-10 w-10 mx-auto text-blue-500 animate-spin" />
                    <p className="mt-2 text-sm text-gray-500">Loading data...</p>
                  </td>
                </tr>
              ) : getSortedPurchases().length > 0 ? (
                getSortedPurchases().map((purchase) => (
                  <tr key={purchase.id} className="hover:bg-blue-50/50 dark:hover:bg-gray-700/50 transition-colors duration-150 group">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-500">
                          <Calendar className="h-5 w-5" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {new Date(purchase.date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="h-8 w-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 flex items-center justify-center text-xs font-bold mr-3 border border-indigo-200 dark:border-indigo-800">
                           {purchase.supplier.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">{purchase.supplier}</div>
                          {purchase.notes && (
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 italic max-w-xs truncate">{purchase.notes}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        {purchase.items.map((item, index) => {
                          const material = rawMaterials.find(m => m.id === item.rawMaterialId);
                          return (
                            <div key={index} className="text-sm text-gray-600 dark:text-gray-300 flex items-center">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mr-2"></span>
                                <span className="font-medium text-gray-900 dark:text-white mr-1">{material?.name}</span>
                                <span className="text-gray-400 mx-1">×</span>
                                <span>{item.quantity} {material?.unit}</span>
                            </div>
                          );
                        })}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                        {formatCurrency(purchase.totalAmount)}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center">
                    <div className="mx-auto h-12 w-12 text-gray-400">
                       <Search className="h-full w-full" />
                    </div>
                    <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No purchases found</h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Try adjusting your search or filter to find what you're looking for.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* 3. Modernized Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            {/* Backdrop dengan blur effect */}
            <div className="fixed inset-0 bg-gray-900/75 backdrop-blur-sm transition-opacity" aria-hidden="true" onClick={() => setIsModalOpen(false)}></div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            
            <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full border border-gray-100 dark:border-gray-700">
              <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800">
                <div>
                   <h3 className="text-xl font-bold text-gray-900 dark:text-white" id="modal-title">Record New Purchase</h3>
                   <p className="text-sm text-gray-500 mt-1">Enter details of the raw material purchase.</p>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="bg-white dark:bg-gray-700 rounded-full p-2 text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-600 transition-all focus:outline-none"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="date" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Transaction Date
                    </label>
                    <input
                      type="date"
                      id="date"
                      name="date"
                      value={formData.date}
                      onChange={handleFormChange}
                      className="block w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white py-2.5 px-3"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="supplier" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Supplier Name
                    </label>
                    <input
                      type="text"
                      id="supplier"
                      name="supplier"
                      placeholder="e.g. PT. Sentosa Jaya"
                      value={formData.supplier}
                      onChange={handleFormChange}
                      className="block w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white py-2.5 px-3"
                      required
                    />
                  </div>
                </div>
                
                <div className="bg-gray-50 dark:bg-gray-700/30 rounded-xl p-4 border border-gray-200 dark:border-gray-700 border-dashed">
                  <div className="flex items-center justify-between mb-4">
                    <label className="block text-sm font-semibold text-gray-900 dark:text-white">
                      Items List
                    </label>
                    <button
                      type="button"
                      onClick={handleAddItem}
                      className="inline-flex items-center px-3 py-1.5 border border-blue-200 dark:border-blue-800 text-xs font-medium rounded-lg text-blue-700 bg-blue-50 hover:bg-blue-100 dark:text-blue-300 dark:bg-blue-900/30 transition-colors"
                    >
                      <Plus className="h-3.5 w-3.5 mr-1.5" />
                      Add Item
                    </button>
                  </div>
                  
                  <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                    {formData.items.length > 0 ? (
                      formData.items.map((item, index) => (
                        <div key={index} className="grid grid-cols-12 gap-3 items-end bg-white dark:bg-gray-800 p-3 rounded-lg shadow-sm border border-gray-100 dark:border-gray-600">
                          <div className="col-span-12 sm:col-span-5">
                            <label className="text-xs text-gray-500 mb-1 block">Material</label>
                            <select
                              value={item.rawMaterialId}
                              onChange={(e) => handleItemChange(index, 'rawMaterialId', e.target.value)}
                              className="block w-full py-2 px-3 border border-gray-300 bg-white rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            >
                              {rawMaterials.map((material) => (
                                <option key={material.id} value={material.id}>
                                  {material.name} ({material.unit})
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="col-span-4 sm:col-span-3">
                             <label className="text-xs text-gray-500 mb-1 block">Qty</label>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={item.quantity}
                              onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                              className="block w-full py-2 px-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm dark:bg-gray-700 dark:border-gray-600"
                              placeholder="Qty"
                            />
                          </div>
                          <div className="col-span-7 sm:col-span-3">
                            <label className="text-xs text-gray-500 mb-1 block">Cost/Unit</label>
                            <div className="relative rounded-md shadow-sm">
                              <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                                <span className="text-gray-500 sm:text-xs">Rp</span>
                              </div>
                              <input
                                type="number"
                                min="0"
                                step="0.001"
                                value={item.unitCost}
                                onChange={(e) => handleItemChange(index, 'unitCost', e.target.value)}
                                className="block w-full pl-8 pr-2 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm dark:bg-gray-700 dark:border-gray-600"
                                placeholder="0"
                              />
                            </div>
                          </div>
                          <div className="col-span-1 flex justify-center pb-2">
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(index)}
                              className="text-gray-400 hover:text-red-500 transition-colors p-1"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 border-2 border-dashed border-gray-200 dark:border-gray-600 rounded-lg">
                         <Package className="h-8 w-8 mx-auto text-gray-300 mb-2" />
                        <p className="text-sm text-gray-500">No items added yet</p>
                      </div>
                    )}
                  </div>
                  
                  {formData.items.length > 0 && (
                    <div className="mt-4 flex justify-end items-center text-sm font-medium text-gray-900 dark:text-white bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-600">
                      <span className="mr-3 text-gray-500">Estimated Total:</span>
                      <span className="text-lg text-blue-600 dark:text-blue-400 font-bold">{formatCurrency(formData.totalAmount)}</span>
                    </div>
                  )}
                </div>
                
                <div>
                  <label htmlFor="notes" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Additional Notes
                  </label>
                  <textarea
                    id="notes"
                    name="notes"
                    rows={2}
                    value={formData.notes}
                    onChange={handleFormChange}
                    placeholder="Optional details about this purchase..."
                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white px-3 py-2"
                  ></textarea>
                </div>
                
                <div className="pt-4 border-t border-gray-100 dark:border-gray-700 flex flex-row-reverse gap-3">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex justify-center items-center py-2.5 px-5 border border-transparent shadow-sm text-sm font-semibold rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    {isSubmitting ? (
                      <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving...</>
                    ) : (
                      <><Save className="h-4 w-4 mr-2" /> Save Record</>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="inline-flex justify-center py-2.5 px-5 border border-gray-300 shadow-sm text-sm font-semibold rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700 transition-all"
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