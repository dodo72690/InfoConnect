# InfoConnect - Plataforma Digital de Gestão de Assistência Técnica

Este repositório contém o código-fonte da plataforma **InfoConnect**, desenvolvida como projeto para a **Prova de Aptidão Profissional (PAP)** no curso de **Técnico de Gestão e Programação de Sistemas Informáticos (TGPSI)**.

A plataforma foi concebida para modernizar, automatizar e centralizar a comunicação e a gestão de pedidos de suporte técnico entre empresas de informática e os seus clientes, substituindo processos manuais em papel por um fluxo 100% digital.

---

## Funcionalidades Principais

A plataforma InfoConnect está dividida em módulos que respondem às necessidades de três tipos de utilizadores (Clientes, Técnicos e Administradores):

*   **Portal do Cliente:**
    *   Registo de pedidos de assistência com descrição de problemas e upload de anexos/imagens.
    *   Acompanhamento em tempo real do estado dos pedidos ("Em análise", "Em reparação", "Concluído").
    *   Chat-suporte bidirecional direto com o técnico responsável pelo equipamento.
    *   Visualização e aprovação/rejeição de orçamentos, com suporte ao envio de contrapropostas.
    *   Avaliação do serviço (classificação de 1 a 5 estrelas e comentário pós-conclusão).
    *   **Assistente Virtual IA:** Chat integrado com a API do Google Gemini (modelo gemini-2.5-flash) para obter pré-diagnósticos rápidos e dicas de segurança antes de abrir um ticket.
    *   **Zona de Risco (RGPD):** Opção para apagar a conta e remover em cascata todos os dados pessoais do sistema.
*   **Portal do Técnico:**
    *   Visualização e gestão de pedidos atribuídos.
    *   Envio de propostas de orçamento para os tickets.
    *   Registo de notas técnicas internas (comentários privados entre técnicos).
    *   Aceitação ou rejeição de contrapropostas enviadas pelos clientes.
*   **Painel Administrativo (Admin):**
    *   Dashboard principal com cartões de estatísticas e gráficos de desempenho (via Recharts).
    *   Gestão de utilizadores (criar, editar e apagar contas de técnicos e clientes).
    *   Consulta e filtragem de logs de auditoria do sistema em tempo real.
    *   Exportação de relatórios consolidados em formato CSV e PDF dinâmicos.
    *   Gestão de categorias de suporte e do catálogo de Perguntas Frequentes (FAQs).

---

## Arquitetura e Tecnologias

A solução baseia-se numa arquitetura Full-Stack moderna utilizando o modelo Cliente-Servidor:

### Frontend (SPA)
*   **React 19 & TypeScript:** Construção da interface de forma modular, rápida e com tipagem segura.
*   **Vite:** Servidor de desenvolvimento e empacotamento rápido com HMR.
*   **Tailwind CSS:** Framework utilitário de CSS usado para criar um design responsivo, minimalista e ergonómico com Modo Escuro Forçado (Forced Dark Mode).
*   **Lucide React:** Biblioteca de ícones nítidos e consistentes.
*   **Recharts:** Biblioteca para geração dinâmica de gráficos estatísticos no painel de controlo.

### Backend (API REST)
*   **Node.js & Express:** Servidor responsável pela lógica de negócio e exposição dos endpoints.
*   **Bcrypt:** Hashing seguro de palavras-passe na base de dados.
*   **@google/genai:** Integração com os modelos de linguagem do Google Gemini (modelo gemini-2.5-flash).
*   **Multer:** Middleware para gestão de uploads e armazenamento de ficheiros anexados.
*   **Nodemailer:** Envio automático de e-mails transacionais (verificação de conta, redefinição de password e alertas).
*   **PDFKit:** Biblioteca para geração dinâmica dos relatórios de pedidos em formato PDF.

### Base de Dados (Relacional)
*   **MySQL / MariaDB:** Armazenamento relacional estruturado com integridade referencial e eliminação em cascata (ON DELETE CASCADE).

---

## Estrutura de Ficheiros

O projeto está organizado da seguinte forma:

