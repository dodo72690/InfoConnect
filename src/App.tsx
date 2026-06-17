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
  History, // Ícone para histórico
  Wrench, // Ícone para técnicos
  Bell // Ícone para notificações
} from 'lucide-react'; // Biblioteca de ícones
import logoImg from './assets/logo.png'; // Logótipo da aplicação
import PainelPrincipal from './components/PainelPrincipal'; // Painel principal (Admin/Técnico)
import DetalhesPedido from './components/DetalhesPedido'; // Detalhes de um pedido específico
import PaginaAutenticacao from './components/PaginaAutenticacao'; // Página de Login/Registo
import PaginaInicial from './components/PaginaInicial'; // Página inicial pública
import SeccaoFAQ from './components/SeccaoFAQ'; // Perguntas Frequentes
import ModalNovoPedido from './components/ModalNovoPedido'; // Modal para criar novo pedido
import ListaClientes from './components/ListaClientes'; // Lista de clientes (Admin)
import ListaTecnicos from './components/ListaTecnicos'; // Lista de Tecnicos
import PainelCliente from './components/PainelCliente'; // Painel do Cliente
import GestaoUtilizadores from './components/GestaoUtilizadores'; // Gestão de utilizadores (Admin)
import PainelRelatorios from './components/PainelRelatorios'; // Relatórios e Estatísticas
import LogsSistema from './components/LogsSistema'; // Logs do Sistema (Admin)
import DefinicoesNotificacao from './components/DefinicoesNotificacao'; // Componente de definições de notificação
import { Ticket, UserRole, TicketStatus, User, SystemLog, LogType, Message } from './types'; // Tipos TypeScript partilhados
import { api } from './services/api'; // Serviço de comunicação com o Backend (API)

