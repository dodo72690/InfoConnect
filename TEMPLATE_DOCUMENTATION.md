# Documentação do Template do Projeto InfoConnect

Este documento descreve a estrutura, tecnologias e funcionalidades do template utilizado no projeto **InfoConnect**.

## 1. Visão Geral

O projeto é uma aplicação web **Full-Stack** desenvolvida para gestão de assistência técnica (tickets, orçamentos, clientes). A arquitetura é dividida em:

-   **Frontend**: Single Page Application (SPA) construída com **React** e **Vite**.
-   **Backend**: API RESTful construída com **Node.js** e **Express**.
-   **Base de Dados**: Relacional, utilizando **MySQL**.

## 2. Tecnologias Utilizadas

### Frontend
-   **React (v19)**: Biblioteca principal para construção da interface.
    -   *Instalação (via Vite)*: `npm create vite@latest . -- --template react-ts`
-   **Vite**: Build tool e servidor de desenvolvimento rápido.
    -   *Instalação*: Incluído no comando acima.
-   **TailwindCSS**: Framework de CSS utilitário para estilização.
    -   *Instalação*: `npm install -D tailwindcss postcss autoprefixer && npx tailwindcss init -p`
-   **Lucide React**: Biblioteca de ícones.
    -   *Instalação*: `npm install lucide-react`
-   **Recharts**: Biblioteca para gráficos (dashboard).
    -   *Instalação*: `npm install recharts`
-   **TypeScript**: (Parcialmente configurado) para tipagem estática.
    -   *Instalação*: `npm install -D typescript @types/react @types/react-dom`

### Backend
-   **Node.js**: Ambiente de execução JavaScript.
    -   *Instalação*: Baixar e instalar do site oficial (https://nodejs.org/).
-   **Express**: Framework web para criação da API.
    -   *Instalação*: `npm install express`
-   **MySQL2**: Driver para conexão com banco de dados MySQL.
    -   *Instalação*: `npm install mysql2`
-   **Multer**: Middleware para upload de arquivos.
    -   *Instalação*: `npm install multer`
-   **Nodemailer**: Envio de emails (configurado para Ethereal Email em testes).
    -   *Instalação*: `npm install nodemailer`
-   **PDFKit**: Geração de relatórios em PDF.
    -   *Instalação*: `npm install pdfkit`
-   **Cors**: Middleware para permitir requisições Cross-Origin.
    -   *Instalação*: `npm install cors`

## 3. Estrutura de Diretórios

```
InfoConnect/
├── components/         # Componentes React reutilizáveis (Frontend)
├── services/           # Lógica de integração com APIs (Frontend)
├── src/                # Código fonte principal do Frontend (se aplicável)
├── uploads/            # Diretório para armazenamento de arquivos enviados
├── public/             # Arquivos estáticos públicos
├── server.cjs          # Ponto de entrada do servidor Backend
├── package.json        # Dependências e scripts do projeto
├── full_schema.json    # Esquema completo da base de dados (referência)
├── *.cjs               # Scripts utilitários de verificação e manutenção da BD
└── index.html          # Ponto de entrada HTML da aplicação
```

## 4. Backend (API)

O servidor backend está centralizado no arquivo `server.cjs` e expõe os seguintes endpoints principais:

### Autenticação e Utilizadores
-   `POST /api/login`: Autenticação de utilizadores (Admin, Técnico, Cliente).
-   `GET /api/users`: Lista todos os utilizadores (Apenas Admin).
-   `DELETE /api/users/:id`: Remove um utilizador e seus dados associados.

### Gestão de Tickets (Pedidos)
-   `GET /api/tickets`: Lista todos os tickets com detalhes.
-   `POST /api/tickets`: Cria um novo ticket (suporta upload de anexo).
-   `PATCH /api/tickets/:id/status`: Atualiza o estado de um ticket.
-   `GET /api/tickets/:id/messages`: Obtém mensagens de um ticket.
-   `POST /api/tickets/:id/messages`: Envia uma mensagem num ticket.

### Orçamentos
-   `POST /api/tickets/:id/budget`: Cria ou atualiza um orçamento para um ticket.
-   `PATCH /api/tickets/:id/budget/status`: Atualiza o estado do orçamento (Aprovado/Rejeitado).

### Funcionalidades Adicionais
-   `GET /api/dashboard/stats`: Estatísticas para o dashboard (Admin).
-   `GET /api/reports/tickets/pdf`: Gera relatório de tickets em PDF.
-   `GET /api/faqs` & `POST /api/faqs`: Gestão de Perguntas Frequentes.
-   `GET /api/categories` & `POST /api/categories`: Gestão de categorias de serviço.
-   `POST /api/tickets/:id/internal-comments`: Comentários internos para técnicos.
-   `GET /api/settings` & `POST /api/settings`: Configurações do sistema (ex: notificações).

## 5. Scripts Disponíveis

No arquivo `package.json`, os seguintes scripts estão definidos:

-   `npm run dev`: Inicia o servidor de desenvolvimento do Frontend (Vite).
-   `npm run build`: Compila o Frontend para produção.
-   `npm run preview`: Visualiza a versão de produção localmente.
-   *(Nota: O backend deve ser iniciado separadamente com `node server.cjs`)*

## 6. Configuração da Base de Dados

O projeto espera uma base de dados MySQL chamada `bd_infoconnect`.
As credenciais padrão configuradas no `server.cjs` são:
-   **Host**: localhost
-   **User**: root
-   **Password**: (vazio)

Existem scripts auxiliares na raiz (`create_missing_tables.cjs`, `inspect_db.cjs`) para ajudar na manutenção do esquema da base de dados.
