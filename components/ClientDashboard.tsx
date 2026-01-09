import React from 'react';
import { Ticket, TicketStatus, User } from '../types';
import { Ticket as TicketIcon, CheckCircle, Clock, AlertCircle, Plus } from 'lucide-react';

interface ClientDashboardProps {
    tickets: Ticket[];
    currentUser: User;
    onCreateTicket: () => void;
    onNavigateToTickets: () => void;
}

const ClientDashboard: React.FC<ClientDashboardProps> = ({ tickets, currentUser, onCreateTicket, onNavigateToTickets }) => {
    // Filter tickets for this client just to be safe, although App.tsx might pass filtered info.
    // Assuming 'tickets' passed here are ALL tickets if coming from App state, or filtered.
    // But App.tsx logic usually filters "filteredTickets" for the list.
    // Let's assume we receive the full list and filter here by client ID to be sure.
    const myTickets = tickets.filter(t => t.clientId === currentUser.id);

    const total = myTickets.length;
    const pending = myTickets.filter(t => t.status === TicketStatus.ANALYSIS).length;
    const active = myTickets.filter(t => t.status === TicketStatus.REPAIR).length;
    const done = myTickets.filter(t => t.status === TicketStatus.DONE).length;

    return (
        <div className="p-6 max-w-6xl mx-auto">
            <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Olá, {currentUser.name.split(' ')[0]}!</h1>
                    <p className="text-slate-500 dark:text-slate-400">Bem-vindo à sua área de cliente. Acompanhe os seus pedidos.</p>
                </div>
                <button
                    onClick={onCreateTicket}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-5 py-2.5 rounded-xl font-medium shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:scale-[1.02] active:scale-95 transition-all duration-200 flex items-center gap-2"
                >
                    <Plus size={20} />
                    <span>Novo Pedido</span>
                </button>
            </div>

            {/* Cards de Métricas */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-lg">
                        <TicketIcon size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Total Pedidos</p>
                        <h3 className="text-2xl font-bold text-slate-800 dark:text-white">{total}</h3>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-amber-100 dark:bg-amber-900/30 text-amber-600 rounded-lg">
                        <Clock size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Em Análise</p>
                        <h3 className="text-2xl font-bold text-slate-800 dark:text-white">{pending}</h3>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 rounded-lg">
                        <AlertCircle size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Em Curso</p>
                        <h3 className="text-2xl font-bold text-slate-800 dark:text-white">{active}</h3>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded-lg">
                        <CheckCircle size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Concluídos</p>
                        <h3 className="text-2xl font-bold text-slate-800 dark:text-white">{done}</h3>
                    </div>
                </div>
            </div>

            {/* Atalho para ver lista */}
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-8 border border-blue-100 dark:border-blue-900/50 text-center">
                <h3 className="text-xl font-bold text-blue-900 dark:text-blue-200 mb-2">Precisa de consultar um pedido antigo?</h3>
                <p className="text-slate-600 dark:text-slate-400 mb-6">Aceda ao histórico completo de intervenções e acompanhe o estado em tempo real.</p>
                <button
                    onClick={onNavigateToTickets}
                    className="bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 px-6 py-2 rounded-lg font-medium hover:bg-blue-50 dark:hover:bg-slate-700 transition-colors"
                >
                    Ver Todos os Pedidos
                </button>
            </div>
        </div>
    );
};

export default ClientDashboard;
