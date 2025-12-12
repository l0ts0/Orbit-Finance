import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { ChartData } from '../types';

interface AssetAllocationProps {
  data: ChartData[];
}

const AssetAllocation: React.FC<AssetAllocationProps> = ({ data }) => {
  return (
    <div className="bg-surface border border-border rounded-3xl p-6 shadow-lg flex flex-col h-full">
      <h3 className="text-slate-200 font-bold text-lg mb-2">資產分佈</h3>
      
      <div className="flex-1 min-h-[220px] relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              innerRadius={65}
              outerRadius={85}
              paddingAngle={4}
              dataKey="value"
              stroke="none"
              cornerRadius={6}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc', borderRadius: '12px' }}
              itemStyle={{ color: '#f8fafc' }}
              formatter={(value: number) => [`${value}%`, '佔比']}
            />
          </PieChart>
        </ResponsiveContainer>
        
        {/* Center Text */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <span className="block text-slate-500 text-xs">總計</span>
            <span className="block text-white font-bold text-xl">100%</span>
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        {data.map((item) => (
          <div key={item.name} className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-800/30 transition-colors">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
              <span className="text-slate-400 text-sm">{item.name}</span>
            </div>
            <span className="text-slate-200 font-medium text-sm">{item.value}%</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AssetAllocation;