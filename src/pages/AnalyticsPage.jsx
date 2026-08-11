import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { BarChart3, TrendingUp, DollarSign, Box, Users, Award, Calendar, AlertTriangle, ArrowUpRight } from 'lucide-react';

export const AnalyticsPage = () => {
  const [period, setPeriod] = useState('monthly'); // 'today', 'yesterday', 'weekly', 'monthly'
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchReport();
  }, [period]);

  const fetchReport = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/reports/sales', {
        params: { period },
      });
      setReport(response.data.data.report);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch sales analytics');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (val) => {
    return Number(val || 0).toLocaleString() + " so'm";
  };

  const getPeriodLabel = () => {
    switch (period) {
      case 'today': return 'Bugun';
      case 'yesterday': return 'Kecha';
      case 'weekly': return 'So\'nggi 7 kun';
      case 'monthly': return 'So\'nggi 30 kun';
      default: return 'So\'nggi 30 kun';
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
          <h2 className="text-xl font-bold text-white flex items-center space-x-2">
            <BarChart3 className="text-brand-400" />
            <span>Savdo Tahlili va Hisobotlar</span>
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            Ulgurji shirinliklar savdo hajmi va do'konlar aylanmasi ({getPeriodLabel()})
          </p>
        </div>

        {/* Period Selector Tabs */}
        <div className="flex bg-slate-950/60 p-1 rounded-xl border border-white/5 self-start">
          {[
            { id: 'today', name: 'Bugun' },
            { id: 'yesterday', name: 'Kecha' },
            { id: 'weekly', name: 'Haftalik' },
            { id: 'monthly', name: 'Oylik' }
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setPeriod(item.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer border ${
                period === item.id
                  ? 'bg-brand-500 text-white shadow border-brand-400 font-bold'
                  : 'text-gray-400 hover:text-gray-200 border-transparent'
              }`}
            >
              {item.name}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-sm">
          Xatolik: {error}
        </div>
      )}

      {loading ? (
        <div className="flex-1 flex items-center justify-center py-20 text-sm text-gray-500">
          Tahliliy ma'lumotlar yuklanmoqda...
        </div>
      ) : !report ? (
        <div className="flex-1 flex items-center justify-center py-20 text-sm text-gray-500">
          Ma'lumot mavjud emas
        </div>
      ) : (
        <div className="space-y-6 overflow-y-auto pr-1 flex-1">
          {/* KPI Dashboard Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Total Sales */}
            <div className="glass-panel rounded-2xl p-5 border border-white/5 flex items-center space-x-4 relative overflow-hidden group">
              <div className="bg-brand-500/10 p-3 rounded-xl text-brand-400">
                <TrendingUp size={24} />
              </div>
              <div>
                <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Jami Savdo</span>
                <h3 className="text-lg font-black text-white mt-1">{formatCurrency(report.totalSales)}</h3>
              </div>
              <div className="absolute top-2 right-2 text-brand-500 opacity-20 group-hover:opacity-40 transition">
                <ArrowUpRight size={18} />
              </div>
            </div>

            {/* Paid Amount */}
            <div className="glass-panel rounded-2xl p-5 border border-white/5 flex items-center space-x-4 relative overflow-hidden group">
              <div className="bg-emerald-500/10 p-3 rounded-xl text-emerald-400">
                <DollarSign size={24} />
              </div>
              <div>
                <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Naqd Tushum</span>
                <h3 className="text-lg font-black text-emerald-400 mt-1">{formatCurrency(report.totalPaid)}</h3>
              </div>
            </div>

            {/* Debt Amount */}
            <div className="glass-panel rounded-2xl p-5 border border-white/5 flex items-center space-x-4 relative overflow-hidden group">
              <div className="bg-red-500/10 p-3 rounded-xl text-red-400">
                <AlertTriangle size={24} />
              </div>
              <div>
                <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Nasiya (Qarz)</span>
                <h3 className="text-lg font-black text-red-400 mt-1">{formatCurrency(report.totalDebt)}</h3>
              </div>
            </div>

            {/* Total Chocolate Sold */}
            <div className="glass-panel rounded-2xl p-5 border border-white/5 flex items-center space-x-4 relative overflow-hidden group">
              <div className="bg-yellow-500/10 p-3 rounded-xl text-yellow-400">
                <Box size={24} />
              </div>
              <div>
                <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Sotilgan Mahsulot</span>
                <h3 className="text-sm font-bold text-white mt-1">
                  {report.totalBoxesSold} quti / {report.totalPiecesSold} dona
                </h3>
              </div>
            </div>
          </div>

          {/* Paid vs Debt percentage split bar */}
          <div className="glass-panel rounded-2xl p-5 border border-white/5 space-y-3">
            <div className="flex justify-between items-center text-xs font-bold uppercase tracking-wider text-gray-400">
              <span className="text-emerald-400">Naqd (To'langan): {paidPercent.toFixed(1)}%</span>
              <span className="text-red-400">Nasiya (Qarz): {debtPercent.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-slate-950/60 rounded-full h-3 flex overflow-hidden border border-white/5">
              <div className="bg-emerald-500 h-full transition-all duration-500" style={{ width: `${paidPercent}%` }} />
              <div className="bg-red-500 h-full transition-all duration-500" style={{ width: `${debtPercent}%` }} />
            </div>
          </div>

          {/* Top Sellings and Top Customers */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Products */}
            <div className="glass-panel rounded-2xl p-5 border border-white/5 flex flex-col space-y-4">
              <div className="flex items-center space-x-2 pb-3 border-b border-white/5">
                <Award size={18} className="text-brand-400" />
                <h3 className="font-bold text-white text-sm">Eng Ko'p Sotilgan Mahsulotlar (Top 5)</h3>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs text-gray-300">
                  <thead>
                    <tr className="border-b border-white/5 bg-slate-950/30 text-gray-400 uppercase font-semibold">
                      <th className="p-3">Mahsulot Nomi</th>
                      <th className="p-3 text-center">Sotuv Hajmi</th>
                      <th className="p-3 text-right font-mono">Umumiy Qiymati</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {report.topProducts.length === 0 ? (
                      <tr>
                        <td colSpan="3" className="p-6 text-center text-gray-500">Hech qanday savdo amalga oshirilmagan</td>
                      </tr>
                    ) : (
                      report.topProducts.map((p, idx) => (
                        <tr key={p.id} className="hover:bg-white/[0.01]">
                          <td className="p-3 font-semibold text-white flex items-center space-x-2">
                            <span className="text-[10px] text-gray-500 font-mono w-4">#{idx+1}</span>
                            <span>{p.name}</span>
                          </td>
                          <td className="p-3 text-center text-gray-400">
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
            <div className="glass-panel rounded-2xl p-5 border border-white/5 flex flex-col space-y-4">
              <div className="flex items-center space-x-2 pb-3 border-b border-white/5">
                <Users size={18} className="text-brand-400" />
                <h3 className="font-bold text-white text-sm">Eng Faol Do'konlar / Hamkorlar (Top 5)</h3>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs text-gray-300">
                  <thead>
                    <tr className="border-b border-white/5 bg-slate-950/30 text-gray-400 uppercase font-semibold">
                      <th className="p-3">Do'kon nomi</th>
                      <th className="p-3 text-center">Buyurtmalar soni</th>
                      <th className="p-3 text-right">Mavjud qarz</th>
                      <th className="p-3 text-right font-mono">Xarid summasi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {report.topStores.length === 0 ? (
                      <tr>
                        <td colSpan="4" className="p-6 text-center text-gray-500">Hech qanday do'kon topilmadi</td>
                      </tr>
                    ) : (
                      report.topStores.map((store, idx) => (
                        <tr key={store.id} className="hover:bg-white/[0.01]">
                          <td className="p-3 font-semibold text-white flex items-center space-x-2">
                            <span className="text-[10px] text-gray-500 font-mono w-4">#{idx+1}</span>
                            <div>
                              <div>{store.name}</div>
                              <div className="text-[10px] text-gray-500 font-normal">Egasi: {store.ownerName}</div>
                            </div>
                          </td>
                          <td className="p-3 text-center text-gray-400 font-mono">{store.ordersCount} ta</td>
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
          </div>
        </div>
      )}
    </div>
  );
};
