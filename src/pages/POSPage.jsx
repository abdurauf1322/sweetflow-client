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
    <div className="flex flex-col lg:flex-row gap-2 sm:gap-4 lg:gap-6 p-1.5 sm:p-4 min-h-[100dvh] lg:min-h-0 lg:h-[calc(100vh-120px)] overflow-y-auto lg:overflow-hidden pb-24 lg:pb-4">
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
            className="w-full pl-11 pr-10 py-3 sm:py-3.5 bg-slate-900/90 border border-slate-700/80 rounded-2xl text-slate-100 placeholder-slate-400 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition shadow-inner min-h-[48px]"
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
                  className={`glass-panel glass-card-hover rounded-2xl sm:rounded-3xl p-3 sm:p-5 flex flex-col justify-between cursor-pointer border active:scale-[0.97] transition-transform ${
                    product.stockCount === 0 
                      ? 'opacity-40 cursor-not-allowed border-red-900/30' 
                      : isLowStock 
                        ? 'border-yellow-600/30' 
                        : 'border-transparent'
                  }`}
                >
                  {/* Row 1: Name + Category */}
                  <div className="space-y-1 mb-2 sm:mb-3">
                    <h3 className="font-bold text-white text-sm sm:text-base line-clamp-1 leading-tight">{product.name}</h3>
                    <div className="text-xs sm:text-sm text-gray-400 flex items-center gap-1 flex-wrap">
                      <span>{product.category?.name || 'Oddiy'}</span>
                      <span className="text-gray-600">·</span>
                      <span>{product.quantityInBox} dona/quti</span>
                    </div>
                  </div>

                  {/* Row 2: Price & Stock - Compact 2-col grid */}
                  <div className="grid grid-cols-2 gap-x-2 gap-y-1 pt-2 sm:pt-3 border-t border-white/5">
                    <div>
                      <span className="text-gray-500 block text-[10px] sm:text-xs uppercase leading-tight font-semibold">Dona</span>
                      <span className="font-bold text-white text-sm sm:text-base leading-tight">{Number(product.unitPrice).toLocaleString()} s.</span>
                    </div>
                    <div className="text-right">
                      <span className="text-gray-500 block text-[10px] sm:text-xs uppercase leading-tight font-semibold">Quti</span>
                      <span className="font-bold text-brand-300 text-sm sm:text-base leading-tight">{Number(product.boxPrice).toLocaleString()} s.</span>
                    </div>
                    <div className="col-span-2 mt-1">
                      <span className={`font-semibold ${isLowStock ? 'text-yellow-400' : 'text-green-400'} text-xs sm:text-sm`}>
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
        <div className="p-3 sm:p-5 border-b border-white/5 space-y-3">
          <label className="block text-xs sm:text-sm font-bold text-gray-400 uppercase tracking-wider">Do'kon (Hamkor):</label>
          <div className="flex items-center space-x-2">
            <User size={20} className="text-brand-400 shrink-0" />
            <select
              value={selectedStoreId}
              onChange={(e) => setSelectedStoreId(e.target.value)}
              className="bg-slate-900 border border-white/10 rounded-2xl text-white text-sm sm:text-base focus:ring-brand-500 focus:border-brand-500 w-full p-3 min-h-[48px]"
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
            <div className="grid grid-cols-2 gap-3 text-sm bg-brand-950/30 rounded-2xl p-4 border border-brand-500/10">
              <div className="min-w-0 text-gray-400">Egasi: <span className="text-white font-bold break-words block">{selectedStore.ownerName}</span></div>
              <div className="min-w-0 text-gray-400">Tel: <span className="text-white font-mono font-semibold break-words block">{selectedStore.phone}</span></div>
              <div className="min-w-0 text-gray-400">Limit: <span className="text-white font-bold break-words block">{Number(selectedStore.creditLimit).toLocaleString()} s.</span></div>
              <div className="min-w-0 text-gray-400">Nasiya: <span className="text-white font-bold block">{selectedStore.paymentDays} kun</span></div>
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
                <div key={item.productId} className="glass-card rounded-2xl p-3.5 sm:p-5 border border-white/5 space-y-3 w-full overflow-hidden">
                  <div className="flex justify-between items-start gap-2">
                    <span className="font-bold text-sm sm:text-base text-white min-w-0 truncate">{item.name}</span>
                    <button onClick={() => removeFromCart(item.productId)} className="text-red-400 hover:text-red-300 p-1 shrink-0 bg-red-400/10 rounded-lg">
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <div className="flex flex-wrap justify-between items-center gap-3 text-sm">
                    <div className="flex bg-slate-900 rounded-xl p-1 border border-white/5">
                      <button
                        onClick={() => toggleUnitType(item.productId, 'BOX')}
                        className={`px-3 py-1.5 rounded-lg flex items-center space-x-1.5 border text-xs sm:text-sm transition ${item.unitType === 'BOX' ? 'bg-brand-500 text-white font-bold border-brand-400 shadow-md' : 'text-gray-400 border-transparent hover:border-white/10 hover:text-gray-200'}`}
                      >
                        <Box size={14} />
                        <span>Quti</span>
                      </button>
                      <button
                        onClick={() => toggleUnitType(item.productId, 'PIECE')}
                        className={`px-3 py-1.5 rounded-lg flex items-center space-x-1.5 border text-xs sm:text-sm transition ${item.unitType === 'PIECE' ? 'bg-brand-500 text-white font-bold border-brand-400 shadow-md' : 'text-gray-400 border-transparent hover:border-white/10 hover:text-gray-200'}`}
                      >
                        <Tag size={14} />
                        <span>Dona</span>
                      </button>
                    </div>

                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => updateCartItemQuantity(item.productId, item.quantity - 1)}
                        className="bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-white font-bold px-3 py-1.5 rounded-xl border border-white/10 hover:border-white/20 min-h-[36px] min-w-[36px] flex items-center justify-center transition"
                      >
                        -
                      </button>
                      <span className="font-mono text-base font-bold text-white w-6 text-center">{item.quantity}</span>
                      <button
                        onClick={() => updateCartItemQuantity(item.productId, item.quantity + 1)}
                        className="bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-white font-bold px-3 py-1.5 rounded-xl border border-white/10 hover:border-white/20 min-h-[36px] min-w-[36px] flex items-center justify-center transition"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-sm pt-2 border-t border-white/5 text-gray-400 mt-1">
                    <span>Narxi: {price.toLocaleString()} s.</span>
                    <span className="font-bold text-white text-base">{subtotal.toLocaleString()} so'm</span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Digital Billing Invoice Checkout Summary */}
        <div className="p-4 sm:p-5 pb-32 sm:pb-5 border-t border-white/5 bg-slate-950/60 space-y-5 rounded-b-2xl">
          <div className="space-y-3">
            <div className="flex justify-between text-sm sm:text-base text-gray-400">
              <span>Jami summa:</span>
              <span className="font-bold text-white text-base sm:text-lg">{totalAmount.toLocaleString()} so'm</span>
            </div>

            <div className="flex items-center justify-between text-sm sm:text-base">
              <span className="text-gray-400">Naqd to'lov:</span>
              <div className="flex items-center space-x-2 border border-white/10 rounded-xl p-1.5 bg-slate-900 w-[140px] sm:w-[160px] focus-within:border-brand-500 focus-within:ring-1 focus-within:ring-brand-500 transition">
                <input
                  type="number"
                  className="bg-transparent text-right border-0 p-1 text-sm sm:text-base font-bold text-white focus:ring-0 w-full"
                  value={paidAmount || ''}
                  onChange={(e) => setPaidAmount(Number(e.target.value))}
                  placeholder="0"
                />
                <span className="text-sm font-semibold text-gray-500 shrink-0 pr-1">so'm</span>
              </div>
            </div>

            <div className="flex justify-between text-sm sm:text-base font-bold border-t border-white/10 pt-3 mt-1">
              <span className="text-brand-300">Nasiya (Qarz):</span>
              <span className="text-brand-400 text-base sm:text-lg">{debtAmount.toLocaleString()} so'm</span>
            </div>
          </div>

          <button
            onClick={handleCheckout}
            disabled={cart.length === 0 || checkoutLoading}
            className="w-full bg-brand-500 hover:bg-brand-600 disabled:opacity-40 text-white py-3.5 sm:py-4 rounded-2xl font-bold transition flex items-center justify-center space-x-2 text-sm sm:text-base border border-brand-400 shadow-lg shadow-brand-500/10 hover:shadow-brand-500/20 cursor-pointer min-h-[52px]"
          >
            <CreditCard size={20} />
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
