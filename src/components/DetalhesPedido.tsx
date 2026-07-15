import React, { useState, useEffect, useRef } from 'react';
import { Ticket, User, TicketStatus, UserRole, Message, BudgetStatus, Budget, LogType } from '../types';
import {
  Send, Clock, ArrowLeft, User as UserIcon, Paperclip,
  FileText, Download, Euro, CheckCircle2, XCircle, MessageSquare, Mail, X, Trash2, Sparkles
} from 'lucide-react';

interface TicketDetailProps {
  ticket: Ticket;
  currentUser: User;
  onClose: () => void;
  onUpdateTicket: (ticket: Ticket) => void;
  onDeleteTicket: (ticketId: string) => void;
  onAddLog: (action: string, details: string, type: LogType) => void;
}

import { api } from '../services/api';

interface InternalComment {
  id: string;
  id_tecnico: number;
  nome_tecnico: string;
  comentario: string;
  data_comentario: string;
}

const DetalhesPedido: React.FC<TicketDetailProps> = ({ ticket, currentUser, onClose, onUpdateTicket, onDeleteTicket, onAddLog }) => {
  // Controle de abas (Chat, Orçamento, Interno)
  const [activeTab, setActiveTab] = useState<'chat' | 'budget' | 'internal'>('chat');

  // Estado para nova mensagem
  const [newMessage, setNewMessage] = useState('');

  // Estado para formulário de orçamento
  const [budgetAmount, setBudgetAmount] = useState('');
  const [budgetDesc, setBudgetDesc] = useState('');

  // Estados para contrapropostas
  const [showCounterForm, setShowCounterForm] = useState(false);
  const [counterValue, setCounterValue] = useState('');
  const [counterReason, setCounterReason] = useState('');
  const [isSubmittingCounter, setIsSubmittingCounter] = useState(false);
  const [isProcessingCounter, setIsProcessingCounter] = useState(false);
  const [showCreateFormForRejected, setShowCreateFormForRejected] = useState(false);

  // Estado para comentários internos
  const [internalComments, setInternalComments] = useState<InternalComment[]>([]);
  const [newInternalComment, setNewInternalComment] = useState('');

  // Estados para Avaliação de Serviço
  const [userStars, setUserStars] = useState(0);
  const [hoverStars, setHoverStars] = useState(0);
  const [userComment, setUserComment] = useState('');
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);

  // Estado para envio de email
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [emailTo, setEmailTo] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');

  // Inicializa o email "Para" e limpa/preenche campos de orçamento quando abre o modal ou muda o ticket
  useEffect(() => {
    if (ticket.clientEmail) {
      setEmailTo(ticket.clientEmail);
    } else {
      setEmailTo('');
    }

    if (ticket.budget) {
      setBudgetAmount(String(ticket.budget.value));
      setBudgetDesc(ticket.budget.description || '');
    } else {
      setBudgetAmount('');
      setBudgetDesc('');
    }
    setShowCreateFormForRejected(false);
  }, [ticket.id]);

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.sendTicketEmail(ticket.id, emailTo, emailSubject, emailBody);
      onAddLog('Envio de Email', `Email enviado para ${emailTo} (Pedido #${ticket.id})`, LogType.INTERVENTION);
      alert("Email enviado com sucesso!");
      setIsEmailModalOpen(false);
      setEmailSubject('');
      setEmailBody('');
    } catch (error) {
      alert("Erro ao enviar email.");
    }
  };

  const handleDeleteTicket = async () => {
    if (!confirm("Tem a certeza que deseja eliminar este pedido? Esta ação não pode ser desfeita.")) return;

    try {
      await api.deleteTicket(ticket.id);
      onDeleteTicket(ticket.id); // Atualiza estado no pai (App.tsx) sem reload 
    } catch (error) {
      alert("Erro ao eliminar pedido.");
    }
  };

  // Referência para o fim da lista de mensagens (auto-scroll)
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Função para rolar o chat para baixo automaticamente
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Rola para baixo sempre que chegam novas mensagens ou a aba muda
  useEffect(() => {
    scrollToBottom();
  }, [ticket.messages, activeTab]);

  // Carregar comentários internos quando a aba é selecionada
  useEffect(() => {
    if (activeTab === 'internal' && isStaff) {
      loadInternalComments();
    }
  }, [activeTab, ticket.id]);

  const loadInternalComments = async () => {
    try {
      const comments = await api.getInternalComments(ticket.id);
      setInternalComments(comments);
    } catch (error) {
      console.error("Erro ao carregar comentários internos:", error);
    }
  };

  const handleSendInternalComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInternalComment.trim()) return;

    try {
      await api.addInternalComment(ticket.id, currentUser.id, newInternalComment);
      setNewInternalComment('');
      loadInternalComments();
    } catch (error) {
      alert("Erro ao enviar comentário interno");
    }
  };

  // Verifica se o usuário atual é da equipe (Admin ou Técnico)
  const isStaff = currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.TECHNICIAN;

  /**
   * Envia uma mensagem para o chat do pedido.
   * Determina automaticamente se o remetente é 'Cliente' ou 'Técnico' baseado no user logado.
   */
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    // Lógica para definir o tipo de remetente (Banco de dados aceita apenas 'Cliente' ou 'Técnico')
    const senderType = isStaff ? 'Técnico' : 'Cliente';

    const msg: Message = {
      id: `${Date.now()}`,
      senderType: senderType,
      text: newMessage,
      timestamp: new Date()
    };

    // Cria um novo objeto ticket com a mensagem adicionada
    const updatedTicket = {
      ...ticket,
      messages: [...ticket.messages, msg]
    };

    // Propaga a atualização para o componente pai (App.tsx) que chama a API
    onUpdateTicket(updatedTicket);
    setNewMessage('');
  };

  /**
   * Cria uma proposta de orçamento (apenas para staff).
   */
  const handleCreateBudget = (e: React.FormEvent) => {
    e.preventDefault();
    if (!budgetAmount || !budgetDesc) return;

    const newBudget: Budget = {
      id: `${Date.now()}`,
      value: Number(budgetAmount),
      description: budgetDesc,
      status: BudgetStatus.PENDING,
      createdAt: new Date()
    };

    onUpdateTicket({
      ...ticket,
      budget: newBudget
    });

    setShowCreateFormForRejected(false);
    setBudgetAmount('');
    setBudgetDesc('');
  };

  /**
   * Aprova ou Rejeita um orçamento (apenas para clientes).
   * Também gera uma mensagem de sistema no chat informando a decisão.
   */
  const handleBudgetAction = (approved: boolean) => {
    if (!ticket.budget) return;

    const updatedBudget = {
      ...ticket.budget,
      status: approved ? BudgetStatus.APPROVED : BudgetStatus.REJECTED
    };

    // Se aprovado, muda o status do ticket para 'Em reparação', senão volta para 'Em análise'
    const newStatus = approved ? TicketStatus.REPAIR : TicketStatus.ANALYSIS;

    // Mensagem automática de sistema
    const sysMsg: Message = {
      id: `sys-${Date.now()}`,
      senderType: isStaff ? 'Técnico' : 'Cliente',
      text: approved
        ? `[SISTEMA] Orçamento Aprovado`
        : `[SISTEMA] Orçamento Recusado`,
      timestamp: new Date()
    };

    onUpdateTicket({
      ...ticket,
      status: newStatus,
      budget: updatedBudget,
      messages: [...ticket.messages, sysMsg]
    });
  };

  const handleSubmitCounterProposal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!counterValue || !counterReason || isSubmittingCounter) return;

    setIsSubmittingCounter(true);
    try {
      await api.submitCounterProposal(ticket.id, Number(counterValue), counterReason);
      
      // Criar mensagem de sistema
      const sysMsg: Message = {
        id: `sys-${Date.now()}`,
        senderType: 'Cliente',
        text: `[SISTEMA] Contraproposta enviada: ${counterValue}€ (${counterReason})`,
        timestamp: new Date()
      };

      // Atualizar o ticket localmente e notificar o componente pai
      const updatedBudget: Budget = {
        ...ticket.budget!,
        status: BudgetStatus.COUNTER_PROPOSAL,
        counterValue: Number(counterValue),
        counterReason: counterReason
      };

      onUpdateTicket({
        ...ticket,
        budget: updatedBudget,
        messages: [...ticket.messages, sysMsg]
      });

      onAddLog('Envio de Contraproposta', `Contraproposta de ${counterValue}€ submetida para o pedido #${ticket.id}`, LogType.INTERVENTION);
      setShowCounterForm(false);
      setCounterValue('');
      setCounterReason('');
    } catch (err: any) {
      alert(err.message || 'Erro ao enviar contraproposta');
    } finally {
      setIsSubmittingCounter(false);
    }
  };

  const handleCounterProposalAction = async (action: 'approve' | 'reject') => {
    if (!ticket.budget || isProcessingCounter) return;

    setIsProcessingCounter(true);
    try {
      await api.handleCounterProposal(ticket.id, action, currentUser.id);

      const approved = action === 'approve';
      const newStatus = approved ? TicketStatus.REPAIR : TicketStatus.ANALYSIS;
      const budgetStatus = approved ? BudgetStatus.APPROVED : BudgetStatus.REJECTED;
      const finalValue = approved ? ticket.budget.counterValue! : ticket.budget.value;

      const sysMsg: Message = {
        id: `sys-${Date.now()}`,
        senderType: 'Técnico',
        text: approved
          ? `[SISTEMA] Contraproposta Aceite (Novo valor: ${finalValue}€)`
          : `[SISTEMA] Contraproposta Recusada`,
        timestamp: new Date()
      };

      const updatedBudget: Budget = {
        ...ticket.budget,
        value: finalValue,
        status: budgetStatus
      };

      onUpdateTicket({
        ...ticket,
        status: newStatus,
        budget: updatedBudget,
        messages: [...ticket.messages, sysMsg]
      });

      onAddLog(
        approved ? 'Aceitação de Contraproposta' : 'Recusa de Contraproposta',
        approved 
          ? `Contraproposta de ${finalValue}€ aceite para o pedido #${ticket.id}`
          : `Contraproposta recusada para o pedido #${ticket.id}`,
        LogType.INTERVENTION
      );
    } catch (err: any) {
      alert(err.message || 'Erro ao processar ação');
    } finally {
      setIsProcessingCounter(false);
    }
  };

  // Handler para mudança manual de status pelo técnico (dropdown no topo)
  const handleStatusChange = (newStatus: TicketStatus) => {
    const updatedTicket = {
      ...ticket,
      status: newStatus
    };
    onUpdateTicket(updatedTicket);
  };

  // Submete a avaliação do cliente
  const handleSubmitRating = async (e: React.FormEvent) => {
    e.preventDefault();
    if (userStars === 0 || isSubmittingRating) return;

    setIsSubmittingRating(true);
    try {
      await api.rateTicket(ticket.id, userStars, userComment);
      const updatedTicket = {
        ...ticket,
        ratingStars: userStars,
        ratingComment: userComment
      };
      onUpdateTicket(updatedTicket);
      onAddLog('Avaliação do Cliente', `Avaliação registada para o pedido #${ticket.id} (${userStars} estrelas)`, LogType.INTERVENTION);
      alert("Avaliação submetida com sucesso! Obrigado pelo seu feedback.");
    } catch (error) {
      alert("Erro ao submeter avaliação.");
    } finally {
      setIsSubmittingRating(false);
    }
  };

  // Auxiliar para cores dos badges de status
  const getStatusColor = (status: TicketStatus) => {
    switch (status) {
      case TicketStatus.ANALYSIS: return 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800';
      case TicketStatus.REPAIR: return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800';
      case TicketStatus.DONE: return 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
      default: return 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300';
    }
  };

  // Verifica se a mensagem foi enviada por "mim" (para alinhar à direita no chat)
  const isMe = (msg: Message) => {
    if (isStaff && msg.senderType === 'Técnico') return true;
    if (!isStaff && msg.senderType === 'Cliente') return true;
    return false;
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-slate-800 transition-colors">
      {/* Header: Detalhes principais do pedido */}
      <div className="p-4 md:p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-start bg-white dark:bg-slate-800">
        <div className="flex items-start gap-4">
          <button onClick={onClose} className="mt-1 lg:hidden text-slate-500 dark:text-slate-400">
            <ArrowLeft size={20} />
          </button>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <h2 className="text-xl font-bold text-slate-800 dark:text-white">Pedido #{ticket.id}</h2>
              <span className={`px-3 py-0.5 rounded-full text-xs font-semibold border ${getStatusColor(ticket.status)}`}>
                {ticket.status}
              </span>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-2 mb-2">{ticket.description}</p>
            <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1"><UserIcon size={12} /> {ticket.clientName}</span>
              <span className="flex items-center gap-1"><Clock size={12} /> {new Date(ticket.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        {/* Ações (Visível apenas para Admin e Técnico): Mudar Status */}
        {isStaff && (
          <div className="flex gap-2 items-center">
            <button
              onClick={() => setIsEmailModalOpen(true)}
              className="p-2 text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-700/50 rounded-lg transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
              title="Enviar Email ao Cliente"
            >
              <Mail size={20} />
            </button>
            {currentUser.role === UserRole.ADMIN && (
              <button
                onClick={handleDeleteTicket}
                className="p-2 text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors border border-transparent hover:border-red-200 dark:hover:border-red-800"
                title="Eliminar Pedido"
              >
                <Trash2 size={20} />
              </button>
            )}
            <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 mx-1"></div>
            <select
              value={ticket.status}
              onChange={(e) => handleStatusChange(e.target.value as TicketStatus)}
              className="bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2"
            >
              {Object.values(TicketStatus).map((status) => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Navegação entre Abas */}
      <div className="flex border-b border-slate-200 dark:border-slate-700 px-4 md:px-6 gap-6 overflow-x-auto">
        <button
          onClick={() => setActiveTab('chat')}
          className={`py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'chat' ? 'border-blue-500 text-blue-600 dark:text-blue-400' : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
        >
          <MessageSquare size={16} /> Conversa
        </button>
        <button
          onClick={() => setActiveTab('budget')}
          className={`py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'budget' ? 'border-blue-500 text-blue-600 dark:text-blue-400' : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
        >
          <Euro size={16} /> Orçamento
          {ticket.budget && (
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${ticket.budget.status === BudgetStatus.APPROVED ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' :
              ticket.budget.status === BudgetStatus.REJECTED ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300' : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
              }`}>
              {ticket.budget.status}
            </span>
          )}
        </button>
        {isStaff && (
          <button
            onClick={() => setActiveTab('internal')}
            className={`py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'internal' ? 'border-blue-500 text-blue-600 dark:text-blue-400' : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
          >
            <FileText size={16} /> Notas Internas
          </button>
        )}
      </div>

      {/* Área de Conteúdo (Scrollável) */}
      <div className="flex-1 overflow-y-auto bg-slate-50/50 dark:bg-slate-900/50 p-4 md:p-6 transition-colors">

        {/* CONTEÚDO DA ABA: ORÇAMENTO */}
        {activeTab === 'budget' && (
          <div className="max-w-2xl mx-auto">
            {ticket.budget && !(isStaff && ticket.budget.status === BudgetStatus.REJECTED && showCreateFormForRejected) ? (
              // Visualização de Orçamento Existente
              <div className="bg-white dark:bg-slate-800 p-4 md:p-8 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-1">Proposta de Orçamento</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Criado em {new Date(ticket.budget.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <span className="block text-2xl font-bold text-slate-900 dark:text-white">{ticket.budget.value.toFixed(2)} €</span>
                    <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-bold ${ticket.budget.status === BudgetStatus.APPROVED ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' :
                      ticket.budget.status === BudgetStatus.REJECTED ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300' :
                      ticket.budget.status === BudgetStatus.COUNTER_PROPOSAL ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-355 border border-amber-200 dark:border-amber-900/40' :
                      'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
                      }`}>
                      {ticket.budget.status.toUpperCase()}
                    </span>
                  </div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-700 p-4 rounded-lg border border-slate-100 dark:border-slate-600 text-slate-700 dark:text-slate-200 mb-6">
                  <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase mb-2">Descrição dos Serviços</h4>
                  {ticket.budget.description}
                </div>

                {/* Se o estado for 'Contraproposta' */}
                {ticket.budget.status === BudgetStatus.COUNTER_PROPOSAL && (
                  isStaff ? (
                    /* Técnico toma decisão sobre a contraproposta */
                    <div className="p-4 bg-amber-500/10 border border-amber-500/25 rounded-lg text-slate-850 dark:text-slate-200 mb-4 animate-in fade-in slide-in-from-top-2">
                      <p className="text-sm font-semibold mb-2 flex items-center gap-2 text-amber-600 dark:text-amber-400">
                        <Sparkles className="text-amber-500 animate-pulse animate-duration-1000" size={16} />
                        Contraproposta Recebida do Cliente
                      </p>
                      <div className="space-y-1 mb-4 text-xs text-slate-700 dark:text-slate-300">
                        <p><strong>Valor Proposto pelo Cliente:</strong> {ticket.budget.counterValue?.toFixed(2)} €</p>
                        <p><strong>Motivo/Justificação:</strong> {ticket.budget.counterReason}</p>
                      </div>
                      <div className="flex gap-3 justify-end">
                        <button
                          onClick={() => handleCounterProposalAction('reject')}
                          disabled={isProcessingCounter}
                          className="px-4 py-2 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-xs font-semibold disabled:opacity-50 transition-colors"
                        >
                          Recusar Contraproposta
                        </button>
                        <button
                          onClick={() => handleCounterProposalAction('approve')}
                          disabled={isProcessingCounter}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-xs font-semibold disabled:opacity-50 transition-colors"
                        >
                          Aceitar Contraproposta
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Cliente vê estado de contraproposta pendente */
                    <div className="p-4 bg-blue-500/10 border border-blue-500/25 rounded-lg text-slate-800 dark:text-slate-200 text-sm mb-4 animate-in fade-in slide-in-from-top-2">
                      <p className="font-semibold mb-2 text-blue-600 dark:text-blue-400">Contraproposta Pendente de Análise</p>
                      <p className="text-xs">Enviou uma contraproposta de <strong>{ticket.budget.counterValue?.toFixed(2)} €</strong> justificando: <em>"{ticket.budget.counterReason}"</em>.</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">A equipa técnica irá analisar a sua proposta e responder brevemente.</p>
                    </div>
                  )
                )}

                {/* Ações de Aprovação - Apenas para Cliente e se Pendente */}
                {!isStaff && ticket.budget.status === BudgetStatus.PENDING && (
                  <div>
                    {!showCounterForm ? (
                      <div className="flex gap-3 justify-end items-center">
                        <button
                          onClick={() => setShowCounterForm(true)}
                          className="mr-auto text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          Enviar Contraproposta
                        </button>
                        <button
                          onClick={() => handleBudgetAction(false)}
                          className="flex items-center gap-2 px-4 py-2 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors font-medium text-sm"
                        >
                          <XCircle size={18} /> Rejeitar
                        </button>
                        <button
                          onClick={() => handleBudgetAction(true)}
                          className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 shadow-sm shadow-green-200 transition-colors font-medium text-sm"
                        >
                          <CheckCircle2 size={18} /> Aprovar
                        </button>
                      </div>
                    ) : (
                      /* Formulário Inline de Contraproposta para o cliente */
                      <form onSubmit={handleSubmitCounterProposal} className="mt-6 p-4 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-700/50 space-y-4 text-left animate-in fade-in slide-in-from-top-2">
                        <h4 className="text-sm font-bold text-slate-700 dark:text-slate-200">Propor Contraproposta</h4>
                        <div>
                          <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Novo Valor Desejado (€)</label>
                          <input
                            type="number"
                            step="0.01"
                            required
                            value={counterValue}
                            onChange={(e) => setCounterValue(e.target.value)}
                            placeholder="0.00"
                            className="w-full text-sm rounded border border-slate-350 dark:border-slate-655 p-2 dark:bg-slate-700 dark:text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Motivo / Justificação</label>
                          <textarea
                            required
                            value={counterReason}
                            onChange={(e) => setCounterReason(e.target.value)}
                            rows={3}
                            placeholder="Explique o motivo do novo valor (ex: já possuo a peça, etc.)..."
                            className="w-full text-sm rounded border border-slate-350 dark:border-slate-655 p-2 dark:bg-slate-700 dark:text-white"
                          />
                        </div>
                        <div className="flex gap-2 justify-end">
                          <button
                            type="button"
                            onClick={() => setShowCounterForm(false)}
                            className="px-4 py-2 border border-slate-300 text-slate-750 dark:text-slate-300 dark:border-slate-650 rounded-lg text-xs hover:bg-slate-100 dark:hover:bg-slate-700"
                          >
                            Cancelar
                          </button>
                          <button
                            type="submit"
                            disabled={isSubmittingCounter}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs hover:bg-blue-700 font-semibold disabled:opacity-50"
                          >
                            {isSubmittingCounter ? 'A enviar...' : 'Submeter Contraproposta'}
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                )}

                {/* Informação para Staff se Pendente */}
                {isStaff && ticket.budget.status === BudgetStatus.PENDING && (
                  <p className="text-center text-sm text-slate-500 dark:text-slate-400 italic">
                    A aguardar decisão do cliente...
                  </p>
                )}

                {/* Se o orçamento foi recusado e o utilizador é Técnico, mostrar botão para propor novo */}
                {isStaff && ticket.budget.status === BudgetStatus.REJECTED && (
                  <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-700 flex justify-end">
                    <button
                      onClick={() => setShowCreateFormForRejected(true)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-xs font-semibold transition-colors"
                    >
                      Propor Novo Orçamento
                    </button>
                  </div>
                )}
              </div>
            ) : (
              // Formulário de Criação de Orçamento (Apenas Staff)
              isStaff ? (
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm animate-in fade-in slide-in-from-top-2">
                  <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">
                    {ticket.budget?.status === BudgetStatus.REJECTED ? 'Propor Novo Orçamento' : 'Criar Novo Orçamento'}
                  </h3>
                  <form onSubmit={handleCreateBudget} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Valor Total (€)</label>
                      <input
                        type="number"
                        step="0.01"
                        required
                        value={budgetAmount}
                        onChange={(e) => setBudgetAmount(e.target.value)}
                        className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white px-3 py-2 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 text-base sm:text-sm"
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Descrição / Detalhes</label>
                      <textarea
                        required
                        value={budgetDesc}
                        onChange={(e) => setBudgetDesc(e.target.value)}
                        rows={4}
                        className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white px-3 py-2 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 text-base sm:text-sm"
                        placeholder="Descreva as peças e mão de obra..."
                      />
                    </div>
                    <div className="pt-2 flex gap-3">
                      {ticket.budget?.status === BudgetStatus.REJECTED && (
                        <button
                          type="button"
                          onClick={() => setShowCreateFormForRejected(false)}
                          className="w-1/3 border border-slate-300 dark:border-slate-650 text-slate-700 dark:text-slate-350 py-2.5 rounded-lg font-medium transition-all"
                        >
                          Voltar
                        </button>
                      )}
                      <button type="submit" className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-2.5 rounded-lg font-medium shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:scale-[1.01] transition-all duration-200">
                        {ticket.budget?.status === BudgetStatus.REJECTED ? 'Enviar Novo Orçamento' : 'Enviar Proposta'}
                      </button>
                    </div>
                  </form>
                </div>
              ) : (
                <div className="text-center py-12 text-slate-400 dark:text-slate-500 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 border-dashed">
                  <Euro size={48} className="mx-auto mb-4 text-slate-300 dark:text-slate-600" />
                  <p>Ainda não existe orçamento para este pedido.</p>
                </div>
              )
            )}
          </div>
        )}

        {/* CONTEÚDO DA ABA: NOTAS INTERNAS */}
        {activeTab === 'internal' && isStaff && (
          <div className="space-y-6">
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 p-4 rounded-lg text-sm text-yellow-800 dark:text-yellow-200 mb-4">
              <p className="font-bold flex items-center gap-2"><FileText size={16} /> Área Privada</p>
              <p>Estas notas são visíveis apenas para a equipa técnica e administradores. O cliente NÃO tem acesso a este conteúdo.</p>
            </div>

            <div className="space-y-4">
              {internalComments.length === 0 ? (
                <div className="text-center py-8 text-slate-400 italic">
                  Sem notas internas.
                </div>
              ) : (
                internalComments.map((comment) => (
                  <div key={comment.id} className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-bold text-slate-700 dark:text-slate-200 text-sm">{comment.nome_tecnico}</span>
                      <span className="text-xs text-slate-400">{new Date(comment.data_comentario).toLocaleString()}</span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-300 text-sm whitespace-pre-wrap">{comment.comentario}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* CONTEÚDO DA ABA: CHAT */}
        {activeTab === 'chat' && (
          <div className="space-y-6">
            {/* FORMULÁRIO DE AVALIAÇÃO: Apenas para Cliente, se Ticket concluído e sem classificação */}
            {ticket.status === TicketStatus.DONE && !isStaff && (ticket.ratingStars === null || ticket.ratingStars === undefined) && (
              <div className="bg-gradient-to-r from-blue-500/10 to-indigo-500/10 border border-blue-200 dark:border-indigo-900/40 p-5 rounded-2xl shadow-sm mb-6 animate-in zoom-in-95 duration-200 text-left">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="text-indigo-500 shrink-0" size={18} />
                  <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm">Avalie a sua Assistência Técnica</h3>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Como avalia o serviço prestado pelo técnico? Deixe a sua classificação e comentário.</p>
                
                <form onSubmit={handleSubmitRating} className="space-y-4">
                  {/* Estrelas */}
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => {
                      const isHighlighted = (hoverStars || userStars) >= star;
                      return (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setUserStars(star)}
                          onMouseEnter={() => setHoverStars(star)}
                          onMouseLeave={() => setHoverStars(0)}
                          className={`text-2xl transition-all ${isHighlighted ? 'text-amber-500 scale-110' : 'text-slate-300 dark:text-slate-650'}`}
                        >
                          ★
                        </button>
                      );
                    })}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Comentário (Opcional)</label>
                    <textarea
                      value={userComment}
                      onChange={(e) => setUserComment(e.target.value)}
                      placeholder="Partilhe a sua experiência com a reparação..."
                      rows={3}
                      className="w-full rounded-lg border border-slate-300 dark:border-slate-650 bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={userStars === 0 || isSubmittingRating}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-5 py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isSubmittingRating ? 'A submeter...' : 'Submeter Avaliação'}
                  </button>
                </form>
              </div>
            )}

            {/* EXIBIÇÃO DE AVALIAÇÃO: Se já tiver sido avaliado */}
            {ticket.ratingStars !== null && ticket.ratingStars !== undefined && (
              <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700/80 shadow-sm mb-6 text-left">
                <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Classificação do Serviço</h4>
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex text-amber-500 text-lg">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <span key={star}>{star <= (ticket.ratingStars || 0) ? '★' : '☆'}</span>
                    ))}
                  </div>
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-450">({ticket.ratingStars}/5)</span>
                </div>
                {ticket.ratingComment && (
                  <p className="text-sm text-slate-650 dark:text-slate-350 italic bg-slate-50 dark:bg-slate-750/30 p-3 rounded-lg border border-slate-100 dark:border-slate-700/50 mt-1">
                    "{ticket.ratingComment}"
                  </p>
                )}
              </div>
            )}

            {/* Descrição Inicial do Pedido */}
            <div className="bg-white dark:bg-slate-800 p-4 md:p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm mb-6 transition-colors">
              <h3 className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Descrição Completa</h3>
              <p className="text-slate-700 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">{ticket.description}</p>

              {ticket.attachment && (
                <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
                  <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-1"><Paperclip size={12} /> Anexo</h4>
                  <a
                    href={ticket.attachment}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 px-3 py-2 rounded-lg text-sm text-slate-700 dark:text-slate-200 w-fit hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                  >
                    <FileText size={16} className="text-blue-500" />
                    <span>{ticket.attachment.split('/').pop()}</span>
                    <Download size={14} className="text-slate-400 ml-1" />
                  </a>
                </div>
              )}
            </div>

            {/* Lista de Mensagens */}
            <div className="space-y-4">
              {ticket.messages.length === 0 ? (
                <div className="text-center py-8 text-slate-400 italic">
                  Sem mensagens ainda.
                </div>
              ) : (
                ticket.messages.map((msg) => {
                  const fromMe = isMe(msg);

                  // Renderiza mensagens de sistema centralizadas
                  if (msg.text.startsWith('[SISTEMA]')) {
                    return (
                      <div key={msg.id} className="flex justify-center my-4">
                        <span className="text-xs text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-700 px-3 py-1 rounded-full border border-slate-200 dark:border-slate-600">
                          {msg.text} - {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    );
                  }

                  // Renderiza mensagens de chat (Esquerda/Direita)
                  return (
                    <div key={msg.id} className={`flex w-full ${fromMe ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] md:max-w-[80%] rounded-2xl px-4 py-2 md:px-5 md:py-3 shadow-sm 
                          ${fromMe ? 'bg-blue-600 text-white' : 'bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200'}
                        `}>
                        <div className="flex justify-between items-center gap-4 mb-1">
                          <span className={`text-xs font-bold ${fromMe ? 'text-blue-100' : 'text-slate-900 dark:text-slate-100'}`}>
                            {msg.senderType === 'Cliente' ? ticket.clientName : (ticket.technicianName || 'Técnico')}
                          </span>
                          <span className={`text-[10px] ${fromMe ? 'text-blue-200' : 'text-slate-400 dark:text-slate-400'}`}>
                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>
        )}
      </div>

      {/* Área de Input de Mensagem */}
      {activeTab === 'chat' && (
        <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
          <form onSubmit={handleSendMessage} className="flex gap-3">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Escreva uma mensagem..."
              className="flex-1 bg-slate-100 dark:bg-slate-700 dark:text-white border-0 rounded-full px-4 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:bg-white dark:focus:bg-slate-600 transition-all text-base sm:text-sm"
            />
            <button
              type="submit"
              disabled={!newMessage.trim()}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white p-3 rounded-full shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none transition-all duration-200"
            >
              <Send size={18} />
            </button>
          </form>
        </div>
      )}

      {/* Área de Input de Nota Interna */}
      {activeTab === 'internal' && isStaff && (
        <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
          <form onSubmit={handleSendInternalComment} className="flex gap-3">
            <input
              type="text"
              value={newInternalComment}
              onChange={(e) => setNewInternalComment(e.target.value)}
              placeholder="Adicionar nota interna..."
              className="flex-1 bg-yellow-50 dark:bg-yellow-900/10 dark:text-white border-yellow-200 dark:border-yellow-800 rounded-full px-4 focus:ring-2 focus:ring-yellow-500 dark:focus:ring-yellow-400 transition-all placeholder-yellow-700/50 dark:placeholder-yellow-500/50 text-base sm:text-sm"
            />
            <button
              type="submit"
              disabled={!newInternalComment.trim()}
              className="bg-yellow-600 hover:bg-yellow-700 text-white p-3 rounded-full shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <Send size={18} />
            </button>
          </form>
        </div>
      )}
      {/* Modal De Envio de Email */}
      {isEmailModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-lg flex flex-col max-h-[90vh] overflow-hidden">
            <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800">
              <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <Mail size={18} className="text-blue-600" />
                Enviar Email
              </h3>
              <button onClick={() => setIsEmailModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSendEmail} className="p-6 overflow-y-auto space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Para</label>
                <input
                  type="email"
                  required
                  value={emailTo}
                  onChange={e => setEmailTo(e.target.value)}
                  className="w-full text-sm border rounded-lg p-2.5 bg-slate-50 dark:bg-slate-700 dark:text-white dark:border-slate-600 focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="email@cliente.com"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Assunto</label>
                <input
                  type="text"
                  required
                  value={emailSubject}
                  onChange={e => setEmailSubject(e.target.value)}
                  className="w-full text-sm border rounded-lg p-2.5 bg-slate-50 dark:bg-slate-700 dark:text-white dark:border-slate-600 focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Assunto do email..."
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Mensagem</label>
                <textarea
                  required
                  rows={6}
                  value={emailBody}
                  onChange={e => setEmailBody(e.target.value)}
                  className="w-full text-sm border rounded-lg p-3 bg-slate-50 dark:bg-slate-700 dark:text-white dark:border-slate-600 focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                  placeholder="Escreva a sua mensagem aqui..."
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEmailModalOpen(false)}
                  className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg font-medium transition-colors text-sm"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg font-medium shadow-md shadow-blue-500/20 hover:shadow-blue-500/40 hover:scale-[1.02] transition-all text-sm flex items-center gap-2"
                >
                  <Send size={16} /> Enviar Email
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DetalhesPedido;