import React, { useState } from 'react';
import { Download, FileText, Database, X } from 'lucide-react';
import { stockApi } from '../services/api';

export default function ExportDataModal({ isOpen, onClose, defaultTicker = 'AAPL' }) {
  const [ticker, setTicker] = useState(defaultTicker);
  const [timeframe, setTimeframe] = useState('2y');
  const [format, setFormat] = useState('csv');

  if (!isOpen) return null;

  const handleDownload = () => {
    const url = stockApi.getExportUrl(ticker.trim().toUpperCase(), timeframe, format);
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="max-w-md w-full p-6 rounded-2xl shadow-2xl relative border border-slate-200 dark:border-[#2A2E39] bg-white dark:bg-[#1E222D] transition-colors">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-900 dark:hover:text-white p-1 rounded-lg cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-[#2962FF]/15 border border-[#2962FF]/30 flex items-center justify-center text-[#2962FF]">
            <Download className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Machine Learning Data Export
            </h3>
            <p className="text-xs text-slate-500 dark:text-[#787B86]">Export clean OHLCV & quantitative indicators</p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Ticker Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 font-mono">
              Stock Ticker Symbol
            </label>
            <input
              type="text"
              value={ticker}
              onChange={(e) => setTicker(e.target.value.toUpperCase())}
              placeholder="AAPL or RELIANCE.NS"
              className="w-full bg-slate-100 dark:bg-[#131722] border border-slate-200 dark:border-[#2A2E39] rounded-xl px-4 py-2 text-slate-900 dark:text-white font-mono font-bold text-sm focus:outline-none focus:border-[#2962FF]"
            />
          </div>

          {/* Timeframe */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 font-mono">
              Historical Range
            </label>
            <select
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value)}
              className="w-full bg-slate-100 dark:bg-[#131722] border border-slate-200 dark:border-[#2A2E39] rounded-xl px-4 py-2 text-slate-900 dark:text-white font-mono text-sm focus:outline-none focus:border-[#2962FF] cursor-pointer"
            >
              <option value="1y">1 Year (Daily OHLCV + Indicators)</option>
              <option value="2y">2 Years (Recommended for ML Training)</option>
              <option value="5y">5 Years (Longitudinal Modeling)</option>
              <option value="max">Max Available History</option>
            </select>
          </div>

          {/* Format (CSV or JSON) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 font-mono">
              File Format
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormat('csv')}
                className={`flex items-center justify-center gap-2 p-3 rounded-xl border font-mono text-xs font-bold transition-all cursor-pointer ${
                  format === 'csv'
                    ? 'bg-[#2962FF]/15 border-[#2962FF]/40 text-[#2962FF]'
                    : 'bg-slate-100 dark:bg-[#131722] border-slate-200 dark:border-[#2A2E39] text-slate-600 dark:text-[#787B86] hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <FileText className="w-4 h-4" />
                CSV Format
              </button>

              <button
                type="button"
                onClick={() => setFormat('json')}
                className={`flex items-center justify-center gap-2 p-3 rounded-xl border font-mono text-xs font-bold transition-all cursor-pointer ${
                  format === 'json'
                    ? 'bg-[#2962FF]/15 border-[#2962FF]/40 text-[#2962FF]'
                    : 'bg-slate-100 dark:bg-[#131722] border-slate-200 dark:border-[#2A2E39] text-slate-600 dark:text-[#787B86] hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Database className="w-4 h-4" />
                JSON Format
              </button>
            </div>
          </div>

          {/* Feature List Preview */}
          <div className="bg-slate-50 dark:bg-[#131722] rounded-xl p-3.5 border border-slate-200 dark:border-[#2A2E39] text-[11px] text-slate-500 dark:text-[#787B86] space-y-1 font-mono">
            <div className="font-bold text-slate-900 dark:text-slate-200 mb-1">Included ML Features:</div>
            <p>• OHLCV (Open, High, Low, Close, Volume)</p>
            <p>• SMA (20, 50, 200)</p>
            <p>• 14-Day RSI & MACD (Line, Signal, Histogram)</p>
            <p>• Bollinger Bands (Upper, Middle, Lower, Bandwidth, %B)</p>
            <p>• 30-Day Rolling Volatility & Log Returns</p>
          </div>

          {/* Download Button */}
          <button
            onClick={handleDownload}
            className="w-full py-3 rounded-xl font-bold font-mono text-sm bg-[#2962FF] hover:bg-[#2962FF]/90 text-white shadow-lg shadow-[#2962FF]/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            Download {ticker} Dataset ({format.toUpperCase()})
          </button>
        </div>

      </div>
    </div>
  );
}
