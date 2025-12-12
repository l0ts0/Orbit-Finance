import React from 'react';
import { Holding, Currency } from '../types';
import { ArrowUp, ArrowDown, RefreshCw } from 'lucide-react';

interface HoldingsTableProps {
  holdings: Holding[];
  displayCurrency: Currency;
  exchangeRate: number; // TWD per USD
  onRefresh: () => void;
  isRefreshing: boolean;
}

const HoldingsTable: React.FC<HoldingsTableProps> = ({ holdings, displayCurrency, exchangeRate, onRefresh, isRefreshing }) => {
  
  const convertPrice = (price: number, assetCurrency: Currency): number => {
    if (displayCurrency === assetCurrency) return price;
    if (displayCurrency === 'TWD' && assetCurrency === 'USD') return price * exchangeRate;
    if (displayCurrency === 'USD' && assetCurrency === 'TWD') return price / exchangeRate;
    return price;
  };

  return (
    <div className="bg-surface border border-border rounded-3xl p-6 shadow-lg overflow-hidden">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-slate-200 font-semibold text-lg">Holdings</h3>
        <button 
          onClick={onRefresh}
          className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm font-medium transition-all"
        >
          <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
          Refresh Prices
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border text-left">
              <th className="pb-3 pl-2 text-slate-500 font-medium text-xs uppercase tracking-wider">Asset</th>
              <th className="pb-3 text-right text-slate-500 font-medium text-xs uppercase tracking-wider">Price</th>
              <th className="pb-3 text-right text-slate-500 font-medium text-xs uppercase tracking-wider">Balance</th>
              <th className="pb-3 text-right text-slate-500 font-medium text-xs uppercase tracking-wider pr-2">24h</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {holdings.map((h) => {
              const currentPrice = convertPrice(h.price, h.currency);
              const totalValue = currentPrice * h.quantity;
              const isPositive = h.change24h >= 0;

              return (
                <tr key={h.id} className="group hover:bg-slate-800/30 transition-colors">
                  <td className="py-4 pl-2">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-300 border border-slate-700">
                        {h.ticker.substring(0, 2)}
                      </div>
                      <div>
                        <div className="text-slate-200 font-medium">{h.ticker}</div>
                        <div className="text-slate-500 text-xs">{h.name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 text-right">
                    <div className="text-slate-200 font-medium">
                      {displayCurrency === 'USD' ? '$' : 'NT$'}{currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                  </td>
                  <td className="py-4 text-right">
                    <div className="text-slate-200 font-medium">
                      {displayCurrency === 'USD' ? '$' : 'NT$'}{totalValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </div>
                    <div className="text-slate-500 text-xs">{h.quantity.toLocaleString()} units</div>
                  </td>
                  <td className="py-4 text-right pr-2">
                    <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold ${isPositive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                      {isPositive ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
                      {Math.abs(h.change24h).toFixed(2)}%
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default HoldingsTable;