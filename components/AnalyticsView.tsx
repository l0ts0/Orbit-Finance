import React, { useMemo } from 'react';
import { ChartData, Transaction } from '../types';
import AssetAllocation from './AssetAllocation';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { ArrowLeft } from 'lucide-react';

interface AnalyticsViewProps {
  onBack: () => void;
  allocationData: ChartData[];
  currentNetWorth: number;
  transactions: Transaction[];
}

// Mock History Data Generator based on current net worth (for demo visualization of trend)
const generateHistoryData = (currentValue: number) => {
  const data = [];
  let value = currentValue * 0.85; // Start 15% lower
  const now = new Date();
  
  for (let i = 6; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    
    // Add some random fluctuation but trend upwards to current
    const randomChange = (Math.random() - 0.3) * (currentValue * 0.05);
    value += (currentValue - value) / (i + 1) + randomChange;
    
    data.push({
      date: date.toLocaleDateString('zh-TW', { month: 'numeric', day: 'numeric' }),
      value: Math.round(value)
    });
  }
  // Ensure last point matches exactly
  data[data.length - 1].value = currentValue;
  return data;
};

// Process real transactions for the Bar Chart
const processDailyExpenses = (transactions: Transaction[]) => {
  const last7Days = new Map<string, number>();
  const now = new Date();
  
  // Initialize last 7 days with 0 to show empty days
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split('T')[0];
    last7Days.set(key, 0);
  }

  transactions.forEach(t => {
    if (t.type === 'EXPENSE') {
      const dateKey = t.date.split('T')[0];
      if (last7Days.has(dateKey)) {
        last7Days.set(dateKey, (last7Days.get(dateKey) || 0) + t.amount);
      }
    }
  });

  return Array.from(last7Days.entries()).map(([dateStr, amount]) => {
     const date = new Date(dateStr);
     return {
       date: date.toLocaleDateString('zh-TW', { month: 'numeric', day: 'numeric' }),
       amount: Math.round(amount)
     };
  });
};

const AnalyticsView: React.FC<AnalyticsViewProps> = ({ onBack, allocationData, currentNetWorth, transactions }) => {
  const historyData = useMemo(() => generateHistoryData(currentNetWorth), [currentNetWorth]);
  const dailyExpenseData = useMemo(() => processDailyExpenses(transactions), [transactions]);

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm overflow-y-auto">
      <div className="max-w-4xl mx-auto p-6 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
        
        {/* Header */}
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="p-2 bg-slate-800 text-slate-300 rounded-xl hover:bg-slate-700 transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <h2 className="text-2xl font-bold text-white">資產與支出分析</h2>
        </div>

        {/* 1. Daily Spending Trend (Bar Chart) - NEW */}
        <div className="bg-surface border border-border rounded-3xl p-6 shadow-lg">
          <h3 className="text-slate-200 font-bold text-lg mb-6 flex items-center gap-2">
             每日支出趨勢 
             <span className="text-xs text-slate-500 font-normal">(近 7 日)</span>
          </h3>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyExpenseData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  stroke="#64748b" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false}
                />
                <YAxis 
                  stroke="#64748b" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false}
                  tickFormatter={(val) => `NT$${val}`}
                />
                <Tooltip 
                  cursor={{fill: '#1e293b'}}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px', color: '#f8fafc' }}
                  itemStyle={{ color: '#f43f5e' }}
                  formatter={(val: number) => [`NT$${val.toLocaleString()}`, '支出']}
                />
                <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
                  {dailyExpenseData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.amount > 0 ? '#f43f5e' : '#334155'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 2. Net Worth Trend (Area Chart) */}
        <div className="bg-surface border border-border rounded-3xl p-6 shadow-lg">
          <h3 className="text-slate-200 font-bold text-lg mb-6">總資產走勢預估</h3>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={historyData}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  stroke="#64748b" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false}
                />
                <YAxis 
                  stroke="#64748b" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false}
                  tickFormatter={(val) => `${(val/10000).toFixed(0)}萬`}
                  domain={['auto', 'auto']}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px', color: '#f8fafc' }}
                  itemStyle={{ color: '#818cf8' }}
                  formatter={(val: number) => [`NT$${val.toLocaleString()}`, '淨資產']}
                />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#6366f1" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorValue)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 3. Asset Allocation Pie Chart */}
        <div className="h-[400px]">
           <AssetAllocation data={allocationData} />
        </div>

      </div>
    </div>
  );
};

export default AnalyticsView;