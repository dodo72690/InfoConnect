import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Ticket as TicketIcon,
  Settings,
  LogOut,
  Plus,
  Search,
  Menu,
  HelpCircle,
  Users,
  Sun,
  Moon,
  FileBarChart,
  ShieldCheck,
  History // Ícone para histórico
} from 'lucide-react'; // Biblioteca de ícones
import logoImg from './assets/logo.png'; // Logótipo da aplicação
import Dashboard from './components/Dashboard'; // Painel principal (Admin/Técnico)
import TicketDetail from './components/TicketDetail'; // Detalhes de um pedido (Chat)
import AuthPage from './components/AuthPage'; // Página de Login/Registo
import LandingPage from './components/LandingPage'; // Página inicial pública
import FAQSection from './components/FAQSection'; // Perguntas Frequentes
import NewTicketModal from './components/NewTicketModal'; // Modal para criar novo pedido
import ClientsList from './components/ClientsList'; // Lista de clientes (Admin)
import ClientDashboard from './components/ClientDashboard'; // Painel do Cliente
import UsersManagement from './components/UsersManagement'; // Gestão de utilizadores (Admin)
import ReportsPanel from './components/ReportsPanel'; // Relatórios e Estatísticas
import SystemLogs from './components/SystemLogs'; // Logs de atividade do sistema
import { Ticket, UserRole, TicketStatus, User, SystemLog, LogType } from './types'; // Tipos TypeScript partilhados
import { api } from './services/api'; // Serviço de comunicação com o Backend (API)

