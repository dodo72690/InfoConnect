import { User, Ticket, Message, TicketStatus, BudgetStatus } from '../types';

// URL base do nosso servidor Backend (Node.js)
const API_URL = 'http://localhost:3000/api';

/**
 * Objeto centralizado para todas as chamadas à API.
 * Responsável por fazer o 'fetch' dos dados do servidor e tratar as respostas.
 */
export const api = {
  /**
   * Autentica o utilizador enviando email e senha.
   * Retorna os dados do utilizador se as credenciais estiverem corretas.
   */
  async login(email: string, password: string): Promise<User> {
    const res = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) throw new Error('Falha no login');
    return res.json();
  },

  /**
   * Obtém a lista completa de pedidos (Tickets).
   * Converte as strings de data (ISO) vindas do JSON para objetos Date do JavaScript.
   */
  async getTickets(): Promise<Ticket[]> {
    const res = await fetch(`${API_URL}/tickets`);
    if (!res.ok) throw new Error('Erro ao buscar pedidos');
    const tickets = await res.json();

    // Converte strings de data para objetos Date reais para uso correto no frontend
    return tickets.map((t: any) => ({
      ...t,
      createdAt: new Date(t.createdAt)
    }));
  },

  /**
   * Cria um novo pedido na base de dados.
   * Associa o pedido ao cliente logado.
   */
  async createTicket(clientId: string, description: string, file: File | null) {
    const formData = new FormData();
    formData.append('clientId', clientId);
    formData.append('description', description);
    if (file) {
      formData.append('file', file);
    }

    const res = await fetch(`${API_URL}/tickets`, {
      method: 'POST',
      body: formData, // Fetch handles Content-Type for FormData automatically
    });
    if (!res.ok) throw new Error('Erro ao criar pedido');
    return res.json();
  },

  /**
   * Apaga definitivamente um pedido.
   */
  async deleteTicket(ticketId: string) {
    const res = await fetch(`${API_URL}/tickets/${ticketId}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Erro ao apagar pedido');
    return res.json();
  },

  /**
   * Busca todas as mensagens associadas a um pedido específico.
   * Também converte os timestamps para objetos Date.
   */
  async getMessages(ticketId: string): Promise<Message[]> {
    const res = await fetch(`${API_URL}/tickets/${ticketId}/messages`);
    if (!res.ok) return [];
    const msgs = await res.json();
    return msgs.map((m: any) => ({
      ...m,
      timestamp: new Date(m.timestamp)
    }));
  },

  /**
   * Envia uma nova mensagem no chat do pedido.
   * Define quem enviou (Cliente ou Técnico) baseado no parâmetro senderType.
   */
  async sendMessage(ticketId: string, senderType: 'Cliente' | 'Técnico', text: string) {
    const res = await fetch(`${API_URL}/tickets/${ticketId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ senderType, text }),
    });
    if (!res.ok) throw new Error('Erro ao enviar mensagem');
    return res.json();
  },

  /**
   * Atualiza o estado de um pedido (ex: de 'Em análise' para 'Concluído').
   */
  /**
   * Atualiza o estado de um pedido (ex: de 'Em análise' para 'Concluído').
   */
  async updateStatus(ticketId: string, status: TicketStatus) {
    const res = await fetch(`${API_URL}/tickets/${ticketId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) throw new Error('Erro ao atualizar estado');
    return res.json();
  },

  /**
   * Cria ou atualiza um orçamento para um pedido.
   */
  async createBudget(ticketId: string, value: number, description: string) {
    const res = await fetch(`${API_URL}/tickets/${ticketId}/budget`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ value, description }),
    });
    if (!res.ok) throw new Error('Erro ao criar orçamento');
    return res.json();
  },

  /**
   * Atualiza o estado de um orçamento (Aprovado/Recusado).
   */
  async updateBudgetStatus(ticketId: string, status: BudgetStatus) {
    const res = await fetch(`${API_URL}/tickets/${ticketId}/budget/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) throw new Error('Erro ao atualizar estado do orçamento');
    return res.json();
  },

  /**
   * Envia um email manual a partir de um ticket.
   */
  async sendTicketEmail(ticketId: string, to: string, subject: string, body: string) {
    const res = await fetch(`${API_URL}/tickets/${ticketId}/email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to, subject, body }),
    });
    if (!res.ok) throw new Error('Erro ao enviar email');
    return res.json();
  },

  /**
   * Obtém a lista de todos os utilizadores (Admin only)
   */
  async getUsers(): Promise<User[]> {
    const res = await fetch(`${API_URL}/users`);
    if (!res.ok) throw new Error('Erro ao buscar utilizadores');
    return res.json();
  },

  /**
   * Obtém a lista de clientes (Admin/Tech only)
   */
  async getClients(): Promise<User[]> {
    const res = await fetch(`${API_URL}/clients`);
    if (!res.ok) throw new Error('Erro ao buscar clientes');
    return res.json();
  },

  /**
   * Regista um novo utilizador (Cliente).
   */
  async register(name: string, email: string, password: string): Promise<User> {
    const res = await fetch(`${API_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.erro || 'Erro ao registar');
    }
    return res.json();
  },

  /**
   * Cria um novo utilizador (Admin).
   */
  async createUser(userData: any) {
    const res = await fetch(`${API_URL}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.erro || 'Erro ao criar utilizador');
    }
    return res.json();
  },

  /**
   * Apaga um utilizador (Admin).
   */
  async deleteUser(userId: string) {
    const res = await fetch(`${API_URL}/users/${userId}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Erro ao apagar utilizador');
    return res.json();
  },

  async forgotPassword(email: string) {
    const res = await fetch(`${API_URL}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.erro || 'Erro ao solicitar recuperação');
    }
    return res.json();
  },

  async resetPassword(email: string, token: string, newPassword: string) {
    const res = await fetch(`${API_URL}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, token, newPassword }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.erro || 'Erro ao redefinir senha');
    }
    return res.json();
  },

  /**
   * Obtém lista de Perguntas Frequentes.
   */
  async getFaqs() {
    const res = await fetch(`${API_URL}/faqs`);
    if (!res.ok) throw new Error('Erro ao carregar FAQs');
    return res.json();
  },

  async addFaq(question: string, answer: string, category: string) {
    const res = await fetch(`${API_URL}/faqs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question, answer, category }),
    });
    if (!res.ok) throw new Error('Erro ao criar FAQ');
    return res.json();
  },

  async deleteFaq(id: string) {
    const res = await fetch(`${API_URL}/faqs/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Erro ao apagar FAQ');
    return res.json();
  },

  /**
   * Obtém comentários internos (invisíveis ao cliente).
   */
  async getInternalComments(ticketId: string) {
    const res = await fetch(`${API_URL}/tickets/${ticketId}/internal-comments`);
    if (!res.ok) return [];
    return res.json();
  },

  async addInternalComment(ticketId: string, technicianId: string, text: string) {
    const res = await fetch(`${API_URL}/tickets/${ticketId}/internal-comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ technicianId, text }),
    });
    if (!res.ok) throw new Error('Erro ao adicionar comentário interno');
    return res.json();
  },

  async getCategories() {
    const res = await fetch(`${API_URL}/categories`);
    if (!res.ok) throw new Error('Erro ao buscar categorias');
    return res.json();
  },

  async addCategory(name: string) {
    const res = await fetch(`${API_URL}/categories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    if (!res.ok) throw new Error('Erro ao adicionar categoria');
    return res.json();
  },

  async deleteCategory(id: string) {
    const res = await fetch(`${API_URL}/categories/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Erro ao apagar categoria');
    return res.json();
  },

  /**
   * Obtém estatísticas para o Dashboard (Contagem de tickets, etc).
   */
  async getDashboardStats() {
    const res = await fetch(`${API_URL}/dashboard/stats`);
    if (!res.ok) throw new Error('Erro ao buscar estatísticas');
    return res.json();
  },

  /**
   * Obtém configurações globais do sistema.
   */
  async getSettings() {
    const res = await fetch(`${API_URL}/settings`);
    if (!res.ok) throw new Error('Erro ao buscar configurações');
    return res.json();
  },

  async updateSetting(key: string, value: string) {
    const res = await fetch(`${API_URL}/settings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, value }),
    });
    if (!res.ok) throw new Error('Erro ao atualizar configuração');
    return res.json();
  },

  async changePassword(userId: string, newPassword: string, currentPassword?: string) {
    const res = await fetch(`${API_URL}/users/${userId}/password`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ newPassword, currentPassword }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.erro || 'Erro ao alterar a senha');
    }
    return res.json();
  },

  // --- LOGS DO SISTEMA ---
  async getLogs() {
    const res = await fetch(`${API_URL}/logs`);
    if (!res.ok) throw new Error('Erro ao carregar logs');
    // Converter strings de data para objetos Date
    const logs = await res.json();
    return logs.map((log: any) => ({
      ...log,
      timestamp: new Date(log.timestamp)
    }));
  },

  async createLog(action: string, details: string, userId: string, userName: string, type: string) {
    const res = await fetch(`${API_URL}/logs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, details, userId, userName, type }),
    });
    // Não lançamos erro aqui para não bloquear a UI caso o log falhe
    if (!res.ok) console.error('Erro ao salvar log');
    return res.json();
  }
};