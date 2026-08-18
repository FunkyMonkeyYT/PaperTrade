import React from 'react';
import {
  LineChart,
  Globe2,
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  Zap,
  ArrowRight,
  GraduationCap,
  Wallet,
  Building2,
  Lock,
  Download,
  BarChart3,
  Cpu,
  Compass,
  CheckCircle2,
  Sparkles,
  Play
} from 'lucide-react';
import { useAuth, COUNTRIES } from '../context/AuthContext';

export default function HomePage({ onNavigateToTrading, onNavigateToLearning, onNavigateToPortfolio }) {
  const {
    username,
    email,
    activeCountry,
    changeCountry,
    formatCurrency,
    marketStatus,
    setIsAuthModalOpen,
  } = useAuth();

  const handleLaunchMarket = (countryCode, defaultTicker) => {
    changeCountry(countryCode);
    if (onNavigateToTrading) {
      onNavigateToTrading(defaultTicker);
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-fadeIn pb-16">
      
      {/* 1. Hero Section */}
      <section className="relative overflow-hidden rounded-lg bg-[#111827] border border-slate-800/80 p-5 sm:p-8 md:p-10 shadow-xl transition-colors">
        
        <div className="max-w-3xl space-y-3 sm:space-y-4 relative z-10">
          
          {/* Top Pill */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#2962FF]/15 border border-[#2962FF]/30 text-xs font-mono font-bold text-[#2962FF]">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Pure Quantitative Platform • Top 10 World Markets</span>
          </div>

          {/* Main Title */}
          <h1 className="text-2xl sm:text-4xl md:text-5xl font-bold tracking-tight text-[#F9FAFB] leading-tight font-sans">
            Institutional-Grade <span className="text-[#2962FF]">Paper Trading</span> & Quantitative Analytics
          </h1>

          {/* Subtitle */}
          <p className="text-xs sm:text-sm md:text-base text-slate-400 font-sans leading-relaxed">
            Trade simulated equities across the <strong>Top 10 Major Markets in the world</strong> (US, India, Japan, UK, Europe, Hong Kong, Canada, Australia, Switzerland, and Crypto) with pure algorithmic analytics, zero external LLM dependencies, and a single shared $100k capital wallet.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center gap-2.5 pt-2">
            <button
              onClick={() => handleLaunchMarket(activeCountry, 'AAPL')}
              className="px-4 sm:px-5 py-2.5 rounded-md bg-[#2962FF] hover:bg-[#2962FF]/90 text-white font-mono font-bold text-xs sm:text-sm tracking-wide shadow-md shadow-[#2962FF]/25 flex items-center gap-2 transition-all cursor-pointer"
            >
              <LineChart className="w-4 h-4" />
              <span>Launch Trading Terminal</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={onNavigateToLearning}
              className="px-4 sm:px-5 py-2.5 rounded-md bg-[#161B26] light:bg-slate-100 hover:bg-slate-800 border border-slate-700/80 light:border-slate-300 text-slate-200 light:text-slate-800 font-mono font-bold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer shadow-sm"
            >
              <GraduationCap className="w-4 h-4 text-[#F59E0B]" />
              <span>Learning Area</span>
            </button>

            {!username && !email && (
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="px-4 py-2.5 rounded-md bg-[#00D09C]/15 hover:bg-[#00D09C]/25 border border-[#00D09C]/40 text-[#00D09C] font-mono font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Create Secure Account</span>
              </button>
            )}
          </div>

          {/* Highlights Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-3 border-t border-slate-800 text-xs font-mono text-slate-300">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#00D09C] shrink-0" />
              <span>$100k Unified Wallet</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#2962FF] shrink-0" />
              <span>Top 10 Global Exchanges</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#8B5CF6] shrink-0" />
              <span>Pure Math Algorithms</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#F59E0B] shrink-0" />
              <span>Google & Cloud Sync</span>
            </div>
          </div>

        </div>
      </section>

      {/* 2. Top 10 Major Markets in the World */}
      <section className="space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <Globe2 className="w-4 h-4 text-[#2962FF]" />
              <h2 className="text-lg sm:text-xl font-bold text-[#F9FAFB] tracking-tight font-sans">
                Top 10 Major World Financial Markets
              </h2>
            </div>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              Instant market profile switching with unified purchasing parity across all 10 financial centers
            </p>
          </div>

          <div className="text-xs font-mono text-[#00D09C] bg-[#00D09C]/10 px-2.5 py-1 rounded-md border border-[#00D09C]/30 font-bold self-start sm:self-auto">
            1 Unified Wallet • 10 Financial Centers
          </div>
        </div>

        {/* 10 Markets Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
          {COUNTRIES.map((c) => {
            const isActive = c.code === activeCountry;
            return (
              <div
                key={c.code}
                className={`p-3.5 rounded-lg border transition-all flex flex-col justify-between group ${
                  isActive
                    ? 'bg-[#161B26] border-[#2962FF] shadow-md shadow-[#2962FF]/10'
                    : 'bg-[#111827] border-slate-800/80 hover:border-slate-700'
                }`}
              >
                <div>
                  {/* Flag & Exchange Status */}
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-2xl">{c.flag}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#161B26] text-slate-400 border border-slate-700/60 font-bold">
                      {c.currency}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-[#F9FAFB] font-sans">
                    {c.name}
                  </h3>
                  <div className="text-[11px] text-slate-400 font-mono mt-0.5 line-clamp-1">
                    {c.exchange}
                  </div>

                  {/* Popular stocks in this market */}
                  <div className="flex flex-wrap gap-1 mt-2.5">
                    {c.popularTickers?.slice(0, 3).map((t) => (
                      <span key={t} className="text-[10px] font-mono text-slate-300 bg-slate-800 px-1.5 py-0.5 rounded">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleLaunchMarket(c.code, c.defaultTicker)}
                  className={`w-full mt-3.5 py-1.5 rounded-md text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#2962FF] text-white shadow-sm'
                      : 'bg-[#161B26] hover:bg-[#2962FF] text-slate-300 hover:text-white border border-slate-700/60'
                  }`}
                >
                  <Play className="w-3 h-3" />
                  <span>{isActive ? 'Active Market' : 'Trade This Market'}</span>
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* 3. Pure Algorithmic Engine & Quant Guarantee */}
      <section className="p-5 sm:p-7 rounded-lg border border-slate-800/80 bg-[#111827] shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <div className="w-8 h-8 rounded-md bg-[#00D09C]/15 border border-[#00D09C]/30 flex items-center justify-center text-[#00D09C] mb-2">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <h4 className="text-sm font-bold text-[#F9FAFB]">100% Algorithmic Engine</h4>
            <p className="text-xs text-slate-400 leading-relaxed font-mono">
              Zero generative AI hallucinations. Every RSI, SMA, MACD, and Bollinger Band is computed using deterministic mathematics via pandas & numpy.
            </p>
          </div>

          <div className="space-y-1.5">
            <div className="w-8 h-8 rounded-md bg-[#2962FF]/15 border border-[#2962FF]/30 flex items-center justify-center text-[#2962FF] mb-2">
              <Zap className="w-4 h-4" />
            </div>
            <h4 className="text-sm font-bold text-[#F9FAFB]">Multi-Profile Parity</h4>
            <p className="text-xs text-slate-400 leading-relaxed font-mono">
              Seamlessly switch between Wall Street, Dalal Street, Tokyo, London, and Euronext with automatic real-time foreign exchange conversions.
            </p>
          </div>

          <div className="space-y-1.5">
            <div className="w-8 h-8 rounded-md bg-[#8B5CF6]/15 border border-[#8B5CF6]/30 flex items-center justify-center text-[#8B5CF6] mb-2">
              <Download className="w-4 h-4" />
            </div>
            <h4 className="text-sm font-bold text-[#F9FAFB]">ML Export Pipeline</h4>
            <p className="text-xs text-slate-400 leading-relaxed font-mono">
              Export clean tabular data as CSV or JSON format formatted specifically for offline Scikit-Learn or PyTorch machine learning models.
            </p>
          </div>
        </div>
      </section>

    </div>
  );
}