function App() {
  // --- ESTADO DE AUTENTICAÇÃO ---
  // Controla se o utilizador está logado e quem é ele.
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    if (typeof window !== 'undefined') {
      const storedUser = localStorage.getItem('currentUser');
      return !!storedUser;
    }
    return false;
  });

  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    if (typeof window !== 'undefined') {
      const storedUser = localStorage.getItem('currentUser');
      return storedUser ? JSON.parse(storedUser) : null;
    }
    return null;
  });

  const [authError, setAuthError] = useState<string>('');

  // --- ESTADO DE NAVEGAÇÃO ---
  // Controla se mostra a Landing Page inicial ou a App
  const [showLanding, setShowLanding] = useState(() => {
    // Se tiver autenticado, não mostra landing
    if (typeof window !== 'undefined') {
      return !localStorage.getItem('currentUser');
    }
    return true;
  });

  // ... (rest of states remain same) ...

  // Controla qual "página" interna está visível (Dashboard, Tickets, Configurações, etc.)
  const [currentView, setCurrentView] = useState<'dashboard' | 'tickets' | 'clients' | 'settings' | 'faq' | 'users' | 'reports' | 'logs'>('dashboard');

  // --- ESTADO DE DADOS ---
  // Armazena a lista de pedidos carregada da API
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoadingTickets, setIsLoadingTickets] = useState(false);

  // --- ESTADO DE UI ---
  // ID do ticket selecionado para visualização detalhada
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  // Controle do menu lateral em mobile
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  // Filtro da lista de tickets
  const [filterStatus, setFilterStatus] = useState<string>('all');
  // Controle do modal de criação de novo ticket
  const [isNewTicketModalOpen, setIsNewTicketModalOpen] = useState(false);

  // --- ESTADO DE LOGS ---
  const [logs, setLogs] = useState<SystemLog[]>([]);

  // --- TEMA (Dark/Light Mode) ---
  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') || 'light';
    }
    return 'light';
  });

  // Aplica a classe 'dark' ao HTML quando o estado muda
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  // --- EFEITO: CARREGAR DADOS ---
  // Sempre que o utilizador se autentica (isAuthenticated muda para true), buscamos os tickets na API.
  useEffect(() => {
    if (isAuthenticated) {
      fetchTickets();
    }
  }, [isAuthenticated]);

  /**
   * Função para buscar os tickets do Backend usando o serviço api.ts
   */
  const fetchTickets = async () => {
    setIsLoadingTickets(true);
    try {
      const data = await api.getTickets();
      setTickets(data);
    } catch (error) {
      console.error("Erro ao carregar pedidos:", error);
    } finally {
      setIsLoadingTickets(false);
    }
  };

  // Carregar Logs se for Admin
  useEffect(() => {
    if (currentUser?.role === UserRole.ADMIN) {
      api.getLogs().then(setLogs).catch(console.error);
    }
  }, [currentUser, currentView]); // Recarrega ao entrar na view ou mudar user

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  // Função auxiliar para registrar logs de sistema (Backend)
  const addLog = async (action: string, details: string, type: LogType = LogType.INTERVENTION, user: User | null = currentUser) => {
    try {
      // Salva no backend
      await api.createLog(
        action,
        details,
        user?.id || 'anonymous',
        user?.name || 'Anonymous',
        type
      );
      // Atualiza a lista local se estivermos a ver logs (ou apenas recarrega periodicamente)
      // Se for admin, poderia fazer append local para feedback imediato
      if (currentUser?.role === UserRole.ADMIN) {
        // Opcional: fetchLogs() ou append local otimista
        const newLog: SystemLog = {
          id: `temp-${Date.now()}`,
          action,
          details,
          userId: user?.id || 'anonymous',
          userName: user?.name || 'Anonymous',
          timestamp: new Date(),
          type
        };
        setLogs(prev => [newLog, ...prev]);
      }
    } catch (error) {
      console.error("Erro ao criar log:", error);
    }
  };

  // --- HANDLERS (Ações do Utilizador) ---

  // Gerencia o processo de login
  const handleLogin = async (user: User | any) => {
    try {
      // Se recebermos um utilizador completo (do AuthPage), definimos o estado
      if (user.id) {
        setCurrentUser(user);
        setIsAuthenticated(true);
        setShowLanding(false);
        localStorage.setItem('currentUser', JSON.stringify(user));
        return;
      }

      // Configuração inicial pós-login
      setCurrentUser(user);
      setIsAuthenticated(true);
      setShowLanding(false);
      localStorage.setItem('currentUser', JSON.stringify(user));
      addLog('LOGIN', `Utilizador ${user.email} iniciou sessão.`, LogType.SYSTEM, user);

      // Redireciona para a view correta baseada no papel do utilizador
      // Agora todos vão para o dashboard inicialmente (ClientDashboard ou Dashboard Admin)
      setCurrentView('dashboard');
    } catch (err) {
      setAuthError('Falha no login');
    }
  };

  // Gerencia o logout
  const handleLogout = () => {
    if (currentUser) {
      addLog('LOGOUT', `Utilizador ${currentUser.email} terminou sessão.`, LogType.SYSTEM);
    }
    // Reseta todos os estados críticos
    setIsAuthenticated(false);
    setCurrentUser(null);
    setSelectedTicketId(null);
    setIsSidebarOpen(false);
    setShowLanding(true); // Voltamos para landing page
    setTickets([]);
    localStorage.removeItem('currentUser');
  };

  // Criação de Ticket chamando a API
  const handleCreateTicket = async (data: any) => {
    if (!currentUser) return;

    try {
      await api.createTicket(currentUser.id, data.description, data.file);
      await fetchTickets(); // Recarrega a lista para mostrar o novo ticket
      addLog('TICKET_CREATE', `Novo pedido criado`, LogType.INTERVENTION);
      setCurrentView('tickets');
      setIsNewTicketModalOpen(false);
    } catch (error) {
      alert('Erro ao criar pedido');
    }
  };

  // Atualização de Ticket (Estado ou Novas Mensagens)
  const handleUpdateTicket = async (updatedTicket: Ticket) => {
    // 1. Atualização Otimista: Atualiza a UI imediatamente antes da resposta do servidor
    setTickets(prev => prev.map(t => t.id === updatedTicket.id ? updatedTicket : t));

    const oldTicket = tickets.find(t => t.id === updatedTicket.id);

    try {
      // 2. Se o estado mudou, chama a API para atualizar estado
      if (oldTicket && oldTicket.status !== updatedTicket.status) {
        await api.updateStatus(updatedTicket.id, updatedTicket.status);
        addLog('STATUS_CHANGE', `Pedido ${updatedTicket.id} estado alterado`, LogType.INTERVENTION);
      }

      // 3. Se há novas mensagens, chama a API para enviar mensagem
      if (updatedTicket.messages.length > (oldTicket?.messages.length || 0)) {
        const newMsg = updatedTicket.messages[updatedTicket.messages.length - 1];
        // Ignora mensagens de sistema geradas localmente (ex: Orçamento Aprovado) pois o backend não as salva assim
        if (!newMsg.text.startsWith('[SISTEMA]')) {
          await api.sendMessage(updatedTicket.id, newMsg.senderType, newMsg.text);
        }
      }

      // 4. Lógica de Orçamento
      if (updatedTicket.budget) {
        // Se não tinha orçamento antes, é uma criação
        if (!oldTicket?.budget) {
          await api.createBudget(updatedTicket.id, updatedTicket.budget.value, updatedTicket.budget.description || '');
          addLog('BUDGET_CREATE', `Orçamento criado para pedido ${updatedTicket.id}`, LogType.INTERVENTION);
        }
        // Se já tinha e o status mudou (Aprovação/Rejeição)
        else if (oldTicket.budget.status !== updatedTicket.budget.status) {
          await api.updateBudgetStatus(updatedTicket.id, updatedTicket.budget.status);
          addLog('BUDGET_UPDATE', `Orçamento ${updatedTicket.budget.status} para pedido ${updatedTicket.id}`, LogType.INTERVENTION);
        }
      }
    } catch (e) {
      console.error("Erro ao sincronizar update:", e);
      fetchTickets(); // Reverte para o estado do servidor em caso de erro
    }
  };

  // Handler para apagar ticket e atualizar estado localmente
  const handleDeleteTicket = (ticketId: string) => {
    // Remove o ticket da lista local
    setTickets(prev => prev.filter(t => t.id !== ticketId));
    // Fecha o detalhe se estiver aberto
    if (selectedTicketId === ticketId) {
      setSelectedTicketId(null);
    }
    // Log
    addLog('TICKET_DELETE', `Pedido ${ticketId} eliminado`, LogType.INTERVENTION);
  };

  // Lógica de Filtro: Filtra tickets baseados no papel do usuário e no status selecionado
  const filteredTickets = tickets.filter(t => {
    if (!currentUser) return false;
    // Clientes só veem os seus próprios tickets
    if (currentUser.role === UserRole.CLIENT && t.clientId !== currentUser.id) return false;
    // Filtro por status (Em análise, Concluído, etc)
    if (filterStatus !== 'all' && t.status !== filterStatus) return false;
    return true;
  });

  const selectedTicket = tickets.find(t => t.id === selectedTicketId);

  // Efeito: Quando um ticket é selecionado, carrega as mensagens detalhadas dele
  useEffect(() => {
    if (selectedTicketId) {
      api.getMessages(selectedTicketId).then(msgs => {
        setTickets(prev => prev.map(t => {
          if (t.id === selectedTicketId) {
            return { ...t, messages: msgs };
          }
          return t;
        }));
      });
    }
  }, [selectedTicketId]);

  // Componente Auxiliar para itens da Sidebar
  const SidebarItem = ({ icon: Icon, label, view, count }: any) => (
    <button
      onClick={() => {
        setCurrentView(view);
        setSelectedTicketId(null);
        setIsSidebarOpen(false);
      }}
      className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors mb-1 ${currentView === view
        ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-medium'
        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
        }`}
    >
      <div className="flex items-center gap-3">
        <Icon size={20} />
        <span>{label}</span>
      </div>
      {count > 0 && (
        <span className="bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 text-xs px-2 py-0.5 rounded-full font-bold">
          {count}
        </span>
      )}
    </button>
  );

  // --- RENDERIZAÇÃO CONDICIONAL ---

  if (!isAuthenticated && showLanding) {
    return (
      <LandingPage
        onNavigateToLogin={() => setShowLanding(false)}
        theme={theme}
        toggleTheme={toggleTheme}
      />
    );
  }

  if (!isAuthenticated || !currentUser) {
    return (
      <AuthPage
        onLogin={async (userData) => {
          if (userData.email && userData.id && userData.id.startsWith('new-')) {
            handleLogin(userData);
          } else if (userData.email) {
            try {
              handleLogin(userData);
            } catch (e) {
              alert("Erro de autenticação");
            }
          }
        }}
        theme={theme}
        toggleTheme={toggleTheme}
        onBack={() => setShowLanding(true)}
      />
    );
  }

  const isAdmin = currentUser.role === UserRole.ADMIN;
  const isTech = currentUser.role === UserRole.TECHNICIAN;
  const isClient = currentUser.role === UserRole.CLIENT;

  return (
    <div className="flex h-screen bg-slate-100 dark:bg-slate-900 overflow-hidden transition-colors duration-300">

      {/* Modal global de criação de ticket */}
      <NewTicketModal
        isOpen={isNewTicketModalOpen}
        onClose={() => setIsNewTicketModalOpen(false)}
        onSubmit={handleCreateTicket}
      />

      {/* Overlay para mobile quando sidebar está aberta */}
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setIsSidebarOpen(false)} />
      )}

      {/* Sidebar de Navegação */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 transform transition-transform duration-300 ease-in-out flex flex-col
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Cabeçalho da Sidebar */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
          <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-bold text-xl">
            <img src={logoImg} alt="Logo" className="w-16 h-16 object-contain" />
            <span>InfoConnect</span>
          </div>
        </div>
        <div className="px-6 pb-2 pt-2">
          <p className="text-xs text-slate-400 dark:text-slate-500 uppercase tracking-wider font-semibold">
            {isAdmin ? 'Área Administrativa' : isTech ? 'Área Técnica' : 'Área Cliente'}
          </p>
        </div>

        {/* Links de Navegação (Variam conforme permissão) */}
        <div className="flex-1 p-4 overflow-y-auto">

          {(isAdmin || isTech || isClient) && (
            <SidebarItem icon={LayoutDashboard} label={isClient ? "Início" : "Painel de Controlo"} view="dashboard" />
          )}

          {isAdmin && (
            <>
              <SidebarItem icon={Users} label="Gestão Utilizadores" view="users" />
              <SidebarItem icon={FileBarChart} label="Relatórios" view="reports" />
              <SidebarItem icon={History} label="Logs do Sistema" view="logs" />
            </>
          )}

          <SidebarItem
            icon={TicketIcon}
            label={isClient ? "Meus Pedidos" : "Gestão de Pedidos"}
            view="tickets"
            count={isAdmin || isTech ? tickets.filter(t => t.status === TicketStatus.ANALYSIS).length : 0}
          />

          {(isAdmin || isTech) && (
            <SidebarItem icon={Users} label="Lista Clientes" view="clients" />
          )}

          <SidebarItem icon={HelpCircle} label={isAdmin ? "Gestão FAQ" : "FAQ & Ajuda"} view="faq" />

          <SidebarItem icon={Settings} label="Definições" view="settings" />
        </div>

        {/* Rodapé da Sidebar (Tema e Perfil) */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-700">
          <button
            onClick={toggleTheme}
            className="w-full flex items-center justify-between p-2 mb-4 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            <span className="text-sm font-medium flex items-center gap-2">
              {theme === 'light' ? <Sun size={16} /> : <Moon size={16} />}
              Modo {theme === 'light' ? 'Claro' : 'Escuro'}
            </span>
            <div className={`w-8 h-4 bg-slate-300 dark:bg-slate-600 rounded-full relative transition-colors`}>
              <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full shadow-sm transition-all ${theme === 'dark' ? 'left-4.5' : 'left-0.5'}`} style={{ left: theme === 'dark' ? '18px' : '2px' }} />
            </div>
          </button>

          <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl mb-3">
            <img src={currentUser.avatarUrl} alt="Avatar" className="w-10 h-10 rounded-full object-cover bg-slate-200 dark:bg-slate-600" />
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 truncate">{currentUser.name}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                {currentUser.role}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 text-xs text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors border border-transparent p-2 rounded-lg"
          >
            <LogOut size={14} /> Terminar Sessão
          </button>
        </div>
      </aside>

      {/* Conteúdo Principal */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">

        {/* Cabeçalho Mobile */}
        <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-4 flex items-center justify-between lg:hidden">
          <button onClick={() => setIsSidebarOpen(true)} className="text-slate-600 dark:text-slate-300">
            <Menu size={24} />
          </button>
          <div className="flex items-center gap-2">
            <img src={logoImg} alt="Logo" className="w-12 h-12 object-contain" />
            <span className="font-semibold text-slate-700 dark:text-slate-200">InfoConnect</span>
          </div>
          <div className="w-6" />
        </header>

        <div className="flex-1 overflow-hidden flex relative">

          {/* --- RENDERIZAÇÃO DAS VISTAS (VIEWS) --- */}

          {currentView === 'settings' && (
            <div className="flex-1 overflow-y-auto w-full bg-slate-50 dark:bg-slate-900">
              <div className="p-8 text-center text-slate-500 dark:text-slate-400">
                <Settings size={48} className="mx-auto mb-4 text-slate-300 dark:text-slate-600" />
                <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-200">Definições</h2>
                <p>Gerir perfil, notificações automáticas e preferências.</p>
                <p className="text-sm mt-4">Email: {currentUser.email}</p>

                {/* Change Password Form */}
                <div className="mt-8 max-w-md mx-auto bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 text-left">
                  <h3 className="font-semibold mb-4 text-slate-800 dark:text-white flex items-center gap-2">
                    <ShieldCheck size={18} className="text-blue-600" />
                    Alterar Senha
                  </h3>
                  <form onSubmit={async (e) => {
                    e.preventDefault();
                    const form = e.target as HTMLFormElement;
                    const currentPass = (form.elements.namedItem('currentPass') as HTMLInputElement).value;
                    const newPass = (form.elements.namedItem('newPass') as HTMLInputElement).value;
                    const confirmPass = (form.elements.namedItem('confirmPass') as HTMLInputElement).value;

                    if (newPass !== confirmPass) {
                      alert("As senhas não coincidem.");
                      return;
                    }

                    try {
                      await api.changePassword(currentUser.id, newPass, currentPass);
                      alert("Senha alterada com sucesso!");
                      form.reset();
                    } catch (error: any) {
                      alert(error.message);
                    }
                  }} className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Senha Atual</label>
                      <input name="currentPass" type="password" required className="w-full text-sm border rounded p-2 dark:bg-slate-700 dark:text-white dark:border-slate-600" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Nova Senha</label>
                      <input name="newPass" type="password" required className="w-full text-sm border rounded p-2 dark:bg-slate-700 dark:text-white dark:border-slate-600" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Confirmar Nova Senha</label>
                      <input name="confirmPass" type="password" required className="w-full text-sm border rounded p-2 dark:bg-slate-700 dark:text-white dark:border-slate-600" />
                    </div>
                    <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors mt-2">
                      Atualizar Senha
                    </button>
                  </form>
                </div>

                {isAdmin && (
                  <div className="mt-6 max-w-md mx-auto bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                    <h3 className="font-semibold mb-2 text-slate-800 dark:text-white flex items-center justify-center gap-2">
                      <ShieldCheck size={18} className="text-blue-600" />
                      Configuração de Notificações
                    </h3>
                    <p className="text-xs text-slate-400 mb-4">Área exclusiva de administrador</p>
                    <div className="space-y-2 text-left">
                      <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                        <input type="checkbox" defaultChecked className="rounded text-blue-600" />
                        Enviar email ao criar ticket
                      </label>
                      <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                        <input type="checkbox" defaultChecked className="rounded text-blue-600" />
                        Notificar técnico responsável
                      </label>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}


          {currentView === 'faq' && (
            <div className="flex-1 overflow-y-auto w-full bg-slate-50 dark:bg-slate-900">
              <FAQSection isAdmin={isAdmin} isTech={isTech} />
            </div>
          )}

          {currentView === 'clients' && (isAdmin || isTech) && (
            <div className="flex-1 overflow-y-auto w-full bg-slate-50 dark:bg-slate-900">
              <ClientsList tickets={tickets} />
            </div>
          )}

          {currentView === 'users' && isAdmin && (
            <div className="flex-1 overflow-y-auto w-full bg-slate-50 dark:bg-slate-900">
              <UsersManagement />
            </div>
          )}

          {currentView === 'reports' && isAdmin && (
            <div className="flex-1 overflow-y-auto w-full bg-slate-50 dark:bg-slate-900">
              <ReportsPanel />
            </div>
          )}

          {currentView === 'logs' && isAdmin && (
            <div className="flex-1 overflow-y-auto w-full bg-slate-50 dark:bg-slate-900">
              <SystemLogs logs={logs} />
            </div>
          )}

          {/* Lista de Tickets (Aparece quando a view é 'tickets') */}
          <div className={`
              flex-1 flex flex-col bg-slate-50 dark:bg-slate-900 overflow-hidden transition-all duration-300
              ${(currentView !== 'tickets') ? 'hidden' : 'flex'} 
              ${selectedTicketId ? 'hidden lg:flex lg:w-1/3 lg:flex-none lg:border-r lg:border-slate-200 lg:dark:border-slate-700' : 'w-full'}
            `}>
            {currentView === 'tickets' && (
              <>
                <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                  <div className="flex justify-between items-center mb-4">
                    <h1 className="text-xl font-bold text-slate-800 dark:text-white">Pedidos</h1>
                    {isClient && (
                      <button
                        onClick={() => setIsNewTicketModalOpen(true)}
                        className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 transition-colors shadow-sm flex items-center gap-2 text-sm font-medium pr-4"
                      >
                        <Plus size={18} /> Novo Pedido
                      </button>
                    )}
                  </div>
                  {/* Barra de Pesquisa */}
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
                    <input
                      type="text"
                      placeholder="Pesquisar pedidos..."
                      className="w-full bg-slate-100 dark:bg-slate-700 dark:text-slate-200 border-none rounded-lg pl-10 py-2 text-sm focus:ring-2 focus:ring-blue-500 dark:placeholder-slate-400"
                    />
                  </div>
                  {/* Filtros de Status */}
                  <div className="flex gap-2 mt-3 overflow-x-auto pb-1 scrollbar-hide">
                    {['all', TicketStatus.ANALYSIS, TicketStatus.REPAIR, TicketStatus.DONE].map((status) => (
                      <button
                        key={status}
                        onClick={() => setFilterStatus(status)}
                        className={`px-3 py-1 text-xs rounded-full whitespace-nowrap border transition-colors ${filterStatus === status
                          ? 'bg-slate-800 dark:bg-slate-600 text-white border-slate-800 dark:border-slate-600'
                          : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                          }`}
                      >
                        {status === 'all' ? 'Todos' : status}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Lista Renderizada */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {isLoadingTickets ? (
                    <div className="text-center py-10 text-slate-400">A carregar pedidos...</div>
                  ) : filteredTickets.length === 0 ? (
                    <div className="text-center py-10 text-slate-400">
                      <p>Nenhum pedido encontrado.</p>
                    </div>
                  ) : (
                    filteredTickets.map(ticket => (
                      <div
                        key={ticket.id}
                        onClick={() => setSelectedTicketId(ticket.id)}
                        className={`p-4 rounded-xl border cursor-pointer transition-all hover:shadow-md ${selectedTicketId === ticket.id
                          ? 'bg-white dark:bg-slate-800 border-blue-500 shadow-md ring-1 ring-blue-500'
                          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-slate-600'
                          }`}
                      >
                        <div className="flex justify-between items-start mb-1">
                          <span className="font-semibold text-slate-800 dark:text-slate-200 text-sm">Pedido #{ticket.id}</span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full ${ticket.status === TicketStatus.ANALYSIS ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' :
                            ticket.status === TicketStatus.DONE ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' :
                              'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                            }`}>
                            {ticket.status}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-3 mt-1">{ticket.description}</p>
                        <div className="flex justify-between items-center text-xs text-slate-400 dark:text-slate-500">
                          <span>{ticket.clientName}</span>
                          <span>{new Date(ticket.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </>
            )}
          </div>

          {/* Detalhe do Ticket (View Lado Direito) */}
          {currentView === 'dashboard' ? (
            <div className="flex-1 overflow-y-auto p-4 lg:p-8 w-full bg-slate-100 dark:bg-slate-900">
              {(isAdmin || isTech) ? (
                <Dashboard />
              ) : (
                <ClientDashboard
                  tickets={tickets}
                  currentUser={currentUser}
                  onCreateTicket={() => setIsNewTicketModalOpen(true)}
                  onNavigateToTickets={() => setCurrentView('tickets')}
                />
              )}
            </div>
          ) : currentView === 'tickets' ? (
            <div className={`
                 flex-1 bg-white dark:bg-slate-800 lg:block 
                 ${selectedTicketId ? 'absolute inset-0 z-10 lg:static' : 'hidden'}
               `}>
              {selectedTicket ? (
                <TicketDetail
                  ticket={selectedTicket}
                  currentUser={currentUser}
                  onClose={() => setSelectedTicketId(null)}
                  onUpdateTicket={handleUpdateTicket}
                  onDeleteTicket={handleDeleteTicket}
                />
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 bg-slate-50 dark:bg-slate-900 border-l border-slate-200 dark:border-slate-700">
                  <div className="bg-white dark:bg-slate-800 p-4 rounded-full mb-4 shadow-sm">
                    <TicketIcon size={40} className="text-slate-300 dark:text-slate-600" />
                  </div>
                  <p className="text-lg font-medium text-slate-500">Selecione um pedido</p>
                  <p className="text-sm">Escolha um pedido da lista para ver os detalhes.</p>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </main>
    </div>
  );
}

export default App;