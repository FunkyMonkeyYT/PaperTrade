import React from 'react';
import { Activity, ShieldCheck, Zap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function TechnicalIndicatorsPanel({ metricsData }) {
  const { getCurrencySymbol } = useAuth();
  if (!metricsData) return null;

  const ind = metricsData.indicators;
  const q = metricsData.quant_scores;
  const bb = ind.bollinger_bands;
  const sym = getCurrencySymbol(metricsData.ticker);

  const rsiVal = ind.rsi14;
  const rsiColor = rsiVal >= 70 ? 'text-[#EB5B5B]' : rsiVal <= 30 ? 'text-[#00D09C]' : 'text-[#2962FF]';
  const macdPositive = ind.macd_histogram >= 0;

  return (
    <div className="p-4 sm:p-5 rounded-lg border border-slate-800/80 bg-[#111827] shadow-sm flex flex-col gap-4 transition-colors">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-[#2962FF]/15 border border-[#2962FF]/30 flex items-center justify-center">
            <Activity className="w-3.5 h-3.5 text-[#2962FF]" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-[#F9FAFB] tracking-tight">
              Algorithmic Technical Indicators
            </h2>
            <p className="text-[11px] text-slate-500 font-mono">Mathematical momentum scorecard & statistical metrics</p>
          </div>
        </div>

        {/* Quant Verdict Badge */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="text-[11px] text-slate-400 uppercase font-bold font-mono">Composite:</span>
          <span
            className={`text-xs font-mono font-extrabold px-2.5 py-1 rounded-md border ${
              q.verdict.includes('Buy')
                ? 'bg-[#00D09C]/15 text-[#00D09C] border-[#00D09C]/30'
                : q.verdict.includes('Sell')
                ? 'bg-[#EB5B5B]/15 text-[#EB5B5B] border-[#EB5B5B]/30'
                : 'bg-[#F59E0B]/15 text-[#F59E0B] border-[#F59E0B]/30'
            }`}
          >
            {q.verdict} ({q.composite_score}/100)
          </span>
        </div>
      </div>

      {/* 4 Quantitative Score & Indicator Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
        
        {/* 1. RSI (14-Day) */}
        <div className="bg-[#161B26] border border-slate-800 rounded-md p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300 font-mono">14-Day RSI</span>
            <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-bold">
              {ind.rsi_status}
            </span>
          </div>

          <div className="my-2 flex items-baseline justify-between">
            <span className={`text-2xl font-bold font-mono tabular-nums ${rsiColor}`}>
              {rsiVal.toFixed(1)}
            </span>
            <span className="text-[10px] text-slate-500 font-mono">Range: 0 - 100</span>
          </div>

          {/* RSI Visual Meter */}
          <div>
            <div className="w-full h-1.5 rounded-full bg-slate-800 relative overflow-hidden flex">
              <div className="w-[30%] h-full bg-[#00D09C]/30" />
              <div className="w-[40%] h-full bg-slate-700" />
              <div className="w-[30%] h-full bg-[#EB5B5B]/30" />
            </div>
            <div className="relative w-full h-1.5 mt-0.5">
              <div
                className="absolute top-0 w-2 h-2 -ml-1 rounded-full bg-white shadow-sm"
                style={{ left: `${Math.min(Math.max(rsiVal, 2), 98)}%` }}
              />
            </div>
          </div>
        </div>

        {/* 2. MACD (12, 26, 9) */}
        <div className="bg-[#161B26] border border-slate-800 rounded-md p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300 font-mono">MACD (12, 26, 9)</span>
            <span
              className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded border font-bold ${
                macdPositive
                  ? 'bg-[#00D09C]/15 text-[#00D09C] border-[#00D09C]/30'
                  : 'bg-[#EB5B5B]/15 text-[#EB5B5B] border-[#EB5B5B]/30'
              }`}
            >
              {ind.macd_crossover}
            </span>
          </div>

          <div className="my-2 grid grid-cols-3 gap-1 text-center font-mono">
            <div className="bg-[#111827] p-1.5 rounded border border-slate-800/80">
              <div className="text-[9px] text-slate-500 uppercase font-bold">MACD</div>
              <div className="text-xs font-bold text-[#2962FF] tabular-nums">{ind.macd_line.toFixed(2)}</div>
            </div>
            <div className="bg-[#111827] p-1.5 rounded border border-slate-800/80">
              <div className="text-[9px] text-slate-500 uppercase font-bold">Signal</div>
              <div className="text-xs font-bold text-[#F59E0B] tabular-nums">{ind.macd_signal.toFixed(2)}</div>
            </div>
            <div className="bg-[#111827] p-1.5 rounded border border-slate-800/80">
              <div className="text-[9px] text-slate-500 uppercase font-bold">Hist</div>
              <div className={`text-xs font-bold tabular-nums ${macdPositive ? 'text-[#00D09C]' : 'text-[#EB5B5B]'}`}>
                {macdPositive ? '+' : ''}{ind.macd_histogram.toFixed(2)}
              </div>
            </div>
          </div>

          <div className="text-[10px] text-slate-500 font-mono text-center">
            {macdPositive ? 'Bullish Acceleration' : 'Bearish Pressure'}
          </div>
        </div>

        {/* 3. Bollinger Bands (20, 2) */}
        <div className="bg-[#161B26] border border-slate-800 rounded-md p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300 font-mono">Bollinger Bands (20, 2)</span>
            <span className="text-[10px] font-mono font-bold text-[#2962FF]">Width: {bb.bandwidth.toFixed(1)}%</span>
          </div>

          <div className="my-2 space-y-1 text-xs font-mono">
            <div className="flex justify-between text-slate-400">
              <span>Upper:</span>
              <span className="text-[#F9FAFB] font-bold tabular-nums">{sym}{bb.upper.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Mid (SMA20):</span>
              <span className="text-[#F9FAFB] font-bold tabular-nums">{sym}{bb.middle.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Lower:</span>
              <span className="text-[#F9FAFB] font-bold tabular-nums">{sym}{bb.lower.toFixed(2)}</span>
            </div>
          </div>

          <div className="text-[10px] text-[#2962FF] font-mono font-bold bg-[#2962FF]/10 border border-[#2962FF]/20 px-2 py-0.5 rounded text-center truncate">
            {bb.status}
          </div>
        </div>

        {/* 4. Volatility & Support/Resistance */}
        <div className="bg-[#161B26] border border-slate-800 rounded-md p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300 font-mono">30D Annual Volatility</span>
            <span
              className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded border font-bold ${
                ind.volatility_status === 'Low'
                  ? 'bg-[#00D09C]/15 text-[#00D09C] border-[#00D09C]/30'
                  : ind.volatility_status === 'Moderate'
                  ? 'bg-[#F59E0B]/15 text-[#F59E0B] border-[#F59E0B]/30'
                  : 'bg-[#EB5B5B]/15 text-[#EB5B5B] border-[#EB5B5B]/30'
              }`}
            >
              {ind.volatility_status}
            </span>
          </div>

          <div className="my-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold font-mono text-[#F9FAFB] tabular-nums">
              {ind.volatility_30d_annualized.toFixed(2)}%
            </span>
            <span className="text-[10px] text-slate-500 font-mono">
              Trend: {ind.sma_alignment.split(' ')[0]}
            </span>
          </div>

          <div className="flex items-center justify-between text-[11px] font-mono pt-1.5 border-t border-slate-800/80 font-bold">
            <span className="text-[#00D09C]">Support: {sym}{ind.support_level.toFixed(2)}</span>
            <span className="text-[#EB5B5B]">Resist: {sym}{ind.resistance_level.toFixed(2)}</span>
          </div>
        </div>

      </div>

      {/* Algorithmic Synthesis Memo Callout */}
      <div className="bg-[#161B26] border border-slate-800 rounded-md p-3.5 flex items-start gap-2.5">
        <ShieldCheck className="w-5 h-5 text-[#00D09C] shrink-0 mt-0.5" />
        <div className="text-xs text-slate-300 leading-relaxed font-mono">
          <span className="font-bold text-[#F9FAFB] mr-2">Quantitative Summary:</span>
          {q.algorithmic_summary}
        </div>
      </div>

    </div>
  );
}
