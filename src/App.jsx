import React, { useState, useEffect } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import { POSPage } from './pages/POSPage';
import { StoresPage } from './pages/StoresPage';
import { InventoryPage } from './pages/InventoryPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { ShoppingCart, Users, Layers, Award, BarChart3, Download, Maximize2, Minimize2 } from 'lucide-react';

function App() {
  const [currentTab, setCurrentTab] = useState('pos');
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(
    window.matchMedia('(display-mode: standalone)').matches || 
    window.matchMedia('(display-mode: fullscreen)').matches || 
    window.navigator.standalone === true
  );
  const [isFullscreen, setIsFullscreen] = useState(!!document.fullscreenElement);

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

  return (
    <div className="min-h-screen bg-[#070b13] text-gray-100 font-sans flex flex-col">
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
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-3 sm:py-4 flex flex-col lg:flex-row justify-between items-center gap-3 sm:gap-4">
          <div className="flex items-center space-x-3 w-full lg:w-auto justify-center lg:justify-start">
            <div className="bg-gradient-to-tr from-brand-600 to-brand-400 p-2 sm:p-2.5 rounded-xl shadow-lg shadow-brand-500/20 text-white shrink-0">
              <Award size={20} />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-bold text-white tracking-wide bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent">
                SweetFlow Ulgurji B2B
              </h1>
              <p className="text-[9px] sm:text-[10px] text-brand-300 font-semibold tracking-widest uppercase">
                Distributsiya Tizimi
              </p>
            </div>
          </div>

          {/* Navigation Tabs - Responsive Grid on Mobile, Flex on Desktop */}
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 w-full lg:w-auto">
            <nav className="grid grid-cols-2 sm:grid-cols-4 lg:flex gap-1.5 sm:gap-2 w-full lg:w-auto bg-slate-950/60 p-1.5 rounded-2xl border border-white/5">
              <button
                onClick={() => setCurrentTab('pos')}
                className={`flex items-center justify-center gap-1.5 sm:gap-2 px-2 sm:px-4 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition border w-full lg:w-auto min-h-[40px] ${
                  currentTab === 'pos'
                    ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/10 font-bold border-brand-400'
                    : 'text-gray-400 hover:text-gray-200 border-white/5 hover:bg-white/5'
                }`}
              >
                <ShoppingCart size={14} className="shrink-0" />
                <span>Savdo (POS)</span>
              </button>

              <button
                onClick={() => setCurrentTab('stores')}
                className={`flex items-center justify-center gap-1.5 sm:gap-2 px-2 sm:px-4 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition border w-full lg:w-auto min-h-[40px] ${
                  currentTab === 'stores'
                    ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/10 font-bold border-brand-400'
                    : 'text-gray-400 hover:text-gray-200 border-white/5 hover:bg-white/5'
                }`}
              >
                <Users size={14} className="shrink-0" />
                <span>CRM</span>
              </button>

              <button
                onClick={() => setCurrentTab('inventory')}
                className={`flex items-center justify-center gap-1.5 sm:gap-2 px-2 sm:px-4 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition border w-full lg:w-auto min-h-[40px] ${
                  currentTab === 'inventory'
                    ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/10 font-bold border-brand-400'
                    : 'text-gray-400 hover:text-gray-200 border-white/5 hover:bg-white/5'
                }`}
              >
                <Layers size={14} className="shrink-0" />
                <span>Omborxona</span>
              </button>

              <button
                onClick={() => setCurrentTab('analytics')}
                className={`flex items-center justify-center gap-1.5 sm:gap-2 px-2 sm:px-4 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition border w-full lg:w-auto min-h-[40px] ${
                  currentTab === 'analytics'
                    ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/10 font-bold border-brand-400'
                    : 'text-gray-400 hover:text-gray-200 border-white/5 hover:bg-white/5'
                }`}
              >
                <BarChart3 size={14} className="shrink-0" />
                <span>Tahlil</span>
              </button>
            </nav>

            <button
              onClick={toggleFullScreen}
              className="flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2.5 bg-slate-900/60 hover:bg-slate-800/80 text-gray-300 hover:text-white rounded-xl text-xs font-bold tracking-wide transition border border-white/5 hover:border-white/10 shadow-lg w-full sm:w-auto min-h-[40px]"
              title={isFullscreen ? "Kichik ekran" : "To'liq ekran"}
            >
              {isFullscreen ? <Minimize2 size={14} className="shrink-0" /> : <Maximize2 size={14} className="shrink-0" />}
              <span>{isFullscreen ? "Kichik ekran" : "To'liq ekran"}</span>
            </button>

            {!isInstalled && (
              <button
                onClick={handleInstallClick}
                className="flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2.5 bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-white rounded-xl text-xs font-bold tracking-wide transition border border-brand-400 shadow-lg shadow-brand-500/20 w-full sm:w-auto min-h-[40px] animate-pulse"
              >
                <Download size={14} className="shrink-0" />
                <span>Ilovani o'rnatish</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8 w-full overflow-hidden">
        {currentTab === 'pos' && <POSPage />}
        {currentTab === 'stores' && <StoresPage />}
        {currentTab === 'inventory' && <InventoryPage />}
        {currentTab === 'analytics' && <AnalyticsPage />}
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 py-4 text-center text-[10px] text-gray-600 tracking-wider bg-slate-950/20">
        © 2026 SweetFlow Wholesale Distribution B2B System. Raqamli Yuk Xatlari va Nasiya CRM Platformasi.
      </footer>
    </div>
  );
}

export default App;
