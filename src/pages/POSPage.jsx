import React, { useState, useEffect, useRef } from 'react';
import { useProducts } from '../hooks/useProducts';
import { useStores } from '../hooks/useStores';
import { useOrders } from '../hooks/useOrders';
import { Search, ShoppingCart, Trash2, CheckCircle2, User, CreditCard, Tag, Box, X, Eye } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatNumberWithSpaces, parseNumberFromSpaces, getImageUrl, fallbackImage } from '../utils/format';


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
  const [paidAmount, setPaidAmount] = useState('');
  const [successOrder, setSuccessOrder] = useState(null);
  const [previewProduct, setPreviewProduct] = useState(null);
  const [activeMobileTab, setActiveMobileTab] = useState('catalog'); // 'catalog' or 'cart'

  useEffect(() => {
    const handleToggle = () => {
      setActiveMobileTab(prev => prev === 'catalog' ? 'cart' : 'catalog');
    };
    window.addEventListener('toggle-pos-view', handleToggle);
    return () => window.removeEventListener('toggle-pos-view', handleToggle);
  }, []);

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
          costPrice: Number(product.costPrice || 0),
          boxCostPrice: Number(product.boxCostPrice || 0),
          quantityInBox: product.quantityInBox,
          stockCount: product.stockCount,
          quantity: 1,
          unitType: 'BOX', // default to BOX
          imageUrl: product.imageUrl,
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

  const totalAmount = cart.reduce((total, item) => {
    const price = item.unitType === 'BOX' ? item.boxPrice : item.unitPrice;
    return total + (item.quantity * price);
  }, 0);

  // Real-time net cost and profit calculation
  const totalCost = cart.reduce((total, item) => {
    const cost = item.unitType === 'BOX'
      ? item.quantity * item.boxCostPrice
      : item.quantity * item.costPrice;
    return total + cost;
  }, 0);
  const netProfit = totalAmount - totalCost;

  const debtAmount = Math.max(0, totalAmount - parseNumberFromSpaces(paidAmount));

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
      paidAmount: parseNumberFromSpaces(paidAmount),
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
    <div className="flex flex-col lg:flex-row gap-2 sm:gap-3 lg:gap-4 p-1.5 sm:p-3 min-h-[100dvh] lg:min-h-0 lg:h-[calc(100vh-120px)] overflow-y-auto lg:overflow-hidden pb-24 lg:pb-4">
      {/* LEFT: Products Panel */}
      <div className={`flex-1 w-full lg:w-2/3 flex flex-col space-y-2 sm:space-y-3 min-h-0 ${activeMobileTab === 'cart' ? 'hidden min-[500px]:flex' : 'flex'}`}>
        {/* Search controls */}
        <div className="relative max-w-md w-full md:w-96 shrink-0">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search size={16} />
          </div>
          
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Mahsulot nomi bo'yicha qidirish..."
            className="w-full pl-9 pr-9 py-2 sm:py-2.5 bg-slate-900/90 border border-slate-700/80 rounded-xl text-slate-100 placeholder-slate-400 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition shadow-inner min-h-[40px]"
          />
          
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-200 transition cursor-pointer"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Products Grid list */}
        <div className="flex-1 overflow-y-auto pr-1 min-h-0">
          <div className="grid grid-cols-2 sm:grid-cols-2 xl:grid-cols-3 gap-2 sm:gap-3">
            {filteredProducts.map((product) => {
              const isLowStock = product.stockCount <= product.minStockLimit;
              return (
                <div
                  key={product.id}
                  onClick={() => product.stockCount > 0 && addToCart(product)}
                  className={`relative glass-panel glass-card-hover rounded-xl sm:rounded-2xl p-2.5 sm:p-3 flex flex-col justify-between cursor-pointer border active:scale-[0.97] transition-transform ${
                    product.stockCount === 0 
                      ? 'opacity-40 cursor-not-allowed border-red-900/30' 
                      : isLowStock 
                        ? 'border-yellow-600/30' 
                        : 'border-transparent'
                  }`}
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setPreviewProduct(product);
                    }}
                    className="absolute top-1.5 right-1.5 p-1 bg-slate-800/80 hover:bg-slate-700 text-gray-300 rounded-lg transition border border-white/5 shadow-sm z-10"
                    title="Rasmni ko'rish"
                  >
                    <Eye size={14} />
                  </button>

                  {/* Product Image Thumbnail */}
                  <div className="w-full h-20 sm:h-24 rounded-lg overflow-hidden bg-slate-900/60 border border-white/5 mb-1.5 flex items-center justify-center">
                    {product.imageUrl ? (
                      <img 
                        src={getImageUrl(product.imageUrl)} 
                        alt={product.name} 
                        className="h-full w-full object-cover" 
                        onError={(e) => { e.target.onerror = null; e.target.src = fallbackImage; }} 
                      />
                    ) : (
                      <Box size={24} className="text-gray-600" />
                    )}
                  </div>
                  
                  {/* Row 1: Name + Category */}
                  <div className="space-y-0.5 mb-1 sm:mb-1.5 pr-6">
                    <h3 className="font-bold text-white text-xs sm:text-sm line-clamp-1 leading-tight">{product.name}</h3>
                    <div className="text-[10px] sm:text-xs text-gray-400 flex items-center gap-1 flex-wrap">
                      <span>{product.category?.name || 'Oddiy'}</span>
                      <span className="text-gray-600">·</span>
                      <span>{product.quantityInBox} dona/quti</span>
                    </div>
                  </div>

                  {/* Row 2: Price & Stock - Compact 2-col grid */}
                  <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 pt-1.5 sm:pt-2 border-t border-white/5">
                    <div>
                      <span className="text-gray-500 block text-[9px] sm:text-[10px] uppercase leading-tight font-semibold">Dona</span>
                      <span className="font-bold text-white text-xs sm:text-sm leading-tight">{Number(product.unitPrice).toLocaleString()} s.</span>
                    </div>
                    <div className="text-right">
                      <span className="text-gray-500 block text-[9px] sm:text-[10px] uppercase leading-tight font-semibold">Quti</span>
                      <span className="font-bold text-brand-300 text-xs sm:text-sm leading-tight">{Number(product.boxPrice).toLocaleString()} s.</span>
                    </div>
                    <div className="col-span-2 mt-0.5">
                      <span className={`font-semibold ${isLowStock ? 'text-yellow-400' : 'text-green-400'} text-[11px] sm:text-xs`}>
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
      <div className={`w-full lg:w-1/3 lg:max-w-md glass-panel rounded-2xl border border-white/5 flex flex-col min-h-0 lg:h-full ${activeMobileTab === 'catalog' ? 'hidden min-[500px]:flex' : 'flex'}`}>
        {/* Back to Catalog button for mobile */}
        <div className="flex min-[500px]:hidden items-center justify-between p-2.5 border-b border-white/5 bg-slate-950/20">
          <button
            type="button"
            onClick={() => setActiveMobileTab('catalog')}
            className="flex items-center space-x-1 text-xs text-brand-400 font-bold hover:text-brand-300 transition cursor-pointer"
          >
            <span>← Mahsulotlar katalogi</span>
          </button>
          <span className="text-xs text-gray-400 font-bold uppercase">{selectedStore?.name || 'Savat'}</span>
        </div>

        {/* Store Selector */}
        <div className="p-2.5 sm:p-3 border-b border-white/5 space-y-2">
          <label className="block text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider">Do'kon (Hamkor):</label>
          <div className="flex items-center space-x-1.5">
            <User size={16} className="text-brand-400 shrink-0" />
            <select
              value={selectedStoreId}
              onChange={(e) => setSelectedStoreId(e.target.value)}
              className="bg-slate-900 border border-white/10 rounded-xl text-xs sm:text-sm focus:ring-brand-500 focus:border-brand-500 w-full p-2 min-h-[38px]"
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
            <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[11px] bg-brand-950/30 rounded-lg p-2 border border-brand-500/10">
              <div className="min-w-0 text-gray-400 truncate">Egasi: <span className="text-white font-bold">{selectedStore.ownerName}</span></div>
              <div className="min-w-0 text-gray-400 truncate">Tel: <span className="text-white font-mono font-semibold">{selectedStore.phone}</span></div>
              <div className="min-w-0 text-gray-400 truncate">Limit: <span className="text-white font-bold">{Number(selectedStore.creditLimit).toLocaleString()} s.</span></div>
              <div className="min-w-0 text-gray-400 truncate">Nasiya: <span className="text-white font-bold">{selectedStore.paymentDays} kun</span></div>
            </div>
          )}
        </div>

        {/* Cart items list */}
        <div className="flex-1 max-h-[320px] lg:max-h-none overflow-y-auto p-2 sm:p-2.5 space-y-1.5 min-h-0 scrollbar-thin">
          <div className="flex items-center justify-between text-[10px] text-gray-400 font-semibold uppercase">
            <div className="flex items-center space-x-1.5"><ShoppingCart size={12} /> <span>Savat</span></div>
            <span>{cart.length} xil</span>
          </div>

          {cart.length === 0 ? (
            <div className="h-24 sm:h-32 flex flex-col justify-center items-center text-gray-500 text-xs">
              <ShoppingCart size={24} className="mb-2 opacity-30" />
              <span>Savat hozircha bo'sh</span>
            </div>
          ) : (
            cart.map((item) => {
              const price = item.unitType === 'BOX' ? item.boxPrice : item.unitPrice;
              const subtotal = item.quantity * price;
              return (
                <div key={item.productId} className="glass-card rounded-xl p-1.5 px-2 border border-white/5 flex flex-col gap-1 w-full overflow-hidden">
                  {/* Row 1: Image, Name, and Delete Button */}
                  <div className="flex items-center justify-between gap-1.5">
                    <div className="flex items-center space-x-1.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg overflow-hidden bg-slate-900 border border-white/5 flex items-center justify-center shrink-0">
                        {item.imageUrl ? (
                          <img src={getImageUrl(item.imageUrl)} alt={item.name} className="h-full w-full object-cover" onError={(e) => { e.target.onerror = null; e.target.src = fallbackImage; }} />
                        ) : (
                          <Box size={12} className="text-gray-600" />
                        )}
                      </div>
                      <span className="font-bold text-xs text-white truncate" title={item.name}>{item.name}</span>
                    </div>
                    <button onClick={() => removeFromCart(item.productId)} className="text-red-400 hover:text-red-300 p-0.5 shrink-0 bg-red-400/5 hover:bg-red-400/10 rounded-md transition">
                      <X size={12} />
                    </button>
                  </div>

                  {/* Row 2: Selector, Qty +/- controls, Subtotal Price */}
                  <div className="flex items-center justify-between gap-2 text-[11px] border-t border-white/5 pt-1">
                    {/* Unit selector */}
                    <div className="flex bg-slate-950 rounded-lg p-0.5 border border-white/5 shrink-0">
                      <button
                        type="button"
                        onClick={() => toggleUnitType(item.productId, 'BOX')}
                        className={`px-1.5 py-0.5 rounded flex items-center space-x-0.5 transition ${item.unitType === 'BOX' ? 'bg-brand-500 text-white font-bold border-brand-400 shadow-sm' : 'text-gray-400 border-transparent hover:text-gray-200'}`}
                      >
                        <Box size={10} />
                        <span className="text-[9px]">Quti</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleUnitType(item.productId, 'PIECE')}
                        className={`px-1.5 py-0.5 rounded flex items-center space-x-0.5 transition ${item.unitType === 'PIECE' ? 'bg-brand-500 text-white font-bold border-brand-400 shadow-sm' : 'text-gray-400 border-transparent hover:text-gray-200'}`}
                      >
                        <Tag size={10} />
                        <span className="text-[9px]">Dona</span>
                      </button>
                    </div>

                    {/* Quantity counter */}
                    <div className="flex items-center space-x-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => updateCartItemQuantity(item.productId, item.quantity - 1)}
                        className="bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-white font-bold w-5 h-5 rounded-md border border-white/10 flex items-center justify-center transition text-[10px]"
                      >
                        -
                      </button>
                      <span className="font-mono font-bold text-white w-4 text-center text-xs">{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() => updateCartItemQuantity(item.productId, item.quantity + 1)}
                        className="bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-white font-bold w-5 h-5 rounded-md border border-white/10 flex items-center justify-center transition text-[10px]"
                      >
                        +
                      </button>
                    </div>

                    {/* Total Subtotal */}
                    <span className="font-black text-white text-xs whitespace-nowrap text-right flex-1 truncate">
                      {subtotal.toLocaleString()} s.
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Digital Billing Invoice Checkout Summary */}
        <div className="p-2 sm:p-3 pb-20 lg:pb-2 border-t border-white/5 bg-slate-950/60 space-y-1.5 rounded-b-2xl">
          <div className="space-y-1 my-0.5">
            <div className="flex justify-between text-xs text-gray-400">
              <span>Jami summa:</span>
              <span className="font-bold text-white text-xs sm:text-sm">{totalAmount.toLocaleString()} so'm</span>
            </div>

            {cart.length > 0 && (
              <div className="flex justify-between text-[10px] text-gray-500 border-b border-white/5 pb-1">
                <span>Sof Foyda:</span>
                <span className={`font-semibold ${netProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {netProfit >= 0 ? '+' : ''}{netProfit.toLocaleString()} so'm
                </span>
              </div>
            )}

            <div className="flex items-center justify-between text-xs py-0.5">
              <span className="text-gray-400">Naqd to'lov:</span>
              <div className="flex items-center space-x-1 border border-white/10 rounded-md px-1 bg-slate-900 w-[100px] sm:w-[120px] focus-within:border-brand-500 transition">
                <input
                  type="text"
                  className="bg-transparent text-right border-0 p-0.5 text-xs font-bold text-white focus:ring-0 w-full"
                  value={paidAmount}
                  onChange={(e) => setPaidAmount(formatNumberWithSpaces(e.target.value))}
                  placeholder="0"
                />
                <span className="text-[10px] font-semibold text-gray-500 shrink-0">so'm</span>
              </div>
            </div>

            <div className="flex justify-between text-xs font-bold border-t border-white/10 pt-1.5 mt-0.5">
              <span className="text-brand-300">Nasiya (Qarz):</span>
              <span className="text-brand-400">{debtAmount.toLocaleString()} so'm</span>
            </div>
          </div>

          <button
            onClick={handleCheckout}
            disabled={cart.length === 0 || checkoutLoading}
            className="w-full bg-brand-500 hover:bg-brand-600 disabled:opacity-40 text-white py-2 sm:py-2.5 rounded-lg font-bold transition flex items-center justify-center space-x-1 text-xs border border-brand-400 shadow-lg cursor-pointer"
          >
            <CreditCard size={14} />
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
              <div className="flex justify-between gap-2"><span className="text-gray-400 shrink-0">Sof Foyda:</span> <span className={`font-bold ${successOrder.items?.reduce((t, item) => {
                const cost = item.unitType === 'BOX'
                  ? item.quantity * Number(item.product?.boxCostPrice || item.product?.costPrice || 0)
                  : item.quantity * Number(item.product?.costPrice || 0);
                return t + (Number(item.totalPrice) - cost);
              }, 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{successOrder.items?.reduce((t, item) => {
                const cost = item.unitType === 'BOX'
                  ? item.quantity * Number(item.product?.boxCostPrice || item.product?.costPrice || 0)
                  : item.quantity * Number(item.product?.costPrice || 0);
                return t + (Number(item.totalPrice) - cost);
              }, 0).toLocaleString()} so'm</span></div>
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
      {/* Image Preview Modal */}
      {previewProduct && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
          onClick={() => setPreviewProduct(null)}
        >
          <div 
            className="glass-panel border-white/10 max-w-sm w-full rounded-3xl p-5 relative flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setPreviewProduct(null)}
              className="absolute top-3 right-3 p-2 bg-slate-800/80 hover:bg-slate-700 text-gray-300 rounded-full transition"
            >
              <X size={20} />
            </button>
            <h3 className="font-bold text-lg text-white mb-4 pr-6 text-center w-full truncate">{previewProduct.name}</h3>
            
            <div className="w-full aspect-square bg-slate-900 rounded-2xl border border-white/10 flex items-center justify-center overflow-hidden">
              {previewProduct.imageUrl ? (
                <img 
                  src={getImageUrl(previewProduct.imageUrl)} 
                  alt={previewProduct.name}
                  className="w-full h-full object-cover"
                  onError={(e) => { e.target.onerror = null; e.target.src = fallbackImage; }}
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-gray-500">
                  <Eye size={48} className="mb-3 opacity-20" />
                  <span className="font-semibold text-sm">Rasm mavjud emas</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Sticky Bottom Go to Cart Button for Mobile */}
      {cart.length > 0 && activeMobileTab === 'catalog' && (
        <button
          onClick={() => setActiveMobileTab('cart')}
          className="fixed bottom-4 left-4 right-4 z-50 min-[500px]:hidden flex items-center justify-between px-5 py-3.5 bg-slate-900/95 backdrop-blur-md border border-blue-500/30 rounded-2xl shadow-2xl shadow-black active:scale-[0.98] transition-all duration-200 cursor-pointer"
        >
          <div className="flex items-center gap-2.5 text-white font-medium text-sm">
            <ShoppingCart className="w-5 h-5 text-blue-400" />
            <span>Savat</span>
            <span className="px-2 py-0.5 text-xs font-bold bg-blue-600 text-white rounded-full">
              {cart.reduce((total, item) => total + item.quantity, 0)} ta
            </span>
          </div>
          <div className="text-base font-bold text-white tracking-wide">
            {totalAmount.toLocaleString()} so'm
          </div>
        </button>
      )}

    </div>
  );
};
