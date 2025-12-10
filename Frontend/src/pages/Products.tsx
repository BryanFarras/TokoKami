import React, { useState, useEffect } from 'react';
import { useProducts, Product, ProductIngredient } from '../context/ProductContext';
import { useInventory, RawMaterial } from '../context/InventoryContext';
import { 
  Plus, Search, Filter, Edit, Trash2, X, Save, Package, Coffee, 
  ArrowUp, ArrowDown, Loader2, AlertTriangle, TrendingUp, DollarSign, Image as ImageIcon
} from 'lucide-react';
import toast from 'react-hot-toast';
import { formatCurrency } from "../utils/currency";

type SortField = 'name' | 'price' | 'stock' | 'category';
type SortDirection = 'asc' | 'desc';

// --- Components Kecil untuk UI ---
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

const Products = () => {
  const { products, loading, addProduct, updateProduct, deleteProduct } = useProducts();
  const { rawMaterials } = useInventory();
  
  // State UI
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formMode, setFormMode] = useState<'add' | 'edit'>('add');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // State Data
  const [currentProduct, setCurrentProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    price: 0,
    costPrice: 0,
    stock: 0,
    category: '',
    image: '',
    ingredients: [] as ProductIngredient[]
  });
  
  const categories = ['All', ...Array.from(new Set(products.map(product => product.category)))];

  // --- Logic Sorting & Filtering (Sama seperti sebelumnya) ---
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };
  
  const getSortedProducts = () => {
    return [...products]
      .filter(product => {
        const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = selectedCategory === null || selectedCategory === 'All' || product.category === selectedCategory;
        return matchesSearch && matchesCategory;
      })
      .sort((a, b) => {
        const multiplier = sortDirection === 'asc' ? 1 : -1;
        if (sortField === 'name') return multiplier * a.name.localeCompare(b.name);
        if (sortField === 'price') return multiplier * (a.price - b.price);
        if (sortField === 'stock') return multiplier * (a.stock - b.stock);
        if (sortField === 'category') return multiplier * a.category.localeCompare(b.category);
        return 0;
      });
  };

  // --- Handlers CRUD ---
  const handleAddProduct = () => {
    setFormMode('add');
    setCurrentProduct(null);
    setFormData({ name: '', price: 0, costPrice: 0, stock: 0, category: '', image: '', ingredients: [] });
    setIsModalOpen(true);
  };
  
  const handleEditProduct = (product: Product) => {
    setFormMode('edit');
    setCurrentProduct(product);
    setFormData({
      name: product.name,
      price: product.price,
      costPrice: product.costPrice,
      stock: product.stock,
      category: product.category,
      image: product.image || '',
      ingredients: [...product.ingredients]
    });
    setIsModalOpen(true);
  };
  
  const handleDeleteProduct = async (product: Product) => {
    if (window.confirm(`Are you sure you want to delete ${product.name}?`)) {
      try {
        await deleteProduct(product.id);
        toast.success(`${product.name} has been deleted`);
      } catch (error) {
        toast.error('Failed to delete product');
      }
    }
  };
  
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'price' || name === 'costPrice' || name === 'stock' ? parseFloat(value) || 0 : value
    }));
  };
  
  // --- Ingredient Logic ---
  const handleAddIngredient = () => {
    const defaultId = rawMaterials.length > 0 ? rawMaterials[0].id : '';
    if(!defaultId) { toast.error("No raw materials available"); return; }
    setFormData(prev => ({
      ...prev,
      ingredients: [...prev.ingredients, { rawMaterialId: defaultId, amount: 1 }]
    }));
  };
  
  const handleRemoveIngredient = (index: number) => {
    setFormData(prev => ({
      ...prev,
      ingredients: prev.ingredients.filter((_, i) => i !== index)
    }));
  };
  
  const handleIngredientChange = (index: number, field: keyof ProductIngredient, value: string | number) => {
    setFormData(prev => {
      const newIngredients = [...prev.ingredients];
      newIngredients[index] = {
        ...newIngredients[index],
        [field]: field === 'amount' ? Number(value) || 0 : String(value),
      };
      return { ...prev, ingredients: newIngredients };
    });
  };

  // Auto-calculate cost based on ingredients
  useEffect(() => {
    const total = formData.ingredients.reduce((sum, ing) => {
      const rm = rawMaterials.find(r => String(r.id) === String(ing.rawMaterialId));
      const unitCost = Number(rm?.unitCost ?? rm?.price ?? 0);
      return sum + unitCost * Number(ing.amount || 0);
    }, 0);
    // Hanya update jika total > 0 agar tidak menimpa manual input jika user mau override
    if(total > 0) setFormData(prev => ({ ...prev, costPrice: Number(total.toFixed(2)) }));
  }, [formData.ingredients, rawMaterials]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (!formData.name.trim()) throw new Error('Product name is required');
      if (formData.price <= 0) throw new Error('Price must be greater than 0');
      if (formData.stock < 0) throw new Error('Stock cannot be negative');
      if (!formData.category.trim()) throw new Error('Category is required');
      
      if (formMode === 'add') {
        await addProduct(formData);
        toast.success(`${formData.name} added successfully`);
      } else if (formMode === 'edit' && currentProduct) {
        await updateProduct(currentProduct.id, formData);
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
  const totalProducts = products.length;
  const lowStockCount = products.filter(p => p.stock <= 5).length;
  const outOfStockCount = products.filter(p => p.stock === 0).length;
  const potentialRevenue = products.reduce((sum, p) => sum + (p.price * p.stock), 0);

  return (
    <div className="space-y-8 pb-10">
      {/* 1. Dashboard Stats */}
      <div className="flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Product Catalog</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">Manage your menu items, recipes, and pricing.</p>
          </div>
          <button
            onClick={handleAddProduct}
            className="inline-flex items-center px-5 py-2.5 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all transform hover:scale-[1.02]"
          >
            <Plus className="h-5 w-5 mr-2" />
            Add New Product
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard 
            title="Total Products" 
            value={totalProducts.toString()} 
            subtext="Active items in menu"
            icon={Package} 
            color="bg-blue-500 text-blue-600" 
          />
          <StatCard 
            title="Stock Alerts" 
            value={`${lowStockCount} Low`} 
            subtext={`${outOfStockCount} Out of stock`}
            icon={AlertTriangle} 
            color="bg-amber-500 text-amber-600" 
          />
          <StatCard 
            title="Potential Revenue" 
            value={formatCurrency(potentialRevenue)} 
            subtext="Based on current stock"
            icon={TrendingUp} 
            color="bg-green-500 text-green-600" 
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
                placeholder="Search products by name..."
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
                  value={selectedCategory || 'All'}
                  onChange={(e) => setSelectedCategory(e.target.value === 'All' ? null : e.target.value)}
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>{c}</option>
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
                    { id: 'name', label: 'Product Details' },
                    { id: 'category', label: 'Category' },
                    { id: 'price', label: 'Pricing & Profit' },
                    { id: 'stock', label: 'Inventory Status' },
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
                    <p className="mt-2 text-sm text-gray-500">Loading products...</p>
                  </td>
                </tr>
              ) : getSortedProducts().length > 0 ? (
                getSortedProducts().map((product) => {
                   const profit = product.price - product.costPrice;
                   const margin = product.price > 0 ? ((profit / product.price) * 100).toFixed(1) : '0';
                   
                   return (
                  <tr key={product.id} className="hover:bg-blue-50/50 dark:hover:bg-gray-700/50 transition-colors duration-150 group">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-12 w-12 flex-shrink-0">
                          {product.image ? (
                            <img 
                              src={product.image} 
                              alt={product.name} 
                              className="h-12 w-12 rounded-lg object-cover border border-gray-200 dark:border-gray-600"
                              onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/150?text=No+Img'; }}
                            />
                          ) : (
                            <div className="h-12 w-12 rounded-lg bg-indigo-50 dark:bg-indigo-900/50 flex items-center justify-center border border-indigo-100 dark:border-indigo-800">
                              <Coffee className="h-6 w-6 text-indigo-400" />
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-blue-600 transition-colors">
                            {product.name}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 flex items-center">
                            <Package className="h-3 w-3 mr-1" />
                            Cost: {formatCurrency(product.costPrice)}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                       <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                        {product.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900 dark:text-white">{formatCurrency(product.price)}</div>
                      <div className="text-xs font-medium mt-1 flex items-center">
                        <span className="text-green-600 dark:text-green-400">+{formatCurrency(profit)}</span>
                        <span className="text-gray-300 mx-1">|</span>
                        <span className="text-gray-500 dark:text-gray-400">{margin}% Margin</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                       {product.stock === 0 ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 border border-red-200 dark:border-red-800">
                            <AlertTriangle className="w-3 h-3 mr-1" /> Out of Stock
                          </span>
                       ) : product.stock <= 5 ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                             Only {product.stock} left
                          </span>
                       ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border border-green-200 dark:border-green-800">
                             {product.stock} Available
                          </span>
                       )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => handleEditProduct(product)}
                          className="p-1.5 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded-md transition-colors dark:text-blue-400 dark:hover:bg-gray-700"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(product)}
                          className="p-1.5 text-red-600 hover:text-red-900 hover:bg-red-50 rounded-md transition-colors dark:text-red-400 dark:hover:bg-gray-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )})
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    <div className="mx-auto h-12 w-12 text-gray-300 mb-3">
                        <Search className="h-full w-full" />
                    </div>
                    No products found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* 3. Modern Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto" role="dialog">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
             <div className="fixed inset-0 bg-gray-900/75 backdrop-blur-sm transition-opacity" onClick={() => setIsModalOpen(false)}></div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            
            <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full border border-gray-100 dark:border-gray-700">
              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800">
                <div>
                   <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                     {formMode === 'add' ? 'Add New Product' : 'Edit Product'}
                   </h3>
                   <p className="text-sm text-gray-500 mt-1">Fill in the details to list your product.</p>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="bg-white dark:bg-gray-700 rounded-full p-2 text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-600 transition-all focus:outline-none"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="p-6">
                <div className="space-y-6">
                  {/* Section 1: Basic Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="col-span-1 md:col-span-2">
                       <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Product Name</label>
                       <input
                         name="name"
                         value={formData.name}
                         onChange={handleFormChange}
                         className="block w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm py-2.5 px-3 dark:bg-gray-700 dark:border-gray-600"
                         placeholder="e.g. Cappuccino Latte"
                         required
                       />
                    </div>
                    
                    <div>
                       <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Category</label>
                       <input
                         name="category"
                         value={formData.category}
                         onChange={handleFormChange}
                         className="block w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm py-2.5 px-3 dark:bg-gray-700 dark:border-gray-600"
                         placeholder="e.g. Coffee"
                         required
                       />
                    </div>

                    <div>
                       <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Current Stock</label>
                       <input
                         type="number"
                         name="stock"
                         value={formData.stock}
                         onChange={handleFormChange}
                         className="block w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm py-2.5 px-3 dark:bg-gray-700 dark:border-gray-600"
                         min="0"
                       />
                    </div>
                  </div>

                  {/* Section 2: Pricing */}
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800">
                     <h4 className="text-sm font-bold text-blue-800 dark:text-blue-300 mb-3 flex items-center">
                        <DollarSign className="w-4 h-4 mr-1"/> Pricing Strategy
                     </h4>
                     <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Selling Price</label>
                          <div className="relative rounded-md shadow-sm">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <span className="text-gray-500 sm:text-sm">Rp</span>
                            </div>
                            <input
                              type="number"
                              name="price"
                              value={formData.price}
                              onChange={handleFormChange}
                              className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-9 sm:text-sm border-gray-300 rounded-md py-2 dark:bg-gray-700 dark:border-gray-600"
                              required
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                             Calc. Cost (Auto)
                          </label>
                          <div className="relative rounded-md shadow-sm opacity-80">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <span className="text-gray-500 sm:text-sm">Rp</span>
                            </div>
                            <input
                              type="number"
                              name="costPrice"
                              value={formData.costPrice}
                              readOnly
                              className="bg-gray-100 focus:ring-blue-500 focus:border-blue-500 block w-full pl-9 sm:text-sm border-gray-300 rounded-md py-2 cursor-not-allowed dark:bg-gray-600 dark:border-gray-500"
                            />
                          </div>
                        </div>
                     </div>
                  </div>

                  {/* Section 3: Ingredients Recipe */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                        Recipe / Ingredients
                      </label>
                      <button
                        type="button"
                        onClick={handleAddIngredient}
                        className="text-xs flex items-center bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-full hover:bg-indigo-100 transition-colors border border-indigo-200"
                      >
                        <Plus className="h-3 w-3 mr-1" /> Add Ingredient
                      </button>
                    </div>
                    
                    <div className="bg-gray-50 dark:bg-gray-700/30 rounded-xl p-3 border border-gray-200 dark:border-gray-600 max-h-48 overflow-y-auto space-y-2 custom-scrollbar">
                      {formData.ingredients.length > 0 ? (
                        formData.ingredients.map((ing, idx) => (
                          <div key={idx} className="flex gap-2 items-center bg-white dark:bg-gray-800 p-2 rounded-lg shadow-sm border border-gray-100 dark:border-gray-600">
                            <select
                              className="flex-1 text-sm border-none bg-transparent focus:ring-0 dark:text-white font-medium"
                              value={String(ing.rawMaterialId)}
                              onChange={(e) => handleIngredientChange(idx, 'rawMaterialId', e.target.value)}
                            >
                              {rawMaterials.map(rm => (
                                <option key={rm.id} value={String(rm.id)}>
                                  {rm.name} ({rm.unit}) - {formatCurrency(rm.unitCost || 0)}
                                </option>
                              ))}
                            </select>
                            <div className="w-px h-6 bg-gray-200 mx-1"></div>
                            <input
                              type="number"
                              step="any"
                              className="w-20 text-sm border-none bg-transparent focus:ring-0 text-right dark:text-white"
                              value={ing.amount}
                              onChange={(e) => handleIngredientChange(idx, 'amount', e.target.value)}
                              placeholder="Qty"
                            />
                            <button
                              type="button"
                              onClick={() => handleRemoveIngredient(idx)}
                              className="text-gray-400 hover:text-red-500 p-1"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ))
                      ) : (
                         <div className="text-center py-4 text-sm text-gray-500 italic">
                           No ingredients defined. This product will have 0 cost.
                         </div>
                      )}
                    </div>
                  </div>

                   {/* Section 4: Image */}
                   <div>
                       <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Image URL</label>
                       <div className="flex gap-4">
                         <div className="flex-1">
                           <input
                             name="image"
                             value={formData.image}
                             onChange={handleFormChange}
                             className="block w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm py-2.5 px-3 dark:bg-gray-700 dark:border-gray-600"
                             placeholder="https://..."
                           />
                         </div>
                         <div className="h-10 w-10 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center overflow-hidden">
                            {formData.image ? (
                               <img src={formData.image} alt="Preview" className="h-full w-full object-cover" onError={(e) => (e.target as HTMLImageElement).src = ''} />
                            ) : (
                               <ImageIcon className="h-5 w-5 text-gray-400"/>
                            )}
                         </div>
                       </div>
                   </div>
                </div>

                <div className="pt-6 mt-6 border-t border-gray-100 dark:border-gray-700 flex flex-row-reverse gap-3">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex justify-center items-center py-2.5 px-5 border border-transparent shadow-sm text-sm font-semibold rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-all"
                  >
                     {isSubmitting ? <Loader2 className="animate-spin h-5 w-5"/> : 'Save Product'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="inline-flex justify-center py-2.5 px-5 border border-gray-300 shadow-sm text-sm font-semibold rounded-lg text-gray-700 bg-white hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700 transition-all"
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

export default Products;