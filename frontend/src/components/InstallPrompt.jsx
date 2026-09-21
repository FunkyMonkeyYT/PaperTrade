import React, { useState, useEffect } from 'react';
import { Download, Monitor, CheckCircle, X, Smartphone, Sparkles } from 'lucide-react';

export default function InstallPrompt({ variant = 'navbar' }) {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if already running in standalone mode (installed PWA)
    const checkInstalled = () => {
      const isStandalone =
        window.matchMedia('(display-mode: standalone)').matches ||
        window.navigator.standalone ||
        document.referrer.includes('android-app://');
      setIsInstalled(isStandalone);
    };

    checkInstalled();

    // Detect iOS Safari
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      setShowModal(false);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    } else {
      // Show informational installation guidance modal
      setShowModal(true);
    }
  };

  // If already installed as a standalone app, show nothing in navbar or compact badge
  if (isInstalled) {
    return null;
  }

  return (
    <>
      {variant === 'navbar' && (
        <button
          type="button"
          onClick={handleInstallClick}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-[#2962FF]/15 hover:bg-[#2962FF]/25 border border-[#2962FF]/40 text-[#2962FF] hover:text-white font-mono text-xs font-bold transition-all cursor-pointer shadow-sm group"
          title="Install PaperTrade Desktop App (PWA)"
        >
          <Monitor className="w-3.5 h-3.5 text-[#2962FF] group-hover:scale-110 transition-transform" />
          <span className="hidden sm:inline">Install App</span>
        </button>
      )}

      {/* Guidance Modal when native prompt isn't directly triggered (e.g. Chrome already loaded, or iOS/Edge) */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 animate-fadeIn">
          <div className="bg-[#0e131f] border border-slate-700/90 rounded-xl max-w-md w-full p-6 shadow-2xl relative text-left">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-md hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-[#2962FF] flex items-center justify-center shadow-lg">
                <Monitor className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white font-mono flex items-center gap-2">
                  Install PaperTrade <Sparkles className="w-4 h-4 text-cyan-400" />
                </h3>
                <p className="text-xs text-slate-400 font-mono">Standalone Desktop & Mobile Experience</p>
              </div>
            </div>

            <div className="space-y-3 my-4 text-xs font-mono text-slate-300">
              <div className="p-3 bg-slate-900/80 rounded-lg border border-slate-800 flex items-start gap-3">
                <CheckCircle className="w-4 h-4 text-profit shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white">Windows / Mac / Linux (Chrome & Edge):</strong>
                  <p className="text-slate-400 mt-1">
                    Click the <span className="text-cyan-400 font-bold">Install</span> icon in your browser's address bar (top right) or press the menu (⋮) &rarr; "Install PaperTrade".
                  </p>
                </div>
              </div>

              {isIOS && (
                <div className="p-3 bg-slate-900/80 rounded-lg border border-slate-800 flex items-start gap-3">
                  <Smartphone className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white">iPhone & iPad (Safari):</strong>
                    <p className="text-slate-400 mt-1">
                      Tap the <span className="text-cyan-400 font-bold">Share</span> button at the bottom of Safari, then choose <span className="text-white font-bold">"Add to Home Screen"</span>.
                    </p>
                  </div>
                </div>
              )}

              <div className="p-3 bg-cyan-950/30 rounded-lg border border-cyan-800/40 text-cyan-200">
                🚀 Runs in a dedicated native window with zero browser address bars, instant offline launch, and keyboard shortcuts!
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-mono text-xs font-bold rounded-md transition-colors cursor-pointer"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
