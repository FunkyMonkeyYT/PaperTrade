import React from 'react';
import { History } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function TransactionHistory({ transactions = [] }) {
  const { formatCurrency, getCurrencySymbol } = useAuth();

  return (
    <div className="rounded-lg border border-slate-800/80 bg-[#111827] shadow-sm overflow-hidden transition-colors">
      <div className="px-4 py-3 border-b border-slate-800/80 flex items-center justify-between bg-[#161B26]">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-[#2962FF]" />
          <h3 className="text-xs sm:text-sm font-bold text-[#F9FAFB] uppercase tracking-wider font-mono">
            Transaction History & Trade Ledger
          </h3>
        </div>
        <span className="text-xs font-mono text-slate-400 font-semibold">
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
            <thead className="bg-[#161B26] text-slate-400 border-b border-slate-800/80 uppercase tracking-wider text-[11px] sticky top-0">
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
            <tbody className="divide-y divide-slate-800/50">
              {transactions.map((tx) => {
                const isBuy = tx.order_type === 'BUY';
                const formattedTime = new Date(tx.timestamp).toLocaleString();
                const sym = getCurrencySymbol(tx.ticker);

                return (
                  <tr key={tx.id} className="hover:bg-[#161B26]/60 transition-colors">
                    <td className="py-2.5 px-4 text-slate-400 text-[11px]">{formattedTime}</td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`font-bold px-2 py-0.5 rounded text-[11px] border ${
                          isBuy
                            ? 'bg-[#00D09C]/15 text-[#00D09C] border-[#00D09C]/30'
                            : 'bg-[#EB5B5B]/15 text-[#EB5B5B] border-[#EB5B5B]/30'
                        }`}
                      >
                        {tx.order_type}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-bold text-[#F9FAFB]">{tx.ticker}</td>
                    <td className="py-2.5 px-3 text-slate-300 text-right tabular-nums">{tx.shares}</td>
                    <td className="py-2.5 px-3 text-slate-400 text-right tabular-nums">{sym}{tx.execution_price.toFixed(2)}</td>
                    <td className="py-2.5 px-3 font-bold text-slate-200 text-right tabular-nums">
                      {formatCurrency(tx.total_value, tx.ticker)}
                    </td>
                    <td className="py-2.5 px-4 text-right font-bold tabular-nums">
                      {isBuy ? (
                        <span className="text-slate-500">-</span>
                      ) : (
                        <span className={tx.realized_pnl >= 0 ? 'text-[#00D09C]' : 'text-[#EB5B5B]'}>
                          {tx.realized_pnl >= 0 ? '+' : ''}{formatCurrency(tx.realized_pnl, tx.ticker)}
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
