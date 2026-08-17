import React, { useState, useEffect } from 'react';
import './utils/format';
import { Toaster, toast } from 'react-hot-toast';
import { POSPage } from './pages/POSPage';
import { StoresPage } from './pages/StoresPage';
import { InventoryPage } from './pages/InventoryPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { UsersPage } from './pages/UsersPage';
import { Login } from './pages/Login';
import { ShoppingCart, Users, Layers, Award, BarChart3, Download, Maximize2, Minimize2, LogOut, UserCog, KeyRound, X, Eye, EyeOff, Moon, Sun } from 'lucide-react';
import api from './services/api';
import { ThemeProvider, useTheme } from './context/ThemeContext';

function AppContent({ userRole, username, handleLogout, isInstalled, handleInstallClick }) {
  const [currentTab, setCurrentTab] = useState('pos');
  const [isFullscreen, setIsFullscreen] = useState(!!document.fullscreenElement);
  
  // Password change modal
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  const { themeMode, toggleTheme } = useTheme();

  const currentRole = (userRole || '').toUpperCase();

  const isTabAllowed = (tab) => {
    switch (tab) {
      case 'pos':
        return ['BOSS', 'MANAGER', 'SELLER'].includes(currentRole);
      case 'stores':
      case 'inventory':
        return ['BOSS', 'MANAGER'].includes(currentRole);
      case 'analytics':
      case 'users':
        return currentRole === 'BOSS';
      default:
        return false;
    }
  };

  // All allowed tabs for this role — used in nav rendering
  const navTabs = [
    { id: 'pos', name: 'Savdo', icon: ShoppingCart },
    { id: 'stores', name: 'CRM', icon: Users },
    { id: 'inventory', name: 'Ombor', icon: Layers },
    { id: 'analytics', name: 'Tahlil', icon: BarChart3 },
    { id: 'users', name: 'Xodimlar', icon: UserCog },
  ].filter(t => isTabAllowed(t.id));

  useEffect(() => {
    if (userRole) {
      if (!isTabAllowed(currentTab)) {
        if (currentRole === 'BOSS') {
          setCurrentTab('analytics');
        } else if (currentRole === 'MANAGER') {
          setCurrentTab('inventory');
        } else {
          setCurrentTab('pos');
        }
      }
    }
  }, [currentTab, userRole]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.error("Fullscreen error:", err);
      });
    } else {
      document.exitFullscreen().catch(err => {
        console.error("Exit fullscreen error:", err);
      });
    }
  };

  const handleLogoutClick = () => {
    handleLogout();
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("Yangi parollar mos kelmayapti!");
      return;
    }
    if (newPassword.length < 4) {
      toast.error("Parol kamida 4 ta belgidan iborat bo'lishi kerak");
      return;
    }
    setPasswordLoading(true);
    try {
      await api.put('/users/change-password', {
        currentPassword: currentPassword || undefined,
        newPassword
      });
      toast.success("Parol muvaffaqiyatli yangilandi!");
      setIsPasswordModalOpen(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      toast.error(err.response?.data?.message || "Parolni yangilashda xatolik");
    } finally {
      setPasswordLoading(false);
    }
  };

  const toasterConfig = {
    duration: 3000,
    style: {
      background: '#1e293b',
      color: '#ffffff',
      border: '1px solid #334155',
      borderRadius: '12px',
      fontSize: '13px',
      padding: '12px 16px',
      maxWidth: '420px',
    },
    success: {
      iconTheme: { primary: '#22c55e', secondary: '#ffffff' },
    },
    error: {
      iconTheme: { primary: '#ef4444', secondary: '#ffffff' },
      duration: 4000,
    },
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-gray-100 font-sans flex flex-col animate-fade-in transition-colors duration-200">
      <Toaster position="top-center" reverseOrder={false} toastOptions={toasterConfig} />

      {/* Header Bar */}
      <header className="bg-white/90 dark:bg-slate-900/90 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-40 backdrop-blur-md transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-3 py-2 sm:px-8 sm:py-5 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
          
          {/* Top Row: Logo + Right Actions (on Mobile) / Left side (on Desktop) */}
          <div className="flex items-center justify-between w-full sm:w-auto">
            {/* Logo */}
            <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
              <div className="bg-gradient-to-tr from-brand-600 to-brand-400 p-2 sm:p-2.5 rounded-xl shadow-lg shadow-brand-500/20 text-white shrink-0">
                <Award size={24} className="sm:w-7 sm:h-7" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-sm sm:text-base font-bold tracking-tight text-slate-900 dark:text-white leading-tight">
                  Qandchi Bola
                </h1>
                <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 font-semibold tracking-widest uppercase leading-tight mt-0.5">
                  Distribyutsiya
                </p>
              </div>
            </div>

            {/* Right: User info + actions (Mobile compact) */}
            <div className="flex items-center gap-1.5 sm:gap-3 shrink-0 sm:hidden">
              <button
                onClick={toggleTheme}
                className="w-8 h-8 flex items-center justify-center bg-slate-100 dark:bg-slate-900/60 hover:bg-slate-200 dark:hover:bg-slate-800/80 text-slate-600 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white rounded-lg transition border border-slate-200 dark:border-slate-700/50 shadow-sm cursor-pointer"
              >
                {themeMode === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
              </button>
              <button
                onClick={() => setIsPasswordModalOpen(true)}
                className="w-8 h-8 flex items-center justify-center bg-slate-100 dark:bg-slate-900/60 hover:bg-slate-200 dark:hover:bg-slate-800/80 text-slate-600 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white rounded-lg transition border border-slate-200 dark:border-slate-700/50 shadow-sm cursor-pointer"
              >
                <KeyRound size={16} />
              </button>
              {!isInstalled && (
                <button
                  onClick={handleInstallClick}
                  className="w-8 h-8 flex items-center justify-center bg-gradient-to-r from-brand-600 to-brand-500 text-white rounded-lg shadow-sm animate-pulse cursor-pointer"
                >
                  <Download size={16} />
                </button>
              )}
              <button
                onClick={handleLogoutClick}
                className="w-8 h-8 flex items-center justify-center bg-red-100 dark:bg-red-950/40 text-red-500 dark:text-red-400 rounded-lg transition border border-red-200 dark:border-red-500/20 shadow-sm cursor-pointer"
              >
                <LogOut size={16} />
              </button>
            </div>
          </div>

          {/* Navigation — single row flex wrap, scrollable on mobile */}
          <nav className="flex items-center gap-1.5 sm:gap-2 bg-slate-100 dark:bg-slate-950/60 p-1 sm:p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800/80 overflow-x-auto w-full sm:w-auto no-scrollbar transition-colors duration-200">
            {navTabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setCurrentTab(tab.id)}
                  className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-[11px] sm:text-sm font-semibold tracking-wide transition border cursor-pointer whitespace-nowrap ${
                    currentTab === tab.id
                      ? 'bg-brand-500 text-white shadow-md shadow-brand-500/20 font-bold border-brand-400'
                      : 'text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-gray-200 border-transparent hover:bg-slate-200 dark:hover:bg-white/5'
                  }`}
                >
                  <Icon size={18} className="shrink-0" />
                  <span>{tab.name}</span>
                </button>
              );
            })}
          </nav>

          {/* Right Desktop Actions */}
          <div className="hidden sm:flex items-center gap-3 shrink-0">
            <div className="flex flex-col text-right">
              <span className="text-slate-800 dark:text-white text-sm font-bold leading-tight">{username}</span>
              <span className="text-[10px] text-brand-500 dark:text-brand-300 font-bold uppercase tracking-wider leading-tight mt-0.5">{userRole}</span>
            </div>

            <button
              onClick={toggleTheme}
              className="w-10 h-10 flex items-center justify-center bg-slate-100 dark:bg-slate-900/60 hover:bg-slate-200 dark:hover:bg-slate-800/80 text-slate-600 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white rounded-xl transition border border-slate-200 dark:border-slate-700/50 hover:border-slate-300 dark:hover:border-slate-600 shadow-sm cursor-pointer"
              title={themeMode === 'dark' ? "Yorug' rejim" : "Qorong'i rejim"}
            >
              {themeMode === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            <button
              onClick={() => setIsPasswordModalOpen(true)}
              className="w-10 h-10 flex items-center justify-center bg-slate-100 dark:bg-slate-900/60 hover:bg-slate-200 dark:hover:bg-slate-800/80 text-slate-600 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white rounded-xl transition border border-slate-200 dark:border-slate-700/50 hover:border-slate-300 dark:hover:border-slate-600 shadow-sm cursor-pointer"
              title="Parolni o'zgartirish"
            >
              <KeyRound size={20} />
            </button>

            <button
              onClick={toggleFullScreen}
              className="w-10 h-10 flex items-center justify-center bg-slate-100 dark:bg-slate-900/60 hover:bg-slate-200 dark:hover:bg-slate-800/80 text-slate-600 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white rounded-xl transition border border-slate-200 dark:border-slate-700/50 hover:border-slate-300 dark:hover:border-slate-600 shadow-sm cursor-pointer"
              title={isFullscreen ? "Kichik ekran" : "To'liq ekran"}
            >
              {isFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
            </button>

            {!isInstalled && (
              <button
                onClick={handleInstallClick}
                className="w-10 h-10 flex items-center justify-center bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-white rounded-xl transition border border-brand-400 shadow-sm animate-pulse cursor-pointer"
                title="O'rnatish"
              >
                <Download size={20} />
              </button>
            )}

            <button
              onClick={handleLogoutClick}
              className="w-10 h-10 flex items-center justify-center bg-red-100 dark:bg-red-950/40 hover:bg-red-200 dark:hover:bg-red-900/60 text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 rounded-xl transition border border-red-200 dark:border-red-500/20 hover:border-red-300 dark:hover:border-red-500/40 shadow-sm cursor-pointer shrink-0"
              title="Chiqish"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8 w-full overflow-hidden">
        {currentTab === 'pos' && isTabAllowed('pos') && <POSPage />}
        {currentTab === 'stores' && isTabAllowed('stores') && <StoresPage />}
        {currentTab === 'inventory' && isTabAllowed('inventory') && <InventoryPage />}
        {currentTab === 'analytics' && isTabAllowed('analytics') && <AnalyticsPage />}
        {currentTab === 'users' && isTabAllowed('users') && <UsersPage />}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-white/5 py-4 text-center text-[10px] text-slate-500 dark:text-gray-600 tracking-wider bg-slate-100/50 dark:bg-slate-950/20 transition-colors duration-200">
        <p className="text-xs text-slate-500 dark:text-gray-400 mt-2 sm:mt-0 font-medium">
          © 2026 Qandchi Bola Wholesale Distribution System. Raqamli Yuk Xatlari va Nasiya CRM Platformasi.
        </p>
      </footer>

      {/* Password Change Modal */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-100/50 dark:bg-slate-900/40  dark:bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden animate-slide-up">
            <div className="flex justify-between items-center p-4 sm:p-5 border-b border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800/50">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <KeyRound size={18} className="text-brand-500 dark:text-brand-400" />
                Parolni o'zgartirish
              </h3>
              <button
                onClick={() => { setIsPasswordModalOpen(false); setCurrentPassword(''); setNewPassword(''); setConfirmPassword(''); }}
                className="text-slate-400 hover:text-slate-600 dark:text-gray-400 dark:hover:text-white transition bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 p-1.5 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handleChangePassword} className="p-4 sm:p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1.5">Joriy parol</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl px-4 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition"
                  placeholder="Hozirgi parolingiz"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1.5">Yangi parol</label>
                <div className="relative">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl pl-4 pr-10 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition"
                    placeholder="Kamida 4 ta belgi"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:text-gray-400 dark:hover:text-white"
                  >
                    {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1.5">Yangi parolni tasdiqlang</label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl px-4 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition"
                  placeholder="Yangi parolni qayta kiriting"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => { setIsPasswordModalOpen(false); setCurrentPassword(''); setNewPassword(''); setConfirmPassword(''); }}
                  className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-700 dark:text-white rounded-xl transition font-medium"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={passwordLoading}
                  className="flex-1 px-4 py-2.5 bg-brand-600 hover:bg-brand-500 text-white rounded-xl transition shadow-lg shadow-brand-500/20 font-medium disabled:opacity-50"
                >
                  {passwordLoading ? 'Saqlanmoqda...' : 'Saqlash'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('token'));
  const [userRole, setUserRole] = useState(localStorage.getItem('role') || '');
  const [username, setUsername] = useState(localStorage.getItem('username') || '');
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(
    window.matchMedia('(display-mode: standalone)').matches || 
    window.matchMedia('(display-mode: fullscreen)').matches || 
    window.navigator.standalone === true
  );

  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      toast.success("Ilova muvaffaqiyatli o'rnatildi!");
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === 'accepted') {
          toast.success('Ilova o\'rnatilmoqda...');
        }
        setDeferredPrompt(null);
      });
    } else {
      toast.error("Brauzeringiz ilovani o'rnatishni qo'llab-quvvatlamaydi yoki ilova allaqachon o'rnatilgan.");
    }
  };

  const handleLoginSuccess = (user) => {
    setIsLoggedIn(true);
    setUserRole(user.role);
    setUsername(user.username);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('username');
    setIsLoggedIn(false);
    setUserRole('');
    setUsername('');
    toast.success("Tizimdan muvaffaqiyatli chiqdingiz.");
  };

  const toasterConfig = {
    duration: 3000,
    style: {
      background: '#1e293b',
      color: '#ffffff',
      border: '1px solid #334155',
      borderRadius: '12px',
      fontSize: '13px',
      padding: '12px 16px',
      maxWidth: '420px',
    },
    success: {
      iconTheme: { primary: '#22c55e', secondary: '#ffffff' },
    },
    error: {
      iconTheme: { primary: '#ef4444', secondary: '#ffffff' },
      duration: 4000,
    },
  };

  if (!isLoggedIn) {
    return (
      <>
        <Toaster position="top-center" reverseOrder={false} toastOptions={toasterConfig} />
        <Login onLoginSuccess={handleLoginSuccess} />
      </>
    );
  }

  return (
    <ThemeProvider userKey={username}>
      <AppContent 
        userRole={userRole} 
        username={username} 
        handleLogout={handleLogout}
        isInstalled={isInstalled}
        handleInstallClick={handleInstallClick}
      />
    </ThemeProvider>
  );
}
