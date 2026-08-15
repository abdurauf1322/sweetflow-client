import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { Award, Lock, User, Eye, EyeOff } from 'lucide-react';
import api from '../services/api';

export function Login({ onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      toast.error("Iltimos, barcha maydonlarni to'ldiring.");
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/auth/login', { username, password });
      const { token, data } = response.data;
      
      localStorage.setItem('token', token);
      const user = data.user || data;
      localStorage.setItem('role', user.role);
      localStorage.setItem('username', user.username);
      
      toast.success(`Xush kelibsiz, ${user.username}!`);
      onLoginSuccess(user);
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.message || "Tizimga kirishda xatolik yuz berdi.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070b13] flex items-center justify-center px-4 relative overflow-hidden">
      {/* Decorative gradients */}
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-brand-500/10 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-purple-500/10 blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-md z-10 animate-fade-in">
        <div className="glass-panel p-8 rounded-3xl border border-white/5 shadow-2xl relative">
          <div className="flex flex-col items-center mb-8">
            <div className="bg-gradient-to-tr from-brand-600 to-brand-400 p-4 rounded-2xl shadow-xl shadow-brand-500/20 text-white mb-4">
              <Award size={32} />
            </div>
            <h2 className="text-2xl font-bold tracking-wide bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent text-center">
              SweetFlow Tizimiga Kirish
            </h2>
            <p className="text-xs text-brand-300 font-semibold tracking-widest uppercase mt-2">
              Ulgurji Distributsiya B2B
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
                Foydalanuvchi nomi
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-500">
                  <User size={16} />
                </span>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-900/40 border border-white/10 rounded-xl text-sm focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 text-white transition placeholder-gray-600"
                  placeholder="Username kiriting"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
                Parol
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-500">
                  <Lock size={16} />
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-3 bg-slate-900/40 border border-white/10 rounded-xl text-sm focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 text-white transition placeholder-gray-600"
                  placeholder="Parolni kiriting"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-500 hover:text-white transition"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-white font-bold rounded-xl text-sm tracking-wide transition shadow-lg shadow-brand-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Kirilmoqda...</span>
                </>
              ) : (
                <span>Kirish</span>
              )}
            </button>
          </form>
        </div>
        <p className="text-[10px] text-gray-600 text-center mt-6 tracking-wide">
          © 2026 SweetFlow Wholesale Distribution B2B System.
        </p>
      </div>
    </div>
  );
}
