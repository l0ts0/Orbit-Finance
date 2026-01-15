import React, { useState, useEffect } from 'react';
import {
  Zap, ArrowRight, CreditCard, Wallet, Settings, X, Plus, Trash2,
  Edit2, Check, AlertCircle, MoreHorizontal, ArrowLeftRight
} from 'lucide-react';
import { Transaction, TransactionCategory, Holding, AssetType, CategoryDef, Currency } from '../types';
import { CategorySelector } from './CategorySelector';
import { ICON_MAP } from '../utils/iconMap';

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

const getCurrentLocalISO = () => {
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  return now.toISOString().slice(0, 16);
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
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [selectedAssetId, setSelectedAssetId] = useState<string>(paymentAssets[0]?.id || '');
  const [destinationAssetId, setDestinationAssetId] = useState<string>('');
  const [transactionType, setTransactionType] = useState<'EXPENSE' | 'INCOME' | 'TRANSFER'>('EXPENSE');
  const [date, setDate] = useState(getCurrentLocalISO());
  const [error, setError] = useState<string | null>(null);

  // Filter assets for Transfer (Banks only)
  const transferAssets = paymentAssets.filter(a => a.type === AssetType.CASH);
  const sourceAssets = transactionType === 'TRANSFER' ? transferAssets : paymentAssets;

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

  // Load last used category
  useEffect(() => {
    const lastCatId = localStorage.getItem('lastUsedCategoryId');
    if (lastCatId && categories.find(c => c.id === lastCatId)) {
      setSelectedCategoryId(lastCatId);
    } else if (categories.length > 0) {
      setSelectedCategoryId(categories[0].id);
    }
  }, [categories]);

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

    if (transactionType === 'TRANSFER') {
      if (!destinationAssetId) {
        setError("請選擇轉入帳戶。");
        return;
      }
      if (selectedAssetId === destinationAssetId) {
        setError("轉出與轉入帳戶不能相同。");
        return;
      }
    }

    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) {
      setError("請輸入有效金額。");
      return;
    }

    if (!selectedCategoryId && transactionType !== 'TRANSFER') {
      setError("請選擇一個類別。");
      return;
    }

    // Find asset name
    const asset = paymentAssets.find(a => a.id === selectedAssetId);
    const destAsset = paymentAssets.find(a => a.id === destinationAssetId);
    const categoryDef = categories.find(c => c.id === selectedCategoryId);

    onAddTransaction({
      type: transactionType,
      amount: numAmount, // This is in Display Currency
      category: transactionType === 'TRANSFER' ? '轉帳' : (categoryDef?.label || '其他'),
      note: note || (transactionType === 'TRANSFER' ? `轉帳至 ${destAsset?.name}` : (categoryDef?.label || '消費')),
      sourceAssetId: selectedAssetId,
      sourceAssetName: asset?.name,
      destinationAssetId: transactionType === 'TRANSFER' ? destinationAssetId : undefined,
      destinationAssetName: transactionType === 'TRANSFER' ? destAsset?.name : undefined,
      date: new Date(date).toISOString(),
    });

    // Save last used category
    localStorage.setItem('lastUsedCategoryId', selectedCategoryId);

    // Reset Form
    setAmount('');
    setNote('');
    setDate(getCurrentLocalISO());
    // Keep selected category and asset
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
    <div className="bg-surface border border-border rounded-3xl p-4 md:p-6 shadow-lg h-full flex flex-col relative overflow-hidden">

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
            <button onClick={() => { setIsManaging(false); cancelEditCategory(); }} className="p-1 hover:bg-slate-800 rounded text-slate-400"><X size={20} /></button>
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
                    {ICON_MAP[cat.icon] || <MoreHorizontal size={16} />}
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
          <button
            type="button"
            onClick={() => { setTransactionType('TRANSFER'); setError(null); }}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${transactionType === 'TRANSFER' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/50' : 'text-slate-500 hover:text-slate-300'}`}
          >
            轉帳
          </button>
        </div>

        <div className="space-y-4">
          {/* Amount Input */}
          <div>
            <label className="text-xs text-slate-500 block mb-1.5 ml-1">金額</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-lg">
                {CURRENCY_SYMBOLS[displayCurrency]}
              </span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                className="w-full bg-slate-900 border border-slate-700 rounded-2xl py-4 pl-16 pr-4 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-2xl font-bold [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
            </div>
          </div>

          {/* Note Input */}
          <div>
            <label className="text-xs text-slate-500 block mb-1.5 ml-1">備註 (選填)</label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="輸入備註..."
              className="w-full bg-slate-900 border border-slate-700 rounded-xl py-3 px-4 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
            />
          </div>

          {/* Date Input */}
          <div>
            <label className="text-xs text-slate-500 block mb-1.5 ml-1">時間</label>
            <input
              type="datetime-local"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full max-w-full min-w-0 bg-slate-900 border border-slate-700 rounded-xl py-3 px-3 md:px-4 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-sm md:text-base appearance-none"
            />
          </div>

          {/* Category Selector (Hide for Transfer) */}
          {transactionType !== 'TRANSFER' && (
            <div>
              <label className="text-xs text-slate-500 block mb-1.5 ml-1">選擇類別</label>
              <CategorySelector
                categories={categories}
                selectedCategoryId={selectedCategoryId}
                onSelectCategory={setSelectedCategoryId}
              />
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg transition-all flex items-center justify-center gap-2 ${transactionType === 'INCOME'
              ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20'
              : transactionType === 'TRANSFER'
                ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/20'
                : 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/20'
              }`}
          >
            {transactionType === 'INCOME' ? <Check size={20} /> : transactionType === 'TRANSFER' ? <ArrowLeftRight size={20} /> : <Check size={20} />}
            {transactionType === 'INCOME' ? '入帳' : transactionType === 'TRANSFER' ? '轉帳' : '記帳'}
          </button>
        </div>

        {/* Source Asset Selector */}
        <div>
          <label className="text-xs text-slate-500 block mb-1.5 ml-1">{transactionType === 'TRANSFER' ? '從哪裡轉出？' : '選擇帳戶'}</label>
          <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
            {sourceAssets.length === 0 ? (
              <div className="text-xs text-slate-500 italic px-2">無可用帳戶，請先新增資產</div>
            ) : (
              sourceAssets.map(asset => (
                <button
                  key={asset.id}
                  type="button"
                  onClick={() => { setSelectedAssetId(asset.id); setError(null); }}
                  className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all flex items-center gap-1.5 ${selectedAssetId === asset.id
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
        </div>

        {/* Destination Asset Selector (Only for Transfer) */}
        {transactionType === 'TRANSFER' && (
          <div className="animate-in fade-in slide-in-from-top-2">
            <label className="text-xs text-slate-500 block mb-1.5 ml-1">轉入到哪裡？</label>
            <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
              {transferAssets.map(asset => (
                <button
                  key={asset.id}
                  type="button"
                  onClick={() => { setDestinationAssetId(asset.id); setError(null); }}
                  className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all flex items-center gap-1.5 ${destinationAssetId === asset.id
                    ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-600/20'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                >
                  {asset.type === AssetType.CREDIT_CARD ? <CreditCard size={12} /> : <Wallet size={12} />}
                  {asset.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </form>

      {/* Transaction List */}
      <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar max-h-[400px]">
        {transactions.length === 0 && (
          <div className="text-center text-slate-600 text-sm py-8">今天還沒有任何消費紀錄</div>
        )}
        {transactions.map((t) => {
          const catDef = categories.find(c => c.label === t.category) || categories[categories.length - 1]; // Fallback to 'Other'
          const isIncome = t.type === 'INCOME';
          const isTransfer = t.type === 'TRANSFER';
          const displayAmount = Math.round(t.amount * exchangeRate);

          return (
            <div
              key={t.id}
              className="flex items-start justify-between gap-3 p-3 hover:bg-slate-800/40 rounded-xl transition-colors group cursor-pointer"
              onClick={() => startEditTransaction(t)}
            >
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <div className={`p-2.5 rounded-xl ${isTransfer ? 'text-blue-400 bg-blue-500/10' : (catDef?.color || 'text-slate-400 bg-slate-800')} transition-transform group-hover:scale-110`}>
                  {isTransfer ? <ArrowLeftRight size={18} /> : (ICON_MAP[catDef?.icon || 'MoreHorizontal'] || ICON_MAP['MoreHorizontal'])}
                </div>
                <div className="min-w-0">
                  <p className="text-slate-200 text-sm font-medium truncate">{t.note}</p>
                  <div className="flex items-center gap-2 text-xs text-slate-500 flex-wrap">
                    <p>{new Date(t.date).toLocaleString([], { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                    {t.sourceAssetName && (
                      <p className="text-indigo-400/70 px-1.5 py-0.5 bg-indigo-500/10 rounded whitespace-nowrap">
                        {t.sourceAssetName} {isTransfer && t.destinationAssetName ? `→ ${t.destinationAssetName}` : ''}
                      </p>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4 md:gap-6 shrink-0 md:self-auto self-start text-right">
                <div className="text-right">
                  <div className={`${isIncome ? 'text-emerald-400' : isTransfer ? 'text-blue-400' : 'text-rose-400'} font-bold font-mono`}>
                    {isIncome ? '+' : isTransfer ? '' : '-'}{CURRENCY_SYMBOLS[displayCurrency]}{displayAmount.toLocaleString()}
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
