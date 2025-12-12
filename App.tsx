import React, { useState, useEffect, useMemo } from 'react';
import { 
  Currency, 
  Holding, 
  AssetType, 
  ChartData,
  Transaction,
  CategoryDef,
  Automation,
  SystemLog
} from './types';
import NetWorthCard from './components/NetWorthCard';
import TransactionTracker from './components/TransactionTracker';
import AssetSection from './components/AssetSection';
import AnalyticsView from './components/AnalyticsView';
import AuthModal from './components/AuthModal';
import AutomationPanel from './components/AutomationPanel';
import SystemLogs from './components/SystemLogs';
import { Logo } from './components/Logo'; // Import Logo
import { LineChart, Settings, Wallet, ListTodo, X, CheckSquare, Square, User, LogOut, Database, Workflow } from 'lucide-react';
import { fetchExchangeRates, fetchStockPrice } from './services/yahooFinanceService';
import { supabase } from './services/supabaseClient';
import { dbService } from './services/dbService';

// Mock Data Initialization (Taiwan Context) - Used for Guest Mode
const INITIAL_HOLDINGS: Holding[] = [];

const INITIAL_CATEGORIES: CategoryDef[] = [
  { id: 'c1', label: '餐飲', icon: 'Utensils', color: 'text-orange-400 bg-orange-400/10', keywords: ['午餐', '晚餐', '早餐', '飲料', '咖啡', '吃', '飯', '火鍋', '麥當勞'] },
  { id: 'c2', label: '娛樂', icon: 'Film', color: 'text-purple-400 bg-purple-400/10', keywords: ['電影', '遊戲', 'Netflix', 'KTV', '玩'] },
  { id: 'c3', label: '交通', icon: 'Car', color: 'text-blue-400 bg-blue-400/10', keywords: ['車', '捷運', '高鐵', '加油', 'Uber', '計程車'] },
  { id: 'c4', label: '購物', icon: 'ShoppingBag', color: 'text-pink-400 bg-pink-400/10', keywords: ['買', '衣服', '鞋子', '超市', '全聯', '蝦皮'] },
  { id: 'c5', label: '帳單', icon: 'FileText', color: 'text-red-400 bg-red-400/10', keywords: ['電費', '水費', '房租', '電話', '繳費'] },
  { id: 'c6', label: '其他', icon: 'MoreHorizontal', color: 'text-slate-400 bg-slate-400/10', keywords: [] },
  { id: 'c7', label: '薪資', icon: 'Briefcase', color: 'text-emerald-400 bg-emerald-400/10', keywords: ['薪水', '獎金', '收入'] },
];

const INITIAL_TRANSACTIONS: Transaction[] = [];

const INITIAL_AUTOMATIONS: Automation[] = [];

