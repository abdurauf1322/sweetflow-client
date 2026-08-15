import React, { useState, useEffect } from 'react';
import { useProducts } from '../hooks/useProducts';
import api from '../services/api';
import { formatNumberWithSpaces, parseNumberFromSpaces, getImageUrl, fallbackImage } from '../utils/format';

import { Search, Plus, Tag, Box, AlertTriangle, Layers, X, ClipboardList, Trash2, Pencil, DollarSign } from 'lucide-react';
import toast from 'react-hot-toast';

export const InventoryPage = () => {
  const { products, fetchProducts, addProduct, deleteProduct, updateProduct } = useProducts();

  const [activeTab, setActiveTab] = useState('all'); // 'all' or 'low'
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [categories, setCategories] = useState([]);

  // Dynamic Category addition states
  const [showAddCategoryInline, setShowAddCategoryInline] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);

  const [showEditCategoryInline, setShowEditCategoryInline] = useState(false);
  const [newEditCategoryName, setNewEditCategoryName] = useState('');
  const [isCreatingEditCategory, setIsCreatingEditCategory] = useState(false);


  // Add Form states
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [unitPrice, setUnitPrice] = useState('');
  const [boxPrice, setBoxPrice] = useState('');
  const [quantityInBox, setQuantityInBox] = useState('');
  const [costPrice, setCostPrice] = useState('');       // Dona tannarxi
  const [boxCostPrice, setBoxCostPrice] = useState(''); // Quti tannarxi
  const [initialPieceStock, setInitialPieceStock] = useState(0);
  const [initialBoxes, setInitialBoxes] = useState(0);
  const [imagePreview, setImagePreview] = useState('');
  const [imageFile, setImageFile] = useState(null);

  // Edit Form states
  const [editId, setEditId] = useState('');
  const [editName, setEditName] = useState('');
  const [editCategoryId, setEditCategoryId] = useState('');
  const [editUnitPrice, setEditUnitPrice] = useState('');
  const [editBoxPrice, setEditBoxPrice] = useState('');
  const [editQuantityInBox, setEditQuantityInBox] = useState('');
  const [editCostPrice, setEditCostPrice] = useState('');       // Dona tannarxi
  const [editBoxCostPrice, setEditBoxCostPrice] = useState(''); // Quti tannarxi
  const [editStockPieces, setEditStockPieces] = useState(0);
  const [editStockBoxes, setEditStockBoxes] = useState(0);
  const [editImagePreview, setEditImagePreview] = useState('');
  const [editImageFile, setEditImageFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  // Expense states
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseDescription, setExpenseDescription] = useState('');
  const [addingExpense, setAddingExpense] = useState(false);
  const isBoss = localStorage.getItem('role') === 'boss';
  const isManager = localStorage.getItem('role') === 'manager';

  const handleImageUpload = (e, isEdit = false) => {
    const file = e.target.files[0];
    if (file) {
      if (isEdit) {
        setEditImageFile(file);
      } else {
        setImageFile(file);
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        if (isEdit) {
          setEditImagePreview(reader.result);
        } else {
          setImagePreview(reader.result);
        }
      };
      reader.readAsDataURL(file);
    } else {
      if (!isEdit) {
        setImagePreview('');
      }
    }
  };

  const handleAddExpenseSubmit = async (e) => {
    e.preventDefault();
    const rawAmount = parseNumberFromSpaces(expenseAmount);
    if (!rawAmount || !expenseDescription.trim()) {
      toast.error("Barcha maydonlarni to'g'ri to'ldiring");
      return;
    }
    setAddingExpense(true);
    try {
      await api.post('/expenses', {
        amount: rawAmount,
        description: expenseDescription.trim(),
      });
      toast.success("Xarajat muvaffaqiyatli saqlandi va kassadan ayirildi!");
      setIsExpenseModalOpen(false);
      setExpenseAmount('');
      setExpenseDescription('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Xatolik yuz berdi');
    } finally {
      setAddingExpense(false);
    }
  };



  useEffect(() => {
    fetchProducts();
    loadCategories();
  }, [fetchProducts]);

  const loadCategories = async () => {
    try {
      const response = await api.get('/categories');
      setCategories(response.data.data.categories);
    } catch (err) {
      // Fallback: if no category API, seed a mock category
      setCategories([
        { id: 'mock-chocolate-uuid', name: 'Shokoladlar' },
        { id: 'mock-sweet-uuid', name: 'Marmeladlar' }
      ]);
    }
  };

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    if (!newCategoryName.trim()) {
      toast.error('Kategoriya nomini kiriting!');
      return;
    }
    setIsCreatingCategory(true);
    try {
      const response = await api.post('/categories', { name: newCategoryName.trim() });
      const newCat = response.data.data.category;
      
      // Update categories list
      setCategories(prev => [...prev, newCat].sort((a, b) => a.name.localeCompare(b.name)));
      
      // Select the newly created category
      setCategoryId(newCat.id);
      
      // Reset inline form
      setNewCategoryName('');
      setShowAddCategoryInline(false);
      toast.success("Kategoriya muvaffaqiyatli qo'shildi!");
    } catch (err) {
      toast.error(`Kategoriya qo'shishda xatolik: ${err.response?.data?.message || err.message}`);
    } finally {
      setIsCreatingCategory(false);
    }
  };

  const handleCreateEditCategory = async (e) => {
    e.preventDefault();
    if (!newEditCategoryName.trim()) {
      toast.error('Kategoriya nomini kiriting!');
      return;
    }
    setIsCreatingEditCategory(true);
    try {
      const response = await api.post('/categories', { name: newEditCategoryName.trim() });
      const newCat = response.data.data.category;
      
      // Update categories list
      setCategories(prev => [...prev, newCat].sort((a, b) => a.name.localeCompare(b.name)));
      
      // Select the newly created category in the edit form
      setEditCategoryId(newCat.id);
      
      // Reset inline form
      setNewEditCategoryName('');
      setShowEditCategoryInline(false);
      toast.success("Kategoriya muvaffaqiyatli qo'shildi!");
    } catch (err) {
      toast.error(`Kategoriya qo'shishda xatolik: ${err.response?.data?.message || err.message}`);
    } finally {
      setIsCreatingEditCategory(false);
    }
  };


  const handleRegisterProduct = async (e) => {
    e.preventDefault();

    if (!name || !categoryId || !unitPrice || !boxPrice || !quantityInBox || !costPrice || !boxCostPrice) {
      toast.error('Barcha maydonlarni to\'ldiring!');
      return;
    }

    const payload = new FormData();
    payload.append('name', name);
    payload.append('categoryId', categoryId);
    payload.append('unitPrice', parseNumberFromSpaces(unitPrice));
    payload.append('boxPrice', parseNumberFromSpaces(boxPrice));
    payload.append('quantityInBox', Number(quantityInBox));
    payload.append('costPrice', parseNumberFromSpaces(costPrice));
    payload.append('boxCostPrice', parseNumberFromSpaces(boxCostPrice));
    payload.append('stock', Number(initialPieceStock));
    payload.append('boxes', Number(initialBoxes));
    if (imageFile) {
      payload.append('image', imageFile);
    }

    setIsUploading(true);
    const res = await addProduct(payload);
    setIsUploading(false);
    if (res.success) {
      setName('');
      setCategoryId('');
      setUnitPrice('');
      setBoxPrice('');
      setQuantityInBox('');
      setCostPrice('');
      setBoxCostPrice('');
      setInitialPieceStock(0);
      setImagePreview('');
      setImageFile(null);

      setInitialBoxes(0);
      setShowAddForm(false);
      fetchProducts();
      toast.success("Mahsulot muvaffaqiyatli saqlandi!");
    } else {
      toast.error(`Xatolik yuz berdi: ${res.error}`);
    }
  };

  const handleDeleteProduct = async (id, name) => {
    if (window.confirm(`Haqiqatdan ham "${name}" mahsulotini o'chirmoqchimisiz?`)) {
      const res = await deleteProduct(id);
      if (res.success) {
        fetchProducts(); // Refresh list
        toast.success("Mahsulot o'chirildi!");
      } else {
        toast.error(`O'chirishda xatolik: ${res.error}`);
      }
    }
  };

  const handleEditClick = (product) => {
    if (!product) return;
    setEditId(product.id || '');
    setEditName(product.name || '');
    setEditCategoryId(product.categoryId || '');
    setEditUnitPrice(formatNumberWithSpaces(product.unitPrice || 0));
    setEditBoxPrice(formatNumberWithSpaces(product.boxPrice || 0));
    
    const qty = product.quantityInBox || 1; // Prevent division by zero
    const stock = product.stockCount || 0;
    
    setEditQuantityInBox(qty);
    setEditCostPrice(formatNumberWithSpaces(product.costPrice || 0));
    setEditBoxCostPrice(formatNumberWithSpaces(product.boxCostPrice || 0));
    
    // Start at 0 for adding stock (refilling)
    setEditStockPieces(0);
    setEditStockBoxes(0);
    
    // Safely set image preview string
    setEditImagePreview(typeof product.imageUrl === 'string' ? product.imageUrl : '');
    setEditImageFile(null);
    setShowEditForm(true);
  };



  const handleUpdateProduct = async (e) => {
    e.preventDefault();

    if (!editName || !editCategoryId || !editUnitPrice || !editBoxPrice || !editQuantityInBox || editCostPrice === '' || editBoxCostPrice === '') {
      toast.error('Barcha maydonlarni to\'ldiring!');
      return;
    }

    const payload = new FormData();
    payload.append('name', editName);
    payload.append('categoryId', editCategoryId);
    payload.append('unitPrice', parseNumberFromSpaces(editUnitPrice));
    payload.append('boxPrice', parseNumberFromSpaces(editBoxPrice));
    payload.append('quantityInBox', Number(editQuantityInBox));
    payload.append('costPrice', parseNumberFromSpaces(editCostPrice));
    payload.append('boxCostPrice', parseNumberFromSpaces(editBoxCostPrice));
    payload.append('stock', Number(editStockPieces));
    payload.append('boxes', Number(editStockBoxes));
    if (editImageFile) {
      payload.append('image', editImageFile);
    }



    setIsUploading(true);
    const res = await updateProduct(editId, payload);
    setIsUploading(false);
    if (res.success) {
      setShowEditForm(false);
      fetchProducts();
      toast.success("Mahsulot yangilandi!");
      setEditStockPieces(0);
      setEditStockBoxes(0);
    } else {
      toast.error(`Tahrirlashda xatolik yuz berdi: ${res.error}`);
    }
  };

  // Filter low stock products
  const lowStockProducts = products.filter(p => p.stockCount <= p.minStockLimit);

  // Filtered products list based on active tab and search query
  const displayedProducts = (activeTab === 'all' ? products : lowStockProducts).filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-4 sm:space-y-6 h-full flex flex-col p-2 sm:p-4">
      {/* Top statistics summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="glass-panel rounded-2xl p-4 sm:p-5 border border-white/5 flex items-center space-x-3 sm:space-x-4">
          <div className="bg-brand-500/10 p-2.5 sm:p-3 rounded-xl text-brand-400 shrink-0">
            <ClipboardList size={22} />
          </div>
          <div>
            <div className="text-[10px] sm:text-xs text-gray-400 uppercase tracking-wider font-semibold">Jami shirinliklar</div>
            <div className="text-lg sm:text-xl font-bold text-white mt-0.5">{products.length} xil</div>
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-4 sm:p-5 border border-white/5 flex items-center space-x-3 sm:space-x-4">
          <div className="bg-green-500/10 p-2.5 sm:p-3 rounded-xl text-green-400 shrink-0">
            <Box size={22} />
          </div>
          <div>
            <div className="text-[10px] sm:text-xs text-gray-400 uppercase tracking-wider font-semibold">Umumiy zaxira qoldig'i</div>
            <div className="text-lg sm:text-xl font-bold text-white mt-0.5">
              {products.reduce((acc, p) => acc + Math.floor((p.stockCount || 0) / (p.quantityInBox || 1)), 0).toLocaleString()} quti
            </div>
          </div>
        </div>

        <div className={`glass-panel rounded-2xl p-4 sm:p-5 border flex items-center space-x-3 sm:space-x-4 sm:col-span-2 lg:col-span-1 ${
          lowStockProducts.length > 0 ? 'border-yellow-500/20 bg-yellow-950/5' : 'border-white/5'
        }`}>
          <div className={`p-2.5 sm:p-3 rounded-xl shrink-0 ${lowStockProducts.length > 0 ? 'bg-yellow-500/10 text-yellow-400' : 'bg-gray-500/10 text-gray-400'}`}>
            <AlertTriangle size={22} />
          </div>
          <div>
            <div className="text-[10px] sm:text-xs text-gray-400 uppercase tracking-wider font-semibold">Kam qolgan mahsulotlar</div>
            <div className={`text-lg sm:text-xl font-bold mt-0.5 ${lowStockProducts.length > 0 ? 'text-yellow-400' : 'text-white'}`}>
              {lowStockProducts.length} xil
            </div>
          </div>
        </div>
      </div>

      {/* Control panel header */}
      <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4">
        {/* Tab switcher */}
        <div className="flex bg-slate-950/60 p-1 rounded-xl border border-white/5 w-full md:w-auto">
          <button
            onClick={() => setActiveTab('all')}
            className={`flex-1 md:flex-none text-center px-3 sm:px-4 py-2 sm:py-2 rounded-lg text-xs font-semibold transition border min-h-[38px] ${
              activeTab === 'all' ? 'bg-brand-500 text-white font-bold border-brand-400' : 'text-gray-400 hover:text-gray-300 border-transparent hover:border-white/10'
            }`}
          >
            Barchasi ({products.length})
          </button>
          <button
            onClick={() => setActiveTab('low')}
            className={`flex-1 md:flex-none text-center px-3 sm:px-4 py-2 sm:py-2 rounded-lg text-xs font-semibold transition flex items-center justify-center space-x-1.5 border min-h-[38px] ${
              activeTab === 'low' ? 'bg-yellow-600 text-white font-bold border-yellow-500' : 'text-gray-400 hover:text-gray-300 border-transparent hover:border-white/10'
            }`}
          >
            <AlertTriangle size={12} className="shrink-0" />
            <span>Kam Qolganlar ({lowStockProducts.length})</span>
          </button>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
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

          {(isBoss || isManager) && (
            <button
              onClick={() => setIsExpenseModalOpen(true)}
              className="bg-red-500/10 hover:bg-red-500/20 text-red-400 font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center space-x-2 shrink-0 border border-red-500/30 cursor-pointer transition min-h-[40px] w-full sm:w-auto"
            >
              <DollarSign size={14} />
              <span>Xarajat qo'shish</span>
            </button>
          )}

          <button
            onClick={() => setShowAddForm(true)}
            className="bg-brand-500 hover:bg-brand-600 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center space-x-2 shrink-0 border border-brand-400 cursor-pointer shadow-lg shadow-brand-500/10 hover:shadow-brand-500/20 min-h-[40px] w-full sm:w-auto"
          >
            <Plus size={14} />
            <span>Yangi mahsulot</span>
          </button>
        </div>
      </div>

      {/* Inventory Container */}
      <div className="flex-1 overflow-hidden glass-panel rounded-2xl border border-white/5 flex flex-col min-h-0">
        {/* Desktop Table (hidden on mobile < 640px) */}
        <div className="hidden sm:block overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-white/5 bg-slate-950/40 text-gray-400 uppercase tracking-wider font-semibold">
                <th className="p-4">Mahsulot nomi</th>
                <th className="p-4">Kategoriya</th>
                <th className="p-4">Qutidagi dona</th>
                <th className="p-4">Narxi (Dona / Quti)</th>
                <th className="p-4">Zaxira (Dona)</th>
                <th className="p-4">Zaxira (Quti)</th>
                <th className="p-4">Holat</th>
                <th className="p-4 text-center">Amallar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-gray-300">
              {displayedProducts.length === 0 ? (
                <tr>
                  <td colSpan="8" className="p-8 text-center text-gray-500 text-sm">
                    Hech qanday mahsulot topilmadi
                  </td>
                </tr>
              ) : (
                displayedProducts.map((product) => {
                  const isLow = product.stockCount <= product.minStockLimit;
                  const boxCount = Math.floor(product.stockCount / product.quantityInBox);
                  const pieceRem = product.stockCount % product.quantityInBox;

                  return (
                    <tr key={product.id} className="hover:bg-white/[0.02] transition">
                      <td className="p-4 font-semibold text-white">
                        <div className="flex items-center space-x-3">
                          <div className="h-10 w-10 shrink-0 rounded-lg overflow-hidden bg-slate-900 border border-white/5 flex items-center justify-center">
                            {product.imageUrl ? (
                              <img src={getImageUrl(product.imageUrl)} alt={product.name} className="h-full w-full object-cover" onError={(e) => { e.target.onerror = null; e.target.src = fallbackImage; }} />
                            ) : (
                              <Box size={16} className="text-gray-600" />
                            )}
                          </div>
                          <span>{product.name}</span>
                        </div>
                      </td>
                      <td className="p-4 text-gray-400">{product.category?.name || 'Noma\'lum'}</td>
                      <td className="p-4 text-gray-400">{product.quantityInBox} dona</td>
                      <td className="p-4 text-white text-xs">
                        <div className="text-[10px] text-gray-500">Tannarx: {Number(product.costPrice || 0).toLocaleString()} s.</div>
                        <div>
                          {Number(product.unitPrice).toLocaleString()} s. / <span className="text-brand-300 font-semibold">{Number(product.boxPrice).toLocaleString()} s.</span>
                        </div>
                      </td>

                      <td className="p-4 font-mono text-white">{product.stockCount} dona</td>
                      <td className="p-4 font-mono text-white">
                        {boxCount} quti {pieceRem > 0 && `+ ${pieceRem} dona`}
                      </td>
                      <td className="p-4">
                        <span className={`inline-block px-2 py-0.5 rounded-full font-bold text-[10px] uppercase border ${
                          product.stockCount === 0 
                            ? 'bg-red-500/20 text-red-400 border-red-500/30' 
                            : isLow
                              ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                              : 'bg-green-500/20 text-green-400 border-green-500/30'
                        }`}>
                          {product.stockCount === 0 ? 'Tugagan' : isLow ? 'Zaxira kam' : 'Yetarli'}
                        </span>
                      </td>
                      <td className="p-4 text-center whitespace-nowrap">
                        <button
                          onClick={() => handleEditClick(product)}
                          className="bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 p-2 rounded-xl transition border border-blue-500/20 hover:border-blue-500/40 cursor-pointer inline-flex items-center justify-center mr-2"
                          title="Tahrirlash"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(product.id, product.name)}
                          className="bg-red-500/10 hover:bg-red-500/20 text-red-400 p-2 rounded-xl transition border border-red-500/20 hover:border-red-500/40 cursor-pointer inline-flex items-center justify-center"
                          title="O'chirish"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Card List (visible on < 640px) */}
        <div className="block sm:hidden overflow-y-auto flex-1 p-3 space-y-3">
          {displayedProducts.length === 0 ? (
            <div className="p-8 text-center text-gray-500 text-sm">
              Hech qanday mahsulot topilmadi
            </div>
          ) : (
            displayedProducts.map((product) => {
              const isLow = product.stockCount <= product.minStockLimit;
              const boxCount = Math.floor(product.stockCount / product.quantityInBox);
              const pieceRem = product.stockCount % product.quantityInBox;

              return (
                <div key={product.id} className="w-full overflow-hidden p-4 rounded-xl border border-slate-700 bg-slate-800/90 space-y-3">
                  {/* Row 1: Name + Edit/Delete buttons */}
                  <div className="flex items-center justify-between gap-2 w-full">
                    <div className="flex items-center space-x-3 min-w-0 flex-1">
                      <div className="h-10 w-10 shrink-0 rounded-lg overflow-hidden bg-slate-900 border border-white/5 flex items-center justify-center">
                        {product.imageUrl ? (
                          <img src={getImageUrl(product.imageUrl)} alt={product.name} className="h-full w-full object-cover" onError={(e) => { e.target.onerror = null; e.target.src = fallbackImage; }} />
                        ) : (
                          <Box size={16} className="text-gray-600" />
                        )}
                      </div>
                      <h3 className="font-bold text-white text-sm leading-tight truncate">{product.name}</h3>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleEditClick(product)}
                        className="bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 p-2 rounded-lg transition border border-blue-500/20 hover:border-blue-500/40 cursor-pointer inline-flex items-center justify-center min-h-[36px] min-w-[36px]"
                        title="Tahrirlash"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(product.id, product.name)}
                        className="bg-red-500/10 hover:bg-red-500/20 text-red-400 p-2 rounded-lg transition border border-red-500/20 hover:border-red-500/40 cursor-pointer inline-flex items-center justify-center min-h-[36px] min-w-[36px]"
                        title="O'chirish"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Row 2: Category + Status Badge */}
                  <div className="flex items-center justify-between gap-2 w-full">
                    <span className="text-[10px] text-gray-400 font-medium bg-white/5 px-2 py-0.5 rounded-full truncate min-w-0">
                      {product.category?.name || 'Noma\'lum'}
                    </span>
                    <span className={`inline-block px-2 py-0.5 rounded-full font-bold text-[9px] uppercase border shrink-0 ${
                      product.stockCount === 0 
                        ? 'bg-red-500/20 text-red-400 border-red-500/30' 
                        : isLow
                          ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                          : 'bg-green-500/20 text-green-400 border-green-500/30'
                    }`}>
                      {product.stockCount === 0 ? 'Tugagan' : isLow ? 'Zaxira kam' : 'Yetarli'}
                    </span>
                  </div>

                  {/* Row 3: Prices & Stock in 2x2 Grid */}
                  <div className="grid grid-cols-2 gap-2 w-full p-2.5 bg-slate-900/50 rounded-lg text-xs">
                    <div className="min-w-0 col-span-2 border-b border-white/5 pb-1 mb-1">
                      <span className="text-gray-500 block text-[9px] uppercase tracking-wider">Tannarxi (dona)</span>
                      <span className="text-gray-400 font-semibold break-words">{Number(product.costPrice || 0).toLocaleString()} s.</span>
                    </div>
                    <div className="min-w-0">
                      <span className="text-gray-500 block text-[9px] uppercase tracking-wider">Dona narxi</span>
                      <span className="text-white font-semibold break-words">{Number(product.unitPrice).toLocaleString()} s.</span>
                    </div>

                    <div className="min-w-0">
                      <span className="text-gray-500 block text-[9px] uppercase tracking-wider">Zaxira (dona)</span>
                      <span className="text-white font-semibold font-mono break-words">{product.stockCount} dona</span>
                    </div>
                    <div className="min-w-0">
                      <span className="text-gray-500 block text-[9px] uppercase tracking-wider">Quti narxi</span>
                      <span className="text-brand-300 font-bold break-words">{Number(product.boxPrice).toLocaleString()} s.</span>
                    </div>
                    <div className="min-w-0">
                      <span className="text-gray-500 block text-[9px] uppercase tracking-wider">Zaxira (quti)</span>
                      <span className="text-white font-semibold font-mono break-words">
                        {boxCount} quti{pieceRem > 0 ? ` +${pieceRem}` : ''}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Add Sweet Product Modal Overlay */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="glass-panel border-white/10 max-w-md w-full rounded-2xl p-5 sm:p-6 relative my-auto max-h-[95vh] overflow-y-auto animate-fade-in">
            <button
              onClick={() => setShowAddForm(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              <X size={20} />
            </button>
            <h2 className="text-lg font-bold text-white mb-4 flex items-center space-x-2">
              <Layers className="text-brand-400" />
              <span>Yangi Mahsulot Qo'shish</span>
            </h2>

            <form onSubmit={handleRegisterProduct} className="space-y-4 text-sm text-gray-300">
              <div className="space-y-1">
                <label className="text-xs text-gray-400 block">Mahsulot Nomi:</label>
                <input
                  type="text"
                  required
                  placeholder="Masalan: Mars Miniatures, Snickers Box..."
                  className="bg-slate-900 border border-white/10 rounded-xl text-white w-full p-2.5 focus:ring-brand-500 focus:border-brand-500"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-gray-400 block">Kategoriya:</label>
                <div className="flex space-x-2">
                  <select
                    required
                    className="bg-slate-900 border border-white/10 rounded-xl text-white flex-1 p-2.5 focus:ring-brand-500"
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                  >
                    <option value="">Tanlang...</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setShowAddCategoryInline(!showAddCategoryInline)}
                    className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 p-2.5 rounded-xl transition border border-emerald-500/20 hover:border-emerald-500/40 cursor-pointer flex items-center justify-center shrink-0 min-h-[40px] w-[40px]"
                    title="Yangi kategoriya qo'shish"
                  >
                    <Plus size={20} />
                  </button>
                </div>

                {showAddCategoryInline && (
                  <div className="mt-2 p-3 bg-slate-950/40 rounded-xl border border-white/5 space-y-2">
                    <label className="text-[10px] text-gray-400 block uppercase tracking-wider font-semibold">Yangi kategoriya nomi:</label>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="text"
                        placeholder="Kategoriya nomi..."
                        className="bg-slate-900 border border-white/10 rounded-xl text-white flex-1 p-2 text-xs focus:ring-brand-500 focus:border-brand-500 min-h-[38px]"
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleCreateCategory(e);
                          }
                        }}
                      />
                      <div className="flex space-x-2 w-full sm:w-auto">
                        <button
                          type="button"
                          onClick={handleCreateCategory}
                          disabled={isCreatingCategory}
                          className="bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-semibold px-3 py-2 rounded-xl transition text-xs cursor-pointer border border-emerald-400 flex-1 sm:flex-none min-h-[38px] justify-center flex items-center"
                        >
                          {isCreatingCategory ? '...' : 'Saqlash'}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowAddCategoryInline(false);
                            setNewCategoryName('');
                          }}
                          className="bg-slate-800 hover:bg-slate-700 text-gray-300 font-semibold px-3 py-2 rounded-xl transition text-xs cursor-pointer border border-white/10 flex-1 sm:flex-none min-h-[38px] justify-center flex items-center"
                        >
                          Bekor
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Narxlar qismi: 2+2+1 ta maydon */}
              <div className="space-y-2">
                <div className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Tannarxlar (Xarid narxi)</div>
                <div className="grid grid-cols-2 gap-2 sm:gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] sm:text-xs text-gray-400 block">Dona tannarxi (s.):</label>
                    <input
                      type="text"
                      required
                      className="bg-slate-900 border border-white/10 rounded-xl text-white w-full p-2 focus:ring-brand-500 text-xs sm:text-sm"
                      value={costPrice}
                      onChange={(e) => setCostPrice(formatNumberWithSpaces(e.target.value))}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] sm:text-xs text-gray-400 block">Quti tannarxi (s.):</label>
                    <input
                      type="text"
                      required
                      className="bg-slate-900 border border-white/10 rounded-xl text-white w-full p-2 focus:ring-brand-500 text-xs sm:text-sm"
                      value={boxCostPrice}
                      onChange={(e) => setBoxCostPrice(formatNumberWithSpaces(e.target.value))}
                    />
                  </div>
                </div>
                <div className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold mt-1">Sotish Narxlari</div>
                <div className="grid grid-cols-3 gap-2 sm:gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] sm:text-xs text-gray-400 block">Dona narx (s.):</label>
                    <input
                      type="text"
                      required
                      className="bg-slate-900 border border-white/10 rounded-xl text-white w-full p-2 focus:ring-brand-500 text-xs sm:text-sm"
                      value={unitPrice}
                      onChange={(e) => setUnitPrice(formatNumberWithSpaces(e.target.value))}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] sm:text-xs text-gray-400 block">Quti narx (s.):</label>
                    <input
                      type="text"
                      required
                      className="bg-slate-900 border border-white/10 rounded-xl text-white w-full p-2 focus:ring-brand-500 text-xs sm:text-sm"
                      value={boxPrice}
                      onChange={(e) => setBoxPrice(formatNumberWithSpaces(e.target.value))}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] sm:text-xs text-gray-400 block">Qutida dona:</label>
                    <input
                      type="number"
                      required
                      className="bg-slate-900 border border-white/10 rounded-xl text-white w-full p-2 focus:ring-brand-500 text-xs sm:text-sm"
                      value={quantityInBox}
                      onChange={(e) => setQuantityInBox(e.target.value)}
                    />
                  </div>
                </div>
              </div>


              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] sm:text-xs text-gray-400 block">Boshlang'ich zaxira (quti):</label>
                  <input
                    type="number"
                    className="bg-slate-900 border border-white/10 rounded-xl text-white w-full p-2.5 focus:ring-brand-500 text-xs sm:text-sm"
                    value={initialBoxes}
                    onChange={(e) => setInitialBoxes(e.target.value)}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] sm:text-xs text-gray-400 block">Boshlang'ich zaxira (dona):</label>
                  <input
                    type="number"
                    className="bg-slate-900 border border-white/10 rounded-xl text-white w-full p-2.5 focus:ring-brand-500 text-xs sm:text-sm"
                    value={initialPieceStock}
                    onChange={(e) => setInitialPieceStock(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-gray-400 block">Mahsulot rasmi (ixtiyoriy):</label>
                <div className="flex flex-col space-y-2">
                  <input
                    type="file"
                    accept="image/*,image/jpeg,image/png"
                    id="product-image-upload"
                    className="bg-slate-900 border border-white/10 rounded-xl text-white w-full p-2 text-xs"
                    onChange={(e) => handleImageUpload(e, false)}
                    disabled={isUploading}
                  />
                  {isUploading && <span className="text-xs text-brand-400">Yuklanmoqda...</span>}
                  {imagePreview && (
                    <img 
                      src={imagePreview.startsWith('data:') ? imagePreview : (getImageUrl(imagePreview) || undefined)} 
                      alt="Preview" 
                      className="h-20 w-20 object-cover rounded-lg border border-white/10" 
                      onError={(e) => {
                        if (!imagePreview.startsWith('data:') && !getImageUrl(imagePreview)) {
                          e.target.onerror = null;
                          e.target.src = fallbackImage;
                        } else {
                          e.target.onerror = null;
                          e.target.src = fallbackImage;
                        }
                      }}
                    />
                  )}
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-brand-500 hover:bg-brand-600 text-white font-bold py-3 rounded-xl transition text-sm mt-6 border border-brand-400 cursor-pointer min-h-[44px] flex items-center justify-center"
              >
                Mahsulotni qo'shish
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Edit Sweet Product Modal Overlay */}
      {showEditForm && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="glass-panel border-white/10 max-w-md w-full rounded-2xl p-5 sm:p-6 relative my-auto max-h-[95vh] overflow-y-auto">
            <button
              onClick={() => setShowEditForm(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              <X size={20} />
            </button>
            <h2 className="text-lg font-bold text-white mb-4 flex items-center space-x-2">
              <Pencil className="text-blue-400" />
              <span>Mahsulotni Tahrirlash</span>
            </h2>

            <form onSubmit={handleUpdateProduct} className="space-y-4 text-sm text-gray-300">
              <div className="space-y-1">
                <label className="text-xs text-gray-400 block">Mahsulot Nomi:</label>
                <input
                  type="text"
                  required
                  className="bg-slate-900 border border-white/10 rounded-xl text-white w-full p-2.5 focus:ring-brand-500 focus:border-brand-500 text-xs sm:text-sm"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-gray-400 block">Kategoriya:</label>
                <div className="flex space-x-2">
                  <select
                    required
                    className="bg-slate-900 border border-white/10 rounded-xl text-white flex-1 p-2.5 focus:ring-brand-500"
                    value={editCategoryId}
                    onChange={(e) => setEditCategoryId(e.target.value)}
                  >
                    <option value="">Tanlang...</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setShowEditCategoryInline(!showEditCategoryInline)}
                    className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 p-2.5 rounded-xl transition border border-emerald-500/20 hover:border-emerald-500/40 cursor-pointer flex items-center justify-center shrink-0 min-h-[40px] w-[40px]"
                    title="Yangi kategoriya qo'shish"
                  >
                    <Plus size={20} />
                  </button>
                </div>

                {showEditCategoryInline && (
                  <div className="mt-2 p-3 bg-slate-950/40 rounded-xl border border-white/5 space-y-2">
                    <label className="text-[10px] text-gray-400 block uppercase tracking-wider font-semibold">Yangi kategoriya nomi:</label>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="text"
                        placeholder="Kategoriya nomi..."
                        className="bg-slate-900 border border-white/10 rounded-xl text-white flex-1 p-2 text-xs focus:ring-brand-500 focus:border-brand-500 min-h-[38px]"
                        value={newEditCategoryName}
                        onChange={(e) => setNewEditCategoryName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleCreateEditCategory(e);
                          }
                        }}
                      />
                      <div className="flex space-x-2 w-full sm:w-auto">
                        <button
                          type="button"
                          onClick={handleCreateEditCategory}
                          disabled={isCreatingEditCategory}
                          className="bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-semibold px-3 py-2 rounded-xl transition text-xs cursor-pointer border border-emerald-400 flex-1 sm:flex-none min-h-[38px] justify-center flex items-center"
                        >
                          {isCreatingEditCategory ? '...' : 'Saqlash'}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowEditCategoryInline(false);
                            setNewEditCategoryName('');
                          }}
                          className="bg-slate-800 hover:bg-slate-700 text-gray-300 font-semibold px-3 py-2 rounded-xl transition text-xs cursor-pointer border border-white/10 flex-1 sm:flex-none min-h-[38px] justify-center flex items-center"
                        >
                          Bekor
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Narxlar qismi: 2+2+1 ta maydon */}
              <div className="space-y-2">
                <div className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Tannarxlar (Xarid narxi)</div>
                <div className="grid grid-cols-2 gap-2 sm:gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] sm:text-xs text-gray-400 block">Dona tannarxi (s.):</label>
                    <input
                      type="text"
                      required
                      className="bg-slate-900 border border-white/10 rounded-xl text-white w-full p-2 focus:ring-brand-500 text-xs sm:text-sm"
                      value={editCostPrice}
                      onChange={(e) => setEditCostPrice(formatNumberWithSpaces(e.target.value))}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] sm:text-xs text-gray-400 block">Quti tannarxi (s.):</label>
                    <input
                      type="text"
                      required
                      className="bg-slate-900 border border-white/10 rounded-xl text-white w-full p-2 focus:ring-brand-500 text-xs sm:text-sm"
                      value={editBoxCostPrice}
                      onChange={(e) => setEditBoxCostPrice(formatNumberWithSpaces(e.target.value))}
                    />
                  </div>
                </div>
                <div className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold mt-1">Sotish Narxlari</div>
                <div className="grid grid-cols-3 gap-2 sm:gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] sm:text-xs text-gray-400 block">Dona narx (s.):</label>
                    <input
                      type="text"
                      required
                      className="bg-slate-900 border border-white/10 rounded-xl text-white w-full p-2 focus:ring-brand-500 text-xs sm:text-sm"
                      value={editUnitPrice}
                      onChange={(e) => setEditUnitPrice(formatNumberWithSpaces(e.target.value))}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] sm:text-xs text-gray-400 block">Quti narx (s.):</label>
                    <input
                      type="text"
                      required
                      className="bg-slate-900 border border-white/10 rounded-xl text-white w-full p-2 focus:ring-brand-500 text-xs sm:text-sm"
                      value={editBoxPrice}
                      onChange={(e) => setEditBoxPrice(formatNumberWithSpaces(e.target.value))}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] sm:text-xs text-gray-400 block">Qutida dona:</label>
                    <input
                      type="number"
                      required
                      className="bg-slate-900 border border-white/10 rounded-xl text-white w-full p-2 focus:ring-brand-500 text-xs sm:text-sm"
                      value={editQuantityInBox}
                      onChange={(e) => setEditQuantityInBox(e.target.value)}
                    />
                  </div>
                </div>
              </div>


              <div className="grid grid-cols-2 gap-2 sm:gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] sm:text-xs text-gray-400 block">Qo'shish (quti):</label>
                  <input
                    type="number"
                    className="bg-slate-900 border border-white/10 rounded-xl text-white w-full p-2.5 focus:ring-brand-500 text-xs sm:text-sm"
                    value={editStockBoxes}
                    onChange={(e) => setEditStockBoxes(e.target.value)}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] sm:text-xs text-gray-400 block">Qo'shish (dona):</label>
                  <input
                    type="number"
                    className="bg-slate-900 border border-white/10 rounded-xl text-white w-full p-2.5 focus:ring-brand-500 text-xs sm:text-sm"
                    value={editStockPieces}
                    onChange={(e) => setEditStockPieces(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-gray-400 block">Mahsulot rasmi (ixtiyoriy):</label>
                <div className="flex flex-col space-y-2">
                  <input
                    type="file"
                    accept="image/*,image/jpeg,image/png"
                    id="product-image-edit-upload"
                    className="bg-slate-900 border border-white/10 rounded-xl text-white w-full p-2 text-xs"
                    onChange={(e) => handleImageUpload(e, true)}
                    disabled={isUploading}
                  />
                  {isUploading && <span className="text-xs text-brand-400">Yuklanmoqda...</span>}
                  {editImagePreview && (
                    <img 
                      src={editImagePreview.startsWith('data:') ? editImagePreview : (getImageUrl(editImagePreview) || undefined)} 
                      alt="Preview" 
                      className="h-20 w-20 object-cover rounded-lg border border-white/10" 
                      onError={(e) => {
                        if (!editImagePreview.startsWith('data:') && !getImageUrl(editImagePreview)) {
                          e.target.onerror = null;
                          e.target.src = fallbackImage;
                        } else {
                          e.target.onerror = null;
                          e.target.src = fallbackImage;
                        }
                      }}
                    />
                  )}
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 rounded-xl transition text-sm mt-6 border border-blue-400 cursor-pointer min-h-[44px] flex items-center justify-center"
              >
                Mahsulotni yangilash
              </button>
            </form>
          </div>
        </div>
      )}
      {/* Modals end */}
      
      {/* Expense Modal */}
      {isExpenseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="glass-panel border-white/10 max-w-sm w-full rounded-2xl p-6 relative">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <DollarSign className="text-red-400" /> Boshqa xarajat qo'shish
            </h3>
            
            <form onSubmit={handleAddExpenseSubmit} className="space-y-4">
              <div>
                <label className="text-xs text-gray-400 block mb-1">Summa (s.):</label>
                <input
                  type="text"
                  required
                  className="bg-slate-900 border border-white/10 rounded-xl text-white w-full p-2.5 focus:ring-brand-500 text-sm font-bold"
                  value={expenseAmount}
                  onChange={(e) => setExpenseAmount(formatNumberWithSpaces(e.target.value))}
                  placeholder="Masalan: 1 000 000"
                />
              </div>

              <div>
                <label className="text-xs text-gray-400 block mb-1">Izoh (Nima uchun?):</label>
                <textarea
                  required
                  rows={3}
                  className="bg-slate-900 border border-white/10 rounded-xl text-white w-full p-2.5 focus:ring-brand-500 text-sm"
                  value={expenseDescription}
                  onChange={(e) => setExpenseDescription(e.target.value)}
                  placeholder="Masalan: Ijara puli, Oylik maosh..."
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsExpenseModalOpen(false)}
                  className="flex-1 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-sm font-semibold rounded-xl transition border border-white/5"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={addingExpense}
                  className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-bold rounded-xl transition shadow-lg shadow-red-500/20 flex justify-center items-center"
                >
                  {addingExpense ? 'Saqlanmoqda...' : 'Saqlash'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
