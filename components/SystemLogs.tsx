import React, { useState } from 'react';
import { SystemLog, LogType } from '../types';
import { History, Search, Filter, Download, Info, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

interface SystemLogsProps {
  logs: SystemLog[];
}

const SystemLogs: React.FC<SystemLogsProps> = ({ logs }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<LogType | 'all'>('all');

  // Filter logic
  const filteredLogs = (Array.isArray(logs) ? logs : []).filter(log => {
    const matchesSearch =
      (log.action?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (log.details?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (log.userName?.toLowerCase() || '').includes(searchTerm.toLowerCase());

    const matchesType = filterType === 'all' || log.type === filterType;

    return matchesSearch && matchesType;
  }).sort((a, b) => (b.timestamp?.getTime() || 0) - (a.timestamp?.getTime() || 0)); // Newest first

  const getIcon = (type: LogType) => {
    switch (type) {
      case LogType.SYSTEM: return <CheckCircle size={16} className="text-green-500" />;
      case LogType.INTERVENTION: return <Info size={16} className="text-blue-500" />;
      case LogType.ERROR: return <XCircle size={16} className="text-red-500" />;
      default: return <Info size={16} className="text-slate-500" />;
    }
  };

  return (
    <div className="p-4 lg:p-8 w-full max-w-6xl mx-auto">
      <div className="mb-6 flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <History className="text-slate-400" /> Logs do Sistema
          </h1>
          <p className="text-slate-500 dark:text-slate-400">Histórico de auditoria e atividades da plataforma.</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg text-sm font-medium transition-colors">
          <Download size={16} /> Exportar CSV
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 mb-6 shadow-sm flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 text-slate-400" size={18} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Pesquisar logs (utilizador, ação, detalhes)..."
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto">
          <Filter size={18} className="text-slate-400 shrink-0" />
          {[
            { label: 'Todos', value: 'all' },
            { label: 'Sistema', value: LogType.SYSTEM },
            { label: 'Intervenção', value: LogType.INTERVENTION },
            { label: 'Erro', value: LogType.ERROR }
          ].map(opt => (
            <button
              key={opt.value}
              onClick={() => setFilterType(opt.value as any)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${filterType === opt.value
                  ? 'bg-slate-800 dark:bg-white text-white dark:text-slate-900'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700 text-xs uppercase text-slate-500 dark:text-slate-400 font-semibold">
                <th className="px-6 py-4 w-48">Data / Hora</th>
                <th className="px-6 py-4 w-10">Tipo</th>
                <th className="px-6 py-4">Ação</th>
                <th className="px-6 py-4">Utilizador</th>
                <th className="px-6 py-4">Detalhes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {filteredLogs.length > 0 ? (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors font-mono text-sm">
                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                      {log.timestamp.toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      {getIcon(log.type)}
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-200">
                      {log.action}
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                      {log.userName} <span className="text-xs text-slate-400">({log.userId})</span>
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                      {log.details}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400 dark:text-slate-500">
                    Nenhum registo encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SystemLogs;