# Documentação Técnica do Projeto InfoConnect

## 1. Arquitetura Geral do Projeto

O **InfoConnect** é uma plataforma web de assistência técnica que conecta clientes a técnicos para resolução de problemas informáticos. A solução adota uma arquitetura **Full-Stack** moderna e escalável, dividida em três camadas principais:

### 1.1 Frontend (Interface do Utilizador)
- **Tecnologia:** React (com Vite) + TypeScript.
- **Estilização:** Tailwind CSS para um design responsivo e moderno.
- **Função:** Responsável por toda a interação visual, desde a Landing Page até aos Dashboards de Cliente e Admin. Comunica com o backend através de requisições API (REST).

### 1.2 Backend (Servidor e Lógica)
- **Tecnologia:** Node.js + Express.
- **Função:** API REST centralizada no ficheiro `server.cjs`. Gerencia autenticação, lógica de tickets, envio de emails (Nodemailer), uploads de ficheiros (Multer) e comunicação com a base de dados.

### 1.3 Base de Dados (Armazenamento)
- **Tecnologia:** MySQL (gerido via XAMPP/phpMyAdmin).
- **Função:** Armazena dados relacionais críticos como utilizadores, pedidos (tickets), mensagens e orçamentos.

---

## 2. Estrutura do Projeto

A organização do repositório foi pensada para separar claramente as responsabilidades do código:

- **`/src`**: Contém o código fonte do Frontend.
  - **`/components`**: Componentes React reutilizáveis (e.g., `Dashboard.tsx`, `TicketDetail.tsx`, `AuthPage.tsx`).
  - **`/services`**: Ficheiros como `api.ts` que centralizam as chamadas HTTP para o backend.
  - **`App.tsx`**: Componente raiz que gere o roteamento e o estado global da aplicação.
- **`server.cjs`**: O coração do Backend. Um único ficheiro robusto que configura o servidor Express e todos os endpoints da API.
- **`/public`**: Arquivos estáticos acessíveis diretamente pelo navegador.
- **`/uploads`**: Diretório onde são armazenados os anexos enviados nos tickets.
- **`package.json`**: Define as dependências do projeto (React, Express, MySQL2, etc.) e scripts de execução.
- **Scripts Utilitários (`*.cjs`)**: Scripts auxiliares na raiz (ex: `create_missing_tables.cjs`, `verify_endpoints.cjs`) usados para manutenção e verificação da base de dados e sanidade do sistema.

Esta estrutura "Monollithic Repository" (Frontend e Backend no mesmo repo) facilita o desenvolvimento e a manutenção por uma equipa pequena.

---

## 3. Instalação das Ferramentas

Para preparar o ambiente de desenvolvimento, foram instaladas as seguintes ferramentas essenciais:

### 3.1 Instalação do VS Code
Editor de código principal utilizado, com extensões para React e Node e a extensão **Antigravity** (Google Deepmind) para assistência IA.
> [Inserir imagem do VS Code aberto aqui]

### 3.2 Instalação do Node.js
Runtime necessário para rodar o Backend e as ferramentas de build do Frontend.
> [Inserir imagem do terminal verificando `node -v` aqui]

### 3.3 Instalação do XAMPP
Pacote que fornece o servidor MySQL e a interface phpMyAdmin para gestão da base de dados.
> [Inserir imagem do Painel de Controlo do XAMPP com MySQL iniciado aqui]

### 3.4 Configuração da Base de Dados
Acesso ao phpMyAdmin para criar a base de dados `bd_infoconnect` e verificar as tabelas iniciais.
> [Inserir imagem do phpMyAdmin mostrando a base de dados aqui]

---

## 4. Configuração do Ambiente de Desenvolvimento

O processo de criação e arranque do projeto envolveu os seguintes passos:

1.  **Criação do Projeto**: Utilização do Vite para gerar a estrutura base React.
    ```bash
    npm create vite@latest . -- --template react-ts
    ```
2.  **Instalação de Dependências**:
    ```bash
    npm install
    # Instalação de pacotes backend e utilitários
    npm install express mysql2 cors multer bcrypt nodemailer pdfkit
    # Instalação de pacotes UI
    npm install -D tailwindcss postcss autoprefixer
    ```
