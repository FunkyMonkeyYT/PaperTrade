import React from 'react';
import {
  Globe2,
  Clock,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Building2,
  Wallet,
  ChevronRight,
  ShieldCheck,
  Zap
} from 'lucide-react';
import { useAuth, COUNTRIES } from '../context/AuthContext';

export default function MarketProfileHeader({ selectedTicker, onSelectTicker, portfolio }) {
  const {
    activeCountry,
    currentCountryObj,
    changeCountry,
    marketStatus,
    formatCurrency,
    convertFx,
    FX_RATES
  } = useAuth();

  const handleProfileSwitch = (countryCode) => {
    changeCountry(countryCode);
    const country = COUNTRIES.find((c) => c.code === countryCode);
    if (country) {
      onSelectTicker(country.defaultTicker);
    }
  };

  const portfolioCurrency = portfolio?.currency || 'USD';
  const totalVal = convertFx(portfolio?.total_portfolio_value ?? 100000, portfolioCurrency, currentCountryObj.currency);
  const popular = currentCountryObj?.popularTickers || [];

  // Market status badge color
  const statusColor = marketStatus?.status_color || 'green';
  const statusLabel = marketStatus?.status_label || (marketStatus?.is_open ? 'OPEN' : 'CLOSED');
  const localTime = marketStatus?.local_time || 'Live';
  const nextEvent = marketStatus?.next_event || (marketStatus?.is_open ? 'Trading Active' : 'Market Closed');

  return (
    <div className="w-full bg-white border border-slate-200 rounded-lg p-3.5 sm:p-4 shadow-sm transition-all space-y-3">
      
      {/* Top Row: Top 10 Market Profile Switcher Pills */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5 border-b border-slate-200 pb-2.5">
        
        {/* Left: Top 10 Markets Switcher */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-500 mr-1 shrink-0 flex items-center gap-1">
            <Globe2 className="w-3.5 h-3.5 text-[#2563EB]" />
            Markets:
          </span>

          {COUNTRIES.map((c) => {
            const isActive = activeCountry === c.code;
            return (
              <button
                key={c.code}
                onClick={() => handleProfileSwitch(c.code)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md font-mono text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  isActive
                    ? 'bg-[#2563EB] text-white shadow-sm'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                }`}
              >
                <span className="text-sm">{c.flag}</span>
                <span>{c.code}</span>
              </button>
            );
          })}
        </div>

        {/* Right: Unified Wallet Balance indicator */}
        <div className="flex items-center gap-2 font-mono text-xs text-slate-600 shrink-0 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200">
          <Wallet className="w-3.5 h-3.5 text-[#16A34A] shrink-0" />
          <span>Unified Capital:</span>
          <span className="font-bold text-slate-900 tabular-nums">{formatCurrency(totalVal)}</span>
        </div>

      </div>

      {/* Middle Row: Active Exchange Details & Live Market Hours Status Clock */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5 bg-slate-50 p-3 rounded-md border border-slate-200">
        
        {/* Left: Active Exchange Identity */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-md bg-[#2563EB]/10 border border-[#2563EB]/25 flex items-center justify-center text-lg shrink-0">
            {currentCountryObj.flag}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-xs sm:text-sm text-slate-900 tracking-tight font-sans">
                {currentCountryObj.exchangeFullName || currentCountryObj.exchange}
              </h3>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#2563EB]/10 text-[#2563EB] font-mono font-bold uppercase">
                {currentCountryObj.code} Market
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-mono mt-0.5">
              Base Currency: <strong className="text-slate-800">{currentCountryObj.currency} ({currentCountryObj.symbol})</strong> • Shared $100k USD Parity
            </p>
          </div>
        </div>

        {/* Right: Market Status Clock */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right">
            <div className="flex items-center justify-end gap-1 text-xs font-mono">
              <span className="text-slate-500">Local Time:</span>
              <span className="font-bold text-slate-900 tabular-nums">{localTime}</span>
            </div>
            <div className="text-[10px] font-mono text-slate-500">{nextEvent}</div>
          </div>

          {/* Status Badge */}
          <div
            className={`px-2.5 py-1 rounded-md border font-mono text-xs font-bold flex items-center gap-1.5 uppercase tracking-wider shrink-0 ${
              statusColor === 'green'
                ? 'bg-[#00D09C]/15 border-[#00D09C]/40 text-[#047857]'
                : statusColor === 'yellow'
                ? 'bg-[#F59E0B]/15 border-[#F59E0B]/40 text-[#D97706]'
                : 'bg-[#EB5B5B]/15 border-[#EB5B5B]/40 text-[#DC2626]'
            }`}
          >
            <span className="relative flex h-2 w-2">
              <span
                className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  statusColor === 'green' ? 'bg-[#00D09C]' : statusColor === 'yellow' ? 'bg-[#F59E0B]' : 'bg-[#EB5B5B]'
                }`}
              />
              <span
                className={`relative inline-flex rounded-full h-2 w-2 ${
                  statusColor === 'green' ? 'bg-[#00D09C]' : statusColor === 'yellow' ? 'bg-[#F59E0B]' : 'bg-[#EB5B5B]'
                }`}
              />
            </span>
            <span>{statusLabel}</span>
          </div>
        </div>

      </div>

    </div>
  );
}
