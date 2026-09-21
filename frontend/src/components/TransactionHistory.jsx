import React from 'react';
import { History } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function TransactionHistory({ transactions = [], portfolioCurrency = 'USD' }) {
  const { formatCurrency, getCurrencySymbol, getCurrencyFromTicker, convertFx } = useAuth();

  return (
    <div className="rounded-lg border border-slate-200 bg-white shadow-sm overflow-hidden transition-colors">
      <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between bg-slate-50">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-[#2563EB]" />
          <h3 className="text-xs sm:text-sm font-bold text-slate-900 uppercase tracking-wider font-mono">
            Transaction History & Trade Ledger
          </h3>
        </div>
        <span className="text-xs font-mono text-slate-500 font-semibold">
          {transactions.length} Trade{transactions.length === 1 ? '' : 's'}
        </span>
      </div>

      {transactions.length === 0 ? (
        <div className="p-10 text-center text-slate-500 font-mono text-xs">
          No trading transactions recorded in this account yet.
        </div>
      ) : (
        <div className="overflow-x-auto max-h-96 overflow-y-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 uppercase tracking-wider text-[11px] sticky top-0">
              <tr>
                <th className="py-2.5 px-4">Timestamp</th>
                <th className="py-2.5 px-3">Action</th>
                <th className="py-2.5 px-3">Ticker</th>
                <th className="py-2.5 px-3 text-right">Quantity</th>
                <th className="py-2.5 px-3 text-right">Exec Price</th>
                <th className="py-2.5 px-3 text-right">Total Value</th>
                <th className="py-2.5 px-4 text-right">Realized P&L</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {transactions.map((tx) => {
                const isBuy = tx.order_type === 'BUY';
                const formattedTime = new Date(tx.timestamp).toLocaleString();
                const txTickerCurr = getCurrencyFromTicker(tx.ticker);
                const sym = getCurrencySymbol(tx.ticker);

                const execPrice = convertFx(tx.execution_price, portfolioCurrency, txTickerCurr);
                const totalVal = convertFx(tx.total_value, portfolioCurrency, txTickerCurr);
                const realizedPnl = convertFx(tx.realized_pnl, portfolioCurrency, txTickerCurr);

                return (
                  <tr key={tx.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2.5 px-4 text-slate-500 text-[11px]">{formattedTime}</td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`font-bold px-2 py-0.5 rounded text-[11px] border ${
                          isBuy
                            ? 'bg-[#16A34A]/15 text-[#16A34A] border-[#16A34A]/30'
                            : 'bg-[#DC2626]/15 text-[#DC2626] border-[#DC2626]/30'
                        }`}
                      >
                        {tx.order_type}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-bold text-slate-900">{tx.ticker}</td>
                    <td className="py-2.5 px-3 text-slate-700 text-right tabular-nums">{tx.shares}</td>
                    <td className="py-2.5 px-3 text-slate-600 text-right tabular-nums">{sym}{execPrice.toFixed(2)}</td>
                    <td className="py-2.5 px-3 font-bold text-slate-800 text-right tabular-nums">
                      {sym}{totalVal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="py-2.5 px-4 text-right font-bold tabular-nums">
                      {isBuy ? (
                        <span className="text-slate-400">-</span>
                      ) : (
                        <span className={tx.realized_pnl >= 0 ? 'text-[#16A34A]' : 'text-[#DC2626]'}>
                          {tx.realized_pnl >= 0 ? '+' : ''}{sym}{realizedPnl.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
