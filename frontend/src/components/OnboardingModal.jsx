import React from 'react';
import { ArrowRight, Sparkles, Globe2 } from 'lucide-react';
import { useAuth, COUNTRIES } from '../context/AuthContext';

export default function OnboardingModal({ isOpen, onSelectMarket }) {
  const { completeOnboarding } = useAuth();

  if (!isOpen) return null;

  const handlePickCountry = async (countryCode) => {
    await completeOnboarding(countryCode);
    const countryObj = COUNTRIES.find((c) => c.code === countryCode) || COUNTRIES[0];
    if (onSelectMarket) {
      onSelectMarket(countryObj.defaultTicker);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="max-w-3xl w-full p-5 sm:p-7 rounded-lg border border-slate-700/80 bg-[#111827] shadow-2xl animate-scaleIn my-auto">
        
        {/* Header */}
        <div className="text-center space-y-2 mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#2962FF]/15 text-[#2962FF] border border-[#2962FF]/30 text-xs font-mono font-bold">
            <Sparkles className="w-3.5 h-3.5" />
            Top 10 Global Financial Markets
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-[#F9FAFB] tracking-tight font-sans">
            Select Your Primary Trading Market
          </h2>
          <p className="text-xs text-slate-400 max-w-md mx-auto font-mono">
            Choose your home exchange to configure your base currency and default stock watch. You can trade in all 10 markets at any time with your unified $100k capital!
          </p>
        </div>

        {/* Top 10 Major Markets Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-5 max-h-[50vh] overflow-y-auto pr-1">
          {COUNTRIES.map((c) => (
            <button
              key={c.code}
              type="button"
              onClick={() => handlePickCountry(c.code)}
              className="p-3.5 rounded-lg border border-slate-800 bg-[#161B26] hover:border-[#2962FF] hover:bg-slate-800/80 transition-all text-left group flex items-center justify-between shadow-sm cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{c.flag}</span>
                <div>
                  <div className="font-bold text-sm text-[#F9FAFB] group-hover:text-[#2962FF] transition-colors">
                    {c.name}
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono">
                    {c.exchange} • {c.currency} ({c.symbol})
                  </div>
                </div>
              </div>

              <div className="w-7 h-7 rounded-md bg-[#111827] border border-slate-700/80 flex items-center justify-center text-slate-400 group-hover:text-[#2962FF] group-hover:border-[#2962FF]/40 transition-colors">
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </button>
          ))}
        </div>

        <div className="text-center pt-2 border-t border-slate-800">
          <p className="text-[11px] text-slate-500 font-mono">
            One shared wallet ($100,000 USD base parity) across all 10 global financial centers.
          </p>
        </div>

      </div>
    </div>
  );
}
