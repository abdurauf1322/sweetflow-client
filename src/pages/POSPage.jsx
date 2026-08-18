import React, { useState, useEffect, useRef } from 'react';
import { useProducts } from '../hooks/useProducts';
import { useStores } from '../hooks/useStores';
import { useOrders } from '../hooks/useOrders';
import { Search, ShoppingCart, Trash2, CheckCircle2, User, CreditCard, Tag, Box, X, Eye } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatNumberWithSpaces, parseNumberFromSpaces, getImageUrl, fallbackImage } from '../utils/format';
import { InvoicePrint } from '../components/InvoicePrint';


export const POSPage = () => {
  const { products, fetchProducts } = useProducts();
  const { stores, fetchStores } = useStores();
  const { createOrder, loading: checkoutLoading, error: checkoutError } = useOrders();

  const [selectedStoreId, setSelectedStoreId] = useState(() => {
    return localStorage.getItem('qandchi_bola_pos_store_id') || '';
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState(() => {
    try {
      const savedCart = localStorage.getItem('qandchi_bola_pos_cart');
      return savedCart ? JSON.parse(savedCart) : [];
    } catch (err) {
      return [];
    }
  });
  const [paidAmount, setPaidAmount] = useState('');
  const [discountType, setDiscountType] = useState('FIXED');
  const [discountValue, setDiscountValue] = useState('');
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
    localStorage.setItem('qandchi_bola_pos_store_id', selectedStoreId);
  }, [selectedStoreId]);

  useEffect(() => {
    localStorage.setItem('qandchi_bola_pos_cart', JSON.stringify(cart));
  }, [cart]);

  // Load stores and products
  useEffect(() => {
    fetchProducts();
    fetchStores();
  }, [fetchProducts, fetchStores]);

  // Selected store details
  const selectedStore = stores.find(s => s.id === selectedStoreId);

  // Filtered and sorted products list
  const filteredProducts = products
    .filter(product => product.name.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      const stockA = a.stockCount || 0;
      const stockB = b.stockCount || 0;
      
      // 1. Zaxirasi borlarni birinchi, tugaganlarni (0) oxiriga surish
      if (stockA > 0 && stockB === 0) return -1;
      if (stockA === 0 && stockB > 0) return 1;
      
      // 2. Ikkalasi ham bor yoki yo'q bo'lsa, nomi bo'yicha tartiblash
      return a.name.localeCompare(b.name);
    });

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

  const subtotalAmount = cart.reduce((total, item) => {
    const price = item.unitType === 'BOX' ? item.boxPrice : item.unitPrice;
    return total + (item.quantity * price);
  }, 0);

  const discountAmt = discountType === 'PERCENT'
    ? subtotalAmount * (Number(parseNumberFromSpaces(String(discountValue))) / 100)
    : Number(parseNumberFromSpaces(String(discountValue)));
    
  const validDiscountAmt = Math.min(subtotalAmount, isNaN(discountAmt) ? 0 : discountAmt);
  const totalAmount = Math.max(0, subtotalAmount - validDiscountAmt);

  // Real-time net cost and profit calculation
  const totalCost = cart.reduce((total, item) => {
    const cost = item.unitType === 'BOX'
      ? item.quantity * item.boxCostPrice
      : item.quantity * item.costPrice;
    return total + cost;
  }, 0);
  const netProfit = totalAmount - totalCost;

  const debtAmount = Math.max(0, totalAmount - parseNumberFromSpaces(String(paidAmount)));

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
      paidAmount: parseNumberFromSpaces(String(paidAmount)),
      discountType,
      discountValue: parseNumberFromSpaces(String(discountValue)),
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
      setPaidAmount('');
      setDiscountValue('');
      setDiscountType('FIXED');
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
        {/* Search controls & Mobile Toggle */}
        <div className="flex gap-2 shrink-0">
          <div className="relative max-w-md w-full md:w-96 shrink-0 flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500 dark:text-slate-400">
              <Search size={16} />
            </div>
            
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Mahsulot nomi bo'yicha qidirish..."
              className="w-full pl-9 pr-9 py-2 sm:py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition shadow-inner min-h-[40px]"
            />
            
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition cursor-pointer"
              >
                <X size={14} />
              </button>
            )}
          </div>
          
          {/* Mobile Catalog / Cart toggle button moved from App.jsx */}
          <button
            onClick={() => {
              const event = new CustomEvent('toggle-pos-view');
              window.dispatchEvent(event);
            }}
            className="flex min-[500px]:hidden items-center justify-center gap-1.5 px-3 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-[10px] font-bold tracking-wide transition border border-brand-400 shadow-lg min-h-[40px] cursor-pointer shrink-0"
          >
            <ShoppingCart size={14} className="shrink-0" />
            <span>Savat / Katalog</span>
          </button>
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
                    className="absolute top-1.5 right-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-gray-300 rounded-lg transition border border-slate-200 dark:border-white/5 shadow-sm z-10"
                    title="Rasmni ko'rish"
                  >
                    <Eye size={14} />
                  </button>

                  {/* Product Image Thumbnail */}
                  <div className="w-full h-20 sm:h-24 rounded-lg overflow-hidden bg-white/60 dark:bg-slate-900/60 border border-slate-200 dark:border-white/5 mb-1.5 flex items-center justify-center">
                    {product.imageUrl ? (
                      <img 
                        src={getImageUrl(product.imageUrl)} 
                        alt={product.name} 
                        className="h-full w-full object-cover" 
                        onError={(e) => { e.target.onerror = null; e.target.src = fallbackImage; }} 
                      />
                    ) : (
                      <Box size={24} className="text-slate-500 dark:text-slate-400 dark:text-gray-600" />
                    )}
                  </div>
                  
                  {/* Row 1: Name + Category */}
                  <div className="space-y-0.5 mb-1 sm:mb-1.5 pr-6">
                    <h3 className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm line-clamp-1 leading-tight">{product.name}</h3>
                    <div className="text-[10px] sm:text-xs text-slate-500 dark:text-gray-400 flex items-center gap-1 flex-wrap">
                      <span>{product.category?.name || 'Oddiy'}</span>
                      <span className="text-slate-500 dark:text-slate-400 dark:text-gray-600">·</span>
                      <span>{product.quantityInBox} dona/quti</span>
                    </div>
                  </div>

                  {/* Row 2: Price & Stock - Compact 2-col grid */}
                  <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 pt-1.5 sm:pt-2 border-t border-slate-200 dark:border-white/5">
                    <div>
                      <span className="text-slate-500 dark:text-gray-500 block text-[9px] sm:text-[10px] uppercase leading-tight font-semibold">Dona</span>
                      <span className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm leading-tight">{Number(product.unitPrice).toLocaleString()} s.</span>
                    </div>
                    <div className="text-right">
                      <span className="text-slate-500 dark:text-gray-500 block text-[9px] sm:text-[10px] uppercase leading-tight font-semibold">Quti</span>
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
      <div className={`w-full lg:w-1/3 lg:max-w-md glass-panel rounded-2xl border border-slate-200 dark:border-white/5 flex flex-col lg:h-full ${activeMobileTab === 'catalog' ? 'hidden min-[500px]:flex min-h-0' : 'flex min-h-[calc(100vh-140px)] lg:min-h-0 justify-between'}`}>
        {/* Back to Catalog button for mobile */}
        <div className="flex min-[500px]:hidden items-center justify-between p-2.5 border-b border-slate-200 dark:border-white/5 bg-slate-100 dark:bg-slate-950/20">
          <button
            type="button"
            onClick={() => setActiveMobileTab('catalog')}
            className="flex items-center space-x-1 text-xs text-brand-400 font-bold hover:text-brand-300 transition cursor-pointer"
          >
            <span>← Mahsulotlar katalogi</span>
          </button>
          <span className="text-xs text-slate-500 dark:text-gray-400 font-bold uppercase">{selectedStore?.name || 'Savat'}</span>
        </div>

        {/* Store Selector */}
        <div className="p-2.5 sm:p-3 border-b border-slate-200 dark:border-white/5 space-y-2">
          <label className="block text-[10px] sm:text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider">Do'kon (Hamkor):</label>
          <div className="flex items-center space-x-1.5">
            <User size={16} className="text-brand-400 shrink-0" />
            <select
              value={selectedStoreId}
              onChange={(e) => setSelectedStoreId(e.target.value)}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl text-xs sm:text-sm focus:ring-brand-500 focus:border-brand-500 w-full p-2 min-h-[38px]"
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
              <div className="min-w-0 text-slate-500 dark:text-gray-400 truncate">Egasi: <span className="text-slate-900 dark:text-white font-bold">{selectedStore.ownerName}</span></div>
              <div className="min-w-0 text-slate-500 dark:text-gray-400 truncate">Tel: <span className="text-slate-900 dark:text-white font-mono font-semibold">{selectedStore.phone}</span></div>
              <div className="min-w-0 text-slate-500 dark:text-gray-400 truncate">Limit: <span className="text-slate-900 dark:text-white font-bold">{Number(selectedStore.creditLimit).toLocaleString()} s.</span></div>
              <div className="min-w-0 text-slate-500 dark:text-gray-400 truncate">Nasiya: <span className="text-slate-900 dark:text-white font-bold">{selectedStore.paymentDays} kun</span></div>
            </div>
          )}
        </div>

        {/* Cart items list */}
        <div className="flex-1 overflow-y-auto p-2 sm:p-3 space-y-2 min-h-0 scrollbar-thin">
          <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-gray-400 font-semibold uppercase">
            <div className="flex items-center space-x-1.5"><ShoppingCart size={12} /> <span>Savat</span></div>
            <span>{cart.length} xil</span>
          </div>

          {cart.length === 0 ? (
            <div className="h-24 sm:h-32 flex flex-col justify-center items-center text-slate-500 dark:text-gray-500 text-xs">
              <ShoppingCart size={24} className="mb-2 opacity-30" />
              <span>Savat hozircha bo'sh</span>
            </div>
          ) : (
            cart.map((item) => {
              const price = item.unitType === 'BOX' ? item.boxPrice : item.unitPrice;
              const subtotal = item.quantity * price;
              return (
                <div key={item.productId} className="glass-card rounded-xl p-1.5 px-2 border border-slate-200 dark:border-white/5 flex flex-col gap-1 w-full overflow-hidden">
                  {/* Row 1: Image, Name, and Delete Button */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center space-x-2.5 min-w-0">
                      <div className="w-10 h-10 rounded-lg overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 flex items-center justify-center shrink-0">
                        {item.imageUrl ? (
                          <img src={getImageUrl(item.imageUrl)} alt={item.name} className="h-full w-full object-cover" onError={(e) => { e.target.onerror = null; e.target.src = fallbackImage; }} />
                        ) : (
                          <Box size={16} className="text-slate-500 dark:text-slate-400 dark:text-gray-600" />
                        )}
                      </div>
                      <span className="font-bold text-sm text-slate-900 dark:text-white truncate" title={item.name}>{item.name}</span>
                    </div>
                    <button onClick={() => removeFromCart(item.productId)} className="text-red-400 hover:text-red-300 p-1.5 shrink-0 bg-red-400/5 hover:bg-red-400/10 rounded-md transition">
                      <X size={16} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between gap-3 text-xs border-t border-slate-200 dark:border-white/5 pt-2 mt-1">
                    {/* Unit selector */}
                    <div className="flex bg-slate-50 dark:bg-slate-950 rounded-lg p-1 border border-slate-200 dark:border-white/5 shrink-0">
                      <button
                        type="button"
                        onClick={() => toggleUnitType(item.productId, 'BOX')}
                        className={`px-2.5 py-1.5 rounded-md flex items-center space-x-1 transition ${item.unitType === 'BOX' ? 'bg-brand-500 text-white font-bold border-brand-400 shadow-sm' : 'text-slate-500 dark:text-gray-400 border-transparent hover:text-slate-700 dark:hover:text-gray-200'}`}
                      >
                        <Box size={14} />
                        <span className="text-xs">Quti</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleUnitType(item.productId, 'PIECE')}
                        className={`px-2.5 py-1.5 rounded-md flex items-center space-x-1 transition ${item.unitType === 'PIECE' ? 'bg-brand-500 text-white font-bold border-brand-400 shadow-sm' : 'text-slate-500 dark:text-gray-400 border-transparent hover:text-slate-700 dark:hover:text-gray-200'}`}
                      >
                        <Tag size={14} />
                        <span className="text-xs">Dona</span>
                      </button>
                    </div>

                    {/* Quantity counter */}
                    <div className="flex items-center space-x-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => updateCartItemQuantity(item.productId, item.quantity - 1)}
                        className="bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 active:bg-slate-600 text-slate-900 dark:text-white font-bold w-9 h-9 rounded-lg border border-slate-200 dark:border-white/10 flex items-center justify-center transition text-base shadow-sm"
                      >
                        -
                      </button>
                      <span className="font-mono font-bold text-slate-900 dark:text-white w-6 text-center text-sm">{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() => updateCartItemQuantity(item.productId, item.quantity + 1)}
                        className="bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 active:bg-slate-600 text-slate-900 dark:text-white font-bold w-9 h-9 rounded-lg border border-slate-200 dark:border-white/10 flex items-center justify-center transition text-base shadow-sm"
                      >
                        +
                      </button>
                    </div>

                    {/* Total Subtotal */}
                    <span className="font-black text-slate-900 dark:text-white text-sm sm:text-base whitespace-nowrap text-right flex-1 truncate">
                      {subtotal.toLocaleString()} s.
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Digital Billing Invoice Checkout Summary */}
        <div className="p-3 sm:p-4 pb-20 lg:pb-3 border-t border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-slate-950/80 space-y-3 rounded-b-2xl">
          <div className="space-y-2 my-1">
            <div className="flex justify-between items-center text-sm text-slate-700 dark:text-gray-300 border-b border-slate-200 dark:border-white/5 pb-2">
              <span className="font-medium">Jami (chegirmasiz):</span>
              <span className="font-bold text-slate-900 dark:text-white text-base">{subtotalAmount.toLocaleString()} so'm</span>
            </div>

            <div className="flex items-center justify-between text-sm py-1">
              <span className="text-slate-700 dark:text-gray-300 font-medium">Chegirma:</span>
              <div className="flex items-center space-x-2 border border-slate-200 dark:border-white/10 rounded-xl bg-white dark:bg-slate-900 w-[160px] sm:w-[180px] focus-within:border-brand-500 transition shadow-inner">
                <input
                  type="text"
                  className="bg-transparent text-right border-0 p-1 text-sm font-bold text-brand-500 focus:ring-0 w-full rounded-l-xl pl-2"
                  value={discountValue}
                  onChange={(e) => setDiscountValue(discountType === 'FIXED' ? formatNumberWithSpaces(e.target.value) : e.target.value.replace(/[^0-9.]/g, ''))}
                  placeholder="0"
                />
                <button
                  onClick={() => {
                    setDiscountType(prev => prev === 'FIXED' ? 'PERCENT' : 'FIXED');
                    setDiscountValue('');
                  }}
                  className="px-2 py-1 bg-brand-100 dark:bg-brand-900/50 text-brand-600 dark:text-brand-400 font-bold text-xs rounded-r-xl border-l border-slate-200 dark:border-white/10 hover:bg-brand-200 dark:hover:bg-brand-800 transition cursor-pointer"
                  title="Chegirma turini o'zgartirish"
                >
                  {discountType === 'FIXED' ? 'UZS' : '%'}
                </button>
              </div>
            </div>

            <div className="flex justify-between items-center text-sm text-slate-700 dark:text-gray-300 border-b border-slate-200 dark:border-white/5 pb-2">
              <span className="font-medium">To'lanishi kerak:</span>
              <span className="font-black text-slate-900 dark:text-white text-base sm:text-lg">{totalAmount.toLocaleString()} so'm</span>
            </div>

            <div className="flex items-center justify-between text-sm py-1">
              <span className="text-slate-700 dark:text-gray-300 font-medium">Naqd to'lov:</span>
              <div className="flex items-center space-x-2 border border-slate-200 dark:border-white/10 rounded-xl px-2 py-1 bg-white dark:bg-slate-900 w-[140px] sm:w-[160px] focus-within:border-brand-500 transition shadow-inner">
                <input
                  type="text"
                  className="bg-transparent text-right border-0 p-1 text-sm font-bold text-slate-900 dark:text-white focus:ring-0 w-full"
                  value={paidAmount}
                  onChange={(e) => setPaidAmount(formatNumberWithSpaces(e.target.value))}
                  placeholder="0"
                />
                <span className="text-xs font-semibold text-slate-500 dark:text-gray-500 shrink-0">so'm</span>
              </div>
            </div>

            <div className="flex justify-between text-sm font-bold border-t border-slate-200 dark:border-white/10 pt-3 mt-1">
              <span className="text-brand-300">Nasiya (Qarz):</span>
              <span className="text-brand-400 text-base">{debtAmount.toLocaleString()} so'm</span>
            </div>
          </div>

          <button
            onClick={handleCheckout}
            disabled={cart.length === 0 || checkoutLoading}
            className="w-full py-4 text-base font-bold bg-blue-600 hover:bg-blue-500 active:scale-95 disabled:opacity-40 disabled:active:scale-100 text-white rounded-xl transition-all flex items-center justify-center space-x-2 shadow-lg shadow-blue-500/20 border border-blue-500 cursor-pointer"
          >
            <CreditCard size={18} />
            <span>{checkoutLoading ? 'Rasmiylashtirilmoqda...' : 'Yuk xati rasmiylashtirish'}</span>
          </button>
        </div>
      </div>

      {/* Digital Invoice Success Screen Modal Overlay */}
      {successOrder && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="glass-panel border border-slate-200 dark:border-white/10 w-full sm:max-w-md md:max-w-2xl rounded-2xl shadow-2xl p-4 sm:p-6 my-auto max-h-[90vh] flex flex-col relative overflow-hidden animate-slide-up">
            <div className="absolute top-0 left-0 right-0 h-1 bg-green-500"></div>
            
            <div className="flex flex-col items-center text-center space-y-2 mb-6">
              <CheckCircle2 size={48} className="text-green-400" />
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">Yuk Xati Muvaffaqiyatli Saqlandi!</h2>
              <p className="text-xs text-slate-500 dark:text-gray-400">Raqamli Yuk Xati (Nakladnaya) tizimda rasmiylashtirildi</p>
            </div>

            <div className="bg-white/60 dark:bg-slate-900/60 rounded-2xl p-3 sm:p-4 border border-slate-200 dark:border-white/5 text-xs space-y-3 mb-6">
              <div className="flex justify-between gap-2"><span className="text-slate-500 dark:text-gray-400 shrink-0">Yuk Xati ID:</span> <span className="font-mono text-slate-900 dark:text-white truncate">{successOrder.id}</span></div>
              <div className="flex justify-between gap-2"><span className="text-slate-500 dark:text-gray-400 shrink-0">Do'kon:</span> <span className="font-semibold text-slate-900 dark:text-white truncate">{successOrder.store?.name}</span></div>
              <div className="flex justify-between gap-2"><span className="text-slate-500 dark:text-gray-400 shrink-0">Dastlabki narx:</span> <span className="font-semibold text-slate-900 dark:text-white">{Number(successOrder.subtotal || successOrder.totalAmount).toLocaleString()} so'm</span></div>
              {Number(successOrder.discountAmount) > 0 && (
                <div className="flex justify-between gap-2"><span className="text-slate-500 dark:text-gray-400 shrink-0">Chegirma:</span> <span className="font-bold text-brand-500">-{Number(successOrder.discountAmount).toLocaleString()} so'm</span></div>
              )}
              <div className="flex justify-between gap-2"><span className="text-slate-500 dark:text-gray-400 shrink-0">Jami narx:</span> <span className="font-bold text-slate-900 dark:text-white">{Number(successOrder.totalAmount).toLocaleString()} so'm</span></div>
              <div className="flex justify-between gap-2"><span className="text-slate-500 dark:text-gray-400 shrink-0">Naqd to'landi:</span> <span className="text-green-400 font-semibold">{(Number(successOrder.totalAmount) - Number(successOrder.debtAmount)).toLocaleString()} so'm</span></div>
              <div className="flex justify-between gap-2"><span className="text-slate-500 dark:text-gray-400 shrink-0">Nasiya (Qarz):</span> <span className="text-red-400 font-bold">{Number(successOrder.debtAmount).toLocaleString()} so'm</span></div>

              <div className="flex justify-between gap-2"><span className="text-slate-500 dark:text-gray-400 shrink-0">To'lov muddati:</span> <span className="text-yellow-400 font-semibold">{new Date(successOrder.dueDate).toLocaleDateString()}</span></div>
            </div>

            <div className="flex space-x-3 w-full">
              <button
                onClick={() => window.print()}
                className="flex-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-white font-bold py-3 rounded-xl transition text-sm border border-slate-300 dark:border-slate-600 cursor-pointer min-h-[44px] print:hidden"
              >
                Chop etish (Print)
              </button>
              <button
                onClick={() => setSuccessOrder(null)}
                className="flex-1 bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded-xl transition text-sm border border-green-500 cursor-pointer min-h-[44px] print:hidden"
              >
                Yopish
              </button>
            </div>
            
            {/* Hidden Print Area */}
            <InvoicePrint order={successOrder} store={successOrder.store} />
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
            className="glass-panel border-slate-200 dark:border-white/10 max-w-sm w-full rounded-3xl p-5 relative flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setPreviewProduct(null)}
              className="absolute top-3 right-3 p-2 bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-gray-300 rounded-full transition"
            >
              <X size={20} />
            </button>
            <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-4 pr-6 text-center w-full truncate">{previewProduct.name}</h3>
            
            <div className="w-full aspect-square bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/10 flex items-center justify-center overflow-hidden">
              {previewProduct.imageUrl ? (
                <img 
                  src={getImageUrl(previewProduct.imageUrl)} 
                  alt={previewProduct.name}
                  className="w-full h-full object-cover"
                  onError={(e) => { e.target.onerror = null; e.target.src = fallbackImage; }}
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-slate-500 dark:text-gray-500">
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
          className="fixed bottom-4 left-4 right-4 z-50 min-[500px]:hidden flex items-center justify-between px-5 py-3.5 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-blue-500/30 rounded-2xl shadow-2xl shadow-black active:scale-[0.98] transition-all duration-200 cursor-pointer"
        >
          <div className="flex items-center gap-2.5 text-slate-900 dark:text-white font-medium text-sm">
            <ShoppingCart className="w-5 h-5 text-blue-400" />
            <span>Savat</span>
            <span className="px-2 py-0.5 text-xs font-bold bg-blue-600 text-white rounded-full">
              {cart.reduce((total, item) => total + item.quantity, 0)} ta
            </span>
          </div>
          <div className="text-base font-bold text-slate-900 dark:text-white tracking-wide">
            {totalAmount.toLocaleString()} so'm
          </div>
        </button>
      )}

    </div>
  );
};
