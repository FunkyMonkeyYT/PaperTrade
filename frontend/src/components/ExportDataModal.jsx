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
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="max-w-md w-full p-6 rounded-lg shadow-xl relative border border-slate-200 bg-white transition-colors">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-lg bg-[#2563EB]/10 border border-[#2563EB]/25 flex items-center justify-center text-[#2563EB]">
            <Download className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Machine Learning Data Export
            </h3>
            <p className="text-xs text-slate-500">Export clean OHLCV & quantitative indicators</p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Ticker Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 font-mono">
              Stock Ticker Symbol
            </label>
            <input
              type="text"
              value={ticker}
              onChange={(e) => setTicker(e.target.value.toUpperCase())}
              placeholder="AAPL or RELIANCE.NS"
              className="w-full bg-slate-50 border border-slate-300 rounded-md px-4 py-2 text-slate-900 font-mono font-bold text-sm focus:outline-none focus:border-[#2563EB]"
            />
          </div>

          {/* Timeframe */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 font-mono">
              Historical Range
            </label>
            <select
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-md px-4 py-2 text-slate-900 font-mono text-sm focus:outline-none focus:border-[#2563EB] cursor-pointer"
            >
              <option value="1y">1 Year (Daily OHLCV + Indicators)</option>
              <option value="2y">2 Years (Recommended for ML Training)</option>
              <option value="5y">5 Years (Longitudinal Modeling)</option>
              <option value="max">Max Available History</option>
            </select>
          </div>

          {/* Format (CSV or JSON) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 font-mono">
              File Format
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormat('csv')}
                className={`flex items-center justify-center gap-2 p-3 rounded-md border font-mono text-xs font-bold transition-all cursor-pointer ${
                  format === 'csv'
                    ? 'bg-[#2563EB]/10 border-[#2563EB]/30 text-[#2563EB]'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900'
                }`}
              >
                <FileText className="w-4 h-4" />
                CSV Format
              </button>

              <button
                type="button"
                onClick={() => setFormat('json')}
                className={`flex items-center justify-center gap-2 p-3 rounded-md border font-mono text-xs font-bold transition-all cursor-pointer ${
                  format === 'json'
                    ? 'bg-[#2563EB]/10 border-[#2563EB]/30 text-[#2563EB]'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900'
                }`}
              >
                <Database className="w-4 h-4" />
                JSON Format
              </button>
            </div>
          </div>

          {/* Feature List Preview */}
          <div className="bg-slate-50 rounded-md p-3.5 border border-slate-200 text-[11px] text-slate-600 space-y-1 font-mono">
            <div className="font-bold text-slate-900 mb-1">Included ML Features:</div>
            <p>• OHLCV (Open, High, Low, Close, Volume)</p>
            <p>• SMA (20, 50, 200)</p>
            <p>• 14-Day RSI & MACD (Line, Signal, Histogram)</p>
            <p>• Bollinger Bands (Upper, Middle, Lower, Bandwidth, %B)</p>
            <p>• 30-Day Rolling Volatility & Log Returns</p>
          </div>

          {/* Download Button */}
          <button
            onClick={handleDownload}
            className="w-full py-2.5 rounded-md font-bold font-mono text-sm bg-[#2563EB] hover:bg-blue-700 text-white shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            Download {ticker} Dataset ({format.toUpperCase()})
          </button>
        </div>

      </div>
    </div>
  );
}
