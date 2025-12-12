import React from 'react';
import { Currency } from '../types';
import { ArrowUpRight, DollarSign, RefreshCw, Eye, EyeOff, ChevronDown, RotateCcw, Clock, TrendingUp } from 'lucide-react';

interface NetWorthCardProps {
  totalValue: number;
  currency: Currency;
  onChangeCurrency: (currency: Currency) => void;
  isRefreshing: boolean;
  onRefreshRates?: () => void;
  ratesLastUpdated?: number | null;
  rates?: Record<Currency, number>;
}

const CURRENCY_LABELS: Record<Currency, string> = {
  'TWD': 'NT$',
  'USD': 'USD $',
  'JPY': 'JPY ¥',
};

const NetWorthCard: React.FC<NetWorthCardProps> = ({ 
  totalValue, 
  currency, 
  onChangeCurrency, 
  isRefreshing, 
  onRefreshRates, 
  ratesLastUpdated,
  rates 
}) => {
  
  // Calculate display rates (Base TWD)
  // rates['USD'] is how many USD for 1 TWD. So 1 USD = 1 / rates['USD'] TWD.
  const usdTwd = rates ? (1 / rates['USD']) : 0;
  const jpyTwd = rates ? (1 / rates['JPY']) : 0;

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-800 to-slate-950 p-8 shadow-2xl border border-slate-700/50">
      
      <div className="relative z-10 flex flex-col h-full justify-between">
        <div>
          <h2 className="text-slate-400 text-sm font-medium tracking-widest mb-1">總淨資產 ({currency})</h2>
          <div className="flex items-baseline gap-2">
            <span className="text-5xl font-bold text-white tracking-tight font-sans">
              {CURRENCY_LABELS[currency].split(' ')[1] || '$'}
              {totalValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-4">
            <div className="flex items-center gap-1 bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full text-sm font-semibold">
              <ArrowUpRight size={16} />
              <span>1.8%</span>
            </div>
            <span className="text-slate-500 text-sm">今日增長</span>
          </div>
        </div>

        <div className="flex flex-col gap-3 mt-8">
          
          {/* Exchange Rate Tickers */}
          {rates && (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 bg-slate-900/40 px-3 py-1.5 rounded-lg border border-slate-700/30 backdrop-blur-sm">
                <div className="w-5 h-5 rounded-full bg-blue-500/20 flex items-center justify-center text-[10px] text-blue-400 font-bold">$</div>
                <div className="flex flex-col leading-none">
                  <span className="text-[10px] text-slate-500 font-medium">USD/TWD</span>
                  <span className="text-xs text-slate-200 font-mono font-medium">{usdTwd.toFixed(2)}</span>
                </div>
              </div>
              <div className="flex items-center gap-1.5 bg-slate-900/40 px-3 py-1.5 rounded-lg border border-slate-700/30 backdrop-blur-sm">
                 <div className="w-5 h-5 rounded-full bg-rose-500/20 flex items-center justify-center text-[10px] text-rose-400 font-bold">¥</div>
                 <div className="flex flex-col leading-none">
                  <span className="text-[10px] text-slate-500 font-medium">JPY/TWD</span>
                  <span className="text-xs text-slate-200 font-mono font-medium">{jpyTwd.toFixed(4)}</span>
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="relative">
                <select
                  value={currency}
                  onChange={(e) => onChangeCurrency(e.target.value as Currency)}
                  className="appearance-none bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl pl-4 pr-10 py-2 border border-slate-700 outline-none focus:border-indigo-500 transition-colors cursor-pointer text-sm font-medium min-w-[140px]"
                >
                  <option value="TWD">TWD (NT$)</option>
                  <option value="USD">USD ($)</option>
                  <option value="JPY">JPY (¥)</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" size={16} />
              </div>

              {onRefreshRates && (
                <button 
                  onClick={onRefreshRates}
                  disabled={isRefreshing}
                  className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-indigo-400 rounded-xl border border-slate-700 transition-all disabled:opacity-50"
                  title="更新即時匯率"
                >
                  <RotateCcw size={20} className={isRefreshing ? 'animate-spin' : ''} />
                </button>
              )}
            </div>
            
            {isRefreshing && (
              <div className="flex items-center gap-2 text-indigo-400 text-sm animate-pulse ml-auto">
                <RefreshCw size={14} className="animate-spin" />
                更新行情中...
              </div>
            )}
          </div>

          {/* Last Updated Timestamp */}
          {ratesLastUpdated && (
             <div className="flex items-center gap-1.5 text-xs text-slate-500 ml-1">
               <Clock size={12} />
               <span>匯率更新於: {new Date(ratesLastUpdated).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
             </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NetWorthCard;