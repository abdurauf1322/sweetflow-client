import React, { useState, useEffect } from 'react';
import { X, RefreshCw, Trash2, Package, Store, Tag, AlertTriangle } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

const TrashModal = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState('product');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchTrashItems();
    }
  }, [isOpen]);

  const fetchTrashItems = async () => {
    setLoading(true);
    try {
      const res = await api.get('/trash');
      setItems(res.data.data.items || []);
    } catch (error) {
      toast.error("Chiqindilar qutisini yuklashda xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (type, id) => {
    try {
      await api.post(`/trash/restore/${type}/${id}`);
      toast.success("Muvaffaqiyatli tiklandi!");
      fetchTrashItems();
    } catch (error) {
      toast.error(error.response?.data?.message || "Tiklashda xatolik yuz berdi");
    }
  };

  const handleHardDelete = async (type, id) => {
    if (!window.confirm("Bu amalni ortga qaytarib bo'lmaydi. Butunlay o'chirilsinmi?")) return;
    
    try {
      await api.delete(`/trash/hard-delete/${type}/${id}`);
      toast.success("Butunlay o'chirildi!");
      fetchTrashItems();
    } catch (error) {
      toast.error(error.response?.data?.message || "O'chirishda xatolik yuz berdi");
    }
  };

  if (!isOpen) return null;

  const filteredItems = items.filter(item => item.type === activeTab);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative bg-white dark:bg-slate-900 w-full max-w-4xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh] sm:max-h-[85vh] animate-scale-in border border-slate-200 dark:border-slate-800">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600 dark:text-red-400">
              <Trash2 size={24} />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">Chiqindilar qutisi</h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">O'chirilgan ma'lumotlarni tiklash yoki butunlay o'chirish</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex px-4 sm:px-6 pt-4 gap-2 overflow-x-auto no-scrollbar border-b border-slate-100 dark:border-slate-800">
          <button
            onClick={() => setActiveTab('product')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold whitespace-nowrap transition-colors border-b-2 ${activeTab === 'product' ? 'border-brand-500 text-brand-600 dark:text-brand-400' : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`}
          >
            <Package size={18} />
            Mahsulotlar
          </button>
          <button
            onClick={() => setActiveTab('category')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold whitespace-nowrap transition-colors border-b-2 ${activeTab === 'category' ? 'border-brand-500 text-brand-600 dark:text-brand-400' : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`}
          >
            <Tag size={18} />
            Kategoriyalar
          </button>
          <button
            onClick={() => setActiveTab('store')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold whitespace-nowrap transition-colors border-b-2 ${activeTab === 'store' ? 'border-brand-500 text-brand-600 dark:text-brand-400' : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`}
          >
            <Store size={18} />
            Do'konlar
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50/50 dark:bg-slate-900/50">
          {loading ? (
            <div className="flex justify-center py-10">
              <RefreshCw className="animate-spin text-brand-500" size={32} />
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-400 dark:text-slate-500 mb-4">
                <Trash2 size={32} />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Hech narsa topilmadi</h3>
              <p className="text-slate-500 dark:text-slate-400 max-w-sm mt-1">Ushbu ro'yxatda o'chirilgan ma'lumotlar yo'q</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {filteredItems.map(item => (
                <div key={item.id} className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white text-base">{item.name}</h4>
                    {item.phone && <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{item.phone}</p>}
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                      O'chirilgan vaqti: {new Date(item.deletedAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button
                      onClick={() => handleRestore(item.type, item.id)}
                      className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 bg-brand-50 dark:bg-brand-500/10 hover:bg-brand-100 dark:hover:bg-brand-500/20 text-brand-600 dark:text-brand-400 rounded-lg font-medium transition text-sm cursor-pointer"
                    >
                      <RefreshCw size={16} />
                      Tiklash
                    </button>
                    <button
                      onClick={() => handleHardDelete(item.type, item.id)}
                      className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 text-red-600 dark:text-red-400 rounded-lg font-medium transition text-sm cursor-pointer"
                    >
                      <Trash2 size={16} />
                      Butunlay o'chirish
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TrashModal;
