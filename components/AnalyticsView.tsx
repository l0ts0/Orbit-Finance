import React, { useMemo, useState } from 'react';
import { ChartData, Transaction } from '../types';
import AssetAllocation from './AssetAllocation';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell, PieChart, Pie } from 'recharts';
import { ArrowLeft, Calendar } from 'lucide-react';

interface AnalyticsViewProps {
  onBack: () => void;
  allocationData: ChartData[];
  currentNetWorth: number;
  transactions: Transaction[];
}

type TimeRange = 'THIS_MONTH' | 'LAST_MONTH' | 'LAST_3_MONTHS' | 'ALL';

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

const AnalyticsView: React.FC<AnalyticsViewProps> = ({ onBack, allocationData, currentNetWorth, transactions }) => {
  const [timeRange, setTimeRange] = useState<TimeRange>('THIS_MONTH');
  const historyData = useMemo(() => generateHistoryData(currentNetWorth), [currentNetWorth]);

  // 1. Filter Transactions by Time Range
  const filteredTransactions = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    return transactions.filter(t => {
      const tDate = new Date(t.date);

      switch (timeRange) {
        case 'THIS_MONTH':
          return tDate.getMonth() === now.getMonth() && tDate.getFullYear() === now.getFullYear();
        case 'LAST_MONTH': {
          const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          return tDate.getMonth() === lastMonth.getMonth() && tDate.getFullYear() === lastMonth.getFullYear();
        }
        case 'LAST_3_MONTHS': {
          const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, 1);
          return tDate >= threeMonthsAgo;
        }
        case 'ALL':
        default:
          return true;
      }
    });
  }, [transactions, timeRange]);

  // 2. Process Daily Expenses (Bar Chart)
  const dailyExpenseData = useMemo(() => {
    const expenseMap = new Map<string, number>();

    // If range is short (this/last month), show all days in range? 
    // Or just show days with data? Let's show days with data sorted + fill gaps if needed.
    // For simplicity, let's just group by date for the filtered set.

    filteredTransactions.forEach(t => {
      if (t.type === 'EXPENSE') {
        const dateKey = new Date(t.date).toLocaleDateString('zh-TW', { month: 'numeric', day: 'numeric' });
        expenseMap.set(dateKey, (expenseMap.get(dateKey) || 0) + t.amount);
      }
    });

    // Convert to array and sort by date
    // Note: Sorting by formatted string "M/D" might be wrong if across years, but for short ranges it's ok.
    // Better to sort by timestamp first.
    const sortedEntries = filteredTransactions
      .filter(t => t.type === 'EXPENSE')
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Re-aggregate based on sorted order to keep timeline correct
    const finalMap = new Map<string, number>();
    sortedEntries.forEach(t => {
      const dateKey = new Date(t.date).toLocaleDateString('zh-TW', { month: 'numeric', day: 'numeric' });
      finalMap.set(dateKey, (finalMap.get(dateKey) || 0) + t.amount);
    });

    return Array.from(finalMap.entries()).map(([date, amount]) => ({ date, amount }));
  }, [filteredTransactions]);

  // 3. Process Expenses by Category (Pie Chart)
  const categoryExpenseData = useMemo(() => {
    const catMap = new Map<string, number>();
    let total = 0;

    filteredTransactions.forEach(t => {
      if (t.type === 'EXPENSE') {
        catMap.set(t.category, (catMap.get(t.category) || 0) + t.amount);
        total += t.amount;
      }
    });

    return {
      data: Array.from(catMap.entries())
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value), // Sort by amount desc
      total
    };
  }, [filteredTransactions]);

  const COLORS = ['#f43f5e', '#fb923c', '#fbbf24', '#a3e635', '#34d399', '#22d3ee', '#818cf8', '#c084fc'];

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm overflow-y-auto">
      <div className="max-w-4xl mx-auto p-6 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="p-2 bg-slate-800 text-slate-300 rounded-xl hover:bg-slate-700 transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <h2 className="text-2xl font-bold text-white">資產與支出分析</h2>
          </div>

          {/* Time Range Selector */}
          <div className="flex bg-slate-900 p-1 rounded-xl">
            {(['THIS_MONTH', 'LAST_MONTH', 'LAST_3_MONTHS', 'ALL'] as TimeRange[]).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${timeRange === range
                  ? 'bg-indigo-600 text-white shadow-lg'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
              >
                {range === 'THIS_MONTH' && '本月'}
                {range === 'LAST_MONTH' && '上月'}
                {range === 'LAST_3_MONTHS' && '近3月'}
                {range === 'ALL' && '全部'}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 1. Daily Spending Trend (Bar Chart) */}
          <div className="bg-surface border border-border rounded-3xl p-6 shadow-lg">
            <h3 className="text-slate-200 font-bold text-lg mb-6 flex items-center gap-2">
              支出趨勢
              <span className="text-xs text-slate-500 font-normal">
                (總計: NT${categoryExpenseData.total.toLocaleString()})
              </span>
            </h3>
            <div className="h-[250px] w-full">
              {dailyExpenseData.length > 0 ? (
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
                      tickFormatter={(val) => `${val / 1000}k`}
                    />
                    <Tooltip
                      cursor={{ fill: '#1e293b' }}
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
              ) : (
                <div className="h-full flex items-center justify-center text-slate-500 text-sm">
                  此區間無支出資料
                </div>
              )}
            </div>
          </div>

          {/* 2. Expenses by Category (Pie Chart) - NEW */}
          <div className="bg-surface border border-border rounded-3xl p-6 shadow-lg flex flex-col h-full">
            <h3 className="text-slate-200 font-bold text-lg mb-2">消費分類佔比</h3>

            <div className="flex-1 min-h-[220px] relative">
              {categoryExpenseData.data.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryExpenseData.data}
                        innerRadius={65}
                        outerRadius={85}
                        paddingAngle={4}
                        dataKey="value"
                        stroke="none"
                        cornerRadius={6}
                      >
                        {categoryExpenseData.data.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '12px', color: '#f8fafc' }}
                        itemStyle={{ color: '#fff' }}
                        formatter={(val: number) => [`NT$${val.toLocaleString()}`, '金額']}
                      />
                    </PieChart>
                  </ResponsiveContainer>

                  {/* Center Text */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="text-center">
                      <span className="block text-slate-500 text-xs">總支出</span>
                      <span className="block text-white font-bold text-lg">
                        ${categoryExpenseData.total.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-500 text-sm">
                  此區間無消費資料
                </div>
              )}
            </div>

            {/* Legend */}
            <div className="mt-4 grid grid-cols-2 gap-2 max-h-[150px] overflow-y-auto pr-2 custom-scrollbar">
              {categoryExpenseData.data.map((entry, index) => (
                <div key={index} className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-800/30 transition-colors">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                    <span className="text-slate-400 text-sm truncate max-w-[80px]">{entry.name}</span>
                  </div>
                  <span className="text-slate-200 font-medium text-sm">
                    {Math.round((entry.value / categoryExpenseData.total) * 100)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 3. Net Worth Trend (Area Chart) */}
        <div className="bg-surface border border-border rounded-3xl p-6 shadow-lg">
          <h3 className="text-slate-200 font-bold text-lg mb-6">總資產走勢預估</h3>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={historyData}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
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
                  tickFormatter={(val) => `${(val / 10000).toFixed(0)}萬`}
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

        {/* 4. Asset Allocation Pie Chart */}
        <div className="h-[400px]">
          <AssetAllocation data={allocationData} />
        </div>

      </div>
    </div>
  );
};

export default AnalyticsView;