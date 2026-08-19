import React, { useState } from 'react';
import { PieChart, Briefcase, TrendingUp, TrendingDown, Layers, ArrowUpRight, ArrowDownRight, Search, PlusCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { COUNTRIES } from '../constants/theme';

export default function PortfolioSummary({ portfolio, onSelectTicker, onQuickSell, onOpenSearch }) {
  const { formatCurrency, getCurrencySymbol, getCurrencyFromTicker, activeCountry, currentCountryObj, convertFx } = useAuth();
  const [filterMode, setFilterMode] = useState('ALL'); // 'ALL' or 'ACTIVE_MARKET'

  if (!portfolio) return null;

  const allPositions = portfolio.positions || [];
  
  // Helper to get exchange tag
  const getExchangeTag = (ticker) => {
    const t = String(ticker).toUpperCase();
    if (t.endsWith('.NS') || t.endsWith('.BO') || t.startsWith('^BSE') || t.startsWith('^NSE')) {
      return { code: 'IN', flag: '🇮🇳', label: 'NSE/BSE' };
    }
    if (t.endsWith('.T') || t === '^N225') {
      return { code: 'JP', flag: '🇯🇵', label: 'TSE/Nikkei' };
    }
    if (t.endsWith('.L') || t === '^FTSE') {
      return { code: 'GB', flag: '🇬🇧', label: 'LSE' };
    }
    if (t.endsWith('.DE') || t.endsWith('.PA') || t.endsWith('.AS') || t === '^GDAXI') {
      return { code: 'EU', flag: '🇪🇺', label: 'Euronext/DAX' };
    }
    if (t.endsWith('.HK') || t === '^HSI') {
      return { code: 'HK', flag: '🇨🇳', label: 'HKEX' };
    }
    if (t.endsWith('.TO') || t === '^GSPTSE') {
      return { code: 'CA', flag: '🇨🇦', label: 'TSX' };
    }
    if (t.endsWith('.AX') || t === '^AXJO') {
      return { code: 'AU', flag: '🇦🇺', label: 'ASX' };
    }
    if (t.endsWith('.SW') || t === '^SSMI') {
      return { code: 'CH', flag: '🇨🇭', label: 'SIX' };
    }
    if (t.endsWith('-USD')) {
      return { code: 'GLOBAL', flag: '🌐', label: 'Crypto' };
    }
    return { code: 'US', flag: '🇺🇸', label: 'NASDAQ/NYSE' };
  };

  const filteredPositions = filterMode === 'ALL'
    ? allPositions
    : allPositions.filter((pos) => getExchangeTag(pos.ticker).code === activeCountry);

  const portfolioCurrency = portfolio.currency || 'USD';
  const targetCurr = currentCountryObj.currency || 'USD';
  const totalValue = convertFx(portfolio.total_portfolio_value ?? 100000, portfolioCurrency, targetCurr);
  const cash = convertFx(portfolio.cash_balance ?? 100000, portfolioCurrency, targetCurr);
  const invested = convertFx(portfolio.invested_value ?? 0, portfolioCurrency, targetCurr);
  const unrealizedPnl = convertFx(portfolio.total_unrealized_pnl ?? 0, portfolioCurrency, targetCurr);
  const unrealizedPct = portfolio.total_unrealized_pnl_percent ?? 0;
  const realizedPnl = convertFx(portfolio.total_realized_pnl ?? 0, portfolioCurrency, targetCurr);
  const totalReturnPct = portfolio.total_return_percent ?? 0;

  return (
    <div className="space-y-4">
      
      {/* 4 Overview Metric Cards */}
      <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-3">
        
        {/* Total Equity */}
        <div className="p-4 rounded-lg border border-slate-800 light:border-slate-200 bg-[#0C0D0E] light:bg-white shadow-sm">
          <div className="flex items-center justify-between text-slate-400 light:text-[#065F46] mb-1.5 font-mono text-xs font-semibold">
            <span className="uppercase tracking-wider">Total Equity</span>
            <Briefcase className="w-4 h-4 text-[#2962FF]" />
          </div>
          <div className="text-2xl font-bold font-mono text-white light:text-slate-900 tabular-nums mb-1">
            {formatCurrency(totalValue)}
          </div>
          <div className="flex items-center gap-1.5 text-xs font-mono">
            <span className={`font-bold tabular-nums ${totalReturnPct >= 0 ? 'text-profit' : 'text-loss'}`}>
              {totalReturnPct >= 0 ? '+' : ''}{totalReturnPct.toFixed(2)}%
            </span>
            <span className="text-slate-500 light:text-slate-400 text-[11px]">all-time return</span>
          </div>
        </div>

        {/* Available Cash */}
        <div className="p-4 rounded-lg border border-slate-800 light:border-slate-200 bg-[#0C0D0E] light:bg-white shadow-sm">
          <div className="flex items-center justify-between text-slate-400 light:text-[#065F46] mb-1.5 font-mono text-xs font-semibold">
            <span className="uppercase tracking-wider">Available Cash</span>
            <span className="w-2 h-2 rounded-full bg-[#00D09C]" />
          </div>
          <div className="text-2xl font-bold font-mono text-profit tabular-nums mb-1">
            {formatCurrency(cash)}
          </div>
          <div className="text-[11px] font-mono text-slate-400 light:text-slate-500 tabular-nums">
            {((cash / (totalValue || 1)) * 100).toFixed(1)}% of unified wallet
          </div>
        </div>

        {/* Invested Market Value */}
        <div className="p-4 rounded-lg border border-slate-800 light:border-slate-200 bg-[#0C0D0E] light:bg-white shadow-sm">
          <div className="flex items-center justify-between text-slate-400 light:text-[#065F46] mb-1.5 font-mono text-xs font-semibold">
            <span className="uppercase tracking-wider">Invested Value</span>
            <Layers className="w-4 h-4 text-[#8B5CF6]" />
          </div>
          <div className="text-2xl font-bold font-mono text-white light:text-slate-900 tabular-nums mb-1">
            {formatCurrency(invested)}
          </div>
          <div className="text-[11px] font-mono text-slate-400 light:text-slate-500">
            {allPositions.length} active global position{allPositions.length === 1 ? '' : 's'}
          </div>
        </div>

        {/* Realized & Unrealized P&L */}
        <div className="p-4 rounded-lg border border-slate-800 light:border-slate-200 bg-[#0C0D0E] light:bg-white shadow-sm">
          <div className="flex items-center justify-between text-slate-400 light:text-[#065F46] mb-1.5 font-mono text-xs font-semibold">
            <span className="uppercase tracking-wider">Unrealized P&L</span>
            {unrealizedPnl >= 0 ? (
              <TrendingUp className="w-4 h-4 text-profit" />
            ) : (
              <TrendingDown className="w-4 h-4 text-loss" />
            )}
          </div>
          <div
            className={`text-2xl font-bold font-mono tabular-nums mb-1 ${
              unrealizedPnl >= 0 ? 'text-profit' : 'text-loss'
            }`}
          >
            {unrealizedPnl >= 0 ? '+' : ''}{formatCurrency(unrealizedPnl)}
          </div>
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 light:text-slate-500">
            <span className="tabular-nums">({unrealizedPct >= 0 ? '+' : ''}{unrealizedPct.toFixed(2)}%)</span>
            <span className="tabular-nums">Realized: {formatCurrency(realizedPnl)}</span>
          </div>
        </div>

      </div>

      {/* Open Holdings Container */}
      <div className="rounded-lg border border-slate-800 light:border-slate-200 bg-[#0C0D0E] light:bg-white shadow-sm overflow-hidden transition-colors">
        <div className="px-4 py-3 border-b border-slate-800 light:border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-[#141517] light:bg-slate-50">
          <div className="flex items-center gap-2">
            <PieChart className="w-4 h-4 text-[#2962FF]" />
            <h3 className="text-xs sm:text-sm font-bold text-white light:text-slate-900 uppercase tracking-wider font-mono">
              Open Positions ({filteredPositions.length})
            </h3>
          </div>

          {/* Filter Tabs: All Global vs Active Market */}
          <div className="flex items-center gap-1 bg-[#0C0D0E] light:bg-white p-0.5 rounded-md border border-slate-800 light:border-slate-300">
            <button
              onClick={() => setFilterMode('ALL')}
              className={`px-2.5 py-1 rounded text-xs font-mono font-bold transition-all cursor-pointer ${
                filterMode === 'ALL'
                  ? 'bg-[#2962FF] text-white shadow-sm'
                  : 'text-slate-400 light:text-slate-600 hover:text-white'
              }`}
            >
              All Global ({allPositions.length})
            </button>
            <button
              onClick={() => setFilterMode('ACTIVE_MARKET')}
              className={`px-2.5 py-1 rounded text-xs font-mono font-bold transition-all flex items-center gap-1 cursor-pointer ${
                filterMode === 'ACTIVE_MARKET'
                  ? 'bg-[#2962FF] text-white shadow-sm'
                  : 'text-slate-400 light:text-slate-600 hover:text-white'
              }`}
            >
              <span>{currentCountryObj.flag}</span>
              <span>{currentCountryObj.code} Only</span>
            </button>
          </div>
        </div>

        {filteredPositions.length === 0 ? (
          /* FinTech Empty State Card */
          <div className="p-10 sm:p-14 text-center text-slate-400 flex flex-col items-center justify-center">
            <div className="w-14 h-14 rounded-full bg-[#141517] light:bg-slate-100 border border-slate-800 light:border-slate-300 flex items-center justify-center text-slate-400 mb-3.5 shadow-inner">
              <Briefcase className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-white light:text-slate-900 font-sans">
              No open positions in your portfolio yet
            </h4>
            <p className="text-xs text-slate-400 light:text-slate-500 mt-1 max-w-md font-mono">
              Search any company across top 10 international markets and place your first simulated order to begin.
            </p>
            {onOpenSearch && (
              <button
                onClick={onOpenSearch}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-md bg-[#2962FF] hover:bg-blue-600 text-white font-mono font-bold text-xs shadow-md transition-all cursor-pointer"
              >
                <Search className="w-3.5 h-3.5" />
                <span>Search Global Stocks (Ctrl + K)</span>
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Desktop / Tablet Dense Financial Table with Right-Aligned Numbers */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-[#141517] light:bg-slate-50 text-slate-400 light:text-slate-600 border-b border-slate-800 light:border-slate-200 uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-2.5 px-4">Market</th>
                    <th className="py-2.5 px-3">Asset</th>
                    <th className="py-2.5 px-3 text-right">Shares</th>
                    <th className="py-2.5 px-3 text-right">Avg Entry</th>
                    <th className="py-2.5 px-3 text-right">Market Price</th>
                    <th className="py-2.5 px-3 text-right">Current Value</th>
                    <th className="py-2.5 px-3 text-right">Unrealized P&L</th>
                    <th className="py-2.5 px-3 text-right">Alloc %</th>
                    <th className="py-2.5 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50 light:divide-slate-200">
                  {filteredPositions.map((pos) => {
                    const isPositive = pos.unrealized_pnl >= 0;
                    const posTickerCurr = getCurrencyFromTicker(pos.ticker);
                    const sym = getCurrencySymbol(pos.ticker);
                    const tag = getExchangeTag(pos.ticker);

                    const entryPrice = convertFx(pos.average_entry_price, portfolioCurrency, posTickerCurr);
                    const currentPrice = convertFx(pos.current_price, portfolioCurrency, posTickerCurr);
                    const marketVal = convertFx(pos.market_value, portfolioCurrency, posTickerCurr);
                    const unrealizedPnl = convertFx(pos.unrealized_pnl, portfolioCurrency, posTickerCurr);

                    return (
                      <tr
                        key={pos.id}
                        className="hover:bg-[#141517]/60 light:hover:bg-slate-50 transition-colors cursor-pointer"
                        onClick={() => onSelectTicker(pos.ticker)}
                      >
                        <td className="py-2.5 px-4">
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#141517] light:bg-slate-100 border border-slate-700/60 light:border-slate-300 text-[11px] font-bold">
                            <span>{tag.flag}</span>
                            <span className="text-slate-400 light:text-slate-600">{tag.label}</span>
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-bold text-white light:text-slate-900 text-sm">
                          <span className="text-[#2962FF] hover:underline">{pos.ticker}</span>
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-slate-300 light:text-slate-700 text-right tabular-nums">
                          {pos.shares}
                        </td>
                        <td className="py-2.5 px-3 text-slate-400 light:text-slate-600 text-right tabular-nums">
                          {sym}{entryPrice.toFixed(2)}
                        </td>
                        <td className="py-2.5 px-3 font-bold text-white light:text-slate-900 text-right tabular-nums">
                          {sym}{currentPrice.toFixed(2)}
                        </td>
                        <td className="py-2.5 px-3 font-bold text-slate-200 light:text-slate-800 text-right tabular-nums">
                          {sym}{marketVal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="py-2.5 px-3 text-right tabular-nums">
                          <div className={`font-bold inline-flex items-center gap-1 ${isPositive ? 'text-profit' : 'text-loss'}`}>
                            {isPositive ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                            <span>{isPositive ? '+' : ''}{sym}{unrealizedPnl.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            <span className="text-[11px]">({isPositive ? '+' : ''}{pos.unrealized_pnl_percent.toFixed(2)}%)</span>
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-slate-400 light:text-slate-600 text-right tabular-nums">
                          {pos.allocation_percent ? `${pos.allocation_percent}%` : 'N/A'}
                        </td>
                        <td className="py-2.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => onQuickSell(pos.ticker, pos.shares)}
                            className="px-2.5 py-1 rounded bg-red-500/15 hover:bg-red-500/25 text-red-400 border border-red-500/30 text-xs font-bold transition-colors cursor-pointer"
                          >
                            Sell
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

    </div>
  );
}
