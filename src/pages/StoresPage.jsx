import React, { useState, useEffect } from 'react';
import { useStores } from '../hooks/useStores';
import { Search, Plus, UserPlus, Phone, DollarSign, Calendar, AlertTriangle, FileText, X, Trash2, Pencil, Send } from 'lucide-react';
import toast from 'react-hot-toast';

export const StoresPage = () => {
  const { stores, overdueStores, fetchStores, fetchOverdueStores, addStore, getStoreOrders, deleteStore, updateStore, addStorePayment, getStorePayments, sendStoreReminder } = useStores();

  const [searchQuery, setSearchQuery] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [selectedStore, setSelectedStore] = useState(null);
  const [storeOrders, setStoreOrders] = useState([]);
  const [storePayments, setStorePayments] = useState([]);
  const [activeDetailTab, setActiveDetailTab] = useState('orders'); // 'orders' or 'payments'
  const [ordersLoading, setOrdersLoading] = useState(false);

  // Payment Form states
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [selectedStoreForPayment, setSelectedStoreForPayment] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('CASH'); // 'CASH' or 'CARD'
  const [paymentNote, setPaymentNote] = useState('');

  const [name, setName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [phone, setPhone] = useState('+998');
  const [telegramChatId, setTelegramChatId] = useState('');
  const [creditLimit, setCreditLimit] = useState(10000000); // Default 10M
  const [paymentDays, setPaymentDays] = useState(30);       // Default 30 days

  // Edit Form states
  const [editStoreId, setEditStoreId] = useState('');
  const [editStoreName, setEditStoreName] = useState('');
  const [editStoreOwnerName, setEditStoreOwnerName] = useState('');
  const [editStorePhone, setEditStorePhone] = useState('');
  const [editStoreTelegramChatId, setEditStoreTelegramChatId] = useState('');
  const [editStoreCreditLimit, setEditStoreCreditLimit] = useState(0);
  const [editStorePaymentDays, setEditStorePaymentDays] = useState(0);

  useEffect(() => {
    fetchStores();
    fetchOverdueStores();
  }, [fetchStores, fetchOverdueStores]);

  // Load details of a specific store (including invoice history and payments history)
  const handleViewStore = async (store) => {
    setSelectedStore(store);
    setOrdersLoading(true);
    setActiveDetailTab('orders');
    const orders = await getStoreOrders(store.id);
    const payments = await getStorePayments(store.id);
    setStoreOrders(orders);
    setStorePayments(payments);
    setOrdersLoading(false);
  };

  // Register B2B store submit
  const handleRegisterStore = async (e) => {
    e.preventDefault();

    if (!name || !ownerName || !phone || !creditLimit || !paymentDays) {
      toast.error('Barcha maydonlarni to\'ldiring!');
      return;
    }

    const payload = {
      name,
      ownerName,
      phone,
      telegramChatId: telegramChatId || undefined,
      creditLimit: Number(creditLimit),
      paymentDays: Number(paymentDays),
    };

    const res = await addStore(payload);
    if (res.success) {
      // Clear forms
      setName('');
      setOwnerName('');
      setPhone('+998');
      setTelegramChatId('');
      setCreditLimit(10000000);
      setPaymentDays(30);
      setShowAddForm(false);
      fetchStores();
      toast.success("Do'kon muvaffaqiyatli qo'shildi!");
    } else {
      toast.error(`Xatolik yuz berdi: ${res.error}`);
    }
  };

  const handleDeleteStore = async (e, store) => {
    e.stopPropagation();
    if (Number(store.currentDebt) > 0) {
      toast.error(`O'chirish imkonsiz! Qarzi mavjud: ${Number(store.currentDebt).toLocaleString()} so'm. Avval qarzni yoping!`);
      return;
    }
    if (window.confirm(`Haqiqatdan ham "${store.name}" do'konini o'chirmoqchimisiz?`)) {
      const res = await deleteStore(store.id);
      if (res.success) {
        fetchStores();
        fetchOverdueStores();
        toast.success("Do'kon o'chirildi!");
      } else {
        toast.error(`O'chirishda xatolik: ${res.error}`);
      }
    }
  };

  const handleEditStoreClick = (e, store) => {
    e.stopPropagation(); // Prevent opening modal details!
    setEditStoreId(store.id);
    setEditStoreName(store.name);
    setEditStoreOwnerName(store.ownerName);
    setEditStorePhone(store.phone);
    setEditStoreTelegramChatId(store.telegramChatId || '');
    setEditStoreCreditLimit(store.creditLimit);
    setEditStorePaymentDays(store.paymentDays);
    setShowEditForm(true);
  };

  const handleUpdateStore = async (e) => {
    e.preventDefault();

    if (!editStoreName || !editStoreOwnerName || !editStorePhone || !editStoreCreditLimit || !editStorePaymentDays) {
      toast.error('Barcha maydonlarni to\'ldiring!');
      return;
    }

    const payload = {
      name: editStoreName,
      ownerName: editStoreOwnerName,
      phone: editStorePhone,
      telegramChatId: editStoreTelegramChatId || undefined,
      creditLimit: Number(editStoreCreditLimit),
      paymentDays: Number(editStorePaymentDays),
    };

    const res = await updateStore(editStoreId, payload);
    if (res.success) {
      setShowEditForm(false);
      fetchStores();
      fetchOverdueStores();
      toast.success("Do'kon ma'lumotlari yangilandi!");
    } else {
      toast.error(`Tahrirlashda xatolik yuz berdi: ${res.error}`);
    }
  };

  const handleSendReminder = async (e, store) => {
    e.stopPropagation();
    if (Number(store.currentDebt) <= 0) {
      toast.error("Ushbu do'konning qarzi yo'q!");
      return;
    }
    const res = await sendStoreReminder(store.id);
    if (res.success && res.data?.success) {
      toast.success("Telegram xabarnoma yuborildi!");
    } else {
      toast.error(res.error || res.data?.message || "Telegram xabar yuborilmadi");
    }
  };

  const handlePayClick = (e, store) => {
    e.stopPropagation();
    if (Number(store.currentDebt) <= 0) {
      toast.error("Ushbu do'konning qarzi yo'q!");
      return;
    }
    setSelectedStoreForPayment(store);
    setPaymentAmount(Math.round(Number(store.currentDebt)));
    setPaymentMethod('CASH');
    setPaymentNote('');
    setShowPaymentForm(true);
  };

  const handlePaySubmit = async (e) => {
    e.preventDefault();
    const amt = Number(paymentAmount);
    if (isNaN(amt) || amt <= 0) {
      toast.error("Musbat to'lov summasini kiriting!");
      return;
    }
    if (amt > Number(selectedStoreForPayment.currentDebt)) {
      toast.error(`To'lov summasi joriy qarzdan (${Number(selectedStoreForPayment.currentDebt).toLocaleString()} so'm) oshib ketishi mumkin emas!`);
      return;
    }

    const res = await addStorePayment(selectedStoreForPayment.id, {
      amount: amt,
      paymentMethod,
      note: paymentNote,
    });

    if (res.success) {
      setShowPaymentForm(false);
      fetchStores();
      fetchOverdueStores();
      toast.success("To'lov muvaffaqiyatli qabul qilindi!");
    } else {
      toast.error(`Xatolik: ${res.error}`);
    }
  };

  // Check if store is overdue based on overdueStores list
  const getIsOverdue = (storeId) => overdueStores.some(s => s.id === storeId);

  // Calculate real remaining payment days dynamically
  // Always derived from lastOrderCreatedAt + store.paymentDays so that
  // editing paymentDays is reflected on the card immediately.
  const calculateRemainingDays = (store) => {
    if (Number(store.currentDebt) <= 0) {
      return { text: "Qarzdorlik yo'q", status: 'none', days: null };
    }

    const totalTerm = Number(store.paymentDays) || 30;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Choose the best reference date: order creation date > store.updatedAt > store.createdAt
    const refRaw = store.lastOrderCreatedAt || store.updatedAt || store.createdAt;
    const refDate = new Date(refRaw);
    refDate.setHours(0, 0, 0, 0);

    // Deadline = order start date + paymentDays term
    const deadline = new Date(refDate);
    deadline.setDate(deadline.getDate() + totalTerm);

    const remaining = Math.round((deadline - today) / (1000 * 60 * 60 * 24));

    if (remaining > 0) {
      return {
        text: `${remaining} kun qoldi (Jami: ${totalTerm} kun)`,
        status: remaining <= 3 ? 'warning' : 'ok',
        days: remaining,
      };
    } else if (remaining === 0) {
      return { text: "Bugun so'nggi kun!", status: 'warning', days: 0 };
    } else {
      return {
        text: `${Math.abs(remaining)} kun kechikdi!`,
        status: 'danger',
        days: remaining,
      };
    }
  };

  // Filtered stores
  const filteredStores = stores.filter(store =>
    store.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    store.ownerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    store.phone.includes(searchQuery)
  );

  return (
    <div className="space-y-6 h-full flex flex-col">
      {/* Top action header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div className="relative max-w-md w-full md:w-96 shrink-0">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search size={18} />
          </div>
          
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Do'kon nomi, egasi yoki telefoni..."
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

        <button
          onClick={() => setShowAddForm(true)}
          className="bg-brand-500 hover:bg-brand-600 text-white font-bold py-2.5 px-4 rounded-xl text-sm flex items-center space-x-2 self-start border border-brand-400 cursor-pointer shadow-lg shadow-brand-500/10 hover:shadow-brand-500/20"
        >
          <Plus size={16} />
          <span>Yangi do'kon qo'shish</span>
        </button>
      </div>

      {/* Grid of Stores CRM cards */}
      <div className="flex-1 overflow-y-auto pr-1">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredStores.map((store) => {
            const isOverdue = getIsOverdue(store.id);
            const currentDebt = Number(store.currentDebt);
            const creditLimit = Number(store.creditLimit);
            const debtPercent = creditLimit > 0 ? (currentDebt / creditLimit) * 100 : 0;
            const remainingInfo = calculateRemainingDays(store);

            return (
              <div
                key={store.id}
                onClick={() => handleViewStore(store)}
                className={`glass-panel glass-card-hover rounded-2xl p-5 border cursor-pointer flex flex-col justify-between ${
                  isOverdue ? 'glow-warning border-red-500/40 bg-red-950/5' : 'border-white/5'
                }`}
              >
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-bold text-white text-base">{store.name}</h3>
                      <p className="text-xs text-gray-400 flex items-center mt-1">
                        <UserPlus size={12} className="mr-1 text-brand-300" />
                        <span>Egasi: {store.ownerName}</span>
                      </p>
                    </div>

                    <div className="flex items-center space-x-2">
                      {isOverdue && (
                        <span className="bg-red-500/20 text-red-400 border border-red-500/30 text-xs px-2 py-0.5 rounded-full font-semibold flex items-center space-x-1">
                          <AlertTriangle size={12} />
                          <span>Kechikkan qarz</span>
                        </span>
                      )}
                      {(isOverdue || currentDebt > 0) && (
                        <button
                          onClick={(e) => handleSendReminder(e, store)}
                          className="bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 p-2 rounded-xl transition border border-blue-500/20 hover:border-blue-500/40 cursor-pointer inline-flex items-center justify-center mr-2"
                          title="Telegram Ogohlantirish"
                        >
                          <Send size={14} />
                        </button>
                      )}
                      <button
                        onClick={(e) => handlePayClick(e, store)}
                        className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 p-2 rounded-xl transition border border-emerald-500/20 hover:border-emerald-500/40 cursor-pointer inline-flex items-center justify-center mr-2"
                        title="To'lov qabul qilish"
                      >
                        <DollarSign size={14} />
                      </button>
                      <button
                        onClick={(e) => handleEditStoreClick(e, store)}
                        className="bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 p-2 rounded-xl transition border border-blue-500/20 hover:border-blue-500/40 cursor-pointer inline-flex items-center justify-center mr-2"
                        title="Tahrirlash"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={(e) => handleDeleteStore(e, store)}
                        className="bg-red-500/10 hover:bg-red-500/20 text-red-400 p-2 rounded-xl transition border border-red-500/20 hover:border-red-500/40 cursor-pointer inline-flex items-center justify-center"
                        title="O'chirish"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  <div className="text-xs text-gray-400 space-y-2 mt-4">
                    <div className="flex items-center space-x-2">
                      <Phone size={14} className="text-gray-500" />
                      <span className="text-gray-300 font-mono">{store.phone}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Calendar size={14} className="text-gray-500" />
                      {remainingInfo.status === 'none' ? (
                        <span className="text-gray-400">Nasiya muddati: {store.paymentDays} kun</span>
                      ) : (
                        <span className={`font-semibold ${
                          remainingInfo.status === 'danger' ? 'text-red-400' :
                          remainingInfo.status === 'warning' ? 'text-yellow-400' :
                          'text-green-400'
                        }`}>
                          {remainingInfo.status === 'danger' && '⚠️ '}
                          {remainingInfo.status === 'warning' && '🕐 '}
                          {remainingInfo.status === 'ok' && '✅ '}
                          {remainingInfo.text}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-white/5 space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400">Qarz / Limit:</span>
                    <span className="font-semibold text-white">
                      {currentDebt.toLocaleString()} / {creditLimit.toLocaleString()} s.
                    </span>
                  </div>

                  {/* Credit limit visual gauge progress bar */}
                  <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        debtPercent >= 90 ? 'bg-red-500' : debtPercent >= 60 ? 'bg-yellow-500' : 'bg-brand-500'
                      }`}
                      style={{ width: `${Math.min(100, debtPercent)}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-[10px] text-gray-500">
                    <span>Qarz foizi:</span>
                    <span>{debtPercent.toFixed(1)}%</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Add B2B Store Modal Overlay */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-panel border-white/10 max-w-md w-full rounded-2xl p-6 relative">
            <button
              onClick={() => setShowAddForm(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              <X size={20} />
            </button>
            <h2 className="text-lg font-bold text-white mb-4 flex items-center space-x-2">
              <UserPlus className="text-brand-400" />
              <span>Yangi Do'kon (Hamkor) Qo'shish</span>
            </h2>

            <form onSubmit={handleRegisterStore} className="space-y-4 text-sm text-gray-300">
              <div className="space-y-1">
                <label className="text-xs text-gray-400 block">Do'kon Nomi (Yuridik/Savdo nomi):</label>
                <input
                  type="text"
                  required
                  placeholder="Masalan: Sweet House, Shokolad Dunyosi..."
                  className="bg-slate-900 border border-white/10 rounded-xl text-white w-full p-2.5 focus:ring-brand-500 focus:border-brand-500"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-gray-400 block">Do'kondor (Egasi ismi):</label>
                <input
                  type="text"
                  required
                  placeholder="Masalan: Elyor Alimov..."
                  className="bg-slate-900 border border-white/10 rounded-xl text-white w-full p-2.5 focus:ring-brand-500 focus:border-brand-500"
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-gray-400 block">Telefon raqam:</label>
                <input
                  type="text"
                  required
                  placeholder="Masalan: +998901234567"
                  className="bg-slate-900 border border-white/10 rounded-xl text-white font-mono w-full p-2.5 focus:ring-brand-500 focus:border-brand-500"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs text-gray-400 block">Kredit limiti (so'm):</label>
                  <input
                    type="number"
                    required
                    className="bg-slate-900 border border-white/10 rounded-xl text-white w-full p-2.5 focus:ring-brand-500 focus:border-brand-500"
                    value={creditLimit}
                    onChange={(e) => setCreditLimit(e.target.value)}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-gray-400 block">Nasiya kuni:</label>
                  <input
                    type="number"
                    required
                    className="bg-slate-900 border border-white/10 rounded-xl text-white w-full p-2.5 focus:ring-brand-500 focus:border-brand-500"
                    value={paymentDays}
                    onChange={(e) => setPaymentDays(e.target.value)}
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-brand-500 hover:bg-brand-600 text-white font-bold py-3 rounded-xl transition text-sm mt-6 border border-brand-400 cursor-pointer"
              >
                Tizimda ro'yxatga olish
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Store In-App Invoice History Details Modal */}
      {selectedStore && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-panel border-white/10 max-w-2xl w-full rounded-2xl p-6 relative flex flex-col max-h-[85vh]">
            <button
              onClick={() => setSelectedStore(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              <X size={20} />
            </button>
            
            <div className="mb-4">
              <h2 className="text-lg font-bold text-white">{selectedStore.name}</h2>
              <p className="text-xs text-gray-400 flex items-center mt-1">
                <span>Egasi: {selectedStore.ownerName}</span>
                <span className="mx-2">•</span>
                <span className="font-mono">{selectedStore.phone}</span>
              </p>
            </div>

            {/* Tab switch buttons */}
            <div className="flex border-b border-white/5 mb-4 text-xs font-semibold">
              <button
                onClick={() => setActiveDetailTab('orders')}
                className={`pb-2.5 px-4 relative ${
                  activeDetailTab === 'orders'
                    ? 'text-brand-400 border-b-2 border-brand-500 font-bold'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                Savdo Tarixi
              </button>
              <button
                onClick={() => setActiveDetailTab('payments')}
                className={`pb-2.5 px-4 relative ${
                  activeDetailTab === 'payments'
                    ? 'text-brand-400 border-b-2 border-brand-500 font-bold'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                To'lovlar Tarixi
              </button>
            </div>

            {/* Tab Contents */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-1 my-2">
              {activeDetailTab === 'orders' ? (
                ordersLoading ? (
                  <div className="text-center py-8 text-sm text-gray-500">Tarix yuklanmoqda...</div>
                ) : storeOrders.length === 0 ? (
                  <div className="text-center py-8 text-sm text-gray-500">
                    <FileText size={32} className="mx-auto mb-2 opacity-20" />
                    <span>Xaridlar tarixi mavjud emas</span>
                  </div>
                ) : (
                  storeOrders.map((order) => {
                    const isOrderOverdue = new Date(order.dueDate) <= new Date() && order.debtAmount > 0;
                    return (
                      <div key={order.id} className="glass-card rounded-xl p-4 border border-white/5 space-y-3">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-mono text-gray-400">ID: #{order.id.slice(0, 8)}</span>
                          <span className="text-gray-500">{new Date(order.createdAt).toLocaleString()}</span>
                        </div>

                        {/* Items details list */}
                        <div className="bg-slate-950/30 rounded-lg p-2 space-y-1 text-xs">
                          {order.items?.map(item => (
                            <div key={item.id} className="flex justify-between text-gray-300">
                              <span>{item.product?.name} ({item.quantity} {item.unitType})</span>
                              <span className="font-mono">{Number(item.totalPrice).toLocaleString()} s.</span>
                            </div>
                          ))}
                        </div>

                        <div className="flex justify-between items-center pt-2 border-t border-white/5 text-xs">
                          <div className="space-y-1">
                            <div>Jami: <span className="font-bold text-white">{Number(order.totalAmount).toLocaleString()} s.</span></div>
                            <div>Qarz: <span className={`font-semibold ${order.debtAmount > 0 ? 'text-red-400' : 'text-gray-400'}`}>{Number(order.debtAmount).toLocaleString()} s.</span></div>
                          </div>

                          <div className="text-right space-y-1">
                            <div className="text-gray-400">Muddat: <span className={isOrderOverdue ? 'text-red-400 font-bold' : 'text-gray-300'}>{new Date(order.dueDate).toLocaleDateString()}</span></div>
                            <span className={`inline-block text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                              order.status === 'PAID' 
                                ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                                : order.status === 'PARTIALLY_PAID'
                                  ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                                  : 'bg-red-500/20 text-red-400 border border-red-500/30'
                            }`}>
                              {order.status}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )
              ) : (
                ordersLoading ? (
                  <div className="text-center py-8 text-sm text-gray-500">Tarix yuklanmoqda...</div>
                ) : storePayments.length === 0 ? (
                  <div className="text-center py-8 text-sm text-gray-500">
                    <DollarSign size={32} className="mx-auto mb-2 opacity-20" />
                    <span>To'lovlar tarixi mavjud emas</span>
                  </div>
                ) : (
                  storePayments.map((payment) => (
                    <div key={payment.id} className="glass-card rounded-xl p-4 border border-white/5 flex justify-between items-center text-xs">
                      <div>
                        <div className="font-semibold text-white">To'lov summasi: <span className="text-emerald-400 font-bold">{Number(payment.amount).toLocaleString()} s.</span></div>
                        <div className="text-gray-500 mt-1 flex items-center">
                          <span className={`inline-block text-[9px] px-1.5 py-0.5 rounded font-bold uppercase mr-2 ${
                            payment.paymentMethod === 'CASH' 
                              ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/20' 
                              : 'bg-blue-500/20 text-blue-400 border border-blue-500/20'
                          }`}>
                            {payment.paymentMethod === 'CASH' ? '💵 Naqd' : '💳 Karta'}
                          </span>
                          {payment.note && <span className="text-gray-400 italic">Izoh: {payment.note}</span>}
                        </div>
                      </div>
                      <div className="text-right text-gray-400">
                        {new Date(payment.createdAt).toLocaleString()}
                      </div>
                    </div>
                  ))
                )
              )}
            </div>

            <div className="border-t border-white/5 pt-4 flex justify-between items-center mt-2 text-xs">
              <div className="space-y-1">
                <span className="text-gray-400">Joriy qarz balansi:</span>
                <div className="font-bold text-white text-base">{Number(selectedStore.currentDebt).toLocaleString()} so'm</div>
              </div>
              <button
                onClick={() => setSelectedStore(null)}
                className="bg-slate-800 hover:bg-slate-700 text-white font-bold py-2 px-4 rounded-xl transition border border-white/10 hover:border-white/20 cursor-pointer"
              >
                Yopish
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Store Modal Overlay */}
      {showEditForm && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-panel border-white/10 max-w-md w-full rounded-2xl p-6 relative">
            <button
              onClick={() => setShowEditForm(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              <X size={20} />
            </button>
            <h2 className="text-lg font-bold text-white mb-4 flex items-center space-x-2">
              <Pencil className="text-blue-400" />
              <span>Do'kon Ma'lumotlarini Tahrirlash</span>
            </h2>

            <form onSubmit={handleUpdateStore} className="space-y-4 text-sm text-gray-300">
              <div className="space-y-1">
                <label className="text-xs text-gray-400 block">Do'kon Nomi:</label>
                <input
                  type="text"
                  required
                  className="bg-slate-900 border border-white/10 rounded-xl text-white w-full p-2.5 focus:ring-brand-500 focus:border-brand-500"
                  value={editStoreName}
                  onChange={(e) => setEditStoreName(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-gray-400 block">Egasining Ismi:</label>
                <input
                  type="text"
                  required
                  className="bg-slate-900 border border-white/10 rounded-xl text-white w-full p-2.5 focus:ring-brand-500 focus:border-brand-500"
                  value={editStoreOwnerName}
                  onChange={(e) => setEditStoreOwnerName(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-gray-400 block">Telefon raqam:</label>
                <input
                  type="text"
                  required
                  className="bg-slate-900 border border-white/10 rounded-xl text-white font-mono w-full p-2.5 focus:ring-brand-500 focus:border-brand-500"
                  value={editStorePhone}
                  onChange={(e) => setEditStorePhone(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs text-gray-400 block">Qarz Limiti (so'm):</label>
                  <input
                    type="number"
                    required
                    className="bg-slate-900 border border-white/10 rounded-xl text-white w-full p-2.5 focus:ring-brand-500"
                    value={editStoreCreditLimit}
                    onChange={(e) => setEditStoreCreditLimit(e.target.value)}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-gray-400 block">Nasiya kuni:</label>
                  <input
                    type="number"
                    required
                    className="bg-slate-900 border border-white/10 rounded-xl text-white w-full p-2.5 focus:ring-brand-500"
                    value={editStorePaymentDays}
                    onChange={(e) => setEditStorePaymentDays(e.target.value)}
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 rounded-xl transition text-sm mt-6 border border-blue-400 cursor-pointer"
              >
                Do'konni yangilash
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Accept Payment Modal Overlay */}
      {showPaymentForm && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-panel border-white/10 max-w-md w-full rounded-2xl p-6 relative">
            <button
              onClick={() => setShowPaymentForm(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              <X size={20} />
            </button>
            <h2 className="text-lg font-bold text-white mb-4 flex items-center space-x-2">
              <DollarSign className="text-emerald-400" />
              <span>To'lov Qabul Qilish</span>
            </h2>

            <div className="bg-slate-900/50 p-3 rounded-xl border border-white/5 mb-4 text-xs">
              <div className="text-gray-400">Mijoz do'kon: <span className="text-white font-bold">{selectedStoreForPayment?.name}</span></div>
              <div className="text-gray-400 mt-1">Joriy qarz balansi: <span className="text-red-400 font-bold font-mono">{Number(selectedStoreForPayment?.currentDebt).toLocaleString()} so'm</span></div>
            </div>

            <form onSubmit={handlePaySubmit} className="space-y-4 text-sm text-gray-300">
              <div className="space-y-1">
                <label className="text-xs text-gray-400 block font-semibold">To'lov summasi (so'm):</label>
                <input
                  type="number"
                  required
                  placeholder="Summani kiriting..."
                  className="bg-slate-900 border border-white/10 rounded-xl text-white font-bold font-mono w-full p-2.5 focus:ring-emerald-500 focus:border-emerald-500"
                  value={paymentAmount}
                  max={Number(selectedStoreForPayment?.currentDebt || 0)}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-gray-400 block font-semibold">To'lov usuli:</label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('CASH')}
                    className={`py-3 px-4 rounded-xl font-bold border transition flex items-center justify-center space-x-2 cursor-pointer ${
                      paymentMethod === 'CASH'
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50 shadow'
                        : 'bg-slate-900 border-white/10 text-gray-400 hover:text-gray-200'
                    }`}
                  >
                    <span>💵</span>
                    <span>Naqd</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('CARD')}
                    className={`py-3 px-4 rounded-xl font-bold border transition flex items-center justify-center space-x-2 cursor-pointer ${
                      paymentMethod === 'CARD'
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50 shadow'
                        : 'bg-slate-900 border-white/10 text-gray-400 hover:text-gray-200'
                    }`}
                  >
                    <span>💳</span>
                    <span>Karta / Perevod</span>
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-gray-400 block">Izoh / Tranzaksiya ma'lumoti:</label>
                <textarea
                  placeholder="Masalan: Click orqali to'landi..."
                  rows={3}
                  className="bg-slate-900 border border-white/10 rounded-xl text-white w-full p-2.5 focus:ring-emerald-500 focus:border-emerald-500 text-xs"
                  value={paymentNote}
                  onChange={(e) => setPaymentNote(e.target.value)}
                />
              </div>

              <button
                type="submit"
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 rounded-xl transition text-sm mt-6 border border-emerald-400 cursor-pointer shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/20"
              >
                To'lovni tasdiqlash
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