// Section Keys
type SectionKey = 'CASH' | 'CREDIT' | 'INVESTMENT';

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [loadingData, setLoadingData] = useState(false);

  const [globalCurrency, setGlobalCurrency] = useState<Currency>('TWD');
  const [holdings, setHoldings] = useState<Holding[]>(INITIAL_HOLDINGS);
  const [categories, setCategories] = useState<CategoryDef[]>(INITIAL_CATEGORIES);
  const [transactions, setTransactions] = useState<Transaction[]>(INITIAL_TRANSACTIONS);
  const [automations, setAutomations] = useState<Automation[]>(INITIAL_AUTOMATIONS);
  const [systemLogs, setSystemLogs] = useState<SystemLog[]>([]);

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isUpdatingRates, setIsUpdatingRates] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showAutomationPanel, setShowAutomationPanel] = useState(false);
  const [showSystemLogs, setShowSystemLogs] = useState(false);
  
  // Mobile Navigation State
  const [mobileTab, setMobileTab] = useState<'ledger' | 'assets'>('ledger');

  // Section Visibility State
  const [visibleSections, setVisibleSections] = useState<Record<SectionKey, boolean>>({
    'CASH': true,
    'CREDIT': true,
    'INVESTMENT': true
  });

  // Exchange Rates State (1 TWD = ?)
  const [rates, setRates] = useState<Record<Currency, number>>({
    'TWD': 1,
    'USD': 0.0307, 
    'JPY': 4.7,    
  });
  const [ratesLastUpdated, setRatesLastUpdated] = useState<number | null>(null);

  // Separation of Assets
  const cashAssets = useMemo(() => holdings.filter(h => h.type === AssetType.CASH), [holdings]);
  const creditAssets = useMemo(() => holdings.filter(h => h.type === AssetType.CREDIT_CARD), [holdings]);
  const investmentAssets = useMemo(() => holdings.filter(h => h.type === AssetType.STOCK || h.type === AssetType.CRYPTO || h.type === AssetType.OTHER), [holdings]);
  const paymentAssets = useMemo(() => [...cashAssets, ...creditAssets], [cashAssets, creditAssets]);

  // Auth & Data Sync
  useEffect(() => {
    if (!supabase) return;
    
    // Check Active Session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fetch Data when User Changes
  useEffect(() => {
    async function loadData() {
      if (user) {
        setLoadingData(true);
        const data = await dbService.fetchUserData(user.id);
        if (data) {
          if (data.categories.length === 0 && data.holdings.length === 0) {
             setCategories(INITIAL_CATEGORIES); 
             setHoldings([]);
             setTransactions([]);
          } else {
             setHoldings(data.holdings);
             setTransactions(data.transactions);
             if (data.categories.length > 0) setCategories(data.categories);
             else setCategories(INITIAL_CATEGORIES);
          }
        }
        setLoadingData(false);
      } else {
        // Reset to Guest Mode Data
        setHoldings(INITIAL_HOLDINGS);
        setCategories(INITIAL_CATEGORIES);
        setTransactions(INITIAL_TRANSACTIONS);
      }
    }
    loadData();
  }, [user]);

  // Initial Rates Fetch
  useEffect(() => {
    handleRefreshRates();
  }, []);

  // Net Worth Calculation
  const netWorth = useMemo(() => {
    let totalInTWD = 0;
    holdings.forEach(h => {
      const nativeValue = h.price * h.quantity;
      if (h.currency === 'TWD') totalInTWD += nativeValue;
      else totalInTWD += nativeValue / rates[h.currency];
    });
    return totalInTWD * rates[globalCurrency];
  }, [holdings, globalCurrency, rates]);

  // Subtotal Calculation
  const calculateTotal = (assets: Holding[]) => {
    return assets.reduce((acc, curr) => {
      const nativeValue = curr.price * curr.quantity;
      const valInTWD = curr.currency === 'TWD' ? nativeValue : nativeValue / rates[curr.currency];
      return acc + (valInTWD * rates[globalCurrency]);
    }, 0);
  };

  const cashTotal = useMemo(() => calculateTotal(cashAssets), [cashAssets, globalCurrency, rates]);
  const creditTotal = useMemo(() => calculateTotal(creditAssets), [creditAssets, globalCurrency, rates]);
  const investmentTotal = useMemo(() => calculateTotal(investmentAssets), [investmentAssets, globalCurrency, rates]);

  // Chart Data
  const chartData: ChartData[] = useMemo(() => {
    const categories: Record<string, number> = {};
    const typeColors: Record<string, string> = {
      [AssetType.CASH]: '#3b82f6', 
      [AssetType.STOCK]: '#f43f5e', 
      [AssetType.CREDIT_CARD]: '#f97316', 
      [AssetType.CRYPTO]: '#10b981', 
      [AssetType.OTHER]: '#a8a29e', 
    };

    holdings.forEach(h => {
      const nativeValue = h.price * h.quantity;
      const valInTWD = h.currency === 'TWD' ? nativeValue : nativeValue / rates[h.currency];
      
      if (valInTWD > 0) {
        const key = h.type;
        categories[key] = (categories[key] || 0) + valInTWD;
      }
    });

    const totalAssets = Object.values(categories).reduce((a, b) => a + b, 0);

    return Object.keys(categories).map(key => ({
      name: key,
      value: totalAssets === 0 ? 0 : Math.round((categories[key] / totalAssets) * 100),
      color: typeColors[key] || '#cbd5e1'
    }));
  }, [holdings, rates]);

  // --- Handlers ---

  const handleChangeCurrency = (newCurrency: Currency) => {
    setGlobalCurrency(newCurrency);
  };

  const handleRefreshRates = async () => {
    setIsUpdatingRates(true);
    const result = await fetchExchangeRates();
    if (result) {
      setRates(result.rates);
      setRatesLastUpdated(result.timestamp);
    }
    setIsUpdatingRates(false);
  };

  const handleUpdateHolding = async (id: string, updates: Partial<Holding>) => {
    setHoldings(prev => prev.map(h => h.id === id ? { ...h, ...updates } : h));
    if (user) await dbService.updateHolding(id, updates);
  };

  const handleAddHolding = async (newHolding: Omit<Holding, 'id'>) => {
    const tempId = Math.random().toString(36).substr(2, 9);
    const holding: Holding = { ...newHolding, id: tempId };
    setHoldings(prev => [...prev, holding]);
    if (user) {
      const dbHolding = await dbService.addHolding(user.id, newHolding);
      if (dbHolding) setHoldings(prev => prev.map(h => h.id === tempId ? dbHolding : h));
    }
  };

  const handleRemoveHolding = async (id: string) => {
    setHoldings(prev => prev.filter(h => h.id !== id));
    if (user) await dbService.deleteHolding(id);
  };

  const handleRefreshStocks = async () => {
    setIsRefreshing(true);
    const updates = holdings.map(async (h) => {
      if ((h.type === AssetType.STOCK || h.type === AssetType.CRYPTO) && h.ticker && h.ticker !== 'TWD') {
         const result = await fetchStockPrice(h.ticker);
         if (result) {
           const change = ((result.price - h.price) / h.price) * 100;
           return {
             ...h,
             price: result.price,
             change24h: change,
             lastUpdated: result.timestamp
           };
         }
      }
      return h;
    });
    const updatedHoldings = await Promise.all(updates);
    setHoldings(updatedHoldings);
  };

  const handleAddTransaction = async (newTx: Omit<Transaction, 'id' | 'date'> & { date?: string }) => {
    const amountInTWD = newTx.amount / rates[globalCurrency];
    const tempId = Math.random().toString(36).substr(2, 9);
    const transaction: Transaction = {
      ...newTx,
      id: tempId,
      date: newTx.date || new Date().toISOString(),
      amount: amountInTWD 
    };
    
    setTransactions(prev => [transaction, ...prev]);

    if (newTx.sourceAssetId) {
      setHoldings(prev => prev.map(h => {
        if (h.id === newTx.sourceAssetId) {
          const amountInAssetCurrency = h.currency === 'TWD' ? amountInTWD : amountInTWD * rates[h.currency];
          let newQuantity = h.quantity;
          if (newTx.type === 'INCOME') newQuantity += amountInAssetCurrency;
          else newQuantity -= amountInAssetCurrency;
          if (user) dbService.updateHolding(h.id, { quantity: newQuantity });
          return { ...h, quantity: newQuantity };
        }
        return h;
      }));
    }

    if (user) {
      const dbTx = await dbService.addTransaction(user.id, { ...transaction, amount: amountInTWD });
      if (dbTx) setTransactions(prev => prev.map(t => t.id === tempId ? dbTx : t));
    }
  };

  const handleUpdateTransaction = async (id: string, updates: Partial<Transaction>) => {
    setTransactions(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
    if (user) await dbService.updateTransaction(id, updates);
  };

  const handleDeleteTransaction = async (id: string) => {
    const tx = transactions.find(t => t.id === id);
    if (!tx) return;
    if (tx.sourceAssetId) {
      setHoldings(prev => prev.map(h => {
        if (h.id === tx.sourceAssetId) {
          const amountInAssetCurrency = h.currency === 'TWD' ? tx.amount : tx.amount * rates[h.currency];
          let newQuantity = h.quantity;
          if (tx.type === 'INCOME') newQuantity -= amountInAssetCurrency;
          else newQuantity += amountInAssetCurrency;
          if (user) dbService.updateHolding(h.id, { quantity: newQuantity });
          return { ...h, quantity: newQuantity };
        }
        return h;
      }));
    }
    setTransactions(prev => prev.filter(t => t.id !== id));
    if (user) await dbService.deleteTransaction(id);
  };

  // --- Automation Logic ---
  const handleAddAutomation = (a: Omit<Automation, 'id'>) => {
    const newAuto = { ...a, id: Math.random().toString(36).substr(2, 9) };
    setAutomations(prev => [...prev, newAuto]);
  };

  const handleDeleteAutomation = (id: string) => {
    setAutomations(prev => prev.filter(a => a.id !== id));
  };

  const handleRunAutomations = () => {
    // Simulation Logic
    const newLogs: SystemLog[] = [];
    let updatedHoldings = [...holdings];
    let newTransactions: Transaction[] = [];

    automations.forEach(auto => {
      if (!auto.active) return;

      const logId = Math.random().toString(36).substr(2, 9);
      const dateStr = new Date().toISOString();

      if (auto.type === 'RECURRING') {
        const targetAsset = updatedHoldings.find(h => h.id === auto.targetAssetId);
        if (targetAsset) {
          // Calculate amount in Asset Currency
          // Auto Amount is in TWD usually (based on panel input)
          const amountInTWD = auto.amount;
          const amountInAsset = targetAsset.currency === 'TWD' ? amountInTWD : amountInTWD * rates[targetAsset.currency];

          // Update Holding Balance
          updatedHoldings = updatedHoldings.map(h => {
            if (h.id === targetAsset.id) {
              const newQty = auto.transactionType === 'INCOME' ? h.quantity + amountInAsset : h.quantity - amountInAsset;
              return { ...h, quantity: newQty };
            }
            return h;
          });

          // Create Transaction
          newTransactions.push({
            id: Math.random().toString(36).substr(2, 9),
            type: auto.transactionType || 'EXPENSE',
            date: dateStr,
            amount: amountInTWD,
            category: auto.category || '自動化',
            note: `[自動] ${auto.name}`,
            sourceAssetId: targetAsset.id,
            sourceAssetName: targetAsset.name
          });

          newLogs.push({
            id: logId,
            date: dateStr,
            title: `執行：${auto.name}`,
            description: `${auto.transactionType === 'INCOME' ? '存入' : '扣款'} ${targetAsset.name} $${amountInTWD}`,
            status: 'SUCCESS',
            amount: `$${amountInTWD}`
          });
        } else {
           newLogs.push({
            id: logId,
            date: dateStr,
            title: `失敗：${auto.name}`,
            description: `找不到目標帳戶 ID: ${auto.targetAssetId}`,
            status: 'FAILED'
          });
        }
      } else if (auto.type === 'DCA_INVEST') {
        const sourceBank = updatedHoldings.find(h => h.id === auto.sourceAssetId);
        const targetStock = updatedHoldings.find(h => h.id === auto.investAssetId);

        if (sourceBank && targetStock) {
           // Budget in TWD
           const budgetTWD = auto.amount;
           const stockPriceTWD = targetStock.currency === 'TWD' ? targetStock.price : targetStock.price / rates[targetStock.currency];
           
           // Calculate Shares (Floor)
           const sharesToBuy = Math.floor(budgetTWD / stockPriceTWD);
           
           if (sharesToBuy > 0) {
             const costTWD = sharesToBuy * stockPriceTWD;
             const costSourceCurrency = sourceBank.currency === 'TWD' ? costTWD : costTWD * rates[sourceBank.currency];

             // Deduct from Bank
             updatedHoldings = updatedHoldings.map(h => {
               if (h.id === sourceBank.id) return { ...h, quantity: h.quantity - costSourceCurrency };
               if (h.id === targetStock.id) return { ...h, quantity: h.quantity + sharesToBuy };
               return h;
             });

             // Create Transaction
             newTransactions.push({
                id: Math.random().toString(36).substr(2, 9),
                type: 'EXPENSE',
                date: dateStr,
                amount: costTWD,
                category: '投資',
                note: `[DCA] ${auto.name} - 買入 ${sharesToBuy} 股`,
                sourceAssetId: sourceBank.id,
                sourceAssetName: sourceBank.name
             });

             newLogs.push({
               id: logId,
               date: dateStr,
               title: `DCA 執行：${auto.name}`,
               description: `從 ${sourceBank.name} 扣款 $${costTWD.toFixed(0)} 買入 ${sharesToBuy} 股 ${targetStock.name}。剩餘預算 $${(budgetTWD - costTWD).toFixed(0)} 未扣款。`,
               status: 'SUCCESS',
               amount: `-$${costTWD.toFixed(0)}`
             });

           } else {
             newLogs.push({
               id: logId,
               date: dateStr,
               title: `跳過：${auto.name}`,
               description: `預算不足買入 1 股 (股價: ${stockPriceTWD.toFixed(0)}, 預算: ${budgetTWD})`,
               status: 'SKIPPED'
             });
           }
        } else {
           newLogs.push({
            id: logId,
            date: dateStr,
            title: `失敗：${auto.name}`,
            description: `找不到來源銀行或目標股票`,
            status: 'FAILED'
          });
        }
      }
    });

    setHoldings(updatedHoldings);
    setTransactions(prev => [...newTransactions, ...prev]);
    setSystemLogs(prev => [...newLogs, ...prev]);
  };

  // --- Render ---

  const handleAddCategory = async (newCat: CategoryDef) => {
    const tempId = Math.random().toString(36).substr(2, 9);
    setCategories(prev => [...prev, { ...newCat, id: tempId }]);
  };
  const handleUpdateCategory = async (id: string, updates: Partial<CategoryDef>) => setCategories(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
  const handleDeleteCategory = async (id: string) => setCategories(prev => prev.filter(c => c.id !== id));
  const toggleSection = (key: SectionKey) => setVisibleSections(prev => ({ ...prev, [key]: !prev[key] }));
  const handleLogout = async () => { if (supabase) await supabase.auth.signOut(); setShowSettings(false); setShowAuthModal(false); };

  return (
    <div className="min-h-screen bg-background text-slate-50 font-sans selection:bg-indigo-500/30 pb-24 md:pb-8 relative">
      
      {/* Modals */}
      {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} onSuccess={() => setShowAuthModal(false)} />}
      
      {showAnalytics && (
        <AnalyticsView 
          onBack={() => setShowAnalytics(false)} 
          allocationData={chartData} 
          currentNetWorth={netWorth}
          transactions={transactions} 
        />
      )}

      {showAutomationPanel && (
        <AutomationPanel 
          automations={automations} 
          holdings={holdings} 
          categories={categories}
          onAddAutomation={handleAddAutomation} 
          onDeleteAutomation={handleDeleteAutomation}
          onRunNow={handleRunAutomations}
          onClose={() => setShowAutomationPanel(false)}
          onShowLogs={() => { setShowSystemLogs(true); }}
        />
      )}
      {showSystemLogs && (
         <SystemLogs 
           logs={systemLogs} 
           onClose={() => setShowSystemLogs(false)} 
           onClear={() => setSystemLogs([])} 
         />
      )}

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-surface border border-border rounded-3xl p-6 w-full max-w-sm shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">設定</h3>
              <button onClick={() => setShowSettings(false)} className="text-slate-400 hover:text-white">
                <X size={24} />
              </button>
            </div>
            <div className="bg-slate-900 rounded-2xl p-4 mb-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                <User size={24} />
              </div>
              <div className="flex-1 overflow-hidden">
                {user ? (
                   <>
                     <div className="font-medium text-white truncate">{user.email}</div>
                     <div className="text-xs text-emerald-400 flex items-center gap-1">
                       <Database size={10} /> 資料庫同步中
                     </div>
                   </>
                ) : (
                   <>
                     <div className="font-medium text-slate-300">訪客模式</div>
                     <div className="text-xs text-slate-500">資料僅暫存於本機 (重整後重置)</div>
                   </>
                )}
              </div>
            </div>
            {user ? (
               <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 py-2 mb-6 bg-slate-800 hover:bg-rose-500/10 hover:text-rose-400 text-slate-300 rounded-xl transition-colors text-sm font-medium">
                 <LogOut size={16} /> 登出帳號
               </button>
            ) : (
               <button onClick={() => { setShowSettings(false); setShowAuthModal(true); }} className="w-full flex items-center justify-center gap-2 py-3 mb-6 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-colors font-bold shadow-lg shadow-indigo-600/20">
                 <User size={18} /> 登入 / 註冊會員
               </button>
            )}
            <p className="text-sm text-slate-400 mb-4 font-bold">版面配置</p>
            <div className="space-y-3">
              <button onClick={() => toggleSection('CASH')} className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-indigo-500/50">
                <span className="text-slate-200">銀行與現金</span>
                {visibleSections['CASH'] ? <CheckSquare className="text-indigo-400" size={18} /> : <Square className="text-slate-600" size={18} />}
              </button>
              <button onClick={() => toggleSection('CREDIT')} className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-indigo-500/50">
                <span className="text-slate-200">信用卡</span>
                {visibleSections['CREDIT'] ? <CheckSquare className="text-indigo-400" size={18} /> : <Square className="text-slate-600" size={18} />}
              </button>
              <button onClick={() => toggleSection('INVESTMENT')} className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-indigo-500/50">
                <span className="text-slate-200">投資組合</span>
                {visibleSections['INVESTMENT'] ? <CheckSquare className="text-indigo-400" size={18} /> : <Square className="text-slate-600" size={18} />}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto md:p-8 p-4 space-y-6 md:space-y-8">
        {/* Header */}
        <header className="flex items-center justify-between">
          <Logo className="w-10 h-10" />
          
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setShowAutomationPanel(true)}
              className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-emerald-400 rounded-xl font-medium transition-colors border border-slate-700 text-sm"
              title="自動化中心"
            >
              <Workflow size={18} />
              <span className="hidden md:inline">自動化</span>
            </button>
            <button 
              onClick={() => setShowAnalytics(true)}
              className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-indigo-400 rounded-xl font-medium transition-colors border border-slate-700 text-sm"
            >
              <LineChart size={18} />
              <span className="hidden md:inline">資產分析</span>
            </button>
            <button 
              onClick={() => setShowSettings(true)}
              className={`p-1.5 pl-2 pr-2 rounded-xl border transition-all flex items-center gap-2 ${user ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300' : 'bg-slate-800 border-slate-700 text-slate-400'}`}
            >
               {user ? <User size={18} /> : <Settings size={20} />}
            </button>
          </div>
        </header>

        {loadingData ? (
           <div className="flex items-center justify-center py-20">
              <div className="animate-spin text-indigo-500"><Logo className="w-12 h-12" showText={false} /></div>
           </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
            {/* Left Column */}
            <div className={`col-span-1 md:col-span-7 flex flex-col gap-6 ${mobileTab === 'assets' ? 'block' : 'hidden md:flex'}`}>
              <NetWorthCard 
                totalValue={netWorth} 
                currency={globalCurrency} 
                onChangeCurrency={handleChangeCurrency}
                isRefreshing={isUpdatingRates}
                onRefreshRates={handleRefreshRates}
                ratesLastUpdated={ratesLastUpdated}
                rates={rates}
              />
              {visibleSections['CASH'] && (
                <AssetSection 
                  title="銀行與現金"
                  type="CASH"
                  holdings={cashAssets}
                  onUpdateHolding={handleUpdateHolding}
                  onAddHolding={handleAddHolding}
                  onRemoveHolding={handleRemoveHolding}
                  totalValue={cashTotal}
                  displayCurrency={globalCurrency}
                />
              )}
              {visibleSections['CREDIT'] && (
                <AssetSection 
                  title="信用卡負債"
                  type="CREDIT"
                  holdings={creditAssets}
                  onUpdateHolding={handleUpdateHolding}
                  onAddHolding={handleAddHolding}
                  onRemoveHolding={handleRemoveHolding}
                  totalValue={creditTotal}
                  displayCurrency={globalCurrency}
                />
              )}
              {visibleSections['INVESTMENT'] && (
                <AssetSection 
                  title="投資組合"
                  type="INVESTMENT"
                  holdings={investmentAssets}
                  onUpdateHolding={handleUpdateHolding}
                  onAddHolding={handleAddHolding}
                  onRemoveHolding={handleRemoveHolding}
                  onRefreshPrices={handleRefreshStocks}
                  totalValue={investmentTotal}
                  displayCurrency={globalCurrency}
                />
              )}
            </div>

            {/* Right Column */}
            <div className={`col-span-1 md:col-span-5 flex flex-col gap-6 ${mobileTab === 'ledger' ? 'block' : 'hidden md:flex'}`}>
              <div className="md:sticky md:top-6 h-full">
                <TransactionTracker 
                  transactions={transactions} 
                  onAddTransaction={handleAddTransaction} 
                  onUpdateTransaction={handleUpdateTransaction}
                  onDeleteTransaction={handleDeleteTransaction}
                  paymentAssets={paymentAssets}
                  categories={categories}
                  onAddCategory={handleAddCategory}
                  onUpdateCategory={handleUpdateCategory}
                  onDeleteCategory={handleDeleteCategory}
                  displayCurrency={globalCurrency}
                  exchangeRate={rates[globalCurrency]}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-slate-950 border-t border-slate-800 md:hidden z-40 pb-safe">
        <div className="flex items-center justify-around p-3">
          <button onClick={() => setMobileTab('ledger')} className={`flex flex-col items-center gap-1 transition-colors ${mobileTab === 'ledger' ? 'text-indigo-400' : 'text-slate-500'}`}>
            <ListTodo size={24} />
            <span className="text-xs font-medium">記帳</span>
          </button>
          <button onClick={() => setMobileTab('assets')} className={`flex flex-col items-center gap-1 transition-colors ${mobileTab === 'assets' ? 'text-indigo-400' : 'text-slate-500'}`}>
            <Wallet size={24} />
            <span className="text-xs font-medium">資產</span>
          </button>
        </div>
      </div>
    </div>
  );
}