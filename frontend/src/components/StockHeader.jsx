import React from 'react';
import { TrendingUp, TrendingDown, Building2, Globe2, Activity } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { COUNTRIES } from '../constants/theme';

export default function StockHeader({ metricsData, loading, onSelectTicker }) {
  const { getCurrencySymbol, getCurrencyFromTicker, currentCountryObj, convertFx, FX_RATES } = useAuth();

  if (loading && !metricsData) {
    return (
      <div className="p-4 sm:p-5 rounded-lg border border-slate-800 light:border-slate-200 bg-[#0C0D0E] light:bg-white shadow-sm">
        <div className="flex items-center gap-3">
          <div className="h-7 w-32 skeleton-shimmer" />
          <div className="h-7 w-44 skeleton-shimmer" />
        </div>
        <div className="mt-3 flex gap-4">
          <div className="h-9 w-40 skeleton-shimmer" />
          <div className="h-9 w-28 skeleton-shimmer" />
        </div>
      </div>
    );
  }

  if (!metricsData) return null;

  const m = metricsData.metrics;
  const q = metricsData.quant_scores;
  const isPositive = m.change_amount >= 0;

  // Active user market currency & ticker native currency
  const activeCurrency = currentCountryObj.currency || 'USD';
  const nativeCurrency = getCurrencyFromTicker(metricsData.ticker) || m.currency || 'USD';

  // Converted price in active user currency
  const fxMultiplier = (FX_RATES[activeCurrency] || 1.0) / (FX_RATES[nativeCurrency] || 1.0);
  const displayPrice = m.current_price * fxMultiplier;
  const displayChange = m.change_amount * fxMultiplier;
  const displayPrevClose = m.previous_close * fxMultiplier;
  const displayHigh52 = m.fifty_two_week_high * fxMultiplier;
  const displayLow52 = m.fifty_two_week_low * fxMultiplier;

  const activeSym = getCurrencySymbol(activeCurrency);
  const nativeSym = getCurrencySymbol(nativeCurrency);
  const isConverted = activeCurrency !== nativeCurrency;

  // Calculate 52-week position percentage
  const range52 = displayHigh52 - displayLow52;
  const currentPos52 = range52 > 0 ? ((displayPrice - displayLow52) / range52) * 100 : 50;

  const formatLargeNum = (num) => {
    if (!num) return 'N/A';
    const convertedCap = num * fxMultiplier;
    if (convertedCap >= 1e12) return `${activeSym}${(convertedCap / 1e12).toFixed(2)}T`;
    if (convertedCap >= 1e9) return `${activeSym}${(convertedCap / 1e9).toFixed(2)}B`;
    if (convertedCap >= 1e6) return `${activeSym}${(convertedCap / 1e6).toFixed(2)}M`;
    return `${activeSym}${convertedCap.toLocaleString()}`;
  };

  const quickPills = currentCountryObj.popularTickers?.slice(0, 6) || ['AAPL', 'NVDA', 'MSFT', 'TSLA', 'RELIANCE.NS', 'BTC-USD'];

  return (
    <div className="p-4 sm:p-5 rounded-lg border border-slate-800 light:border-slate-200 bg-[#0C0D0E] light:bg-white shadow-sm flex flex-col gap-3.5 transition-colors">
      
      {/* Top Bar: Quick Ticker Shortcuts & Market Tag */}
      <div className="flex items-center justify-between gap-2 overflow-x-auto no-scrollbar pb-1 border-b border-slate-800/60 light:border-slate-200">
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-[11px] font-mono text-slate-400 light:text-[#065F46] uppercase font-semibold">Quick Watch:</span>
          {quickPills.map((tkr) => (
            <button
              key={tkr}
              onClick={() => onSelectTicker && onSelectTicker(tkr)}
              className={`px-2 py-0.5 rounded text-xs font-mono font-bold transition-all cursor-pointer ${
                metricsData.ticker === tkr
                  ? 'bg-[#2962FF] text-white shadow-sm'
                  : 'bg-[#141517] light:bg-slate-100 hover:bg-slate-800 light:hover:bg-slate-200 text-slate-300 light:text-slate-800 border border-slate-700/60 light:border-slate-300'
              }`}
            >
              {tkr}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1 text-[11px] font-mono text-slate-400 light:text-[#047857] shrink-0">
          <span className="text-sm">{currentCountryObj.flag}</span>
          <span>{currentCountryObj.exchange}</span>
        </div>
      </div>

      {/* Main Stock Ticker & Price Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        
        {/* Left Column: Ticker, Name, LTP, Change */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-black font-mono text-white light:text-[#047857] tracking-tight">
              {metricsData.ticker}
            </h1>
            <span className="text-xs font-bold text-slate-300 light:text-slate-800 bg-[#141517] light:bg-slate-100 border border-slate-700/80 light:border-slate-300 px-2.5 py-0.5 rounded-md">
              {metricsData.company_name}
            </span>
            <span className="text-xs text-slate-400 light:text-[#065F46] font-mono">
              {m.sector || 'Equities'}
            </span>
            {isConverted && (
              <span className="text-[11px] font-mono text-[#2962FF] bg-[#2962FF]/15 border border-[#2962FF]/30 px-2 py-0.5 rounded-md flex items-center gap-1">
                <Globe2 className="w-3 h-3" />
                <span>1 {nativeCurrency} = {fxMultiplier.toFixed(2)} {activeCurrency}</span>
              </span>
            )}
          </div>

          <div className="flex items-baseline gap-3 flex-wrap">
            <span className="text-3xl sm:text-4xl font-bold font-mono text-white light:text-slate-900 tabular-nums tracking-tight">
              {activeSym}{displayPrice.toFixed(2)}
            </span>

            <div
              className={`flex items-center gap-1 text-sm sm:text-base font-bold font-mono px-2 py-0.5 rounded-md ${
                isPositive ? 'bg-profit-badge' : 'bg-loss-badge'
              }`}
            >
              {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              <span className="tabular-nums">{isPositive ? '+' : ''}{displayChange.toFixed(2)}</span>
              <span className="tabular-nums">({isPositive ? '+' : ''}{m.change_percentage.toFixed(2)}%)</span>
            </div>

            <span className="text-xs font-mono text-slate-400 light:text-slate-500 tabular-nums">
              Prev Close: {activeSym}{displayPrevClose.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Right Column: 52W Range & Fundamentals Summary */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
          
          {/* 52-Week Range Bar */}
          <div className="w-full sm:w-48 flex flex-col gap-1 bg-[#141517] light:bg-slate-100 p-2 rounded-md border border-slate-700/60 light:border-slate-300">
            <div className="flex justify-between text-[10px] font-mono text-slate-400 light:text-slate-600">
              <span>L: {activeSym}{displayLow52.toFixed(1)}</span>
              <span>H: {activeSym}{displayHigh52.toFixed(1)}</span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-slate-800 light:bg-slate-200 relative overflow-hidden">
              <div
                className="h-full bg-profit-badge rounded-full"
                style={{ width: `${Math.min(Math.max(currentPos52, 2), 100)}%` }}
              />
            </div>
            <div className="text-[10px] text-slate-400 light:text-slate-500 font-mono text-center">
              52W Range ({currentPos52.toFixed(0)}%)
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-3 gap-2 text-center font-mono">
            <div className="bg-[#141517] light:bg-slate-100 border border-slate-700/60 light:border-slate-300 p-2 rounded-md">
              <div className="text-[10px] text-slate-400 light:text-slate-500 uppercase font-bold">Mkt Cap</div>
              <div className="text-xs font-bold text-white light:text-slate-900 tabular-nums">{formatLargeNum(m.market_cap)}</div>
            </div>
            <div className="bg-[#141517] light:bg-slate-100 border border-slate-700/60 light:border-slate-300 p-2 rounded-md">
              <div className="text-[10px] text-slate-400 light:text-slate-500 uppercase font-bold">P/E</div>
              <div className="text-xs font-bold text-white light:text-slate-900 tabular-nums">{m.pe_ratio ? m.pe_ratio.toFixed(1) : 'N/A'}</div>
            </div>
            <div className="bg-[#141517] light:bg-slate-100 border border-slate-700/60 light:border-slate-300 p-2 rounded-md">
              <div className="text-[10px] text-slate-400 light:text-slate-500 uppercase font-bold">Beta</div>
              <div className="text-xs font-bold text-white light:text-slate-900 tabular-nums">{m.beta ? m.beta.toFixed(2) : '1.00'}</div>
            </div>
          </div>

          {/* Quant Verdict */}
          <div className="p-2 rounded-md bg-[#141517] light:bg-slate-100 border border-slate-700/60 light:border-slate-300 text-center flex flex-col justify-center">
            <div className="text-[10px] uppercase font-bold text-slate-400 light:text-slate-500 font-mono">Signal</div>
            <span
              className={`text-xs font-extrabold font-mono px-2 py-0.5 rounded mt-0.5 ${
                q.verdict.includes('Buy')
                  ? 'bg-profit-badge'
                  : q.verdict.includes('Sell')
                  ? 'bg-loss-badge'
                  : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
              }`}
            >
              {q.verdict}
            </span>
          </div>

        </div>

      </div>

    </div>
  );
}
