import React, { useState, useEffect, useRef } from 'react';
import { Search, Globe2, TrendingUp, X, ArrowRight, CornerDownLeft, Sparkles } from 'lucide-react';
import { stockApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { COUNTRIES } from '../constants/theme';

export default function SearchModal({ isOpen, onClose, onSelectTicker }) {
  const { activeCountry, currentCountryObj, changeCountry } = useAuth();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [selectedMarketTab, setSelectedMarketTab] = useState('ALL'); // 'ALL' or specific country code
  const inputRef = useRef(null);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Fetch or filter popular tickers
  useEffect(() => {
    let isMounted = true;
    const fetchResults = async () => {
      setLoading(true);
      try {
        const countryFilter = selectedMarketTab === 'ALL' ? null : selectedMarketTab;
        const res = await stockApi.searchStocks(query.trim(), countryFilter);
        if (isMounted) {
          setResults(res || []);
          setSelectedIndex(0);
        }
      } catch (err) {
        console.error('Stock search failed:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    const timer = setTimeout(fetchResults, query.trim() ? 200 : 0);
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [query, selectedMarketTab]);

  // Global hotkeys for arrow navigation & Enter selection
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1 < results.length ? prev + 1 : prev));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 >= 0 ? prev - 1 : 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (results[selectedIndex]) {
          handleSelect(results[selectedIndex].ticker);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, results, selectedIndex]);

  const handleSelect = (ticker) => {
    if (!ticker) return;
    onSelectTicker(ticker);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-start justify-center p-3 sm:p-6 pt-12 sm:pt-20 animate-fadeIn">
      <div className="max-w-2xl w-full bg-[#111827] border border-slate-700/80 rounded-lg shadow-2xl overflow-hidden flex flex-col max-h-[80vh] animate-scaleIn">
        
        {/* Search Header Input */}
        <div className="p-3 sm:p-4 border-b border-slate-800 flex items-center gap-3 bg-[#161B26]">
          <Search className="w-5 h-5 text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search all global stocks (e.g. AAPL, RELIANCE, TSLA, 7203.T, BTC)..."
            className="w-full bg-transparent text-sm sm:text-base font-mono text-[#F9FAFB] placeholder:text-slate-500 focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="text-slate-400 hover:text-white p-1 rounded-md"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono text-slate-400 bg-slate-800 border border-slate-700">
            ESC
          </span>
        </div>

        {/* Top 10 Major Markets Filter Pills */}
        <div className="px-3 sm:px-4 py-2 bg-[#111827] border-b border-slate-800/80 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setSelectedMarketTab('ALL')}
            className={`px-2.5 py-1 rounded-md text-xs font-mono font-medium transition-all shrink-0 ${
              selectedMarketTab === 'ALL'
                ? 'bg-[#2962FF] text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            All Markets
          </button>
          {COUNTRIES.map((c) => (
            <button
              key={c.code}
              onClick={() => setSelectedMarketTab(c.code)}
              className={`px-2.5 py-1 rounded-md text-xs font-mono transition-all shrink-0 flex items-center gap-1.5 ${
                selectedMarketTab === c.code
                  ? 'bg-[#2962FF] text-white font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <span>{c.flag}</span>
              <span>{c.code}</span>
            </button>
          ))}
        </div>

        {/* Results List */}
        <div className="overflow-y-auto divide-y divide-slate-800/60 flex-1 p-2">
          {loading ? (
            <div className="p-8 space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-12 w-full skeleton-shimmer" />
              ))}
            </div>
          ) : results.length === 0 ? (
            <div className="p-10 text-center text-slate-500">
              <Search className="w-8 h-8 mx-auto mb-2 opacity-50 text-slate-600" />
              <p className="text-sm font-medium text-slate-300">No assets found matching "{query}"</p>
              <p className="text-xs text-slate-500 mt-1 font-mono">
                Try searching by company name, ticker code, or standard exchange identifier.
              </p>
            </div>
          ) : (
            results.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={item.ticker}
                  onClick={() => handleSelect(item.ticker)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`p-2.5 sm:p-3 rounded-md transition-all cursor-pointer flex items-center justify-between group ${
                    isSelected
                      ? 'bg-[#161B26] border border-slate-700/80'
                      : 'hover:bg-slate-800/30'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg">
                      {COUNTRIES.find((c) => c.code === item.country)?.flag || '🌐'}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-sm text-[#F9FAFB] group-hover:text-[#2962FF] transition-colors">
                          {item.ticker}
                        </span>
                        <span className="text-[11px] font-mono text-slate-500 bg-slate-800/60 px-1.5 py-0.5 rounded">
                          {item.country || 'GLOBAL'}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 line-clamp-1">
                        {item.name}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono text-slate-500 hidden sm:inline-block">
                      {item.sector || 'Equities'}
                    </span>
                    <div className="w-7 h-7 rounded-md bg-slate-800/60 flex items-center justify-center text-slate-400 group-hover:text-[#2962FF] group-hover:bg-[#2962FF]/10 transition-colors">
                      <CornerDownLeft className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Hotkeys Reference */}
        <div className="p-2.5 sm:p-3 bg-[#161B26] border-t border-slate-800 flex items-center justify-between text-[11px] font-mono text-slate-500">
          <div className="flex items-center gap-3">
            <span><strong className="text-slate-400">↑↓</strong> Navigate</span>
            <span><strong className="text-slate-400">↵</strong> Select</span>
            <span><strong className="text-slate-400">ESC</strong> Close</span>
          </div>
          <span className="hidden sm:inline-block text-slate-500">
            Real-time Algorithmic Search Across Top 10 Markets
          </span>
        </div>

      </div>
    </div>
  );
}