3.  **Configuração do Tailwind**: Inicialização e configuração dos ficheiros de estilo.
4.  **Arranque dos Servidores**:
    - **Frontend**: `npm run dev` (Inicia o servidor Vite na porta 5173).
    - **Backend**: `node server.cjs` (Inicia a API Express na porta 3000).

> [Inserir imagem do terminal dividida mostrando o Frontend e Backend a correr simultaneamente]

---

## 5. Desenvolvimento do Backend (API)

O backend foi desenvolvido em **Node.js** com **Express**, focando-se na simplicidade e eficiência.

-   **Ligação à Base de Dados**: Utiliza a biblioteca `mysql2` para criar uma *pool* de conexões eficiente com o servidor MySQL local.
-   **Segurança**: Implementação de `bcrypt` para encriptação de senhas (hashing) antes do armazenamento, garantindo que dados sensíveis nunca estão em texto simples.
-   **Endpoints Principais**:
    -   `POST /api/login`: Valida credenciais e retorna o perfil do utilizador.
    -   `GET /api/tickets`: Retorna a lista de tickets, filtrada por permissões.
    -   `POST /api/tickets`: Criação de ticket com suporte a upload de arquivos (via `Multer`).
    -   `POST /api/tickets/:id/messages`: Gestão do chat em tempo real entre cliente e técnico.
    -   `POST /api/tickets/:id/budget`: Criação e gestão de orçamentos.

Exemplo de configuração do servidor (`server.cjs`):
```javascript
const app = express();
app.use(cors()); // Permite conexões do Frontend
app.use(express.json()); // Processa JSON nos pedidos
// ... rotas e lógica ...
```

---

## 6. Desenvolvimento do Frontend

A interface foi construída seguindo o padrão **Single Page Application (SPA)**.

-   **Landing Page**: A porta de entrada do site, desenhada para ser atrativa e informativa, apresentando os serviços e permitindo o login.
-   **Componentização**: Uso de componentes React (`/components`) para modularidade.
    -   `TicketDetail.tsx`: Um componente complexo que gere a visualização do ticket, chat e orçamentos numa única vista.
    -   `Dashboard.tsx`: Painel administrativo com gráficos e métricas.
-   **Comunicação com Backend**: O ficheiro `services/api.ts` atua como uma camada de abstração. O frontend não chama `fetch` diretamente nos componentes, mas sim funções como `api.getTickets()`, tornando o código mais limpo e fácil de manter.
-   **Design System**: Utilização de **Tailwind CSS** com um modo escuro (Dark Mode) totalmente funcional, alternável pelo utilizador.

---

## 7. Modelo da Base de Dados + DER

A base de dados `bd_infoconnect` segue um modelo relacional normalizado para garantir a integridade dos dados.

### Tabelas Principais:
1.  **utilizadores**: Tabela central de autenticação (id, email, senha, tipo, data_registo).
2.  **clientes**: Extensão do utilizador com dados específicos de cliente (nome, telefone). Relação 1:1 com utilizadores.
3.  **tecnicos**: Extensão do utilizador técnico (nome, telefone, especialidade). Relação 1:1 com utilizadores.
4.  **pedidos**: Representa os tickets de suporte. Liga Clientes a Técnicos.
5.  **mensagens**: Armazena o histórico do chat de cada pedido.
6.  **orcamentos**: Armazena os orçamentos propostos para cada pedido.

### Diagrama Entidade-Relacionamento (DER)
As relações principais são:
-   Um **Cliente** pode ter muitos **Pedidos** (1:N).
-   Um **Técnico** pode ser responsável por muitos **Pedidos** (1:N).
-   Um **Pedido** tem muitas **Mensagens** (1:N).
-   Um **Pedido** tem um **Orçamento** (1:1).

> [Inserir imagem do DER desenhado no draw.io aqui]

---

## 8. Funcionalidades do Sistema

### 8.1 Login e Autenticação
Sistema seguro com diferenciação de perfis (Cliente, Técnico, Admin).
> [Inserir print do Ecrã de Login]

### 8.2 Registo de Tickets
Clientes podem reportar avarias, descrever o problema e anexar fotos ou documentos.
> [Inserir print do Modal de Novo Ticket]

### 8.3 Chat e Mensagens
Comunicação direta na página do ticket, permitindo troca rápida de informações.
> [Inserir print da área de Chat no detalhe do ticket]

