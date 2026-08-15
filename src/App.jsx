import React, { useState, useEffect } from 'react';
import './utils/format';
import { Toaster, toast } from 'react-hot-toast';
import { POSPage } from './pages/POSPage';
import { StoresPage } from './pages/StoresPage';
import { InventoryPage } from './pages/InventoryPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { Login } from './pages/Login';
import { ShoppingCart, Users, Layers, Award, BarChart3, Download, Maximize2, Minimize2, LogOut } from 'lucide-react';

const allowedTabs = {
  boss: ['analytics', 'inventory', 'stores'],
  manager: ['inventory', 'stores', 'pos'],
  seller: ['pos']
};

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('token'));
  const [userRole, setUserRole] = useState(localStorage.getItem('role') || '');
  const [username, setUsername] = useState(localStorage.getItem('username') || '');
  const [currentTab, setCurrentTab] = useState('pos');
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(
    window.matchMedia('(display-mode: standalone)').matches || 
    window.matchMedia('(display-mode: fullscreen)').matches || 
    window.navigator.standalone === true
  );
  const [isFullscreen, setIsFullscreen] = useState(!!document.fullscreenElement);

  const isTabAllowed = (tab) => {
    const allowed = allowedTabs[userRole] || ['pos'];
    return allowed.includes(tab);
  };

  useEffect(() => {
    if (isLoggedIn && userRole) {
      const allowed = allowedTabs[userRole] || ['pos'];
      if (!allowed.includes(currentTab)) {
        setCurrentTab(allowed[0]);
      }
    }
  }, [currentTab, userRole, isLoggedIn]);

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

  if (!isLoggedIn) {
    return (
      <>
        <Toaster
          position="top-center"
          reverseOrder={false}
          toastOptions={{
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
          }}
        />
        <Login onLoginSuccess={handleLoginSuccess} />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-[#070b13] text-gray-100 font-sans flex flex-col animate-fade-in">
      <Toaster
        position="top-center"
        reverseOrder={false}
        toastOptions={{
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
        }}
      />
      {/* Header Bar */}
      <header className="glass-panel border-b border-white/5 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-3 py-2 sm:px-6 sm:py-3 flex flex-col gap-2.5">
          
          {/* Top Row: Logo & User/Logout */}
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center space-x-2.5">
              <div className="bg-gradient-to-tr from-brand-600 to-brand-400 p-1.5 sm:p-2 rounded-xl shadow-lg shadow-brand-500/20 text-white shrink-0">
                <Award size={18} />
              </div>
              <div>
                <h1 className="text-sm sm:text-base font-bold text-white tracking-wide bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent leading-tight">
                  SweetFlow Ulgurji B2B
                </h1>
                <p className="text-[9px] text-brand-300 font-semibold tracking-widest uppercase leading-tight">
                  Distributsiya Tizimi
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2.5">
              <div className="flex flex-col text-right">
                <span className="text-white text-[11px] sm:text-xs font-bold leading-tight">{username}</span>
                <span className="text-[8px] text-brand-300 font-bold uppercase tracking-wider leading-tight">{userRole}</span>
              </div>
              <button
                onClick={handleLogout}
                className="p-1.5 sm:p-2 bg-red-950/40 hover:bg-red-900/60 text-red-400 hover:text-red-300 rounded-lg transition border border-red-500/20 hover:border-red-500/40 shadow-sm cursor-pointer shrink-0"
                title="Chiqish"
              >
                <LogOut size={16} />
              </button>
            </div>
          </div>

          {/* Bottom Row: Navigation & Actions */}
          <div className="flex items-center justify-between w-full gap-2">
            <nav className="grid grid-cols-3 gap-1.5 bg-slate-950/60 p-1 rounded-xl border border-white/5 flex-1 max-w-md">
              {isTabAllowed('pos') && (
                <button
                  onClick={() => setCurrentTab('pos')}
                  className={`flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 py-1.5 sm:py-2 rounded-lg text-[9px] sm:text-[10px] font-semibold tracking-wide transition border cursor-pointer ${
                    currentTab === 'pos'
                      ? 'bg-brand-500 text-white shadow-md shadow-brand-500/10 font-bold border-brand-400'
                      : 'text-gray-400 hover:text-gray-200 border-transparent hover:bg-white/5'
                  }`}
                >
                  <ShoppingCart size={14} className="shrink-0" />
                  <span>Savdo (POS)</span>
                </button>
              )}

              {isTabAllowed('stores') && (
                <button
                  onClick={() => setCurrentTab('stores')}
                  className={`flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 py-1.5 sm:py-2 rounded-lg text-[9px] sm:text-[10px] font-semibold tracking-wide transition border cursor-pointer ${
                    currentTab === 'stores'
                      ? 'bg-brand-500 text-white shadow-md shadow-brand-500/10 font-bold border-brand-400'
                      : 'text-gray-400 hover:text-gray-200 border-transparent hover:bg-white/5'
                  }`}
                >
                  <Users size={14} className="shrink-0" />
                  <span>CRM</span>
                </button>
              )}

              {isTabAllowed('inventory') && (
                <button
                  onClick={() => setCurrentTab('inventory')}
                  className={`flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 py-1.5 sm:py-2 rounded-lg text-[9px] sm:text-[10px] font-semibold tracking-wide transition border cursor-pointer ${
                    currentTab === 'inventory'
                      ? 'bg-brand-500 text-white shadow-md shadow-brand-500/10 font-bold border-brand-400'
                      : 'text-gray-400 hover:text-gray-200 border-transparent hover:bg-white/5'
                  }`}
                >
                  <Layers size={14} className="shrink-0" />
                  <span>Omborxona</span>
                </button>
              )}

              {isTabAllowed('analytics') && (
                <button
                  onClick={() => setCurrentTab('analytics')}
                  className={`flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 py-1.5 sm:py-2 rounded-lg text-[9px] sm:text-[10px] font-semibold tracking-wide transition border cursor-pointer ${
                    currentTab === 'analytics'
                      ? 'bg-brand-500 text-white shadow-md shadow-brand-500/10 font-bold border-brand-400'
                      : 'text-gray-400 hover:text-gray-200 border-transparent hover:bg-white/5'
                  }`}
                >
                  <BarChart3 size={14} className="shrink-0" />
                  <span>Tahlil</span>
                </button>
              )}
            </nav>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={toggleFullScreen}
                className="hidden sm:flex items-center justify-center p-2 bg-slate-900/60 hover:bg-slate-800/80 text-gray-300 hover:text-white rounded-lg transition border border-white/5 hover:border-white/10 shadow-sm cursor-pointer"
                title={isFullscreen ? "Kichik ekran" : "To'liq ekran"}
              >
                {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
              </button>

              {!isInstalled && (
                <button
                  onClick={handleInstallClick}
                  className="flex items-center justify-center p-2 bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-white rounded-lg transition border border-brand-400 shadow-sm animate-pulse cursor-pointer"
                  title="O'rnatish"
                >
                  <Download size={16} />
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8 w-full overflow-hidden">
        {currentTab === 'pos' && isTabAllowed('pos') && <POSPage />}
        {currentTab === 'stores' && isTabAllowed('stores') && <StoresPage />}
        {currentTab === 'inventory' && isTabAllowed('inventory') && <InventoryPage />}
        {currentTab === 'analytics' && isTabAllowed('analytics') && <AnalyticsPage />}
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 py-4 text-center text-[10px] text-gray-600 tracking-wider bg-slate-950/20">
        © 2026 SweetFlow Wholesale Distribution B2B System. Raqamli Yuk Xatlari va Nasiya CRM Platformasi.
      </footer>
    </div>
  );
}

export default App;
