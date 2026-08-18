import React, { useState, useEffect, useRef } from 'react';
import { ShoppingCart, CheckCircle2, AlertCircle, ArrowRightLeft, ShieldCheck, Zap } from 'lucide-react';
import { stockApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function TradingPanel({
  ticker,
  currentPrice = 0,
  portfolio,
  onOrderSuccess
}) {
  const { formatCurrency, getCurrencySymbol, currentCountryObj, convertFx, FX_RATES } = useAuth();
  const { success, error: toastError } = useToast();
  
  const [orderType, setOrderType] = useState('BUY'); // 'BUY' or 'SELL'
  const [shares, setShares] = useState('1');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const sharesInputRef = useRef(null);

  // Global hotkey: 'B' to focus shares input
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') {
        return;
      }
      if (e.key.toLowerCase() === 'b') {
        e.preventDefault();
        setOrderType('BUY');
        sharesInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const activeCurrency = currentCountryObj.currency || 'USD';
  const nativeCurrency = ticker.includes('.NS') ? 'INR' : (ticker.includes('.L') ? 'GBP' : (ticker.includes('.T') ? 'JPY' : (ticker.includes('.HK') ? 'HKD' : (ticker.includes('.TO') ? 'CAD' : (ticker.includes('.AX') ? 'AUD' : (ticker.includes('.SW') ? 'CHF' : 'USD'))))));
  
  // Calculate converted execution price in active portfolio currency
  const fxMultiplier = (FX_RATES[activeCurrency] || 1.0) / (FX_RATES[nativeCurrency] || 1.0);
  const effectivePrice = currentPrice * fxMultiplier;
  const sym = getCurrencySymbol(activeCurrency);

  const numShares = parseFloat(shares) || 0;
  const totalCost = numShares * effectivePrice;

  const portfolioCurrency = portfolio?.currency || 'USD';
  const cash = convertFx(portfolio?.cash_balance ?? 100000, portfolioCurrency, activeCurrency);
  const currentPosition = portfolio?.positions?.find(
    (p) => p.ticker.toUpperCase() === ticker.toUpperCase()
  );
  const ownedShares = currentPosition ? currentPosition.shares : 0;

  // Max shares calculation
  const maxBuyShares = effectivePrice > 0 ? Math.floor(cash / effectivePrice) : 0;
  const maxSellShares = ownedShares;

  const handlePercentageSelect = (pct) => {
    if (orderType === 'BUY') {
      const targetShares = Math.floor((cash * pct) / (effectivePrice || 1));
      setShares(targetShares > 0 ? targetShares.toString() : '1');
    } else {
      const targetShares = Math.floor(ownedShares * pct);
      setShares(targetShares > 0 ? targetShares.toString() : '0');
    }
  };

  const handleExecute = async (e) => {
    e.preventDefault();
    if (numShares <= 0) {
      toastError('Quantity must be greater than 0.');
      return;
    }

    if (orderType === 'BUY' && totalCost > cash) {
      toastError(`Insufficient cash balance (${formatCurrency(cash)}) to execute ${sym}${totalCost.toFixed(2)} order.`);
      return;
    }

    if (orderType === 'SELL' && numShares > ownedShares) {
      toastError(`You only own ${ownedShares} shares of ${ticker}.`);
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await stockApi.executeOrder(ticker, orderType, numShares);
      success(`${orderType === 'BUY' ? 'Bought' : 'Sold'} ${numShares} ${ticker} @ ${sym}${effectivePrice.toFixed(2)} — Order Executed`);
      if (onOrderSuccess) {
        onOrderSuccess(res);
      }
    } catch (err) {
      const msg = err.response?.data?.detail || err.message || 'Execution failed';
      toastError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-4 sm:p-5 rounded-lg border border-slate-800 light:border-slate-200 bg-[#0C0D0E] light:bg-white shadow-sm flex flex-col justify-between transition-colors">
      
      <div>
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800/80 light:border-slate-200 pb-3 mb-3.5">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-[#2962FF]/15 border border-[#2962FF]/30 flex items-center justify-center">
              <ShoppingCart className="w-3.5 h-3.5 text-[#2962FF]" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white light:text-slate-900 tracking-tight">
                Order Execution
              </h3>
              <p className="text-[11px] text-slate-400 light:text-[#065F46] font-mono">Market Order ({activeCurrency})</p>
            </div>
          </div>

          <span className="text-xs font-mono font-bold text-profit bg-profit-badge px-2 py-0.5 rounded-md">
            {ticker}
          </span>
        </div>

        {/* Buy / Sell Segmented Control */}
        <div className="grid grid-cols-2 p-1 bg-[#141517] light:bg-slate-100 rounded-md border border-slate-800 light:border-slate-300 mb-3.5">
          <button
            type="button"
            onClick={() => setOrderType('BUY')}
            className={`py-1.5 rounded text-xs font-mono font-bold transition-all cursor-pointer ${
              orderType === 'BUY'
                ? 'bg-profit-badge shadow-sm font-extrabold'
                : 'text-slate-400 light:text-slate-600 hover:text-white'
            }`}
          >
            BUY (Long)
          </button>
          <button
            type="button"
            onClick={() => setOrderType('SELL')}
            className={`py-1.5 rounded text-xs font-mono font-bold transition-all cursor-pointer ${
              orderType === 'SELL'
                ? 'bg-loss-badge shadow-sm font-extrabold'
                : 'text-slate-400 light:text-slate-600 hover:text-white'
            }`}
          >
            SELL (Close)
          </button>
        </div>

        {/* Form Fields */}
        <form onSubmit={handleExecute} className="space-y-3">
          
          {/* Shares Input with Stepper */}
          <div>
            <div className="flex justify-between text-xs text-slate-400 light:text-[#065F46] mb-1 font-mono">
              <span>Shares (Qty)</span>
              <span className="font-semibold text-slate-300 light:text-slate-800">
                {orderType === 'BUY' ? `Max: ${maxBuyShares}` : `Owned: ${ownedShares}`}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setShares(Math.max(1, numShares - 1).toString())}
                className="w-9 h-9 rounded-md bg-[#141517] light:bg-slate-100 hover:bg-slate-800 light:hover:bg-slate-200 border border-slate-700/80 light:border-slate-300 text-base font-bold font-mono text-slate-300 light:text-slate-800 transition-all flex items-center justify-center shrink-0 cursor-pointer"
              >
                -
              </button>
              <input
                ref={sharesInputRef}
                type="number"
                min="1"
                step="1"
                value={shares}
                onChange={(e) => setShares(e.target.value)}
                placeholder="1"
                className="w-full text-center bg-[#141517] light:bg-slate-100 border border-slate-700/80 light:border-slate-300 rounded-md px-3 py-1.5 text-white light:text-slate-900 font-mono font-bold text-sm focus:outline-none focus:border-[#2962FF] tabular-nums"
              />
              <button
                type="button"
                onClick={() => setShares((numShares + 1).toString())}
                className="w-9 h-9 rounded-md bg-[#141517] light:bg-slate-100 hover:bg-slate-800 light:hover:bg-slate-200 border border-slate-700/80 light:border-slate-300 text-base font-bold font-mono text-slate-300 light:text-slate-800 transition-all flex items-center justify-center shrink-0 cursor-pointer"
              >
                +
              </button>
            </div>
          </div>

          {/* Quick Lot Shortcuts */}
          <div className="grid grid-cols-4 gap-1.5">
            {[0.25, 0.5, 0.75, 1.0].map((pct) => (
              <button
                key={pct}
                type="button"
                onClick={() => handlePercentageSelect(pct)}
                className="text-[11px] font-mono py-1 rounded-md bg-[#141517] light:bg-slate-100 hover:bg-slate-800 light:hover:bg-slate-200 text-slate-300 light:text-slate-800 border border-slate-800 light:border-slate-300 transition-colors font-bold cursor-pointer"
              >
                {pct * 100}%
              </button>
            ))}
          </div>

          {/* Execution Cost Calculation */}
          <div className="bg-[#141517] light:bg-slate-100 rounded-md p-3 border border-slate-800 light:border-slate-300 space-y-1.5 text-xs font-mono">
            <div className="flex justify-between text-slate-400 light:text-slate-600">
              <span>Market Price:</span>
              <span className="text-white light:text-slate-900 font-bold tabular-nums">
                {sym}{effectivePrice.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between text-slate-400 light:text-slate-600">
              <span>Order Amount:</span>
              <span className={`font-bold tabular-nums ${orderType === 'BUY' ? 'text-profit' : 'text-loss'}`}>
                {sym}{totalCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between text-slate-500 border-t border-slate-800/80 light:border-slate-200 pt-1.5 text-[11px]">
              <span>Available Cash:</span>
              <span className="text-slate-300 light:text-slate-800 font-semibold tabular-nums">
                {formatCurrency(cash)}
              </span>
            </div>
          </div>

          {/* Action Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting || numShares <= 0}
            className={`w-full py-2.5 rounded-md font-bold font-mono text-sm tracking-wide transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer ${
              orderType === 'BUY'
                ? 'bg-[#00D09C] light:bg-[#2563EB] text-black light:text-white shadow-sm'
                : 'bg-[#EB5B5B] light:bg-[#DC2626] text-white shadow-sm'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isSubmitting ? (
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              <span>
                {orderType === 'BUY'
                  ? `BUY ${numShares || 0} ${ticker} (${sym}${totalCost.toFixed(2)})`
                  : `SELL ${numShares || 0} ${ticker} (${sym}${totalCost.toFixed(2)})`}
              </span>
            )}
          </button>

        </form>
      </div>

      {/* Safety info footer */}
      <div className="mt-3 pt-2.5 border-t border-slate-800/80 light:border-slate-200 text-[11px] text-slate-500 text-center font-mono">
        Paper Trading Mode • Instant Virtual Fill (Hotkeys: <span className="text-slate-400">B</span>)
      </div>

    </div>
  );
}
