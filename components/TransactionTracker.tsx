import React, { useState, useEffect } from 'react';
import { 
  Zap, ArrowRight, CreditCard, Wallet, Settings, X, Plus, Trash2,
  Utensils, Film, Car, ShoppingBag, FileText, MoreHorizontal, 
  Gamepad2, Shirt, HeartPulse, GraduationCap, Plane, Gift, Home,
  Edit2, Check, Briefcase, TrendingUp, AlertCircle
} from 'lucide-react';
import { Transaction, TransactionCategory, Holding, AssetType, CategoryDef, Currency } from '../types';

interface TransactionTrackerProps {
  transactions: Transaction[];
  onAddTransaction: (t: Omit<Transaction, 'id' | 'date'> & { date?: string }) => void;
  onUpdateTransaction: (id: string, t: Partial<Transaction>) => void;
  onDeleteTransaction: (id: string) => void;
  paymentAssets: Holding[];
  categories: CategoryDef[];
  onAddCategory: (cat: CategoryDef) => void;
  onUpdateCategory: (id: string, cat: Partial<CategoryDef>) => void;
  onDeleteCategory: (id: string) => void;
  displayCurrency: Currency;
  exchangeRate: number; // Rate to convert TWD (base) to display currency
}

// Icon Mapping for dynamic rendering
const ICON_MAP: Record<string, React.ReactNode> = {
  'Utensils': <Utensils size={16} />,
  'Film': <Film size={16} />,
  'Car': <Car size={16} />,
  'ShoppingBag': <ShoppingBag size={16} />,
  'FileText': <FileText size={16} />,
  'MoreHorizontal': <MoreHorizontal size={16} />,
  'Gamepad2': <Gamepad2 size={16} />,
  'Shirt': <Shirt size={16} />,
  'HeartPulse': <HeartPulse size={16} />,
  'GraduationCap': <GraduationCap size={16} />,
  'Plane': <Plane size={16} />,
  'Gift': <Gift size={16} />,
  'Home': <Home size={16} />,
  'Briefcase': <Briefcase size={16} />,
  'TrendingUp': <TrendingUp size={16} />,
};

const COLOR_OPTIONS = [
  'text-orange-400 bg-orange-400/10',
  'text-purple-400 bg-purple-400/10',
  'text-blue-400 bg-blue-400/10',
  'text-pink-400 bg-pink-400/10',
  'text-red-400 bg-red-400/10',
  'text-emerald-400 bg-emerald-400/10',
  'text-cyan-400 bg-cyan-400/10',
  'text-yellow-400 bg-yellow-400/10',
];

const CURRENCY_SYMBOLS: Record<Currency, string> = {
  'TWD': 'NT$',
  'USD': '$',
  'JPY': '¥'
};