### 8.4 Orçamentos
Técnicos enviam orçamentos que aparecem destacados para o cliente aprovar ou rejeitar.
> [Inserir print da visualização de Orçamento]

### 8.5 Dashboard de Estatísticas
O Administrador tem acesso a métricas visuais sobre o volume de tickets e estados.
> [Inserir print do Dashboard Admin com gráficos]

---


## 9. Testes e Validação

Para garantir a estabilidade do sistema, foram implementados processos de teste automáticos e manuais:

### 9.1 Testes Automatizados (Scripts)
Foram desenvolvidos scripts em Node.js para verificar a integridade da API sem depender do frontend:
-   **`verify_endpoints.cjs`**: Realiza requisições HTTP simuladas (mock requests) aos endpoints `/api/users`, `/api/clients` e `/api/tickets` para confirmar que retornam os códigos de status corretos (200 OK) e o formato JSON esperado.
-   **`verify_bcrypt.cjs`**: Testa o algoritmo de hash, criando uma senha, encriptando-a e tentando validá-la, garantindo que o login funcione corretamente.
-   **`inspect_db.cjs`**: Verifica se a conexão ao MySQL está ativa e lista as tabelas presentes para despiste de erros de esquema.

### 9.2 Testes Manuais
-   **Fluxo de Utilizador**: Criação manual de um "Cliente Teste", submissão de um ticket com anexo PDF, resposta como "Técnico" e aprovação final como "Cliente".
-   **Validação de Uploads**: Envio de ficheiros de grandes dimensões e formatos não suportados para testar as regras do middleware Multer.

---

## 10. Desafios Encontrados e Soluções

Durante o desenvolvimento deste projeto Full-Stack, surgiram diversos desafios técnicos que foram resolvidos de forma prática.

### 10.1 Erros de CORS (Cross-Origin Resource Sharing)
**Problema:** Ao tentar conectar o Frontend (porta 5173) ao Backend (porta 3000), o navegador bloqueava as requisições por segurança.
**Solução:** Implementação do middleware `cors` no Express (`app.use(cors())`), permitindo explicitamente que a origem do Vite comunique com a API.

### 10.2 Migração de Senhas (Segurança)
**Problema:** Inicialmente, as senhas eram guardadas em texto simples. Ao implementar o `bcrypt`, os utilizadores antigos deixaram de conseguir fazer login.
**Solução:** Criação do script `migrate_passwords.cjs` que percorre a base de dados, detecta senhas não encriptadas, converte-as para hashes bcrypt e atualiza o registo, permitindo uma transição suave sem perda de contas.

### 10.3 Integridade da Base de Dados
**Problema:** Ao mover o projeto entre computadores (escola/casa), por vezes faltavam tabelas específicas na base de dados do XAMPP.
**Solução:** Desenvolvimento do script `create_missing_tables.cjs`. Este script verifica a existência de cada tabela critica (`faqs`, `comentarios`, etc.) no arranque e cria-as automaticamente usando SQL `CREATE TABLE IF NOT EXISTS` caso estejam em falta.

### 10.4 Gestão de Uploads de Arquivos
**Problema:** O upload de imagens e PDFs para os tickets falhava silenciosamente se a pasta de destino não existisse.
**Solução:** Adição de uma verificação no arranque do `server.cjs` que utiliza o módulo `fs` para verificar se a pasta `uploads/` existe e, caso contrário, cria-a automaticamente (`fs.mkdirSync`), prevenindo erros de "Directory not found".

---

## 11. Conclusão Final

O desenvolvimento do **InfoConnect** permitiu consolidar conhecimentos em arquitetura web moderna.

-   **Aprendizagens**: Aprofundamento em React Hooks, gestão de estado, construção de APIs REST e modelagem de dados SQL.
-   **Melhorias Futuras**: Implementação de notificações em tempo real (WebSockets) e uma app mobile nativa.
-   **Estado Atual**: O projeto cumpre todos os requisitos funcionais da PAP, oferecendo uma solução robusta para a gestão de assistência técnica.
-   **Impacto**: A plataforma digitaliza e agiliza um processo tipicamente manual, melhorando a comunicação e a transparência entre serviços técnicos e clientes.
