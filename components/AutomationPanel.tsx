import React, { useState } from 'react';
import { Automation, Holding, CategoryDef, AssetType, AutomationType } from '../types';
import { Workflow, Plus, Trash2, Play, CalendarClock, TrendingUp, Wallet, ArrowRight, X, List, ArrowLeft } from 'lucide-react';

interface AutomationPanelProps {
  automations: Automation[];
  holdings: Holding[];
  categories: CategoryDef[];
  onAddAutomation: (a: Omit<Automation, 'id'>) => void;
  onDeleteAutomation: (id: string) => void;
  onRunNow: () => void;
  onClose: () => void;
  onShowLogs: () => void;
}

const AutomationPanel: React.FC<AutomationPanelProps> = ({ 
  automations, 
  holdings, 
  categories, 
  onAddAutomation, 
  onDeleteAutomation,
  onRunNow,
  onClose,
  onShowLogs
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [activeTab, setActiveTab] = useState<AutomationType>('RECURRING');

  // Form State
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [dayOfMonth, setDayOfMonth] = useState('1');
  
  // Recurring Specific
  const [txType, setTxType] = useState<'INCOME' | 'EXPENSE'>('EXPENSE');
  const [category, setCategory] = useState(categories[0]?.label || '');
  const [targetAssetId, setTargetAssetId] = useState(''); // Bank/Card
  
  // DCA Specific
  const [sourceAssetId, setSourceAssetId] = useState(''); // Bank
  const [investAssetId, setInvestAssetId] = useState(''); // Stock

  const bankAssets = holdings.filter(h => h.type === AssetType.CASH);
  const creditAssets = holdings.filter(h => h.type === AssetType.CREDIT_CARD);
  const stockAssets = holdings.filter(h => h.type === AssetType.STOCK || h.type === AssetType.CRYPTO);
  
  // For expenses, we can pay from Bank or Card. For DCA source, only Bank.
  const paymentSources = [...bankAssets, ...creditAssets];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newAutomation: Omit<Automation, 'id'> = {
      name,
      type: activeTab,
      amount: parseFloat(amount),
      currency: 'TWD', // Defaulting to TWD for simplicity
      dayOfMonth: parseInt(dayOfMonth),
      active: true,
    };

    if (activeTab === 'RECURRING') {
      if (!targetAssetId) return;
      newAutomation.transactionType = txType;
      newAutomation.category = category;
      newAutomation.targetAssetId = targetAssetId;
    } else {
      if (!sourceAssetId || !investAssetId) return;
      newAutomation.sourceAssetId = sourceAssetId;
      newAutomation.investAssetId = investAssetId;
    }

    onAddAutomation(newAutomation);
    setIsAdding(false);
    resetForm();
  };

  const resetForm = () => {
    setName('');
    setAmount('');
    setDayOfMonth('5');
    setTargetAssetId('');
    setSourceAssetId('');
    setInvestAssetId('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-0 md:p-4 animate-in fade-in duration-200">
      <div className="bg-surface border border-border rounded-none md:rounded-3xl w-full h-full md:h-auto md:max-h-[90vh] md:max-w-5xl shadow-2xl overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between p-4 md:p-6 bg-slate-900 border-b border-slate-800 gap-4 md:gap-0 shrink-0">
          <div className="flex items-center justify-between md:justify-start gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-600/20 text-white">
                <Workflow size={24} />
              </div>
              <div>
                <h2 className="text-lg md:text-xl font-bold text-white">自動化中心</h2>
                <p className="text-xs md:text-sm text-slate-400">設定定期收支與 DCA</p>
              </div>
            </div>
            {/* Mobile Close Button (Top Right) */}
            <button onClick={onClose} className="md:hidden p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800">
              <X size={24} />
            </button>
          </div>

          <div className="flex items-center justify-between md:justify-end gap-3">
             <button 
              onClick={onShowLogs}
              className="text-xs md:text-sm font-medium text-slate-400 hover:text-white px-3 py-2 md:px-4 hover:bg-slate-800 rounded-xl transition-colors flex items-center gap-1.5 border border-slate-800 md:border-transparent"
            >
              <List size={14} className="md:hidden" />
              <span>紀錄</span>
            </button>
            <button 
              onClick={onRunNow}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 px-3 py-2 md:px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-emerald-600/20 text-xs md:text-sm"
            >
              <Play size={14} fill="currentColor" />
              <span className="md:hidden">手動執行</span>
              <span className="hidden md:inline">手動觸發 (模擬)</span>
            </button>
            {/* Desktop Close Button */}
            <button onClick={onClose} className="hidden md:block p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800">
              <X size={24} />
            </button>
          </div>
        </div>

        <div className="flex flex-col md:flex-row flex-1 overflow-hidden relative">
          
          {/* Sidebar / List - Hidden on mobile if adding */}
          <div className={`flex-col bg-slate-950/30 border-r border-slate-800 w-full md:w-1/3 ${isAdding ? 'hidden md:flex' : 'flex'}`}>
             <div className="p-4 shrink-0">
                <button 
                  onClick={() => setIsAdding(true)}
                  className="w-full py-3 border border-dashed border-slate-700 rounded-xl text-slate-400 hover:text-indigo-400 hover:border-indigo-500 hover:bg-indigo-500/5 transition-all flex items-center justify-center gap-2 text-sm font-medium"
                >
                  <Plus size={18} /> 新增自動化規則
                </button>
             </div>
             
             <div className="flex-1 overflow-y-auto p-4 pt-0 space-y-3 custom-scrollbar">
                {automations.length === 0 && (
                   <div className="text-center py-8 text-slate-600 text-sm">
                      尚未設定任何規則
                   </div>
                )}
                {automations.map(auto => (
                  <div key={auto.id} className="p-4 rounded-xl bg-slate-900 border border-slate-800 hover:border-indigo-500/50 transition-all group relative">
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`p-2 rounded-lg ${auto.type === 'RECURRING' ? 'bg-orange-500/10 text-orange-400' : 'bg-blue-500/10 text-blue-400'}`}>
                         {auto.type === 'RECURRING' ? <CalendarClock size={16} /> : <TrendingUp size={16} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-white font-bold text-sm truncate">{auto.name}</h4>
                        <p className="text-xs text-slate-500">每月 {auto.dayOfMonth} 號執行</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between mt-3 text-xs">
                      <span className="text-slate-300 font-mono">
                        {auto.transactionType === 'INCOME' ? '+' : '-'}${auto.amount.toLocaleString()}
                      </span>
                      <span className={`px-2 py-0.5 rounded ${auto.active ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-500'}`}>
                        {auto.active ? '啟用中' : '已暫停'}
                      </span>
                    </div>

                    <button 
                      onClick={(e) => { e.stopPropagation(); onDeleteAutomation(auto.id); }}
                      className="absolute top-2 right-2 p-2 text-slate-600 hover:text-rose-500 md:opacity-0 md:group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
             </div>
          </div>

          {/* Main Content (Add Form or Summary) - Hidden on mobile if NOT adding */}
          <div className={`bg-slate-900/50 md:p-8 p-4 overflow-y-auto custom-scrollbar w-full md:flex-1 ${isAdding ? 'flex' : 'hidden md:block'}`}>
            {isAdding ? (
              <div className="w-full max-w-lg mx-auto animate-in fade-in slide-in-from-bottom-4 md:slide-in-from-right-4">
                <div className="flex items-center gap-3 mb-6 md:mb-8">
                  <button onClick={() => setIsAdding(false)} className="md:hidden p-2 -ml-2 text-slate-400 hover:text-white">
                    <ArrowLeft size={24} />
                  </button>
                  <div className="flex-1 flex justify-between items-center">
                    <h3 className="text-xl md:text-2xl font-bold text-white">新增規則</h3>
                    <button onClick={() => setIsAdding(false)} className="hidden md:block text-sm text-slate-500 hover:text-white">取消</button>
                  </div>
                </div>

                <div className="flex p-1 bg-slate-950 rounded-xl mb-6 border border-slate-800">
                   <button 
                    onClick={() => setActiveTab('RECURRING')}
                    className={`flex-1 py-2.5 rounded-lg text-xs md:text-sm font-bold transition-all ${activeTab === 'RECURRING' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                   >
                     定期收支
                   </button>
                   <button 
                    onClick={() => setActiveTab('DCA_INVEST')}
                    className={`flex-1 py-2.5 rounded-lg text-xs md:text-sm font-bold transition-all ${activeTab === 'DCA_INVEST' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                   >
                     定期定額 (DCA)
                   </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5 pb-8 md:pb-0">
                   <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">規則名稱</label>
                      <input required value={name} onChange={e => setName(e.target.value)} placeholder={activeTab === 'RECURRING' ? "例如: Netflix 訂閱" : "例如: 買進台積電"} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-indigo-500 outline-none" />
                   </div>

                   <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">
                           {activeTab === 'RECURRING' ? '固定金額' : '每月預算 (Budget)'}
                        </label>
                        <input required type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="3000" className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-indigo-500 outline-none" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">每月執行日</label>
                        <select value={dayOfMonth} onChange={e => setDayOfMonth(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-indigo-500 outline-none">
                           {[...Array(31)].map((_, i) => (
                             <option key={i+1} value={i+1}>{i+1} 號</option>
                           ))}
                        </select>
                      </div>
                   </div>

                   {activeTab === 'RECURRING' && (
                     <>
                        <div className="grid grid-cols-2 gap-4">
                           <div>
                              <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">類型</label>
                              <select value={txType} onChange={e => setTxType(e.target.value as any)} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-indigo-500 outline-none">
                                <option value="EXPENSE">支出</option>
                                <option value="INCOME">收入</option>
                              </select>
                           </div>
                           <div>
                              <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">分類</label>
                              <select value={category} onChange={e => setCategory(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-indigo-500 outline-none">
                                {categories.map(c => <option key={c.id} value={c.label}>{c.label}</option>)}
                              </select>
                           </div>
                        </div>
                        <div>
                           <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">
                             {txType === 'INCOME' ? '存入帳戶' : '扣款帳戶/信用卡'}
                           </label>
                           <select required value={targetAssetId} onChange={e => setTargetAssetId(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-indigo-500 outline-none">
                              <option value="">選擇帳戶...</option>
                              {paymentSources.map(asset => (
                                <option key={asset.id} value={asset.id}>{asset.name} ({asset.type})</option>
                              ))}
                           </select>
                        </div>
                     </>
                   )}

                   {activeTab === 'DCA_INVEST' && (
                      <div className="space-y-4 pt-2">
                         <div className="flex flex-col md:flex-row md:items-center gap-4 bg-slate-950/50 p-4 rounded-xl border border-dashed border-slate-700">
                            <div className="flex-1">
                               <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">扣款銀行 (Source)</label>
                               <select required value={sourceAssetId} onChange={e => setSourceAssetId(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:border-indigo-500 outline-none text-sm">
                                  <option value="">選擇銀行...</option>
                                  {bankAssets.map(asset => (
                                    <option key={asset.id} value={asset.id}>{asset.name}</option>
                                  ))}
                               </select>
                            </div>
                            <ArrowRight className="text-slate-600 md:mt-6 hidden md:block" />
                            <ArrowRight className="text-slate-600 rotate-90 md:rotate-0 self-center md:hidden" />
                            <div className="flex-1">
                               <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">買入標的 (Target)</label>
                               <select required value={investAssetId} onChange={e => setInvestAssetId(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:border-indigo-500 outline-none text-sm">
                                  <option value="">選擇股票/幣...</option>
                                  {stockAssets.map(asset => (
                                    <option key={asset.id} value={asset.id}>{asset.name} ({asset.ticker})</option>
                                  ))}
                               </select>
                            </div>
                         </div>
                         <p className="text-xs text-slate-500 leading-relaxed px-1">
                            <span className="text-indigo-400 font-bold">機制說明：</span> 
                            系統將在執行日當天以該標的之收盤價計算，使用預算購買最大整數股數。
                         </p>
                      </div>
                   )}

                   <button type="submit" className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/20 mt-4 transition-all">
                      建立自動化規則
                   </button>
                </form>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-6">
                 <div className="w-20 h-20 md:w-24 md:h-24 bg-slate-800 rounded-full flex items-center justify-center mb-4">
                    <Workflow className="text-indigo-400 w-10 h-10 md:w-12 md:h-12" />
                 </div>
                 <div>
                    <h3 className="text-xl md:text-2xl font-bold text-white mb-2">理財自動導航</h3>
                    <p className="text-sm md:text-base text-slate-400 max-w-md mx-auto leading-relaxed px-4">
                       設定好規則後，系統將自動為您記帳、繳費與投資。<br className="hidden md:block"/>
                       您可以隨時點擊右上角的 <span className="text-emerald-400 font-bold">手動執行</span> 按鈕來測試效果。
                    </p>
                 </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default AutomationPanel;