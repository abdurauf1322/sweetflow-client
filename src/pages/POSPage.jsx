import React, { useState, useEffect, useRef } from 'react';
import { useProducts } from '../hooks/useProducts';
import { useStores } from '../hooks/useStores';
import { useOrders } from '../hooks/useOrders';
import { Search, ShoppingCart, Trash2, CheckCircle2, User, CreditCard, Tag, Box, X } from 'lucide-react';
import toast from 'react-hot-toast';

export const POSPage = () => {
  const { products, fetchProducts } = useProducts();
  const { stores, fetchStores } = useStores();
  const { createOrder, loading: checkoutLoading, error: checkoutError } = useOrders();

  const [selectedStoreId, setSelectedStoreId] = useState(() => {
    return localStorage.getItem('sweetflow_pos_store_id') || '';
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState(() => {
    try {
      const savedCart = localStorage.getItem('sweetflow_pos_cart');
      return savedCart ? JSON.parse(savedCart) : [];
    } catch (err) {
      return [];
    }
  });
  const [paidAmount, setPaidAmount] = useState(0);
  const [successOrder, setSuccessOrder] = useState(null);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('sweetflow_pos_store_id', selectedStoreId);
  }, [selectedStoreId]);

  useEffect(() => {
    localStorage.setItem('sweetflow_pos_cart', JSON.stringify(cart));
  }, [cart]);

  // Load stores and products
  useEffect(() => {
    fetchProducts();
    fetchStores();
  }, [fetchProducts, fetchStores]);

  // Selected store details
  const selectedStore = stores.find(s => s.id === selectedStoreId);

  // Filtered products list
  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Add to cart logic
  const addToCart = (product) => {
    const existingItem = cart.find(item => item.productId === product.id);

    if (existingItem) {
      updateCartItemQuantity(product.id, existingItem.quantity + 1);
    } else {
      // Verify if we have at least 1 box in stock
      if (product.quantityInBox > product.stockCount) {
        toast.error(`Zaxira yetarli emas! 1 quti uchun kamida ${product.quantityInBox} dona bo'lishi kerak. Omborda faqat ${product.stockCount} dona bor.`);
        return;
      }

      setCart((prev) => [
        ...prev,
        {
          productId: product.id,
          name: product.name,
          unitPrice: Number(product.unitPrice),
          boxPrice: Number(product.boxPrice),
          quantityInBox: product.quantityInBox,
          stockCount: product.stockCount,
          quantity: 1,
          unitType: 'BOX', // default to BOX
        }
      ]);
      toast.success(`${product.name} savatga qo'shildi!`, { icon: '🛒' });
    }
  };

  // Update item quantity in cart
  const updateCartItemQuantity = (productId, qty) => {
    if (qty <= 0) return;

    setCart((prev) =>
      prev.map(item => {
        if (item.productId !== productId) return item;

        // Verify stock limit
        let piecesNeeded = qty;
        if (item.unitType === 'BOX') {
          piecesNeeded = qty * item.quantityInBox;
        }

        if (piecesNeeded > item.stockCount) {
          toast.error(`Zaxira yetarli emas! Omborda faqat ${item.stockCount} dona mavjud.`);
          return item;
        }

        return { ...item, quantity: qty };
      })
    );
  };

  // Toggle unit type between BOX and PIECE
  const toggleUnitType = (productId, unitType) => {
    setCart((prev) =>
      prev.map(item => {
        if (item.productId !== productId) return item;

        // Check stock availability for new unit type
        let piecesNeeded = item.quantity;
        if (unitType === 'BOX') {
          piecesNeeded = item.quantity * item.quantityInBox;
        }

        if (piecesNeeded > item.stockCount) {
          toast.error(`Zaxira yetarli emas! Omborda faqat ${item.stockCount} dona mavjud.`);
          return item;
        }

        return { ...item, unitType };
      })
    );
  };

  // Remove from cart
  const removeFromCart = (productId) => {
    setCart((prev) => prev.filter(item => item.productId !== productId));
  };

  // Total invoice calculation
  const totalAmount = cart.reduce((total, item) => {
    const price = item.unitType === 'BOX' ? item.boxPrice : item.unitPrice;
    return total + (item.quantity * price);
  }, 0);

  const debtAmount = Math.max(0, totalAmount - paidAmount);

  // Submit transaction checkout
  const handleCheckout = async () => {
    if (!selectedStoreId) {
      toast.error('Iltimos, avval do\'konni tanlang!');
      return;
    }
    if (cart.length === 0) {
      toast.error('Savat bo\'sh!');
      return;
    }

    // Verify credit limit check beforehand
    if (debtAmount > 0) {
      const currentDebt = Number(selectedStore.currentDebt);
      const creditLimit = Number(selectedStore.creditLimit);
      if (currentDebt + debtAmount > creditLimit) {
        toast.error(`Tranzaksiya rad etildi! Qarz limiti oshib ketmoqda.\nJoriy qarz: ${currentDebt.toLocaleString()} so'm\nLimit: ${creditLimit.toLocaleString()} so'm`);
        return;
      }
    }

    const orderPayload = {
      storeId: selectedStoreId,
      paidAmount: Number(paidAmount),
      items: cart.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        unitType: item.unitType,
      })),
    };

    const res = await createOrder(orderPayload);
    if (res.success) {
      setSuccessOrder(res.order);
      setCart([]);
      setPaidAmount(0);
      setSelectedStoreId('');
      fetchProducts(); // Refresh stocks
      fetchStores(); // Refresh debts
      toast.success("Yuk xati muvaffaqiyatli rasmiylashtirildi!");
    } else {
      toast.error(`Xatolik yuz berdi: ${res.error}`);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-2 sm:gap-4 lg:gap-6 p-1.5 sm:p-4 lg:h-[calc(100vh-120px)]">
      {/* LEFT: Products Panel */}
      <div className="flex-1 w-full lg:w-2/3 flex flex-col space-y-2 sm:space-y-4 min-h-0">
        {/* Search controls */}
        <div className="relative max-w-md w-full md:w-96 shrink-0">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search size={18} />
          </div>
          
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Mahsulot nomi bo'yicha qidirish..."
            className="w-full pl-11 pr-10 py-2.5 bg-slate-900/90 border border-slate-700/80 rounded-xl text-slate-100 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition shadow-inner min-h-[40px]"
          />
          
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200 transition cursor-pointer"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Products Grid list */}
        <div className="flex-1 overflow-y-auto pr-1 min-h-0">
          <div className="grid grid-cols-2 sm:grid-cols-2 xl:grid-cols-3 gap-2 sm:gap-4">
            {filteredProducts.map((product) => {
              const isLowStock = product.stockCount <= product.minStockLimit;
              return (
                <div
                  key={product.id}
                  onClick={() => product.stockCount > 0 && addToCart(product)}
                  className={`glass-panel glass-card-hover rounded-xl sm:rounded-2xl p-2.5 sm:p-4 flex flex-col justify-between cursor-pointer border active:scale-[0.97] transition-transform ${
                    product.stockCount === 0 
                      ? 'opacity-40 cursor-not-allowed border-red-900/30' 
                      : isLowStock 
                        ? 'border-yellow-600/30' 
                        : 'border-transparent'
                  }`}
                >
                  {/* Row 1: Name + Category */}
                  <div className="space-y-0.5 sm:space-y-1 mb-1.5 sm:mb-2">
                    <h3 className="font-semibold text-white text-xs sm:text-sm line-clamp-1 leading-tight">{product.name}</h3>
                    <div className="text-[10px] sm:text-xs text-gray-500 flex items-center gap-1 flex-wrap">
                      <span className="text-gray-400">{product.category?.name || 'Oddiy'}</span>
                      <span className="text-gray-600">·</span>
                      <span className="text-gray-400">{product.quantityInBox} dona/quti</span>
                    </div>
                  </div>

                  {/* Row 2: Price & Stock - Compact 2-col grid */}
                  <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 pt-1.5 sm:pt-3 border-t border-white/5 text-[11px] sm:text-xs">
                    <div>
                      <span className="text-gray-500 block text-[9px] uppercase leading-tight">Dona</span>
                      <span className="font-bold text-white leading-tight">{Number(product.unitPrice).toLocaleString()} s.</span>
                    </div>
                    <div className="text-right">
                      <span className="text-gray-500 block text-[9px] uppercase leading-tight">Quti</span>
                      <span className="font-bold text-brand-300 leading-tight">{Number(product.boxPrice).toLocaleString()} s.</span>
                    </div>
                    <div className="col-span-2 mt-0.5">
                      <span className={`font-semibold ${isLowStock ? 'text-yellow-400' : 'text-green-400'} text-[10px] sm:text-xs`}>
                        {product.stockCount} dona ({Math.floor(product.stockCount / product.quantityInBox)} quti)
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* RIGHT: Cart & Billing Invoice Panel */}
      <div className="w-full lg:w-1/3 lg:max-w-md glass-panel rounded-2xl border border-white/5 flex flex-col min-h-0 lg:h-full">
        {/* Store Selector */}
        <div className="p-3 sm:p-4 border-b border-white/5 space-y-3">
          <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">Do'kon (Hamkor):</label>
          <div className="flex items-center space-x-2">
            <User size={18} className="text-brand-400 shrink-0" />
            <select
              value={selectedStoreId}
              onChange={(e) => setSelectedStoreId(e.target.value)}
              className="bg-slate-900 border border-white/10 rounded-xl text-white text-xs sm:text-sm focus:ring-brand-500 focus:border-brand-500 w-full p-2 min-h-[40px]"
            >
              <option value="">Hamkorni tanlang...</option>
              {stores.map(store => (
                <option key={store.id} value={store.id}>
                  {store.name} - (Qarzi: {Number(store.currentDebt).toLocaleString()} so'm)
                </option>
              ))}
            </select>
          </div>

          {selectedStore && (
            <div className="grid grid-cols-2 gap-2 text-xs bg-brand-950/20 rounded-xl p-3 border border-brand-500/10">
              <div className="min-w-0">Egasi: <span className="text-white font-semibold break-words">{selectedStore.ownerName}</span></div>
              <div className="min-w-0">Tel: <span className="text-white font-mono break-words">{selectedStore.phone}</span></div>
              <div className="min-w-0">Limit: <span className="text-white font-semibold break-words">{Number(selectedStore.creditLimit).toLocaleString()} s.</span></div>
              <div className="min-w-0">Nasiya: <span className="text-white font-semibold">{selectedStore.paymentDays} kun</span></div>
            </div>
          )}
        </div>

        {/* Cart items list */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 min-h-0">
          <div className="flex items-center justify-between text-xs text-gray-400 font-semibold uppercase">
            <div className="flex items-center space-x-2"><ShoppingCart size={14} /> <span>Savat</span></div>
            <span>{cart.length} xil mahsulot</span>
          </div>

          {cart.length === 0 ? (
            <div className="h-32 sm:h-40 flex flex-col justify-center items-center text-gray-500 text-sm">
              <ShoppingCart size={32} className="mb-2 opacity-30" />
              <span>Savat hozircha bo'sh</span>
            </div>
          ) : (
            cart.map((item) => {
              const price = item.unitType === 'BOX' ? item.boxPrice : item.unitPrice;
              const subtotal = item.quantity * price;
              return (
                <div key={item.productId} className="glass-card rounded-xl p-3 border border-white/5 space-y-2 w-full overflow-hidden">
                  <div className="flex justify-between items-start gap-2">
                    <span className="font-semibold text-xs sm:text-sm text-white min-w-0 truncate">{item.name}</span>
                    <button onClick={() => removeFromCart(item.productId)} className="text-red-400 hover:text-red-300 p-0.5 shrink-0">
                      <Trash2 size={14} />
                    </button>
                  </div>

                  <div className="flex flex-wrap justify-between items-center gap-2 text-xs">
                    <div className="flex bg-slate-900 rounded-lg p-0.5 border border-white/5">
                      <button
                        onClick={() => toggleUnitType(item.productId, 'BOX')}
                        className={`px-2 py-1 rounded-md flex items-center space-x-1 border text-xs ${item.unitType === 'BOX' ? 'bg-brand-500 text-white font-bold border-brand-400' : 'text-gray-400 border-transparent hover:border-white/10'}`}
                      >
                        <Box size={11} />
                        <span>Quti</span>
                      </button>
                      <button
                        onClick={() => toggleUnitType(item.productId, 'PIECE')}
                        className={`px-2 py-1 rounded-md flex items-center space-x-1 border text-xs ${item.unitType === 'PIECE' ? 'bg-brand-500 text-white font-bold border-brand-400' : 'text-gray-400 border-transparent hover:border-white/10'}`}
                      >
                        <Tag size={11} />
                        <span>Dona</span>
                      </button>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => updateCartItemQuantity(item.productId, item.quantity - 1)}
                        className="bg-slate-800 hover:bg-slate-700 text-white font-bold px-2 py-0.5 rounded border border-white/10 hover:border-white/20 min-h-[28px] min-w-[28px] flex items-center justify-center"
                      >
                        -
                      </button>
                      <span className="font-mono text-sm text-white">{item.quantity}</span>
                      <button
                        onClick={() => updateCartItemQuantity(item.productId, item.quantity + 1)}
                        className="bg-slate-800 hover:bg-slate-700 text-white font-bold px-2 py-0.5 rounded border border-white/10 hover:border-white/20 min-h-[28px] min-w-[28px] flex items-center justify-center"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-xs pt-1 border-t border-white/5 text-gray-400">
                    <span>Narxi: {price.toLocaleString()} s.</span>
                    <span className="font-bold text-white">{subtotal.toLocaleString()} so'm</span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Digital Billing Invoice Checkout Summary */}
        <div className="p-3 sm:p-4 border-t border-white/5 bg-slate-950/40 space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-xs sm:text-sm text-gray-400">
              <span>Jami summa:</span>
              <span className="font-semibold text-white">{totalAmount.toLocaleString()} so'm</span>
            </div>

            <div className="flex items-center justify-between text-xs sm:text-sm">
              <span className="text-gray-400">Naqd to'lov:</span>
              <div className="flex items-center space-x-1 border border-white/10 rounded-lg p-1 bg-slate-900 w-[130px] sm:w-[150px]">
                <input
                  type="number"
                  className="bg-transparent text-right border-0 p-0 text-xs sm:text-sm text-white focus:ring-0 w-full"
                  value={paidAmount || ''}
                  onChange={(e) => setPaidAmount(Number(e.target.value))}
                />
                <span className="text-xs text-gray-500 shrink-0">so'm</span>
              </div>
            </div>

            <div className="flex justify-between text-xs sm:text-sm font-bold border-t border-white/5 pt-2">
              <span className="text-brand-300">Nasiya (Qarz):</span>
              <span className="text-brand-400">{debtAmount.toLocaleString()} so'm</span>
            </div>
          </div>

          <button
            onClick={handleCheckout}
            disabled={cart.length === 0 || checkoutLoading}
            className="w-full bg-brand-500 hover:bg-brand-600 disabled:opacity-40 text-white py-3 rounded-xl font-bold transition flex items-center justify-center space-x-2 text-xs sm:text-sm border border-brand-400 shadow-lg shadow-brand-500/10 hover:shadow-brand-500/20 cursor-pointer min-h-[44px]"
          >
            <CreditCard size={18} />
            <span>{checkoutLoading ? 'Rasmiylashtirilmoqda...' : 'Yuk xati rasmiylashtirish'}</span>
          </button>
        </div>
      </div>

      {/* Digital Invoice Success Screen Modal Overlay */}
      {successOrder && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="glass-panel border-green-500/20 max-w-md w-full rounded-3xl p-5 sm:p-6 relative overflow-hidden my-auto max-h-[95vh] overflow-y-auto">
            <div className="absolute top-0 left-0 right-0 h-1 bg-green-500"></div>
            
            <div className="flex flex-col items-center text-center space-y-2 mb-6">
              <CheckCircle2 size={48} className="text-green-400" />
              <h2 className="text-lg sm:text-xl font-bold text-white">Yuk Xati Muvaffaqiyatli Saqlandi!</h2>
              <p className="text-xs text-gray-400">Raqamli Yuk Xati (Nakladnaya) tizimda rasmiylashtirildi</p>
            </div>

            <div className="bg-slate-900/60 rounded-2xl p-3 sm:p-4 border border-white/5 text-xs space-y-3 mb-6">
              <div className="flex justify-between gap-2"><span className="text-gray-400 shrink-0">Yuk Xati ID:</span> <span className="font-mono text-white truncate">{successOrder.id}</span></div>
              <div className="flex justify-between gap-2"><span className="text-gray-400 shrink-0">Do'kon:</span> <span className="font-semibold text-white truncate">{successOrder.store?.name}</span></div>
              <div className="flex justify-between gap-2"><span className="text-gray-400 shrink-0">Jami narx:</span> <span className="font-bold text-white">{Number(successOrder.totalAmount).toLocaleString()} so'm</span></div>
              <div className="flex justify-between gap-2"><span className="text-gray-400 shrink-0">Naqd to'landi:</span> <span className="text-green-400 font-semibold">{(Number(successOrder.totalAmount) - Number(successOrder.debtAmount)).toLocaleString()} so'm</span></div>
              <div className="flex justify-between gap-2"><span className="text-gray-400 shrink-0">Nasiya (Qarz):</span> <span className="text-red-400 font-bold">{Number(successOrder.debtAmount).toLocaleString()} so'm</span></div>
              <div className="flex justify-between gap-2"><span className="text-gray-400 shrink-0">To'lov muddati:</span> <span className="text-yellow-400 font-semibold">{new Date(successOrder.dueDate).toLocaleDateString()}</span></div>
            </div>

            <button
              onClick={() => setSuccessOrder(null)}
              className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded-xl transition text-sm border border-green-500 cursor-pointer min-h-[44px]"
            >
              Yopish
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
