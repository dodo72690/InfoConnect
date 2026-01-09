import { Ticket, TicketStatus, User, UserRole, BudgetStatus } from './types';

export const MOCK_ADMIN: User = {
  id: '1',
  name: 'Administrador Sistema',
  email: 'admin@infoconnect.pt',
  role: UserRole.ADMIN,
  avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Admin',
  companyName: 'InfoConnect HQ'
};

export const MOCK_TECH: User = {
  id: '2',
  name: 'Carlos Técnico',
  email: 'tech@infoconnect.pt',
  role: UserRole.TECHNICIAN,
  avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Carlos',
  companyName: 'InfoConnect',
  specialty: 'Hardware'
};

export const MOCK_CLIENT: User = {
  id: '3',
  name: 'João Silva',
  email: 'joao.silva@empresa.pt',
  role: UserRole.CLIENT,
  avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Joao',
  companyName: 'Consultoria Silva Lda',
  phone: '912345678'
};

export const INITIAL_TICKETS: Ticket[] = [
  {
    id: '1',
    description: 'O servidor principal da contabilidade desligou-se durante a noite e não volta a ligar. A luz da fonte pisca laranja.',
    clientId: '3',
    clientName: 'Consultoria Silva Lda',
    technicianId: '2',
    status: TicketStatus.REPAIR, // Em reparação
    createdAt: new Date('2024-05-20T09:00:00'),
    messages: [
      {
        id: '1',
        senderType: 'Cliente',
        text: 'Bom dia, precisamos de urgência nisto. Ninguém consegue faturar.',
        timestamp: new Date('2024-05-20T09:05:00'),
      },
      {
        id: '2',
        senderType: 'Técnico',
        text: 'Bom dia Sr. João. A equipa técnica já está a caminho para verificar a fonte de alimentação.',
        timestamp: new Date('2024-05-20T09:30:00'),
      }
    ],
    budget: {
      id: '1',
      description: 'Substituição de Fonte de Alimentação 750W Server Grade',
      value: 150.00,
      status: BudgetStatus.PENDING,
      createdAt: new Date('2024-05-20T10:00:00')
    }
  },
  {
    id: '2',
    description: 'Precisamos de 5 licenças novas de Office 365 e instalação nos portáteis dos novos estagiários.',
    clientId: '4', // Mock another client
    clientName: 'Agência Criativa',
    status: TicketStatus.ANALYSIS, // Em análise
    createdAt: new Date('2024-05-21T14:00:00'),
    messages: []
  },
  {
    id: '3',
    description: 'O sinal de Wi-Fi no armazém 2 está muito fraco. Não conseguimos usar os PDAs.',
    clientId: '3',
    clientName: 'Consultoria Silva Lda',
    technicianId: '2',
    status: TicketStatus.DONE, // Concluído
    createdAt: new Date('2024-05-15T10:00:00'),
    messages: [
      {
        id: '3',
        senderType: 'Técnico',
        text: 'Foi instalado um repetidor de sinal. O problema deve estar resolvido.',
        timestamp: new Date('2024-05-16T15:00:00'),
      }
    ]
  }
];