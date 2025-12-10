import React, { useState, useMemo } from 'react';
import { useProducts, Product } from '../context/ProductContext';
import { useTransactions } from '../context/TransactionContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';
import { Search, ShoppingCart, Trash2, Plus, Minus, X, CreditCard, DollarSign, Loader2, Receipt } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatCurrency } from "../utils/currency";
import dayjs from 'dayjs'; 
import 'dayjs/locale/id'; 

// --- UTILITY: Format Tanggal Aman ---
const formatReceiptDate = (dateInput: string | undefined): string => {
  if (!dateInput) return dayjs().format('D MMMM YYYY, HH:mm');
  const date = dayjs(dateInput);
  if (!date.isValid()) return dayjs().format('D MMMM YYYY, HH:mm');
  return date.locale('id').format('D MMMM YYYY, HH:mm');
};

const POS = () => {
  const { products, loading: productsLoading } = useProducts();
  // Safe access to TransactionContext
  const txCtx = (() => { try { return useTransactions(); } catch { return null; } })();
  const { user } = useAuth();

  // Local cart state
  const [cart, setCart] = useState<{ product: Product; quantity: number }[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  
  // Modal & Form States
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);
  
  const [discount, setDiscount] = useState(0);
  const [tax, setTax] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'other'>('cash');
  const [customerName, setCustomerName] = useState('');
  const [notes, setNotes] = useState('');
  const [cashAmount, setCashAmount] = useState('');
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentTransaction, setCurrentTransaction] = useState<any>(null);

  // --- HELPERS ---
  const categories = useMemo(() => ['All', ...Array.from(new Set(products.map(product => product.category)))], [products]);

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === null || selectedCategory === 'All' || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const addToCart = (product: Product, qty = 1) => {
    setCart(prev => {
      const found = prev.find(i => i.product.id === product.id);
      if (found) return prev.map(i => i.product.id === product.id ? { ...i, quantity: i.quantity + qty } : i);
      return [...prev, { product, quantity: qty }];
    });
  };

  const removeFromCart = (productId: string) => setCart(prev => prev.filter(i => i.product.id !== productId));
  
  const updateCartItemQuantity = (productId: string, quantity: number) => {
    setCart(prev => prev.map(i => i.product.id === productId ? { ...i, quantity: Math.max(0, quantity) } : i).filter(i => i.quantity > 0));
  };

  const cartSubtotal = cart.reduce((s, it) => s + (it.product.price * it.quantity), 0);

  const handleAddToCart = (product: Product) => {
    addToCart(product, 1);
    toast.success(`${product.name} added to cart`);
  };

  const calculateChange = () => {
    if (!cashAmount) return 0;
    const cashValue = parseFloat(cashAmount) || 0;
    const totalWithTaxAndDiscount = cartSubtotal + tax - discount;
    return cashValue > totalWithTaxAndDiscount ? cashValue - totalWithTaxAndDiscount : 0;
  };

  // --- CHECKOUT LOGIC ---
  const handleCheckout = async () => {
    if (cart.length === 0) { toast.error('Cart is empty'); return; }
    setIsProcessing(true);
    
    try {
      // 1. Build Payload
      const payload = {
        type: 'sale',
        items: cart.map(i => ({
          productId: i.product.id,
          productName: i.product.name,
          unitPrice: i.product.price,
          quantity: i.quantity,
          totalPrice: i.product.price * i.quantity,
        })),
        subtotal: cartSubtotal,
        discount,
        tax,
        total: cartSubtotal + tax - discount,
        payment_method: paymentMethod,
        cashier_name: user?.name || 'Unknown',
        customer_name: customerName || undefined,
        notes: notes || undefined,
      };

      // 2. LOGIKA GENERATE NOMOR RESI (Supaya tidak "PENDING")
      // Kita hitung manual: Jumlah transaksi sekarang + 1
      let predictedId = '1'; 
      if (txCtx && txCtx.transactions && txCtx.transactions.length > 0) {
          // Cari ID maksimum yang ada saat ini untuk menghindari duplikat
          const maxId = Math.max(...txCtx.transactions.map((t: any) => Number(t.id) || 0));
          predictedId = String(maxId + 1);
      }

      let transactionResult: any;

      // 3. Send to Backend
      if (txCtx && typeof txCtx.addTransaction === 'function') {
        transactionResult = await txCtx.addTransaction(payload as any);
      } else {
        transactionResult = await api<any>('/transactions/checkout', { method: 'POST', body: payload });
      }

      // 4. Create Safe Transaction Object
      const safeTransaction = {
          ...payload,
          ...transactionResult,
          // Prioritas ID: 1. Dari Backend (jika ada), 2. Prediksi Frontend (jika backend gagal kirim)
          id: transactionResult?.id || predictedId, 
          date: transactionResult?.date || new Date().toISOString()
      };

      setCurrentTransaction(safeTransaction);

      // 5. Reset Form & Open Receipt
      setCheckoutModalOpen(false);
      setReceiptModalOpen(true);
      setCart([]);
      setDiscount(0); setTax(0); setPaymentMethod('cash'); setCustomerName(''); setNotes(''); setCashAmount('');
      
      toast.success(`Transaction #${safeTransaction.id} completed successfully`);
    } catch (error: any) {
      console.error("Checkout Error:", error);
      toast.error(error?.message || 'Failed to process transaction');
    } finally {
      setIsProcessing(false);
    }
  };

  const printReceipt = () => {
    toast.success('Receipt printed successfully');
    setReceiptModalOpen(false);
  };

  const exportReceipt = () => {
    toast.success('Receipt exported successfully');
    setReceiptModalOpen(false);
  };

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col">
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Product listing */}
        <div className="w-full md:w-2/3 p-4 flex flex-col overflow-hidden">
          <div className="mb-4 flex flex-col space-y-4">
            <div className="relative">
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
            
            <div className="flex overflow-x-auto pb-2 hide-scrollbar">
              <div className="flex space-x-2">
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category === 'All' ? null : category)}
                    className={`px-4 py-2 text-sm font-medium rounded-full whitespace-nowrap ${
                      (category === 'All' && selectedCategory === null) || category === selectedCategory
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-100 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>
          </div>
          
          <div className="overflow-y-auto flex-1 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {productsLoading ? (
              <div className="col-span-full flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
              </div>
            ) : filteredProducts.length > 0 ? (
              filteredProducts.map((product) => (
                <div
                  key={product.id}
                  className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden cursor-pointer hover:shadow-md transition-shadow dark:bg-gray-800 dark:border-gray-700"
                  onClick={() => handleAddToCart(product)}
                >
                  {product.image && (
                    <div className="h-32 overflow-hidden">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="p-4">
                    <h3 className="font-medium text-gray-900 dark:text-white">{product.name}</h3>
                    <div className="flex items-center justify-between mt-2">
                      <p className="text-lg font-bold text-blue-600 dark:text-blue-400">{formatCurrency(product.price)}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Stock: {product.stock}</p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-12 text-gray-500 dark:text-gray-400">
                No products found matching your search
              </div>
            )}
          </div>
        </div>
        
        {/* Cart */}
        <div className="w-full md:w-1/3 bg-white dark:bg-gray-800 border-t md:border-t-0 md:border-l border-gray-200 dark:border-gray-700 flex flex-col">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <div className="flex items-center">
              <ShoppingCart className="h-5 w-5 text-blue-600 dark:text-blue-400 mr-2" />
              <h2 className="font-medium">Current Order</h2>
            </div>
            {cart.length > 0 && (
              <button
                onClick={() => setCheckoutModalOpen(true)}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
              >
                Checkout
              </button>
            )}
          </div>
          
          <div className="flex-1 overflow-y-auto p-4">
            {cart.length > 0 ? (
              <div className="space-y-4">
                {cart.map((item) => (
                  <div key={item.product.id} className="flex border-b border-gray-200 dark:border-gray-700 pb-4">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 dark:text-white">{item.product.name}</h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{formatCurrency(item.product.price)} each</p>
                      
                      <div className="mt-2 flex items-center">
                        <button
                          onClick={() => updateCartItemQuantity(item.product.id, item.quantity - 1)}
                          className="p-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <span className="mx-3 text-gray-700 dark:text-gray-300">{item.quantity}</span>
                        <button
                          onClick={() => updateCartItemQuantity(item.product.id, item.quantity + 1)}
                          className="p-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                        
                        <div className="ml-auto flex items-center">
                          <span className="font-medium text-gray-900 dark:text-white">
                            {formatCurrency(item.product.price * item.quantity)}
                          </span>
                          <button
                            onClick={() => removeFromCart(item.product.id)}
                            className="ml-3 p-1 rounded-full text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
                <ShoppingCart className="h-12 w-12 mb-4 opacity-20" />
                <p>Your cart is empty</p>
                <p className="text-sm mt-2">Add items from the product list</p>
              </div>
            )}
          </div>
          
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-600 dark:text-gray-400">Subtotal</span>
              <span className="font-medium text-gray-900 dark:text-white">{formatCurrency(cartSubtotal)}</span>
            </div>
            <div className="text-right">
              <span className="text-gray-500 dark:text-gray-400 text-xs">
                {cart.reduce((total, item) => total + item.quantity, 0)} items
              </span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Checkout Modal */}
      {checkoutModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Checkout</h3>
                <button
                  onClick={() => setCheckoutModalOpen(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Order Summary</label>
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-md p-3">
                    <div className="max-h-40 overflow-y-auto">
                      {cart.map((item) => (
                        <div key={item.product.id} className="flex justify-between py-1 text-sm">
                          <span className="text-gray-600 dark:text-gray-300">
                            {item.quantity} x {item.product.name}
                          </span>
                          <span className="font-medium text-gray-900 dark:text-white">
                            {formatCurrency(item.product.price * item.quantity)}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="border-t border-gray-200 dark:border-gray-600 mt-3 pt-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-300">Subtotal</span>
                        <span className="font-medium text-gray-900 dark:text-white">{formatCurrency(cartSubtotal)}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="discount" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Discount (IDR)
                    </label>
                    <input
                      type="number"
                      id="discount"
                      min="0"
                      step="0.01"
                      value={discount}
                      onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                  <div>
                    <label htmlFor="tax" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Tax (IDR)
                    </label>
                    <input
                      type="number"
                      id="tax"
                      min="0"
                      step="0.01"
                      value={tax}
                      onChange={(e) => setTax(parseFloat(e.target.value) || 0)}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Payment Method
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('cash')}
                      className={`flex items-center justify-center px-3 py-2 border rounded-md text-sm font-medium ${
                        paymentMethod === 'cash'
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600'
                      }`}
                    >
                      <DollarSign className="h-4 w-4 mr-1" />
                      Cash
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('card')}
                      className={`flex items-center justify-center px-3 py-2 border rounded-md text-sm font-medium ${
                        paymentMethod === 'card'
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600'
                      }`}
                    >
                      <CreditCard className="h-4 w-4 mr-1" />
                      Card
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('other')}
                      className={`flex items-center justify-center px-3 py-2 border rounded-md text-sm font-medium ${
                        paymentMethod === 'other'
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600'
                      }`}
                    >
                      Other
                    </button>
                  </div>
                </div>
                
                {paymentMethod === 'cash' && (
                  <div>
                    <label htmlFor="cashAmount" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Cash Amount
                    </label>
                    <input
                      type="number"
                      id="cashAmount"
                      min="0"
                      step="0.01"
                      value={cashAmount}
                      onChange={(e) => setCashAmount(e.target.value)}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                    {parseFloat(cashAmount) > 0 && (
                      <div className="mt-2 text-right">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Change: {formatCurrency(calculateChange())}
                        </span>
                      </div>
                    )}
                  </div>
                )}
                
                <div>
                  <label htmlFor="customerName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Customer Name (Optional)
                  </label>
                  <input
                    type="text"
                    id="customerName"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
                
                <div>
                  <label htmlFor="notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Notes (Optional)
                  </label>
                  <textarea
                    id="notes"
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  ></textarea>
                </div>
                
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-6">
                  <div className="flex justify-between text-lg font-bold mb-4">
                    <span className="text-gray-900 dark:text-white">Total</span>
                    <span className="text-blue-600 dark:text-blue-400">
                      {formatCurrency(cartSubtotal + tax - discount)}
                    </span>
                  </div>
                  
                  <button
                    onClick={handleCheckout}
                    disabled={isProcessing || cart.length === 0}
                    className="w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      'Complete Sale'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Receipt Modal */}
      {receiptModalOpen && currentTransaction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Receipt</h3>
                <button
                  onClick={() => setReceiptModalOpen(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="text-center mb-6">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">Brew Manager</h2>
                  <p className="text-gray-500 dark:text-gray-400">
                    {formatReceiptDate(currentTransaction.date)}
                  </p>
                  
                  {/* --- PERUBAHAN UTAMA: MENAMPILKAN ID HASIL PREDIKSI ATAU BACKEND --- */}
                  <p className="text-gray-500 dark:text-gray-400 font-medium">Receipt #{currentTransaction.id}</p>
                </div>
                
                <div className="border-t border-b border-gray-200 dark:border-gray-700 py-4">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-gray-500 dark:text-gray-400">
                        <th className="text-left pb-2">Item</th>
                        <th className="text-center pb-2">Qty</th>
                        <th className="text-right pb-2">Price</th>
                        <th className="text-right pb-2">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentTransaction.items.map((item: any, index: number) => (
                        <tr key={index} className="text-gray-900 dark:text-white">
                          <td className="py-1">{item.productName}</td>
                          <td className="text-center py-1">{item.quantity}</td>
                          <td className="text-right py-1">{formatCurrency(item.unitPrice)}</td>
                          <td className="text-right py-1">{formatCurrency(item.totalPrice)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Subtotal</span>
                    <span className="text-gray-900 dark:text-white">{formatCurrency(currentTransaction.subtotal)}</span>
                  </div>
                  {currentTransaction.discount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Discount</span>
                      <span className="text-gray-900 dark:text-white">-{formatCurrency(currentTransaction.discount)}</span>
                    </div>
                  )}
                  {currentTransaction.tax > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Tax</span>
                      <span className="text-gray-900 dark:text-white">{formatCurrency(currentTransaction.tax)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-base pt-2 border-t border-gray-200 dark:border-gray-700">
                    <span className="text-gray-900 dark:text-white">Total</span>
                    <span className="text-gray-900 dark:text-white">{formatCurrency(currentTransaction.total)}</span>
                  </div>
                  <div className="flex justify-between pt-2">
                    <span className="text-gray-600 dark:text-gray-400">Payment Method</span>
                    <span className="text-gray-900 dark:text-white capitalize">{currentTransaction.paymentMethod}</span>
                  </div>
                </div>
                
                <div className="text-center text-gray-500 dark:text-gray-400 text-sm pt-4 border-t border-gray-200 dark:border-gray-700">
                  <p>Thank you for your purchase!</p>
                  <p>Cashier: {currentTransaction.cashierName}</p>
                  {currentTransaction.customerName && <p>Customer: {currentTransaction.customerName}</p>}
                  {currentTransaction.notes && <p className="mt-2">Notes: {currentTransaction.notes}</p>}
                </div>
                
                <div className="flex space-x-4 mt-6">
                  <button
                    onClick={printReceipt}
                    className="flex-1 flex justify-center items-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:hover:bg-gray-600"
                  >
                    <Receipt className="h-4 w-4 mr-2" />
                    Print
                  </button>
                  <button
                    onClick={exportReceipt}
                    className="flex-1 flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Export
                  </button>
                </div>
                
                <button
                  onClick={() => setReceiptModalOpen(false)}
                  className="w-full text-center text-sm text-blue-600 dark:text-blue-400 hover:underline mt-2"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default POS;