const TransactionTracker: React.FC<TransactionTrackerProps> = ({ 
  transactions, 
  onAddTransaction, 
  onUpdateTransaction,
  onDeleteTransaction,
  paymentAssets,
  categories,
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory,
  displayCurrency,
  exchangeRate
}) => {
  const [smartInput, setSmartInput] = useState('');
  const [parsedData, setParsedData] = useState<{amount: number, note: string, category: TransactionCategory} | null>(null);
  const [selectedAssetId, setSelectedAssetId] = useState<string>(paymentAssets[0]?.id || '');
  const [transactionType, setTransactionType] = useState<'EXPENSE' | 'INCOME'>('EXPENSE');
  const [error, setError] = useState<string | null>(null);
  
  // Category Management State
  const [isManaging, setIsManaging] = useState(false);
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [newCatName, setNewCatName] = useState('');
  const [newCatKeywords, setNewCatKeywords] = useState('');
  const [newCatIcon, setNewCatIcon] = useState('MoreHorizontal');
  const [newCatColor, setNewCatColor] = useState(COLOR_OPTIONS[0]);

  // Transaction Edit State
  const [editingTxId, setEditingTxId] = useState<string | null>(null);
  const [editTxAmount, setEditTxAmount] = useState('');
  const [editTxNote, setEditTxNote] = useState('');
  const [editTxCategory, setEditTxCategory] = useState('');
  const [editTxDate, setEditTxDate] = useState('');
  const [editTxType, setEditTxType] = useState<'EXPENSE' | 'INCOME'>('EXPENSE');

  // Update selected asset if the list changes (e.g. initial load)
  useEffect(() => {
    if (!selectedAssetId && paymentAssets.length > 0) {
      setSelectedAssetId(paymentAssets[0].id);
    }
  }, [paymentAssets, selectedAssetId]);

  // Basic Regex Parsing
  useEffect(() => {
    if (!smartInput) {
      setParsedData(null);
      return;
    }

    // 1. Extract Number (Amount)
    const matchAmount = smartInput.match(/(\d+)/);
    const amount = matchAmount ? parseInt(matchAmount[0]) : 0;

    // 2. Extract Text (Note) - remove the number
    const note = smartInput.replace(/\d+/g, '').trim();

    // 3. Guess Category based on keywords (Dynamic)
    let category: TransactionCategory = '其他';
    if (note) {
      for (const cat of categories) {
        if (cat.keywords.some(k => note.toLowerCase().includes(k.toLowerCase()))) {
          category = cat.label;
          break;
        }
      }
    }

    if (amount > 0) {
      setParsedData({ amount, note: note || category, category });
      setError(null);
    } else {
      setParsedData(null);
    }
  }, [smartInput, categories]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation 1: No payment assets exist
    if (paymentAssets.length === 0) {
      setError("請先至左側「銀行與現金」或「信用卡」新增帳戶，才能開始記帳。");
      return;
    }

    // Validation 2: No asset selected
    if (!selectedAssetId) {
      setError("請選擇一個扣款或存入的帳戶。");
      return;
    }

    if (!parsedData) return;
    
    // Find asset name
    const asset = paymentAssets.find(a => a.id === selectedAssetId);

    onAddTransaction({
      type: transactionType,
      amount: parsedData.amount, // This is in Display Currency
      category: parsedData.category,
      note: parsedData.note,
      sourceAssetId: selectedAssetId,
      sourceAssetName: asset?.name,
    });

    setSmartInput('');
  };

  const handleCategorySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName) return;

    const keywords = newCatKeywords.split(/[,，\s]+/).filter(k => k.length > 0);
    
    if (editingCatId) {
      onUpdateCategory(editingCatId, {
        label: newCatName,
        icon: newCatIcon,
        color: newCatColor,
        keywords: keywords
      });
      setEditingCatId(null);
    } else {
      onAddCategory({
        id: Math.random().toString(36).substr(2, 9),
        label: newCatName,
        icon: newCatIcon,
        color: newCatColor,
        keywords: keywords
      });
    }

    // Reset Form
    setNewCatName('');
    setNewCatKeywords('');
    setNewCatIcon('MoreHorizontal');
    setNewCatColor(COLOR_OPTIONS[0]);
  };

  const startEditCategory = (cat: CategoryDef) => {
    setEditingCatId(cat.id);
    setNewCatName(cat.label);
    setNewCatKeywords(cat.keywords.join(', '));
    setNewCatIcon(cat.icon);
    setNewCatColor(cat.color);
  };

  const cancelEditCategory = () => {
    setEditingCatId(null);
    setNewCatName('');
    setNewCatKeywords('');
    setNewCatIcon('MoreHorizontal');
    setNewCatColor(COLOR_OPTIONS[0]);
  };

  const startEditTransaction = (tx: Transaction) => {
    setEditingTxId(tx.id);
    // Convert base amount to display amount for editing
    const displayAmount = Math.round(tx.amount * exchangeRate);
    setEditTxAmount(displayAmount.toString());
    setEditTxNote(tx.note);
    setEditTxCategory(tx.category);
    setEditTxType(tx.type || 'EXPENSE');
    // Format date for datetime-local input
    const date = new Date(tx.date);
    const dateString = new Date(date.getTime() - (date.getTimezoneOffset() * 60000))
                        .toISOString()
                        .slice(0, 16);
    setEditTxDate(dateString);
  };

  const saveEditTransaction = () => {
    if (!editingTxId) return;
    const amountInDisplay = parseFloat(editTxAmount) || 0;
    const amountInBase = amountInDisplay / exchangeRate;

    onUpdateTransaction(editingTxId, {
      type: editTxType,
      amount: amountInBase,
      note: editTxNote,
      category: editTxCategory,
      date: new Date(editTxDate).toISOString()
    });
    setEditingTxId(null);
  };

  return (
    <div className="bg-surface border border-border rounded-3xl p-6 shadow-lg h-full flex flex-col relative overflow-hidden">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <div className="bg-rose-500/10 p-2 rounded-lg text-rose-400">
             <Zap size={20} />
          </div>
          <h3 className="text-slate-200 font-bold text-lg">快速記帳</h3>
        </div>
        <button 
          onClick={() => setIsManaging(!isManaging)}
          className="p-2 text-slate-500 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          title="管理類別"
        >
          <Settings size={18} />
        </button>
      </div>

      {/* Transaction Edit Modal (Overlay) */}
      {editingTxId && (
        <div className="absolute inset-0 z-30 bg-surface/95 backdrop-blur-md p-4 flex flex-col animate-in fade-in duration-200 justify-center">
          <h4 className="font-bold text-white mb-4 text-center">編輯交易</h4>
          <div className="space-y-4 bg-slate-900 border border-slate-800 p-4 rounded-xl">
             <div className="flex gap-2 p-1 bg-slate-950 rounded-lg">
                <button type="button" onClick={() => setEditTxType('EXPENSE')} className={`flex-1 py-1.5 rounded-md text-sm transition-colors ${editTxType === 'EXPENSE' ? 'bg-rose-500 text-white' : 'text-slate-500'}`}>支出</button>
                <button type="button" onClick={() => setEditTxType('INCOME')} className={`flex-1 py-1.5 rounded-md text-sm transition-colors ${editTxType === 'INCOME' ? 'bg-emerald-500 text-white' : 'text-slate-500'}`}>收入</button>
             </div>
             <div>
                <label className="text-xs text-slate-500 block mb-1">金額 ({displayCurrency})</label>
                <input type="number" value={editTxAmount} onChange={e => setEditTxAmount(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-indigo-500 outline-none" />
             </div>
             <div>
                <label className="text-xs text-slate-500 block mb-1">備註</label>
                <input value={editTxNote} onChange={e => setEditTxNote(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-indigo-500 outline-none" />
             </div>
             <div>
                <label className="text-xs text-slate-500 block mb-1">類別</label>
                <select value={editTxCategory} onChange={e => setEditTxCategory(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-indigo-500 outline-none">
                   {categories.map(c => <option key={c.id} value={c.label}>{c.label}</option>)}
                </select>
             </div>
             <div>
                <label className="text-xs text-slate-500 block mb-1">時間</label>
                <input type="datetime-local" value={editTxDate} onChange={e => setEditTxDate(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-indigo-500 outline-none" />
             </div>
             <div className="flex gap-2 pt-2">
               <button onClick={() => setEditingTxId(null)} className="flex-1 py-2 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700">取消</button>
               <button onClick={saveEditTransaction} className="flex-1 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 font-bold">儲存</button>
             </div>
          </div>
        </div>
      )}

      {/* Category Management Overlay */}
      {isManaging && (
        <div className="absolute inset-0 z-20 bg-surface/95 backdrop-blur-md p-4 flex flex-col animate-in slide-in-from-right-10 duration-200">
          <div className="flex items-center justify-between mb-4">
             <h4 className="font-bold text-white">{editingCatId ? '編輯分類' : '管理分類'}</h4>
             <button onClick={() => { setIsManaging(false); cancelEditCategory(); }} className="p-1 hover:bg-slate-800 rounded text-slate-400"><X size={20}/></button>
          </div>
          
          {/* Add/Edit Category Form */}
          <form onSubmit={handleCategorySubmit} className="bg-slate-900 border border-slate-800 p-3 rounded-xl mb-4 space-y-3">
             <div className="flex gap-2">
                <input required value={newCatName} onChange={e => setNewCatName(e.target.value)} placeholder="類別名稱 (如: 遊戲)" className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-sm text-white focus:border-indigo-500 outline-none" />
                <div className="relative">
                   <select 
                     value={newCatIcon} 
                     onChange={e => setNewCatIcon(e.target.value)}
                     className="bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-sm text-white focus:border-indigo-500 outline-none appearance-none w-24"
                   >
                      {Object.keys(ICON_MAP).map(icon => <option key={icon} value={icon}>{icon}</option>)}
                   </select>
                </div>
             </div>
             
             <input value={newCatKeywords} onChange={e => setNewCatKeywords(e.target.value)} placeholder="關鍵字 (用逗號分隔: Steam, PS5)" className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-sm text-white focus:border-indigo-500 outline-none" />
             
             <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
                {COLOR_OPTIONS.map(color => (
                  <button 
                    key={color} 
                    type="button" 
                    onClick={() => setNewCatColor(color)}
                    className={`w-6 h-6 rounded-full flex-shrink-0 ${color.split(' ')[1].replace('/10', '')} ${newCatColor === color ? 'ring-2 ring-white' : ''}`}
                  />
                ))}
             </div>

             <div className="flex gap-2">
                {editingCatId && (
                  <button type="button" onClick={cancelEditCategory} className="flex-1 bg-slate-800 text-slate-400 py-1.5 rounded-lg text-sm font-medium hover:text-white">取消</button>
                )}
                <button type="submit" className={`flex-1 ${editingCatId ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-indigo-600 hover:bg-indigo-500'} text-white py-1.5 rounded-lg text-sm font-medium`}>
                  {editingCatId ? '更新類別' : '新增類別'}
                </button>
             </div>
          </form>

          {/* Existing Categories List */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
             {categories.map(cat => (
               <div key={cat.id} className="flex items-center justify-between p-2 rounded-lg bg-slate-800/50 border border-slate-700/50">
                  <div className="flex items-center gap-2 overflow-hidden">
                     <div className={`p-1.5 rounded-lg ${cat.color}`}>
                        {ICON_MAP[cat.icon] || <MoreHorizontal size={16}/>}
                     </div>
                     <div className="min-w-0">
                        <div className="text-sm font-medium text-slate-200 truncate">{cat.label}</div>
                        <div className="text-xs text-slate-500 truncate">{cat.keywords.join(', ')}</div>
                     </div>
                  </div>
                  <div className="flex items-center gap-1">
                     <button 
                      onClick={() => startEditCategory(cat)}
                      className="p-1.5 text-slate-500 hover:text-white hover:bg-slate-700 rounded transition-colors"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button 
                      onClick={() => onDeleteCategory(cat.id)}
                      className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-slate-700 rounded transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
               </div>
             ))}
          </div>
        </div>
      )}

      {/* Smart Input Form */}
      <form onSubmit={handleSubmit} className="mb-6 space-y-3">
        
        {/* Error Notification */}
        {error && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center gap-2 text-rose-400 text-sm animate-in fade-in slide-in-from-top-1">
             <AlertCircle size={16} />
             {error}
          </div>
        )}

        {/* Toggle Income/Expense */}
        <div className="flex gap-2 p-1 bg-slate-900 rounded-xl border border-slate-800">
           <button 
            type="button" 
            onClick={() => { setTransactionType('EXPENSE'); setError(null); }} 
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${transactionType === 'EXPENSE' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/50' : 'text-slate-500 hover:text-slate-300'}`}
           >
             支出
           </button>
           <button 
            type="button" 
            onClick={() => { setTransactionType('INCOME'); setError(null); }} 
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${transactionType === 'INCOME' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50' : 'text-slate-500 hover:text-slate-300'}`}
           >
             收入
           </button>
        </div>

        <div className="relative">
           <input
            type="text"
            value={smartInput}
            onChange={(e) => setSmartInput(e.target.value)}
            placeholder={`輸入：${transactionType === 'INCOME' ? '薪水 50000' : '午餐 150'} (自動判斷類別)`}
            className="w-full bg-slate-900 border border-slate-700 rounded-2xl py-4 pl-4 pr-16 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-base font-medium"
          />
          <div className="absolute right-2 top-2 bottom-2">
            <button 
                type="submit"
                disabled={!parsedData}
                className={`aspect-square h-full rounded-xl flex items-center justify-center transition-all ${parsedData ? (transactionType === 'INCOME' ? 'bg-emerald-600 text-white hover:bg-emerald-500' : 'bg-rose-600 text-white hover:bg-rose-500') : 'bg-slate-800 text-slate-600'}`}
            >
                <ArrowRight size={20} />
            </button>
          </div>
        </div>

        {/* Live Preview of Parsed Data */}
        <div className={`p-3 rounded-xl border border-dashed transition-all ${parsedData ? (transactionType === 'INCOME' ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-rose-500/50 bg-rose-500/5') : 'border-slate-800 bg-slate-900/50 opacity-50'}`}>
           {parsedData ? (
             <div className="flex items-center justify-between text-sm">
               <div className="flex items-center gap-2 flex-wrap">
                 <span className={`${transactionType === 'INCOME' ? 'text-emerald-400' : 'text-rose-400'} font-bold`}>
                   {CURRENCY_SYMBOLS[displayCurrency]}{parsedData.amount}
                 </span>
                 <span className="text-slate-400">|</span>
                 <span className="text-slate-200">{parsedData.note}</span>
                 <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 text-xs">{parsedData.category}</span>
               </div>
             </div>
           ) : (
             <div className="text-center text-xs text-slate-500">
               智慧判斷：輸入「麥當勞 150」或「薪水 40000」
             </div>
           )}
        </div>

        {/* Source Asset Selector */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
          {paymentAssets.length === 0 ? (
             <div className="text-xs text-slate-500 italic px-2">無可用帳戶，請先新增資產</div>
          ) : (
            paymentAssets.map(asset => (
               <button
                 key={asset.id}
                 type="button"
                 onClick={() => { setSelectedAssetId(asset.id); setError(null); }}
                 className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all flex items-center gap-1.5 ${
                   selectedAssetId === asset.id 
                   ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/20' 
                   : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                 }`}
               >
                 {asset.type === AssetType.CREDIT_CARD ? <CreditCard size={12} /> : <Wallet size={12} />}
                 {asset.name}
               </button>
            ))
          )}
        </div>
      </form>

      {/* Transaction List */}
      <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar max-h-[400px]">
        {transactions.length === 0 && (
            <div className="text-center text-slate-600 text-sm py-8">今天還沒有任何消費紀錄</div>
        )}
        {transactions.map((t) => {
          const catDef = categories.find(c => c.label === t.category) || categories[categories.length - 1]; // Fallback to 'Other'
          const isIncome = t.type === 'INCOME';
          const displayAmount = Math.round(t.amount * exchangeRate);

          return (
            <div
              key={t.id}
              className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 p-3 hover:bg-slate-800/40 rounded-xl transition-colors group cursor-pointer"
              onClick={() => startEditTransaction(t)}
            >
              <div className="flex items-center gap-3 w-full">
                <div className={`p-2.5 rounded-xl ${catDef?.color || 'text-slate-400 bg-slate-800'} transition-transform group-hover:scale-110`}>
                  {ICON_MAP[catDef?.icon || 'MoreHorizontal'] || ICON_MAP['MoreHorizontal']}
                </div>
                <div>
                  <p className="text-slate-200 text-sm font-medium">{t.note}</p>
                  <div className="flex items-center gap-2">
                     <p className="text-slate-500 text-xs">{new Date(t.date).toLocaleString([], {month:'numeric', day:'numeric', hour:'2-digit', minute:'2-digit'})}</p>
                     {t.sourceAssetName && <p className="text-indigo-400/60 text-xs px-1.5 py-0.5 bg-indigo-500/10 rounded">{t.sourceAssetName}</p>}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4 md:self-auto self-end">
                <div className="text-right">
                  <div className={`${isIncome ? 'text-emerald-400' : 'text-rose-400'} font-bold font-mono`}>
                    {isIncome ? '+' : '-'}{CURRENCY_SYMBOLS[displayCurrency]}{displayAmount.toLocaleString()}
                  </div>
                  <div className="text-[10px] text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity text-right">
                    點擊編輯
                  </div>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); onDeleteTransaction(t.id); }}
                  className="p-2 text-slate-600 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg hover:bg-slate-800"
                  title="刪除"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TransactionTracker;
