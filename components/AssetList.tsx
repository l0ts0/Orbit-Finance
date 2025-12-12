import React, { useState } from 'react';
import { Holding, Currency, AssetType } from '../types';
import { Plus, Wallet, TrendingUp, Bitcoin, Building2, Trash2 } from 'lucide-react';

interface AssetListProps {
  holdings: Holding[];
  onAddAsset: (asset: Omit<Holding, 'id'>) => void;
  onRemoveAsset: (id: string) => void;
  exchangeRate: number;
}

const AssetList: React.FC<AssetListProps> = ({ holdings, onAddAsset, onRemoveAsset, exchangeRate }) => {
  const [isAdding, setIsAdding] = useState(false);
  
  // Form State
  const [newType, setNewType] = useState<AssetType>(AssetType.CASH);
  const [newName, setNewName] = useState('');
  const [newTicker, setNewTicker] = useState('');
  const [newAmount, setNewAmount] = useState(''); // Balance for Cash, Qty for Stock
  const [newPrice, setNewPrice] = useState(''); // Only for Stock

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newAmount) return;

    const isCash = newType === AssetType.CASH;
    
    const asset: Omit<Holding, 'id'> = {
      name: newName,
      type: newType,
      ticker: isCash ? 'TWD' : newTicker.toUpperCase(),
      quantity: parseFloat(newAmount),
      price: isCash ? 1 : (parseFloat(newPrice) || 0),
      currency: isCash ? 'TWD' : 'TWD', // Simplified for demo
      change24h: 0,
      color: getRandomColor()
    };

    onAddAsset(asset);
    setIsAdding(false);
    resetForm();
  };

  const resetForm = () => {
    setNewName('');
    setNewTicker('');
    setNewAmount('');
    setNewPrice('');
  };

  const getRandomColor = () => {
    const colors = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#f43f5e', '#06b6d4'];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  const getIcon = (type: AssetType) => {
    switch (type) {
      case AssetType.CASH: return <Building2 size={18} />;
      case AssetType.STOCK: return <TrendingUp size={18} />;
      case AssetType.CRYPTO: return <Bitcoin size={18} />;
      default: return <Wallet size={18} />;
    }
  };

  return (
    <div className="bg-surface border border-border rounded-3xl p-6 shadow-lg flex flex-col h-full">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-slate-200 font-bold text-lg">我的資產</h3>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition-all shadow-lg shadow-indigo-600/20"
        >
          <Plus size={16} />
          新增
        </button>
      </div>

      {/* Add Asset Form Modal Overlay */}
      {isAdding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 p-6 rounded-3xl w-full max-w-md shadow-2xl">
            <h4 className="text-xl font-bold text-white mb-4">新增資產</h4>
            <form onSubmit={handleAdd} className="space-y-4">
              
              <div>
                <label className="text-slate-400 text-xs uppercase font-semibold mb-1 block">資產類型</label>
                <div className="flex gap-2 p-1 bg-slate-950 rounded-xl border border-slate-800">
                  <button type="button" onClick={() => setNewType(AssetType.CASH)} className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${newType === AssetType.CASH ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-300'}`}>銀行/現金</button>
                  <button type="button" onClick={() => setNewType(AssetType.STOCK)} className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${newType === AssetType.STOCK ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-300'}`}>股票</button>
                  <button type="button" onClick={() => setNewType(AssetType.CRYPTO)} className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${newType === AssetType.CRYPTO ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-300'}`}>加密幣</button>
                </div>
              </div>

              <div>
                <label className="text-slate-400 text-xs uppercase font-semibold mb-1 block">名稱</label>
                <input required value={newName} onChange={e => setNewName(e.target.value)} placeholder={newType === AssetType.CASH ? "例如：中國信託" : "例如：台積電"} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-indigo-500 outline-none" />
              </div>

              {newType !== AssetType.CASH && (
                <div>
                  <label className="text-slate-400 text-xs uppercase font-semibold mb-1 block">代號 (Ticker)</label>
                  <input value={newTicker} onChange={e => setNewTicker(e.target.value)} placeholder="例如：2330" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-indigo-500 outline-none" />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-slate-400 text-xs uppercase font-semibold mb-1 block">{newType === AssetType.CASH ? '金額' : '股數/數量'}</label>
                  <input required type="number" value={newAmount} onChange={e => setNewAmount(e.target.value)} placeholder="0" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-indigo-500 outline-none" />
                </div>
                {newType !== AssetType.CASH && (
                  <div>
                    <label className="text-slate-400 text-xs uppercase font-semibold mb-1 block">目前市價</label>
                    <input required type="number" value={newPrice} onChange={e => setNewPrice(e.target.value)} placeholder="0" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-indigo-500 outline-none" />
                  </div>
                )}
              </div>

              <div className="flex gap-3 mt-6">
                <button type="button" onClick={() => setIsAdding(false)} className="flex-1 py-3 bg-slate-800 text-slate-300 rounded-xl font-medium hover:bg-slate-700">取消</button>
                <button type="submit" className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-500">確認新增</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Asset List */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
        {holdings.map((h) => {
          const totalValue = h.price * h.quantity;
          
          return (
            <div key={h.id} className="group relative flex items-center justify-between p-4 bg-slate-900/50 border border-slate-800/50 rounded-2xl hover:border-indigo-500/30 transition-all">
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg`} style={{ backgroundColor: h.color || '#64748b' }}>
                  {getIcon(h.type)}
                </div>
                <div>
                  <h4 className="text-slate-200 font-bold">{h.name}</h4>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 bg-slate-800 px-1.5 py-0.5 rounded">{h.type}</span>
                    {h.ticker && h.ticker !== 'TWD' && <span className="text-xs text-slate-500">{h.ticker}</span>}
                  </div>
                </div>
              </div>
              
              <div className="text-right">
                <div className="text-white font-bold tracking-tight">
                  NT${totalValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </div>
                {h.type !== AssetType.CASH && (
                  <div className="text-xs text-slate-500">
                    {h.quantity} 股 @ {h.price}
                  </div>
                )}
              </div>

              <button 
                onClick={() => onRemoveAsset(h.id)}
                className="absolute right-2 top-2 p-2 text-slate-600 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AssetList;