const getAvatarUrl = (url?: string) => {
  if (!url) return `https://api.dicebear.com/7.x/avataaars/svg?seed=default`;
  if (url.startsWith('/uploads')) {
    const backendUrl = import.meta.env.VITE_API_URL || '';
    const base = backendUrl.replace('/api', '');
    return `${base}${url}`;
  }
  return url;
};

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
  const [currentView, setCurrentView] = useState<'dashboard' | 'tickets' | 'clients' | 'technicians' | 'settings' | 'faq' | 'users' | 'reports' | 'logs'>('dashboard');

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
  const [prefilledTicketDescription, setPrefilledTicketDescription] = useState('');

  // --- ESTADO DE LOGS ---
  const [logs, setLogs] = useState<SystemLog[]>([]);

  // --- ESTADO DE NOTIFICAÇÕES & LOGS DO UTILIZADOR ---
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isNotificationDropdownOpen, setIsNotificationDropdownOpen] = useState(false);
  const [userActivityLogs, setUserActivityLogs] = useState<any[]>([]);
  const [isLoadingUserLogs, setIsLoadingUserLogs] = useState(false);
  const [showAllUserLogs, setShowAllUserLogs] = useState(false);

  // --- TEMA (Forced Dark Mode) ---
  const [theme] = useState<'dark'>('dark');

  // Aplica a classe 'dark' ao HTML quando o estado muda (redundante se index.html já tiver, mas garante consistência)
  useEffect(() => {
    document.documentElement.classList.add('dark');
    localStorage.setItem('theme', 'dark');
  }, []);

  const toggleTheme = () => {
    // No-op: Theme is locked to dark
  };


  // Função para buscar tickets
  const fetchTickets = async (showLoading = true) => {
    if (!currentUser) return;
    if (showLoading) setIsLoadingTickets(true);
    try {
      const data = await api.getTickets();
      setTickets(prevTickets => {
        // Cria um mapa das mensagens existentes para preservar durante a atualização
        // O endpoint getTickets retorna messages: [] vazio, então precisamos manter o que já carregamos via polling detalhado
        const existingMessagesMap = new Map<string, Message[]>(prevTickets.map(t => [t.id, t.messages]));

        return data.map(newTicket => ({
          ...newTicket,
          messages: (existingMessagesMap.has(newTicket.id) && existingMessagesMap.get(newTicket.id)!.length > 0)
            ? existingMessagesMap.get(newTicket.id)!
            : newTicket.messages
        }));
      });
    } catch (error) {
      console.error("Erro ao buscar tickets:", error);
    } finally {
      if (showLoading) setIsLoadingTickets(false);
    }
  };

  // Função para buscar logs
  const fetchLogs = async () => {
    if (!currentUser || currentUser.role !== UserRole.ADMIN) return;
    try {
      const data = await api.getLogs();
      setLogs(data);
    } catch (error) {
      console.error("Erro ao buscar logs:", error);
    }
  };

  // Função para buscar notificações
  const fetchNotifications = async () => {
    if (!currentUser) return;
    try {
      const data = await api.getNotifications(currentUser.id);
      setNotifications(data);
    } catch (error) {
      console.error("Erro ao buscar notificações:", error);
    }
  };

  // Função para buscar logs de atividade do utilizador
  const fetchUserLogs = async () => {
    if (!currentUser) return;
    setIsLoadingUserLogs(true);
    try {
      const data = await api.getUserLogs(currentUser.id);
      setUserActivityLogs(data);
    } catch (error) {
      console.error("Erro ao buscar logs do utilizador:", error);
    } finally {
      setIsLoadingUserLogs(false);
    }
  };

  // Efeito: carregar notificações (com Polling de 5s)
  useEffect(() => {
    if (isAuthenticated && currentUser) {
      fetchNotifications();
      const intervalId = setInterval(fetchNotifications, 5000);
      return () => clearInterval(intervalId);
    }
  }, [isAuthenticated, currentUser]);

  // Efeito: carregar logs de atividade quando o ecrã de Definições é aberto
  useEffect(() => {
    if (currentView === 'settings' && currentUser) {
      fetchUserLogs();
    }
  }, [currentView, currentUser]);

  // Efeito inicial: carregar tickets se autenticado (com Polling de 3s)
  useEffect(() => {
    if (isAuthenticated && currentUser) {
      fetchTickets(true); // Busca inicial com loading

      const intervalId = setInterval(() => {
        fetchTickets(false); // Busca em background sem loading
      }, 3000);

      return () => clearInterval(intervalId); // Limpa o intervalo ao desmontar/logout
    }
  }, [isAuthenticated, currentUser]);

  // Efeito: carregar logs quando mudar para a view 'logs' (com Polling de 3s)
  useEffect(() => {
    let intervalId: any;

    if (currentView === 'logs' && isAuthenticated && currentUser?.role === UserRole.ADMIN) {
      fetchLogs(); // Busca inicial
      intervalId = setInterval(fetchLogs, 3000);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [currentView, isAuthenticated, currentUser]);



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
        addLog('Início de Sessão', `Utilizador ${user.email} iniciou sessão.`, LogType.SYSTEM, user);
        // Redireciona para a view correta baseada no papel do utilizador
        // Agora todos vão para o dashboard inicialmente (ClientDashboard ou Dashboard Admin)
        setCurrentView('dashboard');
      }

      // Configuração inicial pós-login
      setCurrentUser(user);
      setIsAuthenticated(true);
      setShowLanding(false);
      localStorage.setItem('currentUser', JSON.stringify(user));
      addLog('Início de Sessão', `Utilizador ${user.email} iniciou sessão.`, LogType.SYSTEM, user);

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
      addLog('Fim de Sessão', `Utilizador ${currentUser.email} terminou sessão.`, LogType.SYSTEM);
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
      addLog('Criação de Pedido', `Novo pedido criado`, LogType.INTERVENTION);
      setCurrentView('tickets');
      setIsNewTicketModalOpen(false);
    } catch (error) {
      alert('Erro ao criar pedido');
    }
  };

  const handleOpenTicketWithDescription = (desc: string) => {
    setPrefilledTicketDescription(desc);
    setIsNewTicketModalOpen(true);
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
        addLog('Alteração de Estado', `Pedido ${updatedTicket.id} estado alterado para ${updatedTicket.status}`, LogType.INTERVENTION);
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
          addLog('Criação de Orçamento', `Orçamento criado para pedido ${updatedTicket.id}`, LogType.INTERVENTION);
        }
        // Se já tinha e o status mudou (Aprovação/Rejeição)
        else if (oldTicket.budget.status !== updatedTicket.budget.status) {
          await api.updateBudgetStatus(updatedTicket.id, updatedTicket.budget.status);
          addLog('Atualização de Orçamento', `Orçamento ${updatedTicket.budget.status} para pedido ${updatedTicket.id}`, LogType.INTERVENTION);
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
    addLog('Eliminação de Pedido', `Pedido ${ticketId} eliminado`, LogType.INTERVENTION);
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

  // Efeito: Quando um ticket é selecionado, carrega as mensagens detalhadas dele e inicia Polling (Tempo Real)
  useEffect(() => {
    let intervalId: any;

    if (selectedTicketId) {
      const fetchMessages = () => {
        api.getMessages(selectedTicketId).then(msgs => {
          setTickets(prev => prev.map(t => {
            if (t.id === selectedTicketId) {
              // Verifica se houve mudança real (tamanho ou ID da última mensagem)
              // para evitar re-render desnecessário que causa "piscar"
              if (t.messages.length === msgs.length &&
                (t.messages.length > 0 && t.messages[t.messages.length - 1].id === msgs[msgs.length - 1].id)) {
                return t; // Sem mudanças, retorna o objeto original (React ignora)
              }
              return { ...t, messages: msgs };
            }
            return t;
          }));
        }).catch(err => console.error("Erro no polling de mensagens:", err));
      };

      // 1. Busca imediata
      fetchMessages();

      // 2. Configura intervalo de 3 segundos
      intervalId = setInterval(fetchMessages, 3000);
    }

    // Cleanup: Limpa o intervalo quando mudar de ticket ou fechar
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [selectedTicketId]);

  // Componente Auxiliar para itens da Sidebar
  const SidebarItem = ({ icon: Icon, label, view, count, className }: any) => (
    <button
      onClick={() => {
        setCurrentView(view);
        setSelectedTicketId(null);
        setIsSidebarOpen(false);
      }}
      className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors mb-1 ${currentView === view
        ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-medium'
        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
        } ${className || ''}`}
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
      <PaginaInicial onNavigateToLogin={() => {
        setShowLanding(false);
        setCurrentView('auth');
      }} />
    );
  }

  if (!isAuthenticated || !currentUser) {
    return (
      <PaginaAutenticacao
        onLogin={handleLogin}
        onBack={() => {
          setShowLanding(true);
          setCurrentView('landing');
        }}
      />
    );
  }

  const isAdmin = currentUser.role === UserRole.ADMIN;
  const isTech = currentUser.role === UserRole.TECHNICIAN;
  const isClient = currentUser.role === UserRole.CLIENT;

  return (
    <div className="flex h-screen bg-slate-100 dark:bg-slate-900 overflow-hidden transition-colors duration-300">

      {/* Modal global de criação de ticket */}
      <ModalNovoPedido
        isOpen={isNewTicketModalOpen}
        onClose={() => {
          setIsNewTicketModalOpen(false);
          setPrefilledTicketDescription('');
        }}
        onSubmit={handleCreateTicket}
        initialDescription={prefilledTicketDescription}
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
        <div className="flex-1 p-4 overflow-y-auto flex flex-col">

          {(isAdmin || isTech || isClient) && (
            <SidebarItem icon={LayoutDashboard} label={isClient ? "Início" : "Painel de Controlo"} view="dashboard" />
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

          {(isAdmin || isTech) && (
            <SidebarItem icon={Wrench} label="Lista Técnicos" view="technicians" />
          )}

          <SidebarItem icon={HelpCircle} label={isAdmin ? "Gestão FAQ" : "FAQ & Ajuda"} view="faq" />

          {/* Admin Only Items */}
          {isAdmin && (
            <>
              <SidebarItem icon={ShieldCheck} label="Utilizadores" view="users" />
              <SidebarItem icon={FileBarChart} label="Relatórios" view="reports" />
              <SidebarItem icon={History} label="Logs do Sistema" view="logs" />
            </>
          )}

          <SidebarItem icon={Settings} label="Definições" view="settings" className="mt-auto" />
        </div>

        {/* Rodapé da Sidebar (Tema e Perfil) */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-700">
          <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl mb-3">
            <img src={getAvatarUrl(currentUser.avatarUrl)} alt="Avatar" className="w-10 h-10 rounded-full object-cover bg-slate-200 dark:bg-slate-600" />
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

        {/* Cabeçalho Global (Desktop e Mobile) */}
        <header className="bg-white dark:bg-slate-800/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-700 px-6 py-4 flex items-center justify-between z-30">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(true)} className="text-slate-600 dark:text-slate-300 lg:hidden">
              <Menu size={24} />
            </button>
            <h1 className="text-lg font-semibold text-slate-800 dark:text-slate-100 hidden lg:block">
              {currentView === 'dashboard' ? (isClient ? 'Início' : 'Painel de Controlo') :
               currentView === 'tickets' ? (isClient ? 'Meus Pedidos' : 'Gestão de Pedidos') :
               currentView === 'clients' ? 'Lista de Clientes' :
               currentView === 'technicians' ? 'Lista de Técnicos' :
               currentView === 'faq' ? (isAdmin ? 'Gestão FAQ' : 'FAQ & Ajuda') :
               currentView === 'users' ? 'Utilizadores' :
               currentView === 'reports' ? 'Relatórios' :
               currentView === 'logs' ? 'Logs do Sistema' : 'Definições'}
            </h1>
            <div className="lg:hidden flex items-center gap-2">
              <img src={logoImg} alt="Logo" className="w-10 h-10 object-contain" />
              <span className="font-semibold text-slate-700 dark:text-slate-200">InfoConnect</span>
            </div>
          </div>

          {/* Notificações */}
          <div className="flex items-center gap-4">
            <div className="relative">
              <button
                onClick={() => setIsNotificationDropdownOpen(!isNotificationDropdownOpen)}
                className="relative p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                <Bell size={20} />
                {notifications.filter(n => !n.read).length > 0 && (
                  <span className="absolute top-1 right-1 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                    {notifications.filter(n => !n.read).length}
                  </span>
                )}
              </button>

              {/* Dropdown de Notificações */}
              {isNotificationDropdownOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in-50 slide-in-from-top-1 duration-200">
                  <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-700/50">
                    <span className="font-semibold text-sm text-slate-800 dark:text-slate-200">Notificações</span>
                    {notifications.filter(n => !n.read).length > 0 && (
                      <button
                        onClick={async () => {
                          try {
                            await api.markAllNotificationsAsRead(currentUser.id);
                            fetchNotifications();
                          } catch (e) {
                            console.error(e);
                          }
                        }}
                        className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        Limpar todas
                      </button>
                    )}
                  </div>
                  <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-700">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-slate-400 text-sm">
                        Não tem notificações.
                      </div>
                    ) : (
                      notifications.map(n => (
                        <div
                          key={n.id}
                          onClick={async () => {
                            try {
                              await api.markNotificationAsRead(n.id);
                              setIsNotificationDropdownOpen(false);
                              fetchNotifications();
                              
                              // Redirecionar para o ticket se a mensagem contiver "#" seguido de dígitos
                              const ticketMatch = n.message.match(/#(\d+)/);
                              if (ticketMatch && ticketMatch[1]) {
                                setCurrentView('tickets');
                                setSelectedTicketId(ticketMatch[1]);
                              } else {
                                setCurrentView('tickets');
                              }
                            } catch (e) {
                              console.error(e);
                            }
                          }}
                          className={`p-4 text-left hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer transition-colors ${!n.read ? 'bg-blue-50/30 dark:bg-blue-900/10' : ''}`}
                        >
                          <p className={`text-xs text-slate-700 dark:text-slate-300 ${!n.read ? 'font-medium' : ''}`}>
                            {n.message}
                          </p>
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 block">
                            {new Date(n.createdAt).toLocaleDateString()} {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-hidden flex relative">

          {/* --- RENDERIZAÇÃO DAS VISTAS (VIEWS) --- */}

          {currentView === 'settings' && (
            <div className="flex-1 overflow-y-auto w-full bg-slate-50 dark:bg-slate-900">
              <div className="p-4 lg:p-8 text-center text-slate-500 dark:text-slate-400 max-w-4xl mx-auto">
                <Settings size={48} className="mx-auto mb-4 text-slate-300 dark:text-slate-600" />
                <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-200">Definições</h2>
                <p className="text-sm">Gerir perfil, foto de perfil, notificações e preferências.</p>
                <p className="text-xs mt-1">Email: {currentUser.email}</p>

                {/* Alteração de Foto de Perfil */}
                <div className="mt-8 mb-6 w-full bg-white dark:bg-slate-800 p-4 md:p-6 rounded-xl border border-slate-200 dark:border-slate-700 text-left">
                  <h3 className="font-semibold mb-4 text-slate-800 dark:text-white flex items-center gap-2">
                    <Users size={18} className="text-blue-600" />
                    Foto de Perfil
                  </h3>
                  
                  <div className="flex flex-col md:flex-row items-center gap-6">
                    {/* Current Avatar Preview */}
                    <div className="relative group">
                      <img
                        src={getAvatarUrl(currentUser.avatarUrl)}
                        alt="Avatar Atual"
                        className="w-24 h-24 rounded-full object-cover border-4 border-blue-500/20 bg-slate-200 dark:bg-slate-700"
                      />
                    </div>

                    <div className="flex-1 w-full">
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                        Escolha um dos avatares predefinidos ou carregue a sua própria foto de perfil.
                      </p>

                      {/* Predefined Avatars Grid */}
                      <div className="grid grid-cols-6 gap-2 mb-4">
                        {[
                          'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
                          'https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka',
                          'https://api.dicebear.com/7.x/avataaars/svg?seed=Liliana',
                          'https://api.dicebear.com/7.x/avataaars/svg?seed=Milo',
                          'https://api.dicebear.com/7.x/avataaars/svg?seed=Oliver',
                          'https://api.dicebear.com/7.x/avataaars/svg?seed=Sophia'
                        ].map((avatarSeed, idx) => (
                          <button
                            key={idx}
                            onClick={async () => {
                              try {
                                await api.updateAvatar(currentUser.id, avatarSeed);
                                const updatedUser = { ...currentUser, avatarUrl: avatarSeed };
                                setCurrentUser(updatedUser);
                                localStorage.setItem('currentUser', JSON.stringify(updatedUser));
                                addLog('Atualização de Avatar', `Utilizador escolheu o avatar predefinido ${idx + 1}`, LogType.SYSTEM);
                              } catch (err: any) {
                                alert(err.message);
                              }
                            }}
                            className={`p-1 rounded-full border-2 transition-all hover:scale-105 ${
                              currentUser.avatarUrl === avatarSeed
                                ? 'border-blue-500 bg-blue-500/10'
                                : 'border-transparent hover:border-slate-300 dark:hover:border-slate-600'
                            }`}
                          >
                            <img src={avatarSeed} alt={`Avatar ${idx + 1}`} className="w-10 h-10 rounded-full" />
                          </button>
                        ))}
                      </div>

                      {/* Custom Upload Button */}
                      <div className="flex items-center gap-3">
                        <label className="cursor-pointer bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs font-semibold py-2 px-4 rounded-lg transition-colors border border-slate-200 dark:border-slate-600">
                          Carregar Foto Personalizada
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              try {
                                const res = await api.updateAvatar(currentUser.id, file);
                                const updatedUser = { ...currentUser, avatarUrl: res.avatarUrl };
                                setCurrentUser(updatedUser);
                                localStorage.setItem('currentUser', JSON.stringify(updatedUser));
                                addLog('Atualização de Avatar', `Utilizador carregou uma foto personalizada`, LogType.SYSTEM);
                              } catch (err: any) {
                                alert(err.message);
                              }
                            }}
                          />
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Edit Profile Form */}
                <div className="mt-8 mb-6 w-full bg-white dark:bg-slate-800 p-4 md:p-6 rounded-xl border border-slate-200 dark:border-slate-700 text-left">
                  <h3 className="font-semibold mb-4 text-slate-800 dark:text-white flex items-center gap-2">
                    <Users size={18} className="text-blue-600" />
                    Editar Perfil
                  </h3>
                  <form onSubmit={async (e) => {
                    e.preventDefault();
                    const form = e.target as HTMLFormElement;
                    const name = (form.elements.namedItem('name') as HTMLInputElement).value;
                    const email = (form.elements.namedItem('email') as HTMLInputElement).value;
                    const phone = (form.elements.namedItem('phone') as HTMLInputElement).value;

                    try {
                      await api.updateProfile(currentUser.id, { name, email, phone });
                      const updatedUser = { ...currentUser, name, email, phone };
                      setCurrentUser(updatedUser);
                      localStorage.setItem('currentUser', JSON.stringify(updatedUser));
                      addLog('Atualização de Perfil', `Utilizador atualizou o perfil (Nome: ${name})`, LogType.SYSTEM);
                      alert("Perfil atualizado com sucesso!");
                    } catch (error: any) {
                      alert(error.message);
                    }
                  }} className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Nome</label>
                      <input name="name" type="text" defaultValue={currentUser.name} required className="w-full text-sm border rounded p-2 dark:bg-slate-700 dark:text-white dark:border-slate-600" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Email</label>
                      <input name="email" type="email" defaultValue={currentUser.email} required className="w-full text-sm border rounded p-2 dark:bg-slate-700 dark:text-white dark:border-slate-600" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Telemóvel</label>
                      <input name="phone" type="tel" defaultValue={currentUser.phone} className="w-full text-sm border rounded p-2 dark:bg-slate-700 dark:text-white dark:border-slate-600" />
                    </div>
                    <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors mt-2">
                      Guardar Alterações
                    </button>
                  </form>
                </div>

                {/* Change Password Form */}
                <div className="mt-8 w-full bg-white dark:bg-slate-800 p-4 md:p-6 rounded-xl border border-slate-200 dark:border-slate-700 text-left">
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
                      addLog('Alteração de Senha', `Utilizador alterou a sua senha.`, LogType.SYSTEM);
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
                  <DefinicoesNotificacao />
                )}

                {/* Histórico de Atividade do Utilizador */}
                <div className="mt-8 mb-6 w-full bg-white dark:bg-slate-800 p-4 md:p-6 rounded-xl border border-slate-200 dark:border-slate-700 text-left">
                  <h3 className="font-semibold mb-4 text-slate-800 dark:text-white flex items-center gap-2">
                    <History size={18} className="text-blue-600" />
                    Histórico de Atividade Recente
                  </h3>
                  {isLoadingUserLogs ? (
                    <p className="text-sm text-slate-400">A carregar atividades...</p>
                  ) : userActivityLogs.length === 0 ? (
                    <p className="text-sm text-slate-400">Nenhuma atividade registada.</p>
                  ) : (
                    <>
                      <div className="relative border-l border-slate-200 dark:border-slate-700 ml-3 pl-6 space-y-6 my-4">
                        {(showAllUserLogs ? userActivityLogs : userActivityLogs.slice(0, 5)).map(log => (
                          <div key={log.id} className="relative">
                            {/* Dot */}
                            <span className="absolute -left-[31px] top-1 bg-blue-500 w-3 h-3 rounded-full border-2 border-white dark:border-slate-800 ring-4 ring-blue-50 dark:ring-blue-900/20" />
                            <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                              {log.action}
                            </p>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                              {log.details}
                            </p>
                            <span className="text-[10px] text-slate-400 dark:text-slate-500 block mt-1">
                              {new Date(log.timestamp).toLocaleDateString()} {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        ))}
                      </div>
                      {userActivityLogs.length > 5 && (
                        <button
                          onClick={() => setShowAllUserLogs(!showAllUserLogs)}
                          className="mt-4 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                        >
                          {showAllUserLogs ? 'Ver menos' : `Ver mais (${userActivityLogs.length - 5} adicionais)`}
                        </button>
                      )}
                    </>
                  )}
                </div>

                {/* Zona de Risco: Eliminar Conta */}
                <div className="mt-8 mb-6 w-full bg-white dark:bg-slate-800 p-4 md:p-6 rounded-xl border border-red-200 dark:border-red-950/30 text-left">
                  <h3 className="font-semibold mb-2 text-red-600 dark:text-red-400">
                    Zona de Risco
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                    Ao eliminar a sua conta, todos os seus dados pessoais, tickets de suporte, histórico de mensagens e orçamentos serão permanentemente apagados da plataforma, em conformidade com as regras do RGPD.
                  </p>
                  <button
                    onClick={async () => {
                      if (currentUser.id === '1') {
                        alert("Não é permitido remover o administrador principal.");
                        return;
                      }
                      
                      const confirm1 = window.confirm("Tem a certeza absoluta de que deseja ELIMINAR permanentemente a sua conta? Esta ação não pode ser desfeita.");
                      if (!confirm1) return;

                      const confirm2 = window.confirm("Por favor confirme uma última vez. Todos os seus tickets e dados serão permanentemente apagados. Deseja continuar?");
                      if (!confirm2) return;

                      try {
                        await api.deleteUser(currentUser.id);
                        alert("A sua conta foi eliminada com sucesso. Obrigado por utilizar a InfoConnect.");
                        handleLogout();
                      } catch (error: any) {
                        alert("Erro ao eliminar conta: " + error.message);
                      }
                    }}
                    className="w-full bg-red-600 hover:bg-red-700 text-white py-2.5 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2"
                  >
                    Eliminar a Minha Conta Permanentemente
                  </button>
                </div>
              </div>
            </div>
          )}


          {currentView === 'faq' && (
            <div className="flex-1 overflow-y-auto w-full bg-slate-50 dark:bg-slate-900">
              <SeccaoFAQ
                isAdmin={isAdmin}
                isTech={isTech}
                currentUser={currentUser}
                onAddLog={addLog}
                onOpenTicketWithDescription={handleOpenTicketWithDescription}
              />
            </div>
          )}

          {currentView === 'clients' && (isAdmin || isTech) && (
            <div className="flex-1 overflow-y-auto w-full bg-slate-50 dark:bg-slate-900">
              <ListaClientes tickets={tickets} />
            </div>
          )}

          {currentView === 'technicians' && (isAdmin || isTech) && (
            <div className="flex-1 overflow-y-auto w-full bg-slate-50 dark:bg-slate-900">
              <ListaTecnicos />
            </div>
          )}

          {currentView === 'users' && isAdmin && (
            <div className="flex-1 overflow-y-auto w-full bg-slate-50 dark:bg-slate-900">
              <GestaoUtilizadores onAddLog={addLog} />
            </div>
          )}

          {currentView === 'reports' && isAdmin && (
            <div className="flex-1 overflow-y-auto w-full bg-slate-50 dark:bg-slate-900">
              <PainelRelatorios />
            </div>
          )}

          {currentView === 'logs' && isAdmin && (
            <div className="flex-1 overflow-y-auto w-full bg-slate-50 dark:bg-slate-900">
              <LogsSistema logs={logs} />
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
                    null
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
                <PainelPrincipal />
              ) : (
                <PainelCliente
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
                <DetalhesPedido
                  ticket={selectedTicket}
                  currentUser={currentUser}
                  onClose={() => setSelectedTicketId(null)}
                  onUpdateTicket={handleUpdateTicket}
                  onDeleteTicket={handleDeleteTicket}
                  onAddLog={addLog}
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