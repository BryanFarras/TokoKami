import React, { useState } from 'react';
// Mengganti import lama dengan yang baru (hanya Product dan useProducts)
import { useProducts, Product } from '../context/ProductContext';
// import { useInventory, RawMaterial } from '../context/InventoryContext'; <--- DIHAPUS
import { 
  Plus, Search, Filter, Edit, Trash2, X, Save, Coffee, 
  ArrowUp, ArrowDown, Loader2, AlertTriangle, PackageOpen
} from 'lucide-react';
import toast from 'react-hot-toast';

// --- DEFINISI TIPE DATA LAMA yang masih digunakan di Form ---
// Dihapus: ProductIngredient (karena tidak ada endpoint)
type SortField = 'name' | 'price' | 'stock'; // Dihapus: 'category' karena mungkin tidak ada
type SortDirection = 'asc' | 'desc';

// Menggunakan tipe data Product dari context yang BARU (id: number, cost: number)
interface ProductFormData extends Omit<Product, 'id'> {
  // Menambahkan field tambahan yang ada di form lama tapi tidak di DB
  image?: string;
  // ingredients: any[]; // Dihapus karena tidak ada endpoint
  category: string; // Ditambahkan kembali untuk form state
  // FIX: costPrice diganti cost untuk form state
  cost: number;
}


