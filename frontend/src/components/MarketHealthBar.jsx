import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Globe2, Activity } from 'lucide-react';
import { stockApi } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function MarketHealthBar({ onSelectTicker }) {
  const [indices, setIndices] = useState([]);
  const [loading, setLoading] = useState(true);
  const { getCurrencySymbol } = useAuth();

  useEffect(() => {
    let isMounted = true;
    const fetchIndices = async () => {
      try {
        const res = await stockApi.getMarketIndices();
        if (isMounted && res?.indices) {
          setIndices(res.indices);
        }
      } catch (err) {
        console.error('Failed to load market indices:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchIndices();
    const interval = setInterval(fetchIndices, 45000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  if (loading && indices.length === 0) {
    return (
      <div className="w-full bg-[#0C0D0E] light:bg-slate-50 border-b border-slate-800 light:border-slate-200 px-4 py-2 flex items-center gap-4 overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-2 text-xs text-slate-400 light:text-[#065F46] font-mono">
          <Activity className="w-3.5 h-3.5 text-[#2962FF] animate-spin" />
          <span>Syncing Global Market Health Indices...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-[#0C0D0E] light:bg-white border-b border-slate-800 light:border-slate-200 px-3 sm:px-6 lg:px-8 py-1.5 overflow-x-auto no-scrollbar shadow-sm transition-colors">
      <div className="max-w-7xl mx-auto flex items-center justify-start gap-2.5 sm:gap-4 w-full">
        
        {/* Left Indicator */}
        <div className="flex items-center gap-1.5 shrink-0 pr-1">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00D09C] opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00D09C]" />
          </span>
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 light:text-[#065F46] font-mono flex items-center gap-1 whitespace-nowrap">
            <Globe2 className="w-3 h-3 text-[#2962FF]" />
            <span>Health:</span>
          </span>
        </div>

        {/* Indices Strip */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5 w-full">
          {indices.map((idx) => {
            const isPos = idx.change_amount >= 0;
            const sym = idx.currency === 'INR' ? '₹' : (idx.currency === 'GBP' ? '£' : (idx.currency === 'JPY' ? '¥' : (idx.currency === 'EUR' ? '€' : (idx.currency === 'HKD' ? 'HK$' : (idx.currency === 'CAD' ? 'CA$' : (idx.currency === 'AUD' ? 'A$' : (idx.currency === 'CHF' ? 'CHF ' : '$')))))));

            return (
              <button
                key={idx.symbol}
                onClick={() => onSelectTicker(idx.symbol)}
                title={`Click to analyze ${idx.name} (${idx.market_label})`}
                className="flex items-center gap-2 px-2.5 py-1 rounded-md bg-[#141517] light:bg-slate-100 hover:bg-slate-800 light:hover:bg-slate-200 border border-slate-700/60 light:border-slate-300 text-xs font-mono transition-all cursor-pointer shrink-0"
              >
                <span className="font-bold text-white light:text-slate-900">{idx.name}</span>
                <span className="text-slate-300 light:text-slate-700 font-bold tabular-nums">
                  {sym}{idx.price.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 2 })}
                </span>
                <div
                  className={`flex items-center gap-0.5 font-bold tabular-nums ${
                    isPos ? 'text-profit' : 'text-loss'
                  }`}
                >
                  {isPos ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  <span>{isPos ? '+' : ''}{idx.change_percentage.toFixed(2)}%</span>
                </div>
              </button>
            );
          })}
        </div>

      </div>
    </div>
  );
}
