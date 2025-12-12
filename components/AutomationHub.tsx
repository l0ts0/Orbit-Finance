import React from 'react';
import { Briefcase, TrendingUp, Calendar, ArrowRight } from 'lucide-react';
import { Automation } from '../types';

interface AutomationHubProps {
  automations: Automation[];
}

const AutomationHub: React.FC<AutomationHubProps> = ({ automations }) => {
  return (
    <div className="bg-surface border border-border rounded-3xl p-6 shadow-lg">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-slate-200 font-semibold text-lg">Active Automations</h3>
        <button className="text-indigo-400 text-sm font-medium hover:text-indigo-300 transition-colors">Manage</button>
      </div>

      <div className="grid gap-4">
        {automations.map((auto) => {
          const isIncome = auto.type === 'RECURRING' && auto.transactionType === 'INCOME';
          
          return (
            <div key={auto.id} className="group relative overflow-hidden bg-slate-950/50 hover:bg-slate-800/50 border border-border rounded-2xl p-4 transition-all duration-300">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-xl ${isIncome ? 'bg-emerald-500/10 text-emerald-400' : 'bg-indigo-500/10 text-indigo-400'}`}>
                    {isIncome ? <Briefcase size={20} /> : <TrendingUp size={20} />}
                  </div>
                  <div>
                    <h4 className="text-slate-200 font-medium">{auto.name}</h4>
                    <p className="text-slate-400 text-sm mt-0.5">
                      {isIncome ? '+' : '-'}${auto.amount.toLocaleString()} {auto.currency}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className="inline-flex items-center gap-1 bg-slate-800 text-slate-400 text-xs px-2.5 py-1 rounded-full border border-slate-700">
                    <Calendar size={12} />
                    Monthly ({auto.dayOfMonth}th)
                  </span>
                </div>
              </div>
              
              <div className="mt-4 flex items-center justify-between border-t border-slate-800/50 pt-3">
                 <span className="text-xs text-slate-500">Next run: Day {auto.dayOfMonth}</span>
                 <ArrowRight size={14} className="text-slate-600 group-hover:text-indigo-400 transition-colors transform group-hover:translate-x-1" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AutomationHub;