const Products = () => {
  // MENGGUNAKAN CONTEXT BARU
  const { 
    products, 
    isLoading: loading, // Rename loading ke isLoading
    isError: error, // Rename error ke isError
    addProduct, 
    updateProduct, 
    deleteProduct,
    // rawMaterials dan useInventory DIHAPUS
  } = useProducts();
  
  // RAW MATERIALS DIHAPUS (HANYA MOCK)
  const rawMaterials: any[] = []; 
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  // FIX: currentProduct.id harus number
  const [currentProduct, setCurrentProduct] = useState<Product | null>(null);
  const [formMode, setFormMode] = useState<'add' | 'edit'>('add');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form state disesuaikan dengan Product interface yang baru
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    price: 0,
    cost: 0, // FIX: Menggunakan 'cost'
    stock: 0,
    sku: '', // Tambahan dari DB
    category: '', // Field lama yang dipertahankan untuk form
    image: '',
    // ingredients: [] as any[] // DIHAPUS: ingredients
  } as ProductFormData);
  
  // Get unique categories (Hanya akan bekerja jika ada data yang dikembalikan)
  const categories = ['All', ...Array.from(new Set(products.map(product => product.category || 'Uncategorized')))];
  
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };
  
  // Fungsi sort menggunakan produk baru
  const getSortedProducts = () => {
    return [...products]
      .filter(product => {
        const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
        // Asumsi category tidak ada di DB, tapi kita pakai category dari state
        const matchesCategory = selectedCategory === null || selectedCategory === 'All' || product.category === selectedCategory; 
        return matchesSearch && (selectedCategory === null || selectedCategory === 'All' || matchesCategory);
      })
      .sort((a, b) => {
        if (sortField === 'name') {
          return sortDirection === 'asc' 
            ? a.name.localeCompare(b.name) 
            : b.name.localeCompare(a.name);
        } else if (sortField === 'price') {
          return sortDirection === 'asc' 
            ? a.price - b.price 
            : b.price - a.price;
        } else if (sortField === 'stock') {
          return sortDirection === 'asc' 
            ? a.stock - b.stock 
            : b.stock - a.stock;
        }
        return 0;
      });
  };
  
  const handleAddProduct = () => {
    setFormMode('add');
    setCurrentProduct(null);
    setFormData({
      name: '',
      price: 0,
      cost: 0, // FIX: Menggunakan 'cost'
      stock: 0,
      sku: '',
      category: '',
      image: '',
      // ingredients: [] // DIHAPUS
    } as ProductFormData);
    setIsModalOpen(true);
  };
  
  const handleEditProduct = (product: Product) => {
    setFormMode('edit');
    setCurrentProduct(product);
    setFormData({
      name: product.name,
      price: product.price,
      cost: product.cost, // FIX: Menggunakan 'cost'
      stock: product.stock,
      // Field lama yang dipertahankan
      category: (product as any).category || '', 
      image: (product as any).image || '',
      sku: product.sku || '',
      // ingredients: [] // DIHAPUS
    });
    setIsModalOpen(true);
  };
  
  const handleDeleteProduct = async (product: Product) => {
    // FIX: Mengganti window.confirm dengan alert karena window.confirm diblokir
    if (window.confirm(`Are you sure you want to delete ${product.name}?`)) {
      try {
        await deleteProduct(product.id); // FIX: id sekarang number
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
      [name]: name === 'price' || name === 'cost' || name === 'stock' 
        ? parseFloat(value) || 0 
        : value
    }));
  };
  
  // FUNGSI INGREDIENTS DIHAPUS
  const handleAddIngredient = () => { console.log('Ingredients endpoint not yet implemented.'); };
  const handleRemoveIngredient = (index: number) => { console.log('Ingredients endpoint not yet implemented.'); };
  const handleIngredientChange = (index: number, field: any, value: string | number) => { console.log('Ingredients endpoint not yet implemented.'); };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Data yang akan dikirim ke API
      const dataToSend = {
          name: formData.name,
          price: formData.price,
          cost: formData.cost, // FIX: costPrice menjadi cost
          stock: formData.stock,
          sku: formData.sku,
          // image: formData.image, // Dihapus karena tidak ada di tabel DB
          // category: formData.category, // Dihapus karena tidak ada di tabel DB
      }
      
      // Validation
      if (!dataToSend.name.trim() || dataToSend.price <= 0 || dataToSend.stock < 0) {
          throw new Error('Please fill out all required fields correctly.');
      }
      
      if (formMode === 'add') {
        // Panggil addProduct dari Context baru
        await addProduct(dataToSend); 
        toast.success(`${formData.name} has been added`);
      } else if (formMode === 'edit' && currentProduct) {
        // Panggil updateProduct dari Context baru
        await updateProduct(currentProduct.id, dataToSend); // FIX: ID sekarang number
        toast.success(`${formData.name} has been updated`);
      }
      
      setIsModalOpen(false);
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error('An unexpected error occurred. Check server logs.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- KODE RENDER (JSX) ---
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-10 w-10 text-blue-500 animate-spin" />
        <p className="ml-3 text-gray-600">Loading products from Render...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="flex items-center justify-center h-64 text-red-500 bg-red-50 border border-red-200 p-4 rounded-lg">
        <AlertTriangle className="h-6 w-6 mr-2" />
        <p>Error: Failed to fetch products. Check your Render connection!</p>
      </div>
    );
  }

  // Komponen SortField untuk Header Tabel
  const SortButton = ({ field, label }: { field: SortField, label: string }) => (
    <th 
      scope="col" 
      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer"
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center">
        {label}
        {sortField === field && (
          sortDirection === 'asc' ? <ArrowUp className="h-4 w-4 ml-1" /> : <ArrowDown className="h-4 w-4 ml-1" />
        )}
      </div>
    </th>
  );
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold">Products</h1>
        <button
          onClick={handleAddProduct}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Product
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
                placeholder="Search products..."
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
                {/* FIX: Mengganti select Categories dengan input sederhana karena category tidak ada di DB */}
                 <select
                   className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                   value={selectedCategory || 'All'}
                   onChange={(e) => setSelectedCategory(e.target.value === 'All' ? null : e.target.value)}
                 >
                   {/* Categories hanya di-mock atau diabaikan karena tidak ada di DB products */}
                   {categories.map((category) => (
                     <option key={category} value={category}>
                       {category}
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
                <SortButton field="name" label="Product" />
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Category
                </th>
                <SortButton field="price" label="Price" />
                <SortButton field="stock" label="Stock" />
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
              {getSortedProducts().length > 0 ? (
                getSortedProducts().map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {/* Image dihapus karena tidak ada di DB */}
                        <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                          <Coffee className="h-6 w-6 text-gray-400" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {product.name}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            Cost: Rp{product.cost.toFixed(2)} {/* FIX: costPrice -> cost */}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                       {/* Category Dihapus atau di-mock */}
                      <div className="text-sm text-gray-900 dark:text-white">Coffee (Mock)</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">${product.price.toFixed(2)}</div>
                      <div className="text-sm text-green-600 dark:text-green-400">
                        +Rp{(product.price - product.cost).toFixed(2)} profit {/* FIX: costPrice -> cost */}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        product.stock > 10 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                          : product.stock > 0
                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                            : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                      }`}>
                        {product.stock} available
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleEditProduct(product)}
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 mr-4"
                      >
                        <Edit className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(product)}
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                    No products found matching your search
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Product Modal */}
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
                  {formMode === 'add' ? 'Add Product' : 'Edit Product'}
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
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Product Name
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleFormChange}
                        className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        required
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="price" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Selling Price
                        </label>
                        <div className="mt-1 relative rounded-md shadow-sm">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <span className="text-gray-500 dark:text-gray-400 sm:text-sm">$</span>
                          </div>
                          <input
                            type="number"
                            id="price"
                            name="price"
                            min="0"
                            step="0.01"
                            value={formData.price}
                            onChange={handleFormChange}
                            className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-7 pr-3 sm:text-sm border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            required
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label htmlFor="cost" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Cost Price
                        </label>
                        <div className="mt-1 relative rounded-md shadow-sm">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <span className="text-gray-500 dark:text-gray-400 sm:text-sm">$</span>
                          </div>
                          <input
                            type="number"
                            id="cost"
                            name="cost" // FIX: Mengganti costPrice menjadi cost
                            min="0"
                            step="0.01"
                            value={formData.cost}
                            onChange={handleFormChange}
                            className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-7 pr-3 sm:text-sm border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            required
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Category (Mock)
                        </label>
                        <input
                          type="text"
                          id="category"
                          name="category"
                          value={formData.category}
                          onChange={handleFormChange}
                          className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                          required
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="stock" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Initial Stock
                        </label>
                        <input
                          type="number"
                          id="stock"
                          name="stock"
                          min="0"
                          value={formData.stock}
                          onChange={handleFormChange}
                          className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                          required
                        />
                      </div>
                    </div>
                    
                    {/* Ingredients Section DIHAPUS karena tidak ada endpoint backend */}
                    <div className="border border-gray-200 dark:border-gray-700 rounded-md p-3 space-y-3">
                        <div className="flex flex-col items-center justify-center py-3 text-gray-500 dark:text-gray-400">
                            <PackageOpen className="h-6 w-6 mb-1 opacity-40" />
                            <p className="text-sm">Ingredients tracking disabled (Requires separate API)</p>
                        </div>
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
                        {formMode === 'add' ? 'Add Product' : 'Save Changes'}
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

export default Products;