import React, { useState } from 'react';
import { Holding, AssetType, Currency } from '../types';
import { ChevronDown, ChevronUp, Edit2, Check, X, Wallet, TrendingUp, CreditCard, Plus, RefreshCw, Trash2, Clock, Loader2, Globe, Bitcoin } from 'lucide-react';
import { fetchStockPrice, MarketType } from '../services/yahooFinanceService';

interface AssetSectionProps {
  title: string;
  type: 'CASH' | 'INVESTMENT' | 'CREDIT';
  holdings: Holding[];
  onUpdateHolding: (id: string, updates: Partial<Holding>) => void;
  onAddHolding: (holding: Omit<Holding, 'id'>) => void;
  onRemoveHolding?: (id: string) => void;
  onRefreshPrices?: () => void;
  totalValue: number;
  displayCurrency?: Currency; // New prop
}

const CURRENCY_SYMBOLS: Record<Currency, string> = {
  'TWD': 'NT$',
  'USD': '$',
  'JPY': '¥'
};

const AssetSection: React.FC<AssetSectionProps> = ({ 
  title, 
  type, 
  holdings, 
  onUpdateHolding, 
  onAddHolding, 
  onRemoveHolding,
  onRefreshPrices,
  totalValue,
  displayCurrency = 'TWD'
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Edit States
  const [editName, setEditName] = useState('');
  const [editAmount, setEditAmount] = useState(''); 
  const [editBillDay, setEditBillDay] = useState('');

  // Add States
  const [marketType, setMarketType] = useState<MarketType>('TW');
  const [newName, setNewName] = useState('');
  const [newTicker, setNewTicker] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newPrice, setNewPrice] = useState(''); 
  const [newBillDay, setNewBillDay] = useState('');

  const startEdit = (h: Holding) => {
    setEditingId(h.id);
    setEditName(h.name);
    setEditAmount(h.quantity.toString());
    setEditBillDay(h.billDay ? h.billDay.toString() : '');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName('');
    setEditAmount('');
    setEditBillDay('');
  };

  const saveEdit = (id: string) => {
    onUpdateHolding(id, {
      name: editName,
      quantity: parseFloat(editAmount) || 0,
      billDay: type === 'CREDIT' ? (parseInt(editBillDay) || undefined) : undefined
    });
    setEditingId(null);
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    
    try {
      let assetType = AssetType.OTHER;
      if (type === 'CASH') assetType = AssetType.CASH;
      if (type === 'INVESTMENT') {
        if (marketType === 'CRYPTO') assetType = AssetType.CRYPTO;
        else assetType = AssetType.STOCK;
      }
      if (type === 'CREDIT') assetType = AssetType.CREDIT_CARD;

      let finalPrice = type === 'INVESTMENT' ? (parseFloat(newPrice) || 0) : 1;
      let finalName = newName;
      let finalCurrency: Currency = 'TWD';
      let finalTicker = type === 'INVESTMENT' ? newTicker.toUpperCase() : 'TWD';

      if (type === 'INVESTMENT') {
        const result = await fetchStockPrice(finalTicker, marketType);
        if (result) {
          finalPrice = result.price;
          // Yahoo returns 'USD', 'TWD', etc. We map strictly to our Currency type if possible, or fallback to TWD/USD
          if (['TWD', 'USD', 'JPY'].includes(result.currency)) {
             finalCurrency = result.currency as Currency;
          } else {
             // Fallback logic for cryptos or others
             finalCurrency = 'USD'; 
          }
          // If name is empty, use ticker
          if (!finalName) {
            finalName = finalTicker;
          }
        } else {
          // Fetch failed
          alert(`無法取得代號 ${finalTicker} 的價格，請檢查代號或市場類型。`);
          setIsSubmitting(false);
          return;
        }
      }

      const newAsset: Omit<Holding, 'id'> = {
        name: finalName,
        type: assetType,
        quantity: parseFloat(newAmount) || 0,
        price: finalPrice,
        currency: finalCurrency,
        ticker: finalTicker,
        change24h: 0,
        color: getRandomColor(),
        billDay: type === 'CREDIT' ? parseInt(newBillDay) : undefined
      };

      onAddHolding(newAsset);
      setIsAdding(false);
      // Reset
      setNewName('');
      setNewTicker('');
      setNewAmount('');
      setNewPrice('');
      setNewBillDay('');
      setMarketType('TW'); // Reset to default
    } catch (error) {
      console.error("Error adding asset:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRandomColor = () => {
    const colors = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#f43f5e', '#06b6d4'];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  const getIcon = () => {
    switch (type) {
      case 'CASH': return <Wallet size={20} />;
      case 'INVESTMENT': return <TrendingUp size={20} />;
      case 'CREDIT': return <CreditCard size={20} />;
      default: return <Wallet size={20} />;
    }
  };

  const getColorClass = () => {
    switch (type) {
      case 'CASH': return 'bg-indigo-500/20 text-indigo-400';
      case 'INVESTMENT': return 'bg-rose-500/20 text-rose-400';
      case 'CREDIT': return 'bg-orange-500/20 text-orange-400';
      default: return 'bg-slate-700 text-slate-300';
    }
  };

  return (
    <div className="bg-surface border border-border rounded-3xl overflow-hidden shadow-lg transition-all duration-300 relative">
      
      {/* Header */}
      <div 
        className="flex items-center justify-between p-4 md:p-6 bg-slate-900/50 hover:bg-slate-800/50 transition-colors cursor-pointer select-none"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className={`p-2 rounded-xl flex-shrink-0 ${getColorClass()}`}>
             {getIcon()}
          </div>
          <h3 className="text-slate-200 font-bold text-lg truncate pr-2">{title}</h3>
        </div>

        <div className="flex items-center gap-2 md:gap-4 flex-shrink-0">
          {/* Action Buttons */}
          <div className="flex items-center gap-1 md:gap-2 md:mr-4">
             {type === 'INVESTMENT' && onRefreshPrices && (
                <button 
                  onClick={(e) => { e.stopPropagation(); onRefreshPrices(); }}
                  className="p-2 md:px-3 md:py-2 text-slate-400 hover:text-white hover:bg-slate-700 bg-slate-800/50 rounded-lg transition-colors border border-slate-700/50"
                  title="更新股價"
                >
                  <RefreshCw size={16} />
                </button>
             )}
             <button 
               onClick={(e) => { e.stopPropagation(); setIsAdding(true); }}
               className="p-2 md:px-3 md:py-2 text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors shadow-lg shadow-indigo-600/20"
               title="新增項目"
             >
               <Plus size={16} />
             </button>
          </div>

          <div className="text-right hidden sm:block">
            <span className={`font-bold tracking-tight text-lg block leading-none ${totalValue < 0 ? 'text-rose-400' : 'text-white'}`}>
              {CURRENCY_SYMBOLS[displayCurrency]}
              {Math.abs(totalValue).toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </span>
          </div>
          {/* Mobile Value (Compact) */}
           <div className="text-right sm:hidden">
            <span className={`font-bold tracking-tight text-base block leading-none ${totalValue < 0 ? 'text-rose-400' : 'text-white'}`}>
              {CURRENCY_SYMBOLS[displayCurrency]}{Math.abs(totalValue).toLocaleString(undefined, { maximumFractionDigits: 0, notation: "compact" })}
            </span>
          </div>

          <div>
             {isCollapsed ? <ChevronDown size={20} className="text-slate-500" /> : <ChevronUp size={20} className="text-slate-500" />}
          </div>
        </div>
      </div>

      {/* Add Modal (Inline) */}
      {isAdding && (
        <div className="p-4 bg-slate-800/50 border-t border-b border-indigo-500/30 animate-in fade-in slide-in-from-top-2">
           <form onSubmit={handleAddSubmit} className="flex flex-col gap-3">
              
              {/* Market Selector for Investment */}
              {type === 'INVESTMENT' && (
                <div className="flex gap-2 p-1 bg-slate-950 rounded-xl border border-slate-800 mb-1">
                   <button 
                     type="button" 
                     onClick={() => setMarketType('TW')} 
                     className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1 ${marketType === 'TW' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-300'}`}
                   >
                     <TrendingUp size={14}/> 台股
                   </button>
                   <button 
                     type="button" 
                     onClick={() => setMarketType('US')} 
                     className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1 ${marketType === 'US' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-300'}`}
                   >
                     <Globe size={14}/> 美股
                   </button>
                   <button 
                     type="button" 
                     onClick={() => setMarketType('CRYPTO')} 
                     className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1 ${marketType === 'CRYPTO' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-300'}`}
                   >
                     <Bitcoin size={14}/> 加密貨幣
                   </button>
                </div>
              )}

              <div className="flex gap-3">
                 {type === 'INVESTMENT' ? (
                   // Investment Layout: Ticker First, Name Optional
                   <>
                     <input required autoFocus value={newTicker} onChange={e => setNewTicker(e.target.value)} placeholder={marketType === 'TW' ? "代號 (如: 2330)" : (marketType === 'US' ? "代號 (如: TSLA)" : "代號 (如: BTC)")} className="w-1/3 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:border-indigo-500 outline-none" />
                     <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="名稱 (選填)" className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:border-indigo-500 outline-none" />
                   </>
                 ) : (
                   // Standard Layout: Name First
                   <input required autoFocus value={newName} onChange={e => setNewName(e.target.value)} placeholder="名稱 (如: 國泰世華)" className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:border-indigo-500 outline-none" />
                 )}
              </div>
              
              <div className="flex gap-3">
                 <input required type="number" value={newAmount} onChange={e => setNewAmount(e.target.value)} placeholder={type === 'INVESTMENT' ? "股數" : "金額 (負值代表欠款)"} className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:border-indigo-500 outline-none" />
                 
                 {/* Hide Manual Price Input for Investment to enforce auto-fetch */}
                 {type !== 'INVESTMENT' && type !== 'CREDIT' && type !== 'CASH' && (
                    <input required type="number" value={newPrice} onChange={e => setNewPrice(e.target.value)} placeholder="現價" className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:border-indigo-500 outline-none" />
                 )}
                 
                 {type === 'CREDIT' && (
                    <input type="number" min="1" max="31" value={newBillDay} onChange={e => setNewBillDay(e.target.value)} placeholder="繳款日 (1-31)" className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:border-indigo-500 outline-none" />
                 )}
              </div>
              
              {type === 'INVESTMENT' && (
                <div className="text-xs text-slate-500 px-1">
                  * 系統將自動取得最新股價與幣別
                </div>
              )}

              <div className="flex justify-end gap-2 mt-1">
                 <button type="button" onClick={() => setIsAdding(false)} disabled={isSubmitting} className="px-3 py-1.5 text-xs text-slate-400 hover:text-white">取消</button>
                 <button type="submit" disabled={isSubmitting} className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold flex items-center gap-2">
                    {isSubmitting && <Loader2 size={12} className="animate-spin" />}
                    確認新增
                 </button>
              </div>
           </form>
        </div>
      )}

      {/* List */}
      {!isCollapsed && (
        <div className="p-2 space-y-1 bg-slate-950/30 border-t border-border">
          {holdings.length === 0 && (
             <div className="text-center py-4 text-slate-600 text-sm">尚無項目，請點擊上方 + 新增</div>
          )}
          {holdings.map((h) => {
             const isEditing = editingId === h.id;
             const val = h.price * h.quantity; 

             return (
               <div 
                  key={h.id} 
                  className="group flex items-center justify-between p-3 rounded-xl hover:bg-slate-800/40 transition-colors active:bg-slate-800/40"
               >
                 
                 <div className="flex items-center gap-3 flex-1 min-w-0 pr-2">
                    <div className="w-1 h-8 rounded-full flex-shrink-0" style={{ backgroundColor: h.color }} />
                    
                    {isEditing ? (
                      <div className="flex flex-col gap-2 w-full max-w-[200px]">
                        <input 
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="bg-slate-800 text-white text-sm px-2 py-1 rounded border border-slate-700 focus:border-indigo-500 outline-none w-full"
                          placeholder="名稱"
                        />
                        {type === 'CREDIT' && (
                          <div className="flex items-center gap-2">
                             <span className="text-xs text-slate-500 whitespace-nowrap">繳款日:</span>
                             <input 
                                type="number"
                                min="1" max="31"
                                value={editBillDay}
                                onChange={(e) => setEditBillDay(e.target.value)}
                                className="bg-slate-800 text-white text-xs px-2 py-1 rounded border border-slate-700 focus:border-indigo-500 outline-none w-16"
                                placeholder="日"
                             />
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-slate-200 font-medium text-sm truncate">{h.name}</span>
                          {h.ticker && h.ticker !== 'TWD' && (
                            <span className="text-[10px] text-slate-500 bg-slate-900 px-1.5 py-0.5 rounded font-mono whitespace-nowrap">
                              {h.ticker}
                            </span>
                          )}
                        </div>
                        <div className="text-slate-500 text-xs flex items-center gap-2 mt-0.5 truncate">
                          <span className="truncate">{type === 'CREDIT' && h.billDay ? `每月 ${h.billDay} 號繳款` : h.type}</span>
                          {/* Last Updated Timestamp */}
                          {h.lastUpdated && (
                            <span className="flex items-center gap-1 text-[10px] text-slate-600 ml-1 whitespace-nowrap">
                              • <Clock size={10} /> {new Date(h.lastUpdated).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                 </div>

                 <div className="flex items-center gap-2 md:gap-4 flex-shrink-0 ml-1">
                    {isEditing ? (
                       <div className="text-right">
                          <input 
                            type="number"
                            value={editAmount}
                            onChange={(e) => setEditAmount(e.target.value)}
                            className="bg-slate-800 text-white text-sm px-2 py-1 rounded border border-slate-700 focus:border-indigo-500 outline-none w-20 text-right"
                          />
                          <div className="text-xs text-slate-500 mt-1 text-right">{type === 'INVESTMENT' ? '股數' : '餘額'}</div>
                       </div>
                    ) : (
                      <div className="text-right min-w-[70px]">
                        <div className={`font-medium text-sm whitespace-nowrap ${val < 0 ? 'text-rose-400' : 'text-slate-200'}`}>
                          {/* Display Native Currency Symbol if possible, default to NT$ if TWD */}
                          {h.currency === 'USD' ? '$' : (h.currency === 'JPY' ? '¥' : 'NT$')}
                          {val.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </div>
                        {type === 'INVESTMENT' && (
                          <div className="text-slate-500 text-xs whitespace-nowrap">{h.quantity} 股</div>
                        )}
                        {type === 'CREDIT' && (
                          <div className="text-slate-500 text-xs whitespace-nowrap">目前卡費</div>
                        )}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-1 items-center">
                      {isEditing ? (
                        <>
                          <button onClick={() => saveEdit(h.id)} className="p-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg hover:bg-emerald-500/30"><Check size={16} /></button>
                          <button onClick={cancelEdit} className="p-1.5 bg-rose-500/20 text-rose-400 rounded-lg hover:bg-rose-500/30"><X size={16} /></button>
                        </>
                      ) : (
                        <>
                          <button 
                            onClick={(e) => { e.stopPropagation(); startEdit(h); }} 
                            className="p-2 text-slate-600 hover:text-white md:opacity-0 md:group-hover:opacity-100 transition-opacity active:opacity-100"
                          >
                            <Edit2 size={16} />
                          </button>
                          {onRemoveHolding && (
                            <button 
                              onClick={(e) => { e.stopPropagation(); onRemoveHolding(h.id); }} 
                              className="p-2 text-slate-600 hover:text-rose-400 md:opacity-0 md:group-hover:opacity-100 transition-opacity active:opacity-100"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </>
                      )}
                    </div>
                 </div>
               </div>
             );
          })}
        </div>
      )}
    </div>
  );
};

export default AssetSection;