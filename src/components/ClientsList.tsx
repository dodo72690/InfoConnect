import React, { useState, useEffect } from 'react';
import { User, Ticket } from '../types';
import { Users, Mail, Building2, Phone, ExternalLink, Loader2 } from 'lucide-react';
import { api } from '../services/api';

interface ClientsListProps {
  tickets: Ticket[]; // Para calcular estatísticas por cliente
}

const ClientsList: React.FC<ClientsListProps> = ({ tickets }) => {
  const [clients, setClients] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    try {
      const data = await api.getClients();
      setClients(data);
    } catch (error) {
      console.error("Erro ao carregar clientes:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getClientStats = (clientId: string) => {
    // Nota: O clientId nos tickets deve corresponder ao ID do cliente.
    // Como convertemos tudo para string no backend, deve funcionar.
    const clientTickets = tickets.filter(t => t.clientId === clientId);
    return {
      total: clientTickets.length,
      active: clientTickets.filter(t => t.status !== 'Concluído').length
    };
  };

  if (isLoading) {
    return (
      <div className="p-8 w-full flex justify-center items-center text-slate-500">
        <Loader2 className="animate-spin mr-2" size={24} /> Carregando clientes...
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 w-full max-w-6xl mx-auto">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Gestão de Clientes</h1>
          <p className="text-slate-500 dark:text-slate-400">Lista de empresas e contactos registados.</p>
        </div>
      </div>

      {
        clients.length === 0 ? (
          <div className="text-center py-10 text-slate-400 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
            <p>Nenhum cliente encontrado.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {clients.map(client => {
              const stats = getClientStats(client.id);
              return (
                <div key={client.id} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6 shadow-sm hover:shadow-md transition-all">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <img src={client.avatarUrl} alt={client.name} className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-700" />
                      <div>
                        <h3 className="font-bold text-slate-800 dark:text-white">{client.name}</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400">ID: {client.id}</p>
                      </div>
                    </div>
                    <button className="text-slate-400 hover:text-blue-600 dark:hover:text-blue-400">
                      <ExternalLink size={18} />
                    </button>
                  </div>

                  <div className="space-y-3 text-sm text-slate-600 dark:text-slate-300 mb-6">
                    <div className="flex items-center gap-2">
                      <Building2 size={16} className="text-slate-400" />
                      <span className="font-medium">{client.companyName || 'Particular'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail size={16} className="text-slate-400" />
                      <span className="truncate">{client.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone size={16} className="text-slate-400" />
                      <span>{client.phone || 'N/A'}</span>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100 dark:border-slate-700 flex justify-between items-center">
                    <div className="text-center">
                      <p className="text-xl font-bold text-slate-800 dark:text-white">{stats.total}</p>
                      <p className="text-[10px] uppercase tracking-wider text-slate-400 dark:text-slate-500">Total Pedidos</p>
                    </div>
                    <div className="h-8 w-px bg-slate-200 dark:bg-slate-700"></div>
                    <div className="text-center">
                      <p className={`text-xl font-bold ${stats.active > 0 ? 'text-amber-500' : 'text-emerald-500'}`}>
                        {stats.active}
                      </p>
                      <p className="text-[10px] uppercase tracking-wider text-slate-400 dark:text-slate-500">Ativos</p>
                    </div>
                    <div className="h-8 w-px bg-slate-200 dark:bg-slate-700"></div>
                    <button className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 bg-blue-50 dark:bg-blue-900/20 px-3 py-1.5 rounded-lg">
                      Ver Perfil
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )
      }
    </div >
  );
};

export default ClientsList;