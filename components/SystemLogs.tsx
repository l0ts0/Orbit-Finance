import React from 'react';
import { SystemLog } from '../types';
import { CheckCircle2, XCircle, AlertCircle, Terminal, X } from 'lucide-react';

interface SystemLogsProps {
  logs: SystemLog[];
  onClose: () => void;
  onClear: () => void;
}

const SystemLogs: React.FC<SystemLogsProps> = ({ logs, onClose, onClear }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-surface border border-border rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
        
        <div className="flex items-center justify-between p-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/20 rounded-lg text-indigo-400">
              <Terminal size={20} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">系統執行紀錄</h3>
              <p className="text-xs text-slate-500">自動化操作與定期定額紀錄</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={onClear} 
              className="text-xs text-slate-500 hover:text-white px-3 py-1.5 rounded-lg hover:bg-slate-800 transition-colors"
            >
              清除紀錄
            </button>
            <button onClick={onClose} className="text-slate-400 hover:text-white p-2">
              <X size={24} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar bg-slate-950/50">
          {logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-slate-600">
              <Terminal size={48} className="mb-4 opacity-20" />
              <p>尚無自動化執行紀錄</p>
            </div>
          ) : (
            logs.map((log) => (
              <div key={log.id} className="flex gap-4 p-4 rounded-xl bg-slate-900 border border-slate-800/50 hover:border-slate-700 transition-colors">
                <div className="mt-1">
                  {log.status === 'SUCCESS' && <CheckCircle2 className="text-emerald-500" size={20} />}
                  {log.status === 'FAILED' && <XCircle className="text-rose-500" size={20} />}
                  {log.status === 'SKIPPED' && <AlertCircle className="text-amber-500" size={20} />}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="text-slate-200 font-bold text-sm">{log.title}</h4>
                    <span className="text-xs text-slate-500 font-mono">
                      {new Date(log.date).toLocaleString([], {month:'numeric', day:'numeric', hour:'2-digit', minute:'2-digit'})}
                    </span>
                  </div>
                  <p className="text-slate-400 text-sm leading-relaxed">{log.description}</p>
                  {log.amount && (
                    <div className="mt-2 inline-block px-2 py-1 bg-slate-800 rounded text-xs font-mono text-indigo-300 border border-slate-700">
                      {log.amount}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default SystemLogs;