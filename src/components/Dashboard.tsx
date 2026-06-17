import React, { useState, useEffect } from 'react';
import { BarChart3, Users, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { api } from '../services/api';

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const data = await api.getDashboardStats();
      setStats(data);
    } catch (error) {
      console.error("Erro ao carregar estatísticas:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-400">Carregando Dashboard...</div>;
  if (!stats) return <div className="p-8 text-center text-slate-400">Erro ao carregar dados.</div>;

  return (
    <div className="p-6 w-full">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Dashboard</h1>
        <p className="text-slate-500 dark:text-slate-400">Visão geral da atividade do sistema.</p>
      </div>

      {/* Cards de Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-lg">
            <BarChart3 size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400">Total Pedidos</p>
            <h3 className="text-2xl font-bold text-slate-800 dark:text-white">{stats.totalTickets}</h3>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-amber-100 dark:bg-amber-900/30 text-amber-600 rounded-lg">
            <Clock size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400">Em Análise</p>
            <h3 className="text-2xl font-bold text-slate-800 dark:text-white">{stats.pendingTickets}</h3>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 rounded-lg">
            <AlertCircle size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400">Em Reparação</p>
            <h3 className="text-2xl font-bold text-slate-800 dark:text-white">{stats.activeTickets}</h3>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded-lg">
            <CheckCircle size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400">Concluídos</p>
            <h3 className="text-2xl font-bold text-slate-800 dark:text-white">{stats.completedTickets}</h3>
          </div>
        </div>
      </div>

      {/* Gráficos Simplificados (Barras CSS) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6">Distribuição de Estados</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-slate-600 dark:text-slate-300">Em Análise</span>
                <span className="font-bold text-slate-800 dark:text-white">{stats.pendingTickets}</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2.5">
                <div className="bg-amber-500 h-2.5 rounded-full" style={{ width: `${(stats.pendingTickets / stats.totalTickets) * 100}%` }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-slate-600 dark:text-slate-300">Em Reparação</span>
                <span className="font-bold text-slate-800 dark:text-white">{stats.activeTickets}</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2.5">
                <div className="bg-indigo-500 h-2.5 rounded-full" style={{ width: `${(stats.activeTickets / stats.totalTickets) * 100}%` }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-slate-600 dark:text-slate-300">Concluídos</span>
                <span className="font-bold text-slate-800 dark:text-white">{stats.completedTickets}</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2.5">
                <div className="bg-emerald-500 h-2.5 rounded-full" style={{ width: `${(stats.completedTickets / stats.totalTickets) * 100}%` }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Gráfico de Atividade (Simulado) */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6">Atividade Recente (Últimos 7 Dias)</h3>
          <div className="flex-1 min-h-[200px] w-full">
            {/* Usando Recharts para o gráfico */}
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={[
                  { name: 'Seg', tickets: 4 },
                  { name: 'Ter', tickets: 3 },
                  { name: 'Qua', tickets: 7 },
                  { name: 'Qui', tickets: 5 },
                  { name: 'Sex', tickets: 8 },
                  { name: 'Sáb', tickets: 2 },
                  { name: 'Dom', tickets: 1 },
                ]}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                <XAxis dataKey="name" stroke="#9ca3af" tick={{ fontSize: 12 }} />
                <YAxis stroke="#9ca3af" tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', borderColor: '#374151', color: '#fff' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Area type="monotone" dataKey="tickets" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;