import React, { useState, useEffect } from 'react'; // Force HMR reload
import { Plus, Edit2, Trash2, X, Eye, EyeOff, Clock, Calendar } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../services/api';
import { formatMoney } from '../utils/format';

export const UsersPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [period, setPeriod] = useState('monthly');

  // Sales History Modal
  const [isSalesHistoryOpen, setIsSalesHistoryOpen] = useState(false);
  const [salesHistoryUser, setSalesHistoryUser] = useState(null);
  const [salesHistoryData, setSalesHistoryData] = useState(null);
  const [salesHistoryLoading, setSalesHistoryLoading] = useState(false);
  const [salesHistoryPeriod, setSalesHistoryPeriod] = useState('monthly');
  const [salesHistoryCustomDate, setSalesHistoryCustomDate] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    username: '',
    password: '',
    role: 'SELLER'
  });

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/users', { params: { period } });
      if (response.data?.success && Array.isArray(response.data?.data)) {
        setUsers(response.data.data);
      } else {
        setUsers([]);
      }
    } catch (error) {
      toast.error("Xodimlarni yuklashda xatolik yuz berdi");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [period]);

  const fetchSalesHistory = async (userId, p) => {
    try {
      setSalesHistoryLoading(true);
      const response = await api.get(`/users/${userId}/sales-history`, { params: { period: p } });
      if (response.data?.success) {
        setSalesHistoryData(response.data.data);
      }
    } catch (error) {
      toast.error("Savdo tarixini yuklashda xatolik");
    } finally {
      setSalesHistoryLoading(false);
    }
  };

  const handleOpenSalesHistory = (user) => {
    setSalesHistoryUser(user);
    setIsSalesHistoryOpen(true);
    setSalesHistoryPeriod('monthly');
    fetchSalesHistory(user.id, 'monthly');
  };

  useEffect(() => {
    if (isSalesHistoryOpen && salesHistoryUser) {
      fetchSalesHistory(salesHistoryUser.id, salesHistoryPeriod);
    }
  }, [salesHistoryPeriod]);

  const handleOpenModal = (user = null) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        name: user.name,
        username: user.username,
        password: '',
        role: user.role
      });
    } else {
      setEditingUser(null);
      setFormData({
        name: '',
        username: '',
        password: '',
        role: 'SELLER'
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingUser) {
        const payload = { ...formData };
        if (!payload.password) delete payload.password;
        await api.put(`/users/${editingUser.id}`, payload);
        toast.success("Xodim ma'lumotlari yangilandi");
      } else {
        if (!formData.password) {
          toast.error("Yangi xodim uchun parol kiritish shart");
          return;
        }
        await api.post('/users', formData);
        toast.success("Yangi xodim qo'shildi");
      }
      handleCloseModal();
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || "Xatolik yuz berdi");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Rostdan ham bu xodimni o'chirmoqchimisiz?")) {
      try {
        await api.delete(`/users/${id}`);
        toast.success("Xodim o'chirildi");
        fetchUsers();
      } catch (error) {
        toast.error(error.response?.data?.message || "O'chirishda xatolik");
      }
    }
  };

  const getRoleBadge = (role) => {
    const r = (role || '').toUpperCase();
    switch (r) {
      case 'BOSS':
        return <span className="px-2 py-1 bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded-md text-[10px] font-bold tracking-wider">BOSS</span>;
      case 'MANAGER':
        return <span className="px-2 py-1 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-md text-[10px] font-bold tracking-wider">MANAGER</span>;
      case 'SELLER':
      default:
        return <span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-md text-[10px] font-bold tracking-wider">SELLER</span>;
    }
  };

  const getPeriodLabel = (p) => {
    switch (p) {
      case 'today': return 'Bugun';
      case 'monthly': return 'Joriy oy';
      case 'yearly': return 'Joriy yil';
      case 'all': return 'Barcha vaqt';
      default: return 'Joriy oy';
    }
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('uz-UZ', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const formatCurrency = (val) => formatMoney(val) + " so'm";

  const filteredSalesData = React.useMemo(() => {
    if (!salesHistoryData) return null;
    let filteredDailyStats = salesHistoryData.dailyStats;
    if (salesHistoryCustomDate && salesHistoryPeriod === 'custom') {
      filteredDailyStats = salesHistoryData.dailyStats.filter(day => day.date === salesHistoryCustomDate);
    }
    const totalOrders = filteredDailyStats.reduce((sum, day) => sum + day.ordersCount, 0);
    const totalSales = filteredDailyStats.reduce((sum, day) => sum + day.totalSales, 0);
    return {
      ...salesHistoryData,
      dailyStats: filteredDailyStats,
      totalOrders,
      totalSales
    };
  }, [salesHistoryData, salesHistoryPeriod, salesHistoryCustomDate]);

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-wide">Xodimlar</h2>
          <p className="text-sm text-slate-500 dark:text-gray-400 mt-1">Tizim foydalanuvchilarini boshqarish ({getPeriodLabel(period)})</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl transition shadow-lg shadow-brand-500/20 font-medium w-full sm:w-auto justify-center"
        >
          <Plus size={18} />
          <span>Yangi xodim</span>
        </button>
      </div>

      {/* Period Filter */}
      <div className="flex bg-slate-50/60 dark:bg-slate-950/60 p-1 rounded-xl border border-slate-200 dark:border-white/5 self-start w-fit">
        {[
          { id: 'today', name: 'Bugun' },
          { id: 'monthly', name: 'Oylik' },
          { id: 'yearly', name: 'Yillik' },
          { id: 'all', name: 'Hammasi' }
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => setPeriod(item.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer border ${
              period === item.id
                ? 'bg-brand-500 text-white shadow border-brand-400 font-bold'
                : 'text-slate-500 dark:text-gray-400 hover:text-slate-700 dark:hover:text-gray-200 border-transparent'
            }`}
          >
            {item.name}
          </button>
        ))}
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block glass-panel p-4 sm:p-6 rounded-2xl border border-slate-200 dark:border-white/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 dark:text-gray-400 uppercase bg-slate-100/50 dark:bg-slate-900/40  border-b border-slate-200 dark:border-white/5">
              <tr>
                <th className="px-4 py-3 font-semibold rounded-tl-xl">Ism va Login</th>
                <th className="px-4 py-3 font-semibold">Roli</th>
                <th className="px-4 py-3 font-semibold text-right">Savdolar</th>
                <th className="px-4 py-3 font-semibold text-right">Tushum</th>
                <th className="px-4 py-3 font-semibold text-right">Naqd</th>
                <th className="px-4 py-3 font-semibold text-right">Nasiya</th>
                <th className="px-4 py-3 font-semibold text-right rounded-tr-xl">Amallar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-4 py-8 text-center text-slate-500 dark:text-gray-400 animate-pulse">
                    Yuklanmoqda...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-4 py-8 text-center text-slate-500 dark:text-gray-400">
                    Xodimlar topilmadi
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-white/[0.02] transition">
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900 dark:text-white">{user.name}</div>
                      <div className="text-xs text-slate-500 dark:text-gray-500">@{user.username}</div>
                    </td>
                    <td className="px-4 py-3">
                      {getRoleBadge(user.role)}
                    </td>
                    <td className="px-4 py-3 text-right text-slate-700 dark:text-gray-300 font-mono">
                      {user.salesCount} ta
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-brand-400 font-mono">
                      {formatMoney(user.salesAmount)}
                    </td>
                    <td className="px-4 py-3 text-right text-emerald-400 font-mono">
                      {formatMoney(user.paidAmount || 0)}
                    </td>
                    <td className="px-4 py-3 text-right text-red-400 font-mono">
                      {formatMoney(user.debtAmount || 0)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenSalesHistory(user)}
                          className="p-1.5 bg-brand-500/10 hover:bg-brand-500/20 text-brand-400 rounded-lg transition"
                          title="Savdo tarixi"
                        >
                          <Calendar size={16} />
                        </button>
                        <button
                          onClick={() => handleOpenModal(user)}
                          className="p-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-lg transition"
                          title="Tahrirlash"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(user.id)}
                          className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition"
                          title="O'chirish"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {loading ? (
          <div className="text-center text-slate-500 dark:text-gray-400 py-8 animate-pulse">Yuklanmoqda...</div>
        ) : users.length === 0 ? (
          <div className="text-center text-slate-500 dark:text-gray-400 py-8">Xodimlar topilmadi</div>
        ) : (
          users.map((user) => (
            <div key={user?.id || Math.random()} className="glass-panel p-4 rounded-2xl border border-slate-200 dark:border-white/5 space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-bold text-slate-900 dark:text-white text-base">{user?.name || 'Ismsiz'}</div>
                  <div className="text-xs text-slate-500 dark:text-gray-500 mb-1">@{user?.username || 'login'}</div>
                  {getRoleBadge(user?.role)}
                </div>
                <div className="flex gap-1.5">
                  <button onClick={() => handleOpenSalesHistory(user)} className="p-2 bg-brand-500/10 text-brand-400 rounded-xl" title="Savdo tarixi"><Calendar size={18} /></button>
                  <button onClick={() => handleOpenModal(user)} className="p-2 bg-blue-500/10 text-blue-400 rounded-xl" title="Tahrirlash"><Edit2 size={18} /></button>
                  <button onClick={() => handleDelete(user?.id)} className="p-2 bg-red-500/10 text-red-400 rounded-xl" title="O'chirish"><Trash2 size={18} /></button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 bg-slate-50 dark:bg-slate-900/40 p-3 rounded-xl border border-slate-200 dark:border-white/5 text-sm">
                <div>
                  <div className="text-[10px] text-slate-500 dark:text-gray-400 uppercase font-semibold">Tushum ({user?.salesCount || 0} ta)</div>
                  <div className="font-bold text-brand-500">{formatMoney(user?.salesAmount || 0)}</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-emerald-500 uppercase font-semibold">Naqd to'lov</div>
                  <div className="font-bold text-emerald-500">{formatMoney(user?.paidAmount || 0)}</div>
                </div>
                <div className="col-span-2 pt-2 mt-1 border-t border-slate-200 dark:border-white/10 text-right">
                  <div className="text-[10px] text-red-400 uppercase font-semibold">Nasiya (Qarz)</div>
                  <div className="font-bold text-red-500">{formatMoney(user?.debtAmount || 0)}</div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create/Edit User Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-slide-up">
            <div className="flex justify-between items-center p-4 sm:p-5 border-b border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-slate-800/50">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {editingUser ? "Xodimni tahrirlash" : "Yangi xodim qo'shish"}
              </h3>
              <button
                onClick={handleCloseModal}
                className="text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:text-white transition bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 p-1.5 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1.5">Ism-familiya</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition"
                  placeholder="Masalan: Sardor Aliyev"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1.5">Login (Username)</label>
                <input
                  type="text"
                  required
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition"
                  placeholder="Masalan: sardor123"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1.5">
                  Parol {editingUser && <span className="text-slate-500 dark:text-gray-500 text-xs">(O'zgartirish uchun kiriting)</span>}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required={!editingUser}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-xl pl-4 pr-10 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition"
                    placeholder="Kamida 6 ta belgi"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:text-white"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1.5">Roli (Lavozimi)</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition appearance-none"
                >
                  <option value="SELLER">SELLER (Sotuvchi)</option>
                  <option value="MANAGER">MANAGER (Menejer)</option>
                  <option value="BOSS">BOSS (Boshliq)</option>
                </select>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 px-4 py-2.5 bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-900 dark:text-white rounded-xl transition font-medium"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-brand-600 hover:bg-brand-500 text-white rounded-xl transition shadow-lg shadow-brand-500/20 font-medium"
                >
                  Saqlash
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Sales History Modal */}
      {isSalesHistoryOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden my-auto">
            <div className="flex justify-between items-center p-4 sm:p-5 border-b border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-slate-800/50">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Clock size={20} className="text-brand-400" />
                  Savdo tarixi
                </h3>
                <p className="text-xs text-slate-500 dark:text-gray-400 mt-0.5">
                  {salesHistoryUser?.name} (@{salesHistoryUser?.username})
                </p>
              </div>
              <button
                onClick={() => { setIsSalesHistoryOpen(false); setSalesHistoryData(null); }}
                className="text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:text-white transition bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 p-1.5 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            {/* Period filter inside modal */}
            <div className="p-4 border-b border-slate-200 dark:border-white/5">
              <div className="flex bg-slate-50/60 dark:bg-slate-950/60 p-1 rounded-xl border border-slate-200 dark:border-white/5 w-fit items-center overflow-x-auto">
                {[
                  { id: 'today', name: 'Bugun' },
                  { id: 'monthly', name: 'Oylik' },
                  { id: 'yearly', name: 'Yillik' },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setSalesHistoryPeriod(item.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer border whitespace-nowrap ${
                      salesHistoryPeriod === item.id
                        ? 'bg-brand-500 text-white shadow border-brand-400 font-bold'
                        : 'text-slate-500 dark:text-gray-400 hover:text-slate-700 dark:hover:text-gray-200 border-transparent'
                    }`}
                  >
                    {item.name}
                  </button>
                ))}
                
                {/* Calendar Date Picker Button */}
                <div className="relative flex items-center mx-1">
                  <label 
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer border whitespace-nowrap ${
                      salesHistoryPeriod === 'custom'
                        ? 'bg-brand-500 text-white shadow border-brand-400 font-bold'
                        : 'text-slate-500 dark:text-gray-400 hover:text-slate-700 dark:hover:text-gray-200 border-transparent'
                    }`}
                  >
                    <Calendar size={14} className={salesHistoryPeriod === 'custom' ? 'text-white' : 'text-slate-400'} />
                    <span>
                      {salesHistoryPeriod === 'custom' && salesHistoryCustomDate 
                        ? new Date(salesHistoryCustomDate).toLocaleDateString('uz-UZ', { day: '2-digit', month: '2-digit', year: 'numeric' })
                        : (() => {
                            const m = new Date().toLocaleDateString('uz-UZ', { month: 'long' });
                            return m.charAt(0).toUpperCase() + m.slice(1);
                          })()
                      }
                    </span>
                    <input 
                      type="date" 
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val) {
                          setSalesHistoryCustomDate(val);
                          setSalesHistoryPeriod('custom');
                        }
                      }}
                      value={salesHistoryCustomDate}
                    />
                  </label>
                </div>

                <button
                  onClick={() => setSalesHistoryPeriod('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer border whitespace-nowrap ${
                    salesHistoryPeriod === 'all'
                      ? 'bg-brand-500 text-white shadow border-brand-400 font-bold'
                      : 'text-slate-500 dark:text-gray-400 hover:text-slate-700 dark:hover:text-gray-200 border-transparent'
                  }`}
                >
                  Hammasi
                </button>
              </div>
            </div>

            {/* Summary */}
            {filteredSalesData && !salesHistoryLoading && (
              <div className="p-4 grid grid-cols-2 gap-3 border-b border-slate-200 dark:border-white/5">
                <div className="bg-slate-50/50 dark:bg-slate-950/50 rounded-xl p-3 border border-slate-200 dark:border-white/5">
                  <div className="text-[10px] text-slate-500 dark:text-gray-400 uppercase font-bold tracking-wider">Jami savdolar</div>
                  <div className="text-lg font-bold text-slate-900 dark:text-white mt-1">{filteredSalesData.totalOrders} ta</div>
                </div>
                <div className="bg-slate-50/50 dark:bg-slate-950/50 rounded-xl p-3 border border-slate-200 dark:border-white/5">
                  <div className="text-[10px] text-slate-500 dark:text-gray-400 uppercase font-bold tracking-wider">Jami tushum</div>
                  <div className="text-lg font-bold text-brand-400 mt-1">{formatCurrency(filteredSalesData.totalSales)}</div>
                </div>
              </div>
            )}

            {/* Daily stats table */}
            <div className="p-4 max-h-[50vh] overflow-y-auto">
              {salesHistoryLoading ? (
                <div className="text-center py-8 text-slate-500 dark:text-gray-400 animate-pulse">Yuklanmoqda...</div>
              ) : !filteredSalesData || filteredSalesData.dailyStats.length === 0 ? (
                <div className="text-center py-8 text-slate-500 dark:text-gray-500">
                  <Calendar size={32} className="mx-auto mb-2 opacity-20" />
                  <span>Bu davrda savdo qilinmagan</span>
                </div>
              ) : (
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-slate-500 dark:text-gray-400 uppercase bg-slate-50/30 dark:bg-slate-950/30 border-b border-slate-200 dark:border-white/5 sticky top-0">
                    <tr>
                      <th className="px-3 py-2.5 font-semibold">Sana</th>
                      <th className="px-3 py-2.5 font-semibold text-center">Buyurtmalar</th>
                      <th className="px-3 py-2.5 font-semibold text-right">Naqd tushum</th>
                      <th className="px-3 py-2.5 font-semibold text-right">Nasiya</th>
                      <th className="px-3 py-2.5 font-semibold text-right">Jami</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-white/5">
                    {filteredSalesData.dailyStats.map((day) => (
                      <tr key={day.date} className="hover:bg-white/[0.02] transition">
                        <td className="px-3 py-2.5 text-slate-900 dark:text-white font-medium">{formatDate(day.date)}</td>
                        <td className="px-3 py-2.5 text-center text-slate-700 dark:text-gray-300 font-mono">{day.ordersCount} ta</td>
                        <td className="px-3 py-2.5 text-right text-emerald-400 font-mono">{formatMoney(day.paidAmount)}</td>
                        <td className="px-3 py-2.5 text-right text-red-400 font-mono">{formatMoney(day.debtAmount)}</td>
                        <td className="px-3 py-2.5 text-right text-brand-400 font-bold font-mono">{formatMoney(day.totalSales)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
