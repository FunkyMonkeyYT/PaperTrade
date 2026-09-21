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
      <section className="relative overflow-hidden rounded-lg bg-white border border-slate-200 p-5 sm:p-8 md:p-10 shadow-sm transition-colors">
        
        <div className="max-w-3xl space-y-3 sm:space-y-4 relative z-10">
          
          {/* Top Pill */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#2563EB]/10 border border-[#2563EB]/20 text-xs font-mono font-bold text-[#2563EB]">
            <span>10 Global Markets Supported</span>
          </div>

          {/* Main Title */}
          <h1 className="text-2xl sm:text-4xl md:text-5xl font-bold tracking-tight text-slate-900 leading-tight font-sans">
            Paper Trading & Market Analytics
          </h1>

          {/* Subtitle */}
          <p className="text-xs sm:text-sm md:text-base text-slate-600 font-sans leading-relaxed">
            Trade simulated equities across the US, India, Japan, UK, Europe, Hong Kong, Canada, Australia, Switzerland, and Crypto using a unified $100k capital wallet.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center gap-2.5 pt-2">
            <button
              onClick={() => handleLaunchMarket(activeCountry, 'AAPL')}
              className="px-4 sm:px-5 py-2.5 rounded-md bg-[#2563EB] hover:bg-blue-700 text-white font-mono font-bold text-xs sm:text-sm tracking-wide shadow-sm flex items-center gap-2 transition-all cursor-pointer"
            >
              <LineChart className="w-4 h-4" />
              <span>Launch Terminal</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={onNavigateToLearning}
              className="px-4 sm:px-5 py-2.5 rounded-md bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 font-mono font-bold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer shadow-sm"
            >
              <GraduationCap className="w-4 h-4 text-[#2563EB]" />
              <span>Learning Area</span>
            </button>

            {!username && !email && (
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="px-4 py-2.5 rounded-md bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 font-mono font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5 text-[#2563EB]" />
                <span>Create Account</span>
              </button>
            )}
          </div>

        </div>
      </section>

      {/* 2. Available Markets */}
      <section className="space-y-3.5 pt-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <Globe2 className="w-4 h-4 text-[#2563EB]" />
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight font-sans">
                Available Markets
              </h2>
            </div>
            <p className="text-xs text-slate-500 font-mono mt-0.5">
              Switch between regions to view market data and execute simulated trades.
            </p>
          </div>

          <div className="text-xs font-mono text-[#2563EB] bg-[#2563EB]/10 px-2.5 py-1 rounded-md border border-[#2563EB]/20 font-bold self-start sm:self-auto">
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
                    ? 'bg-blue-50/40 border-[#2563EB] shadow-sm'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div>
                  {/* Exchange Status */}
                  <div className="flex items-center justify-end mb-2">
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200 font-bold">
                      {c.currency}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 font-sans">
                    {c.name}
                  </h3>
                  <div className="text-[11px] text-slate-500 font-mono mt-0.5 line-clamp-1">
                    {c.exchange}
                  </div>

                  {/* Popular stocks in this market */}
                  <div className="flex flex-wrap gap-1 mt-2.5">
                    {c.popularTickers?.slice(0, 3).map((t) => (
                      <span key={t} className="text-[10px] font-mono text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
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
                      ? 'bg-[#2563EB] text-white shadow-sm'
                      : 'bg-slate-50 hover:bg-[#2563EB] text-slate-700 hover:text-white border border-slate-200'
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

      {/* 3. Product Preview */}
      <section className="mt-8 rounded-lg border border-slate-200 bg-white overflow-hidden shadow-sm">
        <div className="border-b border-slate-200 bg-slate-50 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-[#2563EB]" />
            <span className="text-sm font-bold text-slate-900">Portfolio Overview</span>
          </div>
          <span className="text-xs font-mono bg-green-100 text-green-700 px-2 py-0.5 rounded font-medium border border-green-200">
            Live Simulated Data
          </span>
        </div>
        <div className="p-6 md:p-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-1">
              <div className="text-xs text-slate-500 font-medium">Starting Capital</div>
              <div className="text-2xl font-bold text-slate-900 font-mono">$100,000.00</div>
            </div>
            <div className="space-y-1">
              <div className="text-xs text-slate-500 font-medium">Current Balance</div>
              <div className="text-2xl font-bold text-slate-900 font-mono text-green-600">$102,450.25</div>
            </div>
            <div className="space-y-1">
              <div className="text-xs text-slate-500 font-medium">Active Positions</div>
              <div className="text-2xl font-bold text-slate-900 font-mono">4</div>
            </div>
          </div>
          
          <div className="mt-8 overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 font-mono uppercase bg-slate-50 border-y border-slate-200">
                <tr>
                  <th className="px-4 py-3 font-medium">Asset</th>
                  <th className="px-4 py-3 font-medium text-right">Shares</th>
                  <th className="px-4 py-3 font-medium text-right">Avg Price</th>
                  <th className="px-4 py-3 font-medium text-right">Current Price</th>
                  <th className="px-4 py-3 font-medium text-right">Return</th>
                </tr>
              </thead>
              <tbody className="font-mono text-slate-800">
                <tr className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3 font-bold flex items-center gap-2">
                    <div className="w-6 h-6 rounded bg-blue-100 flex items-center justify-center text-blue-700 text-[10px]">APL</div>
                    AAPL
                  </td>
                  <td className="px-4 py-3 text-right">50</td>
                  <td className="px-4 py-3 text-right">$175.20</td>
                  <td className="px-4 py-3 text-right">$178.45</td>
                  <td className="px-4 py-3 text-right text-green-600">+$162.50</td>
                </tr>
                <tr className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3 font-bold flex items-center gap-2">
                    <div className="w-6 h-6 rounded bg-purple-100 flex items-center justify-center text-purple-700 text-[10px]">MSF</div>
                    MSFT
                  </td>
                  <td className="px-4 py-3 text-right">25</td>
                  <td className="px-4 py-3 text-right">$330.10</td>
                  <td className="px-4 py-3 text-right">$335.80</td>
                  <td className="px-4 py-3 text-right text-green-600">+$142.50</td>
                </tr>
                <tr className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-bold flex items-center gap-2">
                    <div className="w-6 h-6 rounded bg-orange-100 flex items-center justify-center text-orange-700 text-[10px]">BTC</div>
                    BTC-USD
                  </td>
                  <td className="px-4 py-3 text-right">0.5</td>
                  <td className="px-4 py-3 text-right">$64,200</td>
                  <td className="px-4 py-3 text-right">$63,800</td>
                  <td className="px-4 py-3 text-right text-red-600">-$200.00</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

    </div>
  );
}
