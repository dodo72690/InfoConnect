// Papéis (Roles) que um utilizador pode ter no sistema
export enum UserRole {
  ADMIN = 'Admin',       // Administrador total
  TECHNICIAN = 'Tecnico',// Técnico de suporte
  CLIENT = 'Cliente'     // Cliente final
}

// Estados possíveis para um pedido de suporte
export enum TicketStatus {
  ANALYSIS = 'Em análise',   // Pedido criado, aguarda técnico
  REPAIR = 'Em reparação',   // Técnico está a trabalhar
  DONE = 'Concluído'         // Resolvido
}

// Priority and Category removed as they don't exist in the 'pedidos' table

export interface User {
  id: string; // id_utilizador
  name: string; // nome (from clientes/tecnicos)
  email: string;
  role: UserRole;
  avatarUrl?: string;
  companyName?: string;
  phone?: string; // telemovel
  specialty?: string; // especialidade (for tecnicos)
}

export interface Message {
  id: string; // id_mensagem
  senderType: 'Cliente' | 'Técnico'; // remetente
  text: string; // mensagem
  timestamp: Date; // data_envio
}

export enum BudgetStatus {
  PENDING = 'Pendente',
  APPROVED = 'Aprovado',
  REJECTED = 'Recusado'
}

export interface Budget {
  id: string; // id_orcamento
  description: string; // descricao_servico
  value: number;
  status: BudgetStatus;
  createdAt: Date; // data_envio
}

export interface Ticket {
  id: string; // id_pedido
  description: string; // descricao_problema
  clientId: string; // id_cliente
  clientName?: string; // nome do cliente (from JOIN)
  clientEmail?: string;
  technicianId?: string; // id_tecnico
  technicianName?: string; // nome do tecnico
  status: TicketStatus; // estado_pedido
  createdAt: Date; // data_pedido
  attachment?: string | null; // anexo (VARCHAR 255 - Single file)
  messages: Message[];
  budget?: Budget;
}

export interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
}

export enum LogType {
  INTERVENTION = 'Intervencao',
  SYSTEM = 'Sistema',
  ERROR = 'Erro'
}

export interface SystemLog {
  id: string; // id_log
  action: string;
  details: string; // descricao
  userId: string; // id_utilizador
  userName: string;
  timestamp: Date; // data_registo
  type: LogType; // tipo_log
}

// Meme types kept to avoid breaking build if referenced, but unused in main logic
export interface MemeText {
  id: string;
  content: string;
  x: number;
  y: number;
  size: number;
  color: string;
}

export interface MemeState {
  currentImage: string | null;
  originalImage: string | null;
  texts: MemeText[];
}