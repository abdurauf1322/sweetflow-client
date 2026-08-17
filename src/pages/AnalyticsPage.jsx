import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { toast } from 'react-hot-toast';
import { BarChart3, TrendingUp, DollarSign, Box, Users, Award, Calendar, AlertTriangle, ArrowUpRight, X, Clock, Wallet, Pencil } from 'lucide-react';
import { formatMoney, formatNumberWithSpaces, parseNumberFromSpaces } from '../utils/format';

export const AnalyticsPage = () => {
  const [period, setPeriod] = useState('monthly'); // 'today', 'yesterday', 'weekly', 'monthly'
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isEditingBalance, setIsEditingBalance] = useState(false);
  const [newBalance, setNewBalance] = useState('');
  const [isExpensesHistoryModalOpen, setIsExpensesHistoryModalOpen] = useState(false);
  const [isPurchaseHistoryModalOpen, setIsPurchaseHistoryModalOpen] = useState(false);
  const [isProfitDetailsModalOpen, setIsProfitDetailsModalOpen] = useState(false);
  const [isSalesHistoryModalOpen, setIsSalesHistoryModalOpen] = useState(false);
  const [isCashInflowModalOpen, setIsCashInflowModalOpen] = useState(false);
  const [isDebtStoresModalOpen, setIsDebtStoresModalOpen] = useState(false);
  const [isSoldProductsModalOpen, setIsSoldProductsModalOpen] = useState(false);
  const [purchases, setPurchases] = useState([]);
  const [loadingPurchases, setLoadingPurchases] = useState(false);
  const isBoss = (localStorage.getItem('role') || '').toUpperCase() === 'BOSS';

  const handleUpdateBalanceSubmit = async (e) => {
    e.preventDefault();
    const rawBalance = parseNumberFromSpaces(newBalance);
    if (newBalance === '') {
      toast.error('Iltimos, to\'g\'ri son kiriting');
      return;
    }
    try {
      await api.put('/reports/balance', { balance: rawBalance });
      toast.success('Kassa balansi muvaffaqiyatli yangilandi');
      setIsEditingBalance(false);
      fetchReport();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Xatolik yuz berdi');
    }
  };



  useEffect(() => {
    fetchReport();
    
    // Auto-refresh (polling) every 10 seconds to catch other users' sales in real-time
    const intervalId = setInterval(() => {
      fetchReport(true);
    }, 10000);

    return () => clearInterval(intervalId);
  }, [period]);

  const fetchPurchases = async () => {
    setLoadingPurchases(true);
    try {
      const response = await api.get('/purchases', {
        params: { period, _t: Date.now() },
      });
      setPurchases(response.data.data.purchases);
    } catch (err) {
      toast.error('Tovar xaridlarini yuklashda xatolik yuz berdi');
    } finally {
      setLoadingPurchases(false);
    }
  };

  useEffect(() => {
    if (isPurchaseHistoryModalOpen) {
      fetchPurchases();
    }
  }, [isPurchaseHistoryModalOpen, period]);

  const fetchReport = async (silent = false) => {
    if (!silent) setLoading(true);
    if (!silent) setError(null);
    try {
      const response = await api.get('/reports/sales', {
        params: { period, _t: Date.now() },
      });
      // TAQDIMOT HOLATI UCHUN BARCHA QIYMATLAR 0 GA O'ZGARTIRILDI
      setReport({
        systemBalance: 0,
        totalExpenses: 0,
        totalOtherExpenses: 0,
        totalSales: 0,
        totalPaid: 0,
        totalDebt: 0,
        totalBoxesSold: 0,
        totalPiecesSold: 0,
        netProfit: 0,
        profitPercentage: 0,
        topProducts: [],
        topStores: [],
        topSellers: [],
        expensesList: [],
        productProfitList: [],
        salesHistory: [],
        debtStores: [],
        soldProductsList: []
      });
    } catch (err) {
      if (!silent) setError(err.response?.data?.message || 'Failed to fetch sales analytics');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const formatCurrency = (val) => {
    return formatMoney(val) + " so'm";
  };


  const getPeriodLabel = () => {
    switch (period) {
      case 'today': return 'Bugun';
      case 'yesterday': return 'Kecha';
      case 'weekly': return 'So\'nggi 7 kun';
      case 'monthly': return 'Joriy oy';
      case 'yearly': return 'Joriy yil';
      default: return 'Joriy oy';
    }
  };

  const debtPercent = report && report.totalSales > 0
    ? (report.totalDebt / report.totalSales) * 100
    : 0;

  const paidPercent = report && report.totalSales > 0
    ? (report.totalPaid / report.totalSales) * 100
    : 0;

  return (
    <div className="space-y-6 h-full flex flex-col">
      {/* Header bar and Period filter */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center space-x-2">
            <BarChart3 className="text-brand-400" />
            <span>Savdo Tahlili va Hisobotlar</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-gray-400 mt-1">
            Ulgurji shirinliklar savdo hajmi va do'konlar aylanmasi ({getPeriodLabel()})
          </p>
        </div>

        {/* Period Selector Tabs */}
        <div className="flex bg-slate-50/60 dark:bg-slate-950/60 p-1 rounded-xl border border-slate-200 dark:border-white/5 self-start">
          {[
            { id: 'today', name: 'Bugun' },
            { id: 'yesterday', name: 'Kecha' },
            { id: 'weekly', name: 'Haftalik' },
            { id: 'monthly', name: 'Oylik' },
            { id: 'yearly', name: 'Yillik' }
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setPeriod(item.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer border whitespace-nowrap ${
                period === item.id
                  ? 'bg-brand-500 text-white shadow border-brand-400 font-bold'
                  : 'text-slate-500 dark:text-gray-400 hover:text-slate-700 dark:hover:text-gray-200 border-transparent'
              }`}
            >
              {item.name}
            </button>
          ))}

          {/* Custom Date & Month Pickers */}
          <div className="flex items-center gap-1 border-l border-slate-200 dark:border-white/10 pl-1 ml-1">
            {/* Date Picker */}
            <div className="relative flex items-center">
              <label className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer border whitespace-nowrap ${
                period.match(/^\d{4}-\d{2}-\d{2}$/) ? 'bg-brand-500 text-white shadow border-brand-400 font-bold' : 'text-slate-500 dark:text-gray-400 hover:text-slate-700 dark:hover:text-gray-200 border-transparent'
              }`}>
                <Calendar size={14} />
                <span>
                  {period.match(/^\d{4}-\d{2}-\d{2}$/) 
                    ? new Date(period).toLocaleDateString('uz-UZ', { day: '2-digit', month: '2-digit', year: 'numeric' })
                    : 'Kun'}
                </span>
                <input type="date" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  onChange={(e) => e.target.value && setPeriod(e.target.value)} />
              </label>
            </div>

            {/* Month Picker */}
            <div className="relative flex items-center">
              <label className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer border whitespace-nowrap ${
                period.match(/^\d{4}-\d{2}$/) ? 'bg-brand-500 text-white shadow border-brand-400 font-bold' : 'text-slate-500 dark:text-gray-400 hover:text-slate-700 dark:hover:text-gray-200 border-transparent'
              }`}>
                <Calendar size={14} />
                <span>
                  {period.match(/^\d{4}-\d{2}$/) 
                    ? new Date(period + '-01').toLocaleDateString('uz-UZ', { month: 'long', year: 'numeric' })
                    : (() => {
                        const m = new Date().toLocaleDateString('uz-UZ', { month: 'long' });
                        return m.charAt(0).toUpperCase() + m.slice(1);
                      })()
                  }
                </span>
                <input type="month" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  onChange={(e) => e.target.value && setPeriod(e.target.value)} />
              </label>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-sm">
          Xatolik: {error}
        </div>
      )}

      {loading ? (
        <div className="flex-1 flex items-center justify-center py-20 text-sm text-slate-500 dark:text-gray-500">
          Tahliliy ma'lumotlar yuklanmoqda...
        </div>
      ) : !report ? (
        <div className="flex-1 flex items-center justify-center py-20 text-sm text-slate-500 dark:text-gray-500">
          Ma'lumot mavjud emas
        </div>
      ) : (
        <div className="space-y-6 overflow-y-auto pr-1 flex-1">
          {/* Section 1: Financial Balances */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* System Balance */}
            <div className="glass-panel rounded-2xl p-5 border border-brand-500/20 bg-gradient-to-br from-brand-950/20 to-slate-900/40 relative overflow-hidden group shadow-lg shadow-brand-500/5 transition-all">
              {isBoss && !isEditingBalance && (
                <button
                  onClick={() => {
                    setNewBalance(formatNumberWithSpaces(report.systemBalance));
                    setIsEditingBalance(true);
                  }}
                  className="absolute top-3 right-3 bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:text-white p-1.5 rounded-lg border border-slate-200 dark:border-white/5 hover:border-slate-200 dark:border-white/10 transition cursor-pointer flex items-center justify-center z-10"
                  title="Balansni tahrirlash"
                >
                  <Pencil size={12} />
                </button>
              )}

              <div className="flex items-center space-x-4">
                <div className="bg-brand-500/20 w-10 h-10 rounded-full flex items-center justify-center text-brand-400 shrink-0">
                  <Wallet size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-xs text-slate-500 dark:text-gray-400 font-medium tracking-wider uppercase block">Asosiy Balans</span>
                  {isEditingBalance ? (
                    <form onSubmit={handleUpdateBalanceSubmit} className="flex items-center gap-2 mt-1.5 w-full">
                      <div className="relative flex-1 min-w-0">
                        <input
                          type="text"
                          className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-lg text-slate-900 dark:text-white w-full pl-2 pr-10 py-1.5 focus:outline-none focus:ring-1 focus:ring-brand-500 text-sm font-mono font-bold"
                          value={newBalance}
                          onChange={(e) => setNewBalance(formatNumberWithSpaces(e.target.value))}
                          autoFocus
                        />
                        <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-500 dark:text-gray-500 font-bold">so'm</span>
                      </div>
                      <button type="submit" className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 w-8 h-8 rounded-lg border border-emerald-500/20 transition cursor-pointer flex items-center justify-center shrink-0 text-xs font-bold" title="Saqlash">
                        ✔
                      </button>
                      <button type="button" onClick={() => setIsEditingBalance(false)} className="bg-red-500/10 hover:bg-red-500/20 text-red-400 w-8 h-8 rounded-lg border border-red-500/20 transition cursor-pointer flex items-center justify-center shrink-0 text-xs font-bold" title="Bekor qilish">
                        ✖
                      </button>
                    </form>
                  ) : (
                    <div className="flex items-center gap-2 mt-1">
                      <h3 className={`text-xl sm:text-2xl font-black tracking-tight whitespace-nowrap ${Number(report.systemBalance || 0) < 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                        {formatCurrency(report.systemBalance)}
                      </h3>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Total Operational Expenses */}
            <div 
              onClick={() => setIsPurchaseHistoryModalOpen(true)}
              className="glass-panel rounded-3xl p-6 border border-orange-500/20 bg-gradient-to-br from-orange-900/20 to-slate-900/60 flex flex-col justify-between relative overflow-hidden group shadow-lg hover:shadow-orange-500/10 transition-all cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800/40"
            >
              <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="bg-orange-500/20 text-orange-400 p-1.5 rounded-lg text-xs font-bold flex items-center space-x-1 border border-orange-500/20 shadow-sm shadow-orange-500/10">
                  <span>Tarix</span>
                  <ArrowUpRight size={14} />
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="bg-orange-500/20 w-12 h-12 rounded-full flex items-center justify-center text-orange-400 shrink-0">
                  <DollarSign size={24} className="rotate-180" />
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 dark:text-gray-400 uppercase font-black tracking-widest">Jami Xarajat (Tovarlar)</span>
                  <h3 className="text-2xl font-black text-orange-400 mt-1 tracking-tight">{formatCurrency(report.totalExpenses)}</h3>
                </div>
              </div>
            </div>

            {/* Other Expenses (Boshqa / Shaxsiy xarajatlar) */}
            <div 
              onClick={() => setIsExpensesHistoryModalOpen(true)}
              className="glass-panel rounded-3xl p-6 border border-red-500/20 bg-gradient-to-br from-red-900/20 to-slate-900/60 flex flex-col justify-between relative overflow-hidden group shadow-lg hover:shadow-red-500/10 transition-all cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800/40"
            >
              <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="bg-red-500/20 text-red-400 p-1.5 rounded-lg text-xs font-bold flex items-center space-x-1 border border-red-500/20 shadow-sm shadow-red-500/10">
                  <span>Tarix</span>
                  <ArrowUpRight size={14} />
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="bg-red-500/20 w-12 h-12 rounded-full flex items-center justify-center text-red-500 shrink-0">
                  <AlertTriangle size={24} />
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 dark:text-gray-400 uppercase font-black tracking-widest">Boshqa Xarajatlar</span>
                  <h3 className="text-2xl font-black text-red-500 mt-1 tracking-tight">{formatCurrency(report.totalOtherExpenses)}</h3>
                </div>
              </div>
            </div>

            {/* Net Profit (Profit/Loss) */}
            <div 
              onClick={() => setIsProfitDetailsModalOpen(true)}
              className="glass-panel rounded-3xl p-6 border border-emerald-500/20 bg-gradient-to-br from-emerald-900/20 to-slate-900/60 flex flex-col justify-between relative overflow-hidden group shadow-lg hover:shadow-emerald-500/10 transition-all cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800/40"
            >
              <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="bg-emerald-500/20 text-emerald-400 p-1.5 rounded-lg text-xs font-bold flex items-center space-x-1 border border-emerald-500/20 shadow-sm shadow-emerald-500/10">
                  <span>Tarix</span>
                  <ArrowUpRight size={14} />
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${report.netProfit >= 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                  <TrendingUp size={24} className={report.netProfit < 0 ? 'rotate-180' : ''} />
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 dark:text-gray-400 uppercase font-black tracking-widest">Sof Foyda (Profit)</span>
                  <div className="flex items-baseline space-x-2 mt-1">
                    <h3 className={`text-2xl font-black tracking-tight ${report.netProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {formatCurrency(report.netProfit)}
                    </h3>
                  </div>
                </div>
              </div>
              <div className="mt-4 flex">
                <span className={`inline-block px-3 py-1.5 rounded-xl font-black text-[10px] tracking-wider uppercase border shadow-sm ${
                  report.netProfit >= 0 
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 shadow-emerald-500/10' 
                    : 'bg-red-500/20 text-red-400 border-red-500/40 shadow-red-500/10'
                }`}>
                  {report.netProfit >= 0 ? '+' : ''}{report.profitPercentage.toFixed(1)}% {report.netProfit >= 0 ? 'Foyda' : 'Ziyon'}
                </span>
              </div>
            </div>
          </div>

          {/* Section 2: Sales & Operational stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Total Sales */}
            <div 
              onClick={() => setIsSalesHistoryModalOpen(true)}
              className="glass-panel rounded-3xl p-6 border border-brand-500/10 bg-gradient-to-br from-brand-950/20 to-slate-900/40 flex items-center space-x-4 relative overflow-hidden group hover:border-brand-500/20 transition-all cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800/40"
            >
              <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <ArrowUpRight size={14} className="text-brand-400" />
              </div>
              <div className="bg-brand-500/20 w-12 h-12 rounded-full flex items-center justify-center text-brand-400 shrink-0">
                <TrendingUp size={24} />
              </div>
              <div>
                <span className="text-[10px] text-slate-500 dark:text-gray-400 uppercase font-black tracking-widest">Jami Savdo</span>
                <h3 className="text-xl font-black text-slate-900 dark:text-white mt-1 tracking-tight">{formatCurrency(report.totalSales)}</h3>
              </div>
            </div>

            {/* Paid Amount */}
            <div 
              onClick={() => setIsCashInflowModalOpen(true)}
              className="glass-panel rounded-3xl p-6 border border-emerald-500/10 bg-gradient-to-br from-emerald-950/20 to-slate-900/40 flex items-center space-x-4 relative overflow-hidden group hover:border-emerald-500/20 transition-all cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800/40"
            >
              <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <ArrowUpRight size={14} className="text-emerald-400" />
              </div>
              <div className="bg-emerald-500/20 w-12 h-12 rounded-full flex items-center justify-center text-emerald-400 shrink-0">
                <DollarSign size={24} />
              </div>
              <div>
                <span className="text-[10px] text-slate-500 dark:text-gray-400 uppercase font-black tracking-widest">Naqd Tushum</span>
                <h3 className="text-xl font-black text-emerald-400 mt-1 tracking-tight">{formatCurrency(report.totalPaid)}</h3>
              </div>
            </div>

            {/* Debt Amount */}
            <div 
              onClick={() => setIsDebtStoresModalOpen(true)}
              className="glass-panel rounded-3xl p-6 border border-red-500/10 bg-gradient-to-br from-red-950/20 to-slate-900/40 flex items-center space-x-4 relative overflow-hidden group hover:border-red-500/20 transition-all cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800/40"
            >
              <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <ArrowUpRight size={14} className="text-red-400" />
              </div>
              <div className="bg-red-500/20 w-12 h-12 rounded-full flex items-center justify-center text-red-400 shrink-0">
                <AlertTriangle size={24} />
              </div>
              <div>
                <span className="text-[10px] text-slate-500 dark:text-gray-400 uppercase font-black tracking-widest">Nasiya (Qarz)</span>
                <h3 className="text-xl font-black text-red-400 mt-1 tracking-tight">{formatCurrency(report.totalDebt)}</h3>
              </div>
            </div>

            {/* Total Chocolate Sold */}
            <div 
              onClick={() => setIsSoldProductsModalOpen(true)}
              className="glass-panel rounded-3xl p-6 border border-yellow-500/10 bg-gradient-to-br from-yellow-950/20 to-slate-900/40 flex items-center space-x-4 relative overflow-hidden group hover:border-yellow-500/20 transition-all cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800/40"
            >
              <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <ArrowUpRight size={14} className="text-yellow-400" />
              </div>
              <div className="bg-yellow-500/20 w-12 h-12 rounded-full flex items-center justify-center text-yellow-400 shrink-0">
                <Box size={24} />
              </div>
              <div>
                <span className="text-[10px] text-slate-500 dark:text-gray-400 uppercase font-black tracking-widest">Sotilgan Mahsulot</span>
                <h3 className="text-lg font-black text-slate-900 dark:text-white mt-1 tracking-tight leading-tight">
                  {report.totalBoxesSold} quti<br/>{report.totalPiecesSold} dona
                </h3>
              </div>
            </div>
          </div>

          {/* Paid vs Debt percentage split bar */}
          <div className="glass-panel rounded-3xl p-6 border border-slate-200 dark:border-white/5 space-y-4 bg-slate-100/50 dark:bg-slate-900/40 ">
            <div className="flex justify-between items-center text-[10px] sm:text-xs font-black uppercase tracking-widest">
              <span className="text-emerald-400 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                Naqd (To'langan): {paidPercent.toFixed(1)}%
              </span>
              <span className="text-red-400 flex items-center gap-2">
                Nasiya (Qarz): {debtPercent.toFixed(1)}%
                <span className="w-2 h-2 rounded-full bg-red-400"></span>
              </span>
            </div>
            <div className="w-full bg-slate-100/50 dark:bg-slate-900/40  rounded-full h-5 sm:h-6 flex overflow-hidden border border-slate-200 dark:border-white/10 shadow-inner">
              <div className="bg-gradient-to-r from-emerald-600 to-emerald-400 h-full transition-all duration-1000 shadow-[0_0_15px_rgba(52,211,153,0.5)]" style={{ width: `${paidPercent}%` }} />
              <div className="bg-gradient-to-l from-red-600 to-red-400 h-full transition-all duration-1000 shadow-[0_0_15px_rgba(248,113,113,0.5)]" style={{ width: `${debtPercent}%` }} />
            </div>
          </div>

          {/* Top Sellings and Top Customers */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Products */}
            <div className="glass-panel rounded-2xl p-5 border border-slate-200 dark:border-white/5 flex flex-col space-y-4">
              <div className="flex items-center space-x-2 pb-3 border-b border-slate-200 dark:border-white/5">
                <Award size={18} className="text-brand-400" />
                <h3 className="font-bold text-slate-900 dark:text-white text-sm">Eng Ko'p Sotilgan Mahsulotlar (Top 5)</h3>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs text-slate-700 dark:text-gray-300">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-white/5 bg-slate-50/30 dark:bg-slate-950/30 text-slate-500 dark:text-gray-400 uppercase font-semibold">
                      <th className="p-3">Mahsulot Nomi</th>
                      <th className="p-3 text-center">Sotuv Hajmi</th>
                      <th className="p-3 text-right font-mono">Umumiy Qiymati</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-white/5">
                    {report.topProducts.length === 0 ? (
                      <tr>
                        <td colSpan="3" className="p-6 text-center text-slate-500 dark:text-gray-500">Hech qanday savdo amalga oshirilmagan</td>
                      </tr>
                    ) : (
                      report.topProducts.map((p, idx) => (
                        <tr key={p.id} className="hover:bg-white/[0.01]">
                          <td className="p-3 font-semibold text-slate-900 dark:text-white flex items-center space-x-2">
                            <span className="text-[10px] text-slate-500 dark:text-gray-500 font-mono w-4">#{idx+1}</span>
                            <span>{p.name}</span>
                          </td>
                          <td className="p-3 text-center text-slate-500 dark:text-gray-400">
                            {p.boxesSold > 0 && `${p.boxesSold} quti`}
                            {p.boxesSold > 0 && p.piecesSold > 0 && ' + '}
                            {p.piecesSold > 0 && `${p.piecesSold} dona`}
                            {p.boxesSold === 0 && p.piecesSold === 0 && '0 dona'}
                          </td>
                          <td className="p-3 text-right text-brand-300 font-bold font-mono">
                            {formatCurrency(p.totalSalesValue)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Top Stores */}
            <div className="glass-panel rounded-2xl p-5 border border-slate-200 dark:border-white/5 flex flex-col space-y-4">
              <div className="flex items-center space-x-2 pb-3 border-b border-slate-200 dark:border-white/5">
                <Users size={18} className="text-brand-400" />
                <h3 className="font-bold text-slate-900 dark:text-white text-sm">Eng Faol Do'konlar / Hamkorlar (Top 5)</h3>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs text-slate-700 dark:text-gray-300">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-white/5 bg-slate-50/30 dark:bg-slate-950/30 text-slate-500 dark:text-gray-400 uppercase font-semibold">
                      <th className="p-3">Do'kon nomi</th>
                      <th className="p-3 text-center">Buyurtmalar soni</th>
                      <th className="p-3 text-right">Mavjud qarz</th>
                      <th className="p-3 text-right font-mono">Xarid summasi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-white/5">
                    {report.topStores.length === 0 ? (
                      <tr>
                        <td colSpan="4" className="p-6 text-center text-slate-500 dark:text-gray-500">Hech qanday do'kon topilmadi</td>
                      </tr>
                    ) : (
                      report.topStores.map((store, idx) => (
                        <tr key={store.id} className="hover:bg-white/[0.01]">
                          <td className="p-3 font-semibold text-slate-900 dark:text-white flex items-center space-x-2">
                            <span className="text-[10px] text-slate-500 dark:text-gray-500 font-mono w-4">#{idx+1}</span>
                            <div>
                              <div>{store.name}</div>
                              <div className="text-[10px] text-slate-500 dark:text-gray-500 font-normal">Egasi: {store.ownerName}</div>
                            </div>
                          </td>
                          <td className="p-3 text-center text-slate-500 dark:text-gray-400 font-mono">{store.ordersCount} ta</td>
                          <td className="p-3 text-right text-red-400 font-mono">
                            {store.currentDebt > 0 ? formatCurrency(store.currentDebt) : 'Qarz yo\'q'}
                          </td>
                          <td className="p-3 text-right text-emerald-400 font-bold font-mono">
                            {formatCurrency(store.totalSpend)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Top Sellers */}
            <div className="glass-panel rounded-2xl p-5 border border-slate-200 dark:border-white/5 flex flex-col space-y-4 md:col-span-2 mt-6 lg:mt-0 lg:col-span-1 xl:col-span-2">
              <div className="flex items-center space-x-2 pb-3 border-b border-slate-200 dark:border-white/5">
                <Users size={18} className="text-brand-400" />
                <h3 className="font-bold text-slate-900 dark:text-white text-sm">Xodimlar bo'yicha savdo (Tushum)</h3>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs text-slate-700 dark:text-gray-300">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-white/5 bg-slate-50/30 dark:bg-slate-950/30 text-slate-500 dark:text-gray-400 uppercase font-semibold">
                      <th className="p-3">Xodim nomi</th>
                      <th className="p-3 text-center">Savdolar soni</th>
                      <th className="p-3 text-right font-mono">Umumiy Tushum</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-white/5">
                    {!report?.topSellers || report.topSellers.length === 0 ? (
                      <tr>
                        <td colSpan="3" className="p-6 text-center text-slate-500 dark:text-gray-500">Hech qanday ma'lumot yo'q</td>
                      </tr>
                    ) : (
                      report.topSellers.map((seller, idx) => (
                        <tr key={seller.id} className="hover:bg-white/[0.01]">
                          <td className="p-3 font-semibold text-slate-900 dark:text-white flex items-center space-x-2">
                            <span className="text-[10px] text-slate-500 dark:text-gray-500 font-mono w-4">#{idx+1}</span>
                            <div>{seller.name}</div>
                          </td>
                          <td className="p-3 text-center text-slate-500 dark:text-gray-400 font-mono">{seller.ordersCount} ta</td>
                          <td className="p-3 text-right text-emerald-400 font-bold font-mono">
                            {formatCurrency(seller.totalSales)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Expenses History Modal */}
      {isExpensesHistoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="glass-panel border-slate-200 dark:border-white/10 max-w-2xl w-full rounded-3xl p-6 relative my-auto shadow-2xl shadow-red-900/20 border-t-red-500/20">
            <button
              onClick={() => setIsExpensesHistoryModalOpen(false)}
              className="absolute top-4 right-4 text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:text-white transition bg-white/5 p-2 rounded-xl hover:bg-slate-200 dark:hover:bg-white/10 cursor-pointer"
            >
              <X size={20} />
            </button>
            <div className="flex items-center space-x-3 mb-6">
              <div className="bg-red-500/20 p-2.5 rounded-xl text-red-400">
                <AlertTriangle size={24} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Boshqa xarajatlar tarixi</h3>
                <p className="text-xs text-slate-500 dark:text-gray-400 mt-0.5">{getPeriodLabel()} ({report?.expensesList?.length || 0} ta yozuv)</p>
              </div>
            </div>
            
            <div className="bg-slate-50/50 dark:bg-slate-950/50 rounded-2xl border border-slate-200 dark:border-white/5 overflow-hidden max-h-[60vh] overflow-y-auto">
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="bg-white/80 dark:bg-slate-900/80 text-slate-500 dark:text-gray-400 uppercase tracking-wider font-semibold border-b border-slate-200 dark:border-white/5 sticky top-0 backdrop-blur-md">
                    <th className="p-4">Sana / Vaqt</th>
                    <th className="p-4">Izoh</th>
                    <th className="p-4 text-right">Summa</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-white/5">
                  {!report?.expensesList || report.expensesList.length === 0 ? (
                    <tr>
                      <td colSpan="3" className="p-8 text-center text-slate-500 dark:text-gray-500">Bu davrda boshqa xarajatlar mavjud emas.</td>
                    </tr>
                  ) : (
                    report.expensesList.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).map((expense, idx) => (
                      <tr key={expense.id || idx} className="hover:bg-white/[0.02] transition">
                        <td className="p-4 text-slate-700 dark:text-gray-300 font-mono flex items-center space-x-2 whitespace-nowrap">
                          <Clock size={14} className="text-slate-500 dark:text-gray-500" />
                          <span>{new Date(expense.createdAt).toLocaleString('ru-RU')}</span>
                        </td>
                        <td className="p-4 text-slate-900 dark:text-white font-medium break-words max-w-[200px]">
                          {expense.description}
                        </td>
                        <td className="p-4 text-right text-red-400 font-black tracking-tight whitespace-nowrap">
                          {formatCurrency(expense.amount)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Purchase History Modal */}
      {isPurchaseHistoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="glass-panel border-slate-200 dark:border-white/10 max-w-4xl w-full rounded-3xl p-6 relative my-auto shadow-2xl shadow-orange-900/20 border-t-orange-500/20">
            <button onClick={() => setIsPurchaseHistoryModalOpen(false)} className="absolute top-4 right-4 text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:text-white transition bg-white/5 p-2 rounded-xl hover:bg-slate-200 dark:hover:bg-white/10 cursor-pointer">
              <X size={20} />
            </button>
            <div className="flex items-center space-x-3 mb-6">
              <div className="bg-orange-500/20 p-2.5 rounded-xl text-orange-400"><DollarSign size={24} className="rotate-180" /></div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Omborga qilingan tovar xaridlari</h3>
                <p className="text-xs text-slate-500 dark:text-gray-400 mt-0.5">{getPeriodLabel()} ({purchases?.length || 0} ta yozuv)</p>
              </div>
            </div>
            <div className="bg-slate-50/50 dark:bg-slate-950/50 rounded-2xl border border-slate-200 dark:border-white/5 overflow-hidden max-h-[60vh] overflow-y-auto">
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="bg-white/80 dark:bg-slate-900/80 text-slate-500 dark:text-gray-400 uppercase tracking-wider font-semibold border-b border-slate-200 dark:border-white/5 sticky top-0 backdrop-blur-md">
                    <th className="p-4">Sana</th>
                    <th className="p-4">Mahsulot</th>
                    <th className="p-4 text-center">Miqdor</th>
                    <th className="p-4 text-right">Tannarx (dona / quti)</th>
                    <th className="p-4 text-right">Jami Summa</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-white/5">
                  {loadingPurchases ? (
                    <tr><td colSpan="5" className="p-8 text-center text-slate-500 dark:text-gray-500">Yuklanmoqda...</td></tr>
                  ) : !purchases || purchases.length === 0 ? (
                    <tr><td colSpan="5" className="p-8 text-center text-slate-500 dark:text-gray-500">Bu davrda tovar xaridlari mavjud emas.</td></tr>
                  ) : (
                    purchases.map((hist, idx) => (
                      <tr key={hist.id || idx} className="hover:bg-white/[0.02] transition">
                        <td className="p-4 text-slate-700 dark:text-gray-300 font-mono whitespace-nowrap"><Clock size={14} className="inline mr-2 text-slate-500 dark:text-gray-500" />{new Date(hist.createdAt).toLocaleString('ru-RU')}</td>
                        <td className="p-4 text-slate-900 dark:text-white font-medium">{hist.product?.name || 'Noma\'lum'}</td>
                        <td className="p-4 text-center text-slate-700 dark:text-gray-300">
                          {hist.addedBoxes > 0 && `${hist.addedBoxes} quti`}
                          {hist.addedBoxes > 0 && hist.addedPieces > 0 && ' + '}
                          {hist.addedPieces > 0 && `${hist.addedPieces} dona`}
                        </td>
                        <td className="p-4 text-right text-slate-500 dark:text-gray-400 font-mono text-[11px]">
                          {hist.addedPieces > 0 && <div>D: {formatCurrency(hist.pieceCostPrice)}</div>}
                          {hist.addedBoxes > 0 && <div>Q: {formatCurrency(hist.boxCostPrice)}</div>}
                        </td>
                        <td className="p-4 text-right text-orange-400 font-black tracking-tight whitespace-nowrap">{formatCurrency(hist.totalCost)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Profit Details Modal */}
      {isProfitDetailsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="glass-panel border-slate-200 dark:border-white/10 max-w-4xl w-full rounded-3xl p-6 relative my-auto shadow-2xl shadow-emerald-900/20 border-t-emerald-500/20">
            <button onClick={() => setIsProfitDetailsModalOpen(false)} className="absolute top-4 right-4 text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:text-white transition bg-white/5 p-2 rounded-xl hover:bg-slate-200 dark:hover:bg-white/10 cursor-pointer"><X size={20} /></button>
            <div className="flex items-center space-x-3 mb-6">
              <div className="bg-emerald-500/20 p-2.5 rounded-xl text-emerald-400"><TrendingUp size={24} /></div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Mahsulotlar kesimida sof foyda</h3>
                <p className="text-xs text-slate-500 dark:text-gray-400 mt-0.5">{getPeriodLabel()}</p>
              </div>
            </div>
            <div className="bg-slate-50/50 dark:bg-slate-950/50 rounded-2xl border border-slate-200 dark:border-white/5 overflow-hidden max-h-[60vh] overflow-y-auto">
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="bg-white/80 dark:bg-slate-900/80 text-slate-500 dark:text-gray-400 uppercase tracking-wider font-semibold border-b border-slate-200 dark:border-white/5 sticky top-0 backdrop-blur-md">
                    <th className="p-4">Mahsulot Nomi</th>
                    <th className="p-4 text-center">Sotilgan Hajm</th>
                    <th className="p-4 text-right">Tannarx (Xarajat)</th>
                    <th className="p-4 text-right">Sotuv Summasi</th>
                    <th className="p-4 text-right">Sof Foyda</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-white/5">
                  {!report?.productProfitList || report.productProfitList.length === 0 ? (
                    <tr><td colSpan="5" className="p-8 text-center text-slate-500 dark:text-gray-500">Hech qanday savdo mavjud emas.</td></tr>
                  ) : (
                    report.productProfitList.map((p, idx) => (
                      <tr key={p.id} className="hover:bg-white/[0.02] transition">
                        <td className="p-4 text-slate-900 dark:text-white font-medium">{p.name}</td>
                        <td className="p-4 text-center text-slate-700 dark:text-gray-300">
                          {p.boxesSold > 0 && `${p.boxesSold} quti`}
                          {p.boxesSold > 0 && p.piecesSold > 0 && ' + '}
                          {p.piecesSold > 0 && `${p.piecesSold} dona`}
                        </td>
                        <td className="p-4 text-right text-orange-400/80 font-mono">{formatCurrency(p.totalCost)}</td>
                        <td className="p-4 text-right text-blue-400/80 font-mono">{formatCurrency(p.totalSalesValue)}</td>
                        <td className={`p-4 text-right font-black tracking-tight whitespace-nowrap ${p.netProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {p.netProfit >= 0 ? '+' : ''}{formatCurrency(p.netProfit)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Sales History Modal */}
      {isSalesHistoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="glass-panel border-slate-200 dark:border-white/10 max-w-4xl w-full rounded-3xl p-6 relative my-auto shadow-2xl shadow-brand-900/20 border-t-brand-500/20">
            <button onClick={() => setIsSalesHistoryModalOpen(false)} className="absolute top-4 right-4 text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:text-white transition bg-white/5 p-2 rounded-xl hover:bg-slate-200 dark:hover:bg-white/10 cursor-pointer"><X size={20} /></button>
            <div className="flex items-center space-x-3 mb-6">
              <div className="bg-brand-500/20 p-2.5 rounded-xl text-brand-400"><TrendingUp size={24} /></div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Barcha Savdolar Tarixi</h3>
                <p className="text-xs text-slate-500 dark:text-gray-400 mt-0.5">{getPeriodLabel()} ({report?.salesHistory?.length || 0} ta savdo)</p>
              </div>
            </div>
            <div className="bg-slate-50/50 dark:bg-slate-950/50 rounded-2xl border border-slate-200 dark:border-white/5 overflow-hidden max-h-[60vh] overflow-y-auto">
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="bg-white/80 dark:bg-slate-900/80 text-slate-500 dark:text-gray-400 uppercase tracking-wider font-semibold border-b border-slate-200 dark:border-white/5 sticky top-0 backdrop-blur-md">
                    <th className="p-4">Sana</th>
                    <th className="p-4">Do'kon / Mijoz</th>
                    <th className="p-4 text-right">Umumiy Summa</th>
                    <th className="p-4 text-right">To'langan (Naqd)</th>
                    <th className="p-4 text-right">Nasiya (Qarz)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-white/5">
                  {!report?.salesHistory || report.salesHistory.length === 0 ? (
                    <tr><td colSpan="5" className="p-8 text-center text-slate-500 dark:text-gray-500">Bu davrda savdolar mavjud emas.</td></tr>
                  ) : (
                    report.salesHistory.map((order, idx) => (
                      <tr key={order.id} className="hover:bg-white/[0.02] transition">
                        <td className="p-4 text-slate-700 dark:text-gray-300 font-mono whitespace-nowrap"><Clock size={14} className="inline mr-2 text-slate-500 dark:text-gray-500" />{new Date(order.createdAt).toLocaleString('ru-RU')}</td>
                        <td className="p-4 text-slate-900 dark:text-white font-medium">{order.store?.name || 'Noma\'lum'}</td>
                        <td className="p-4 text-right text-slate-900 dark:text-white font-bold">{formatCurrency(order.totalAmount)}</td>
                        <td className="p-4 text-right text-emerald-400 font-mono">{formatCurrency(Number(order.totalAmount) - Number(order.debtAmount))}</td>
                        <td className="p-4 text-right text-red-400 font-mono">{formatCurrency(order.debtAmount)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Cash Inflow Modal */}
      {isCashInflowModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="glass-panel border-slate-200 dark:border-white/10 max-w-4xl w-full rounded-3xl p-6 relative my-auto shadow-2xl shadow-emerald-900/20 border-t-emerald-500/20">
            <button onClick={() => setIsCashInflowModalOpen(false)} className="absolute top-4 right-4 text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:text-white transition bg-white/5 p-2 rounded-xl hover:bg-slate-200 dark:hover:bg-white/10 cursor-pointer"><X size={20} /></button>
            <div className="flex items-center space-x-3 mb-6">
              <div className="bg-emerald-500/20 p-2.5 rounded-xl text-emerald-400"><DollarSign size={24} /></div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Naqd Tushum Tarixi</h3>
                <p className="text-xs text-slate-500 dark:text-gray-400 mt-0.5">{getPeriodLabel()} (Savdolardan olingan naqd to'lovlar)</p>
              </div>
            </div>
            <div className="bg-slate-50/50 dark:bg-slate-950/50 rounded-2xl border border-slate-200 dark:border-white/5 overflow-hidden max-h-[60vh] overflow-y-auto">
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="bg-white/80 dark:bg-slate-900/80 text-slate-500 dark:text-gray-400 uppercase tracking-wider font-semibold border-b border-slate-200 dark:border-white/5 sticky top-0 backdrop-blur-md">
                    <th className="p-4">Sana</th>
                    <th className="p-4">Do'kon / Mijoz</th>
                    <th className="p-4 text-right">Umumiy Chek</th>
                    <th className="p-4 text-right">Tushgan Naqd</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-white/5">
                  {!report?.salesHistory || report.salesHistory.filter(o => Number(o.totalAmount) - Number(o.debtAmount) > 0).length === 0 ? (
                    <tr><td colSpan="4" className="p-8 text-center text-slate-500 dark:text-gray-500">Bu davrda naqd tushum mavjud emas.</td></tr>
                  ) : (
                    report.salesHistory.filter(o => Number(o.totalAmount) - Number(o.debtAmount) > 0).map((order) => (
                      <tr key={order.id} className="hover:bg-white/[0.02] transition">
                        <td className="p-4 text-slate-700 dark:text-gray-300 font-mono whitespace-nowrap"><Clock size={14} className="inline mr-2 text-slate-500 dark:text-gray-500" />{new Date(order.createdAt).toLocaleString('ru-RU')}</td>
                        <td className="p-4 text-slate-900 dark:text-white font-medium">{order.store?.name || 'Noma\'lum'}</td>
                        <td className="p-4 text-right text-slate-500 dark:text-gray-400 font-mono">{formatCurrency(order.totalAmount)}</td>
                        <td className="p-4 text-right text-emerald-400 font-black tracking-tight">{formatCurrency(Number(order.totalAmount) - Number(order.debtAmount))}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Debt Stores Modal */}
      {isDebtStoresModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="glass-panel border-slate-200 dark:border-white/10 max-w-4xl w-full rounded-3xl p-6 relative my-auto shadow-2xl shadow-red-900/20 border-t-red-500/20">
            <button onClick={() => setIsDebtStoresModalOpen(false)} className="absolute top-4 right-4 text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:text-white transition bg-white/5 p-2 rounded-xl hover:bg-slate-200 dark:hover:bg-white/10 cursor-pointer"><X size={20} /></button>
            <div className="flex items-center space-x-3 mb-6">
              <div className="bg-red-500/20 p-2.5 rounded-xl text-red-400"><AlertTriangle size={24} /></div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Qarzdor Do'konlar ro'yxati</h3>
                <p className="text-xs text-slate-500 dark:text-gray-400 mt-0.5">Joriy vaqtda haqiqatda qarzi bor do'konlar ({report?.debtStores?.length || 0} ta)</p>
              </div>
            </div>
            <div className="bg-slate-50/50 dark:bg-slate-950/50 rounded-2xl border border-slate-200 dark:border-white/5 overflow-hidden max-h-[60vh] overflow-y-auto">
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="bg-white/80 dark:bg-slate-900/80 text-slate-500 dark:text-gray-400 uppercase tracking-wider font-semibold border-b border-slate-200 dark:border-white/5 sticky top-0 backdrop-blur-md">
                    <th className="p-4">Do'kon / Mijoz Nomi</th>
                    <th className="p-4 text-right">Umumiy Qarz (Nasiya)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-white/5">
                  {!report?.debtStores || report.debtStores.length === 0 ? (
                    <tr><td colSpan="2" className="p-8 text-center text-emerald-500 font-bold">Ayni paytda qarzlar yo'q!</td></tr>
                  ) : (
                    report.debtStores.map((store) => (
                      <tr key={store.id} className="hover:bg-white/[0.02] transition">
                        <td className="p-4 text-slate-900 dark:text-white font-medium">{store.name} {store.ownerName ? `(${store.ownerName})` : ''}</td>
                        <td className="p-4 text-right text-red-400 font-black tracking-tight">{formatCurrency(store.currentDebt)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Sold Products Modal */}
      {isSoldProductsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="glass-panel border-slate-200 dark:border-white/10 max-w-4xl w-full rounded-3xl p-6 relative my-auto shadow-2xl shadow-yellow-900/20 border-t-yellow-500/20">
            <button onClick={() => setIsSoldProductsModalOpen(false)} className="absolute top-4 right-4 text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:text-white transition bg-white/5 p-2 rounded-xl hover:bg-slate-200 dark:hover:bg-white/10 cursor-pointer"><X size={20} /></button>
            <div className="flex items-center space-x-3 mb-6">
              <div className="bg-yellow-500/20 p-2.5 rounded-xl text-yellow-400"><Box size={24} /></div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Sotilgan Mahsulotlar Statistikasi</h3>
                <p className="text-xs text-slate-500 dark:text-gray-400 mt-0.5">{getPeriodLabel()}</p>
              </div>
            </div>
            <div className="bg-slate-50/50 dark:bg-slate-950/50 rounded-2xl border border-slate-200 dark:border-white/5 overflow-hidden max-h-[60vh] overflow-y-auto">
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="bg-white/80 dark:bg-slate-900/80 text-slate-500 dark:text-gray-400 uppercase tracking-wider font-semibold border-b border-slate-200 dark:border-white/5 sticky top-0 backdrop-blur-md">
                    <th className="p-4">Mahsulot Nomi</th>
                    <th className="p-4 text-center">Sotilgan Quti</th>
                    <th className="p-4 text-center">Sotilgan Dona</th>
                    <th className="p-4 text-right">Jami Summa</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-white/5">
                  {!report?.soldProductsList || report.soldProductsList.length === 0 ? (
                    <tr><td colSpan="4" className="p-8 text-center text-slate-500 dark:text-gray-500">Bu davrda mahsulot sotilmagan.</td></tr>
                  ) : (
                    report.soldProductsList.map((p) => (
                      <tr key={p.id} className="hover:bg-white/[0.02] transition">
                        <td className="p-4 text-slate-900 dark:text-white font-medium">{p.name}</td>
                        <td className="p-4 text-center text-brand-300 font-mono">{p.boxesSold}</td>
                        <td className="p-4 text-center text-brand-300 font-mono">{p.piecesSold}</td>
                        <td className="p-4 text-right text-slate-900 dark:text-white font-bold">{formatCurrency(p.totalSalesValue)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

