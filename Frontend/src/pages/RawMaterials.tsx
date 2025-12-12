import React, { useState } from 'react';
import { useInventory, RawMaterial } from '../context/InventoryContext';
import { 
  Plus, Search, Filter, Edit, Trash2, X, Save, Loader2,
  ArrowUp, ArrowDown, Box, Layers, AlertCircle, Coins, Factory
} from 'lucide-react';
import toast from 'react-hot-toast';
import { formatCurrency } from "../utils/currency";

type SortField = 'name' | 'stock' | 'unitCost' | 'supplier';
type SortDirection = 'asc' | 'desc';

// --- Komponen Stat Card (Konsisten dengan page lain) ---
const StatCard = ({ title, value, subtext, icon: Icon, color }: any) => (
  <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
        <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
        {subtext && <p className="mt-1 text-xs text-gray-400">{subtext}</p>}
      </div>
      <div className={`p-3 rounded-lg ${color} bg-opacity-10`}>
        <Icon className={`h-6 w-6 ${color.replace('bg-', 'text-')}`} />
      </div>
    </div>
  </div>
);

const RawMaterials = () => {
  const { rawMaterials, loading, addRawMaterial, updateRawMaterial, deleteRawMaterial } = useInventory();
  
  // State UI
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formMode, setFormMode] = useState<'add' | 'edit'>('add');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // State Data
  const [currentMaterial, setCurrentMaterial] = useState<RawMaterial | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    unit: '',
    stock: 0,
    unitCost: 0,
    supplier: ''
  });
  
  // Filter Logic
  const suppliers = ['All', ...Array.from(new Set(rawMaterials.map(material => material.supplier)))];
  const [selectedSupplier, setSelectedSupplier] = useState<string | null>(null);
  
  // --- Logic Sorting & Filtering (Dipertahankan) ---
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };
  
  const getSortedMaterials = () => {
    return [...rawMaterials]
      .filter(material => {
        const matchesSearch = material.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesSupplier = selectedSupplier === null || selectedSupplier === 'All' || material.supplier === selectedSupplier;
        return matchesSearch && matchesSupplier;
      })
      .sort((a, b) => {
        const multiplier = sortDirection === 'asc' ? 1 : -1;
        if (sortField === 'name') return multiplier * a.name.localeCompare(b.name);
        if (sortField === 'stock') return multiplier * (a.stock - b.stock);
        if (sortField === 'unitCost') return multiplier * (a.unitCost - b.unitCost);
        if (sortField === 'supplier') return multiplier * a.supplier.localeCompare(b.supplier);
        return 0;
      });
  };
  
  // --- CRUD Handlers ---
  const handleAddMaterial = () => {
    setFormMode('add');
    setCurrentMaterial(null);
    setFormData({ name: '', unit: '', stock: 0, unitCost: 0, supplier: '' });
    setIsModalOpen(true);
  };
  
  const handleEditMaterial = (material: RawMaterial) => {
    setFormMode('edit');
    setCurrentMaterial(material);
    setFormData({
      name: material.name,
      unit: material.unit,
      stock: material.stock,
      unitCost: material.unitCost,
      supplier: material.supplier
    });
    setIsModalOpen(true);
  };
  
  const handleDeleteMaterial = async (material: RawMaterial) => {
    if (window.confirm(`Are you sure you want to delete ${material.name}?`)) {
      try {
        await deleteRawMaterial(material.id);
        toast.success(`${material.name} deleted successfully`);
      } catch (error: any) {
        const msg = error?.message || error?.response?.data?.message || 'Failed to delete raw material';
        toast.error(msg);
      }
    }
  };
  
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'unitCost' || name === 'stock' ? parseFloat(value) || 0 : value
    }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      if (!formData.name.trim()) throw new Error('Material name is required');
      if (!formData.unit.trim()) throw new Error('Unit is required');
      if (formData.stock < 0) throw new Error('Stock cannot be negative');
      if (formData.unitCost <= 0) throw new Error('Unit cost must be > 0');
      if (!formData.supplier.trim()) throw new Error('Supplier is required');
      
      if (formMode === 'add') {
        await addRawMaterial(formData);
        toast.success(`${formData.name} added successfully`);
      } else if (formMode === 'edit' && currentMaterial) {
        await updateRawMaterial(currentMaterial.id, formData);
        toast.success(`${formData.name} updated successfully`);
      }
      setIsModalOpen(false);
    } catch (error: any) {
      toast.error(error.message || 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Stats Calculation ---
  const totalItems = rawMaterials.length;
  const totalValue = rawMaterials.reduce((acc, curr) => acc + (curr.stock * curr.unitCost), 0);
  const lowStockCount = rawMaterials.filter(m => m.stock < 100).length; // Asumsi threshold 100

  return (
    <div className="space-y-8 pb-10">
      {/* 1. Header & Stats */}
      <div className="flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Raw Materials</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">Track inventory levels and material costs.</p>
          </div>
          <button
            onClick={handleAddMaterial}
            className="inline-flex items-center px-5 py-2.5 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all transform hover:scale-[1.02]"
          >
            <Plus className="h-5 w-5 mr-2" />
            Add Material
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard 
            title="Total Materials" 
            value={totalItems.toString()} 
            subtext="Distinct items in stock"
            icon={Layers} 
            color="bg-purple-500 text-purple-600" 
          />
          <StatCard 
            title="Inventory Value" 
            value={formatCurrency(totalValue)} 
            subtext="Total asset valuation"
            icon={Coins} 
            color="bg-emerald-500 text-emerald-600" 
          />
          <StatCard 
            title="Low Stock Alerts" 
            value={lowStockCount.toString()} 
            subtext="Items below threshold"
            icon={AlertCircle} 
            color="bg-amber-500 text-amber-600" 
          />
        </div>
      </div>
      
      {/* 2. Main Content */}
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
                placeholder="Search raw materials..."
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
                    <option key={supplier} value={supplier}>
                      {supplier}
                    </option>
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
                    { id: 'name', label: 'Material Name' },
                    { id: 'supplier', label: 'Supplier' },
                    { id: 'stock', label: 'Stock Level' },
                    { id: 'unitCost', label: 'Unit Cost' },
                ].map((col) => (
                  <th 
                    key={col.id}
                    scope="col" 
                    className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    onClick={() => handleSort(col.id as SortField)}
                  >
                    <div className="flex items-center gap-2">
                      {col.label}
                      {sortField === col.id && (
                        sortDirection === 'asc' ? <ArrowUp className="h-3 w-3 text-blue-500" /> : <ArrowDown className="h-3 w-3 text-blue-500" />
                      )}
                    </div>
                  </th>
                ))}
                <th scope="col" className="px-6 py-4 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <Loader2 className="h-10 w-10 mx-auto text-blue-500 animate-spin" />
                    <p className="mt-2 text-sm text-gray-500">Loading inventory...</p>
                  </td>
                </tr>
              ) : getSortedMaterials().length > 0 ? (
                getSortedMaterials().map((material) => (
                  <tr key={material.id} className="hover:bg-blue-50/50 dark:hover:bg-gray-700/50 transition-colors duration-150 group">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                          <Box className="h-5 w-5" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-blue-600 transition-colors">
                            {material.name}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            Unit: <span className="font-medium bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded text-gray-600 dark:text-gray-300">{material.unit}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                       <div className="flex items-center">
                          <Factory className="h-4 w-4 text-gray-400 mr-2" />
                          <div className="text-sm text-gray-900 dark:text-white">{material.supplier}</div>
                       </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {material.stock === 0 ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 border border-red-200 dark:border-red-800">
                             Out of Stock
                          </span>
                      ) : material.stock < 200 ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                             {material.stock} {material.unit} (Low)
                          </span>
                      ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border border-green-200 dark:border-green-800">
                             {material.stock} {material.unit}
                          </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {formatCurrency(material.unitCost)}
                        <span className="text-gray-400 text-xs font-normal"> / {material.unit}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                       <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => handleEditMaterial(material)}
                            className="p-1.5 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded-md transition-colors dark:text-blue-400 dark:hover:bg-gray-700"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteMaterial(material)}
                            className="p-1.5 text-red-600 hover:text-red-900 hover:bg-red-50 rounded-md transition-colors dark:text-red-400 dark:hover:bg-gray-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                       </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    <div className="mx-auto h-12 w-12 text-gray-300 mb-3">
                        <Search className="h-full w-full" />
                    </div>
                    No raw materials found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* 3. Modern Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
             <div className="fixed inset-0 bg-gray-900/75 backdrop-blur-sm transition-opacity" onClick={() => setIsModalOpen(false)}></div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            
            <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-xl sm:w-full border border-gray-100 dark:border-gray-700">
              <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800">
                <div>
                   <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                     {formMode === 'add' ? 'Add Material' : 'Edit Material'}
                   </h3>
                   <p className="text-sm text-gray-500 mt-1">Manage raw material details and stock.</p>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="bg-white dark:bg-gray-700 rounded-full p-2 text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-600 transition-all focus:outline-none"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                <div className="grid grid-cols-1 gap-6">
                  {/* Row 1: Name & Supplier */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                           Material Name
                        </label>
                        <input
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleFormChange}
                          className="block w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm py-2.5 px-3 dark:bg-gray-700 dark:border-gray-600"
                          placeholder="e.g. Coffee Beans"
                          required
                        />
                     </div>
                     <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                           Supplier
                        </label>
                        <input
                          type="text"
                          name="supplier"
                          value={formData.supplier}
                          onChange={handleFormChange}
                          className="block w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm py-2.5 px-3 dark:bg-gray-700 dark:border-gray-600"
                          placeholder="e.g. Local Farm"
                          required
                        />
                     </div>
                  </div>
                  
                  {/* Row 2: Stock & Unit */}
                  <div className="grid grid-cols-2 gap-6">
                     <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                           Current Stock
                        </label>
                        <input
                          type="number"
                          name="stock"
                          min="0"
                          value={formData.stock}
                          onChange={handleFormChange}
                          className="block w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm py-2.5 px-3 dark:bg-gray-700 dark:border-gray-600"
                          required
                        />
                     </div>
                     <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                           Unit (e.g., kg, L)
                        </label>
                        <input
                          type="text"
                          name="unit"
                          value={formData.unit}
                          onChange={handleFormChange}
                          className="block w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm py-2.5 px-3 dark:bg-gray-700 dark:border-gray-600"
                          required
                        />
                     </div>
                  </div>
                  
                  {/* Row 3: Cost */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Cost per Unit
                    </label>
                    <div className="relative rounded-lg shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-500 sm:text-sm">Rp</span>
                      </div>
                      <input
                        type="number"
                        name="unitCost"
                        min="0"
                        step="0.1"
                        value={formData.unitCost}
                        onChange={handleFormChange}
                        className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-9 sm:text-sm border-gray-300 rounded-lg py-2.5 dark:bg-gray-700 dark:border-gray-600"
                        required
                      />
                    </div>
                  </div>
                </div>
                
                <div className="pt-4 flex flex-row-reverse gap-3 border-t border-gray-100 dark:border-gray-700">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex justify-center items-center py-2.5 px-5 border border-transparent shadow-sm text-sm font-semibold rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-all"
                  >
                    {isSubmitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                    {formMode === 'add' ? 'Add Material' : 'Save Changes'}
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

export default RawMaterials;