```text
InfoConnect/
├── public/                 # Recursos públicos acessíveis
├── uploads/                # Ficheiros e anexos carregados nos pedidos (gerada dinamicamente)
├── dist/                   # Ficheiros de build de produção do frontend (gerada após build)
├── src/                    # Código fonte do Frontend (React)
│   ├── assets/             # Imagens e logótipos estáticos
│   ├── components/         # Componentes reutilizáveis (DetalhesPedido, SeccaoFAQ, etc.)
│   ├── services/           # Comunicação com APIs (api.ts, geminiService.ts)
│   ├── App.tsx             # Componente raiz (gestão de rotas e polling)
│   ├── index.tsx           # Ponto de entrada do React
│   └── types.ts            # Definições de interfaces em TypeScript
├── server.cjs              # Servidor Backend (Express, API REST, Nodemailer)
├── package.json            # Scripts de execução e dependências do Node.js
├── tailwind.config.js      # Configurações do Tailwind CSS
├── tsconfig.json           # Configurações do compilador TypeScript
├── vite.config.ts          # Configurações do Vite
└── .env                    # Variáveis de ambiente locais (Base de Dados, Gemini API, SMTP)
```

---

## Configuração do Ambiente de Desenvolvimento

Siga os passos abaixo para correr a aplicação na sua máquina local:

### 1. Requisitos Prévios
Certifique-se de que tem instalados:
*   [Node.js](https://nodejs.org/) (versão 18 ou superior)
*   [XAMPP](https://www.apachefriends.org/) (para correr o Apache e o MySQL localmente)

### 2. Configurar a Base de Dados
1.  Abra o Painel de Controlo do XAMPP e inicie os módulos Apache e MySQL.
2.  Aceda ao phpMyAdmin (http://localhost/phpmyadmin).
3.  Crie uma base de dados com o nome `bd_infoconnect`.
4.  Importe o ficheiro de esquema SQL correspondente para preencher as tabelas iniciais.

### 3. Configurar as Variáveis de Ambiente
Na raiz da pasta `InfoConnect`, crie um ficheiro com o nome `.env` (ou edite o existente) e preencha as variáveis de ambiente necessárias:

```env
# Conexão à Base de Dados
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=bd_infoconnect
DB_PORT=3306

# Chave da API do Gemini para o diagnóstico IA
GEMINI_API_KEY=SUA_CHAVE_AQUI

# Configuração de E-mail (Exemplo para SMTP do Gmail)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=seu_email@gmail.com
SMTP_PASS=sua_senha_de_aplicativo
```

### 4. Instalar Dependências e Iniciar a Aplicação
Abra o terminal na pasta `InfoConnect` e execute os seguintes passos:

**Instalar bibliotecas:**
```bash
npm install
```

**Iniciar o Servidor Backend (Terminal 1):**
```bash
node server.cjs
```
*Saída esperada:* `Servidor InfoConnect a correr na porta 3000` e `Ligado à Base de Dados com sucesso!`.

**Iniciar o Servidor Frontend (Terminal 2):**
Abra um novo terminal e execute:
```bash
npm run dev
```
*Saída esperada:* Irá aparecer o link do servidor local do Vite, geralmente `http://localhost:5173`. Aceda a este endereço no seu navegador.

---

## Principais Rotas da API Backend (Endpoints)

*   `POST /api/login` - Autenticação de utilizadores.
*   `POST /api/register` - Registo de novos clientes com ativação por código.
*   `GET /api/tickets` - Listagem de pedidos de assistência (tickets).
*   `POST /api/tickets` - Criação de novos pedidos com ficheiro anexo (via Multer).
*   `POST /api/tickets/:id/messages` - Envio de mensagem no chat em tempo real (polling).
*   `POST /api/tickets/:id/budget` - Criação de propostas de orçamento por parte do técnico.
*   `POST /api/tickets/:id/budget/counter` - Envio de contraproposta de orçamento por parte do cliente.
*   `GET /api/reports/tickets/pdf` - Geração automática de relatórios de tickets em PDF (via PDFKit).
*   `GET /api/faqs` - Catálogo de Perguntas Frequentes (FAQs).
*   `GET /api/logs` - Registo de logs de auditoria de sistema (Admin).

---

## Contexto Académico

Este projeto foi desenvolvido como a Prova de Aptidão Profissional (PAP) para a conclusão do Curso Técnico de Gestão e Programação de Sistemas Informáticos (TGPSI) na Escola Técnico Profissional de Cantanhede (ETPC).

*   **Autor:** Douglas Anjos (12º TGPSI, Nº 3)
*   **Ano Letivo:** 2025/2026
