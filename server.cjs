// ==========================================
// InfoConnect - Backend (server.cjs)
// ==========================================

const express = require("express"); // Framework web para Node.js
const cors = require("cors"); // Permite requisições de outros domínios (Frontend)
const mysql = require("mysql2"); // Driver para conectar à base de dados MySQL
const multer = require("multer"); // Middleware para gerir uploads de ficheiros
const path = require("path"); // Utilitário para lidar com caminhos de ficheiros
const fs = require("fs"); // Sistema de ficheiros (para criar pastas, etc.)
const bcrypt = require("bcrypt"); // Biblioteca para encriptar senhas (segurança)
// ==========================================
// Ligação à Base de Dados (MySQL - XAMPP)
// ==========================================

const db = mysql.createPool({
  host: "localhost", // Endereço do servidor da base de dados (XAMPP)
  user: "root",      // Utilizador padrão do XAMPP
  password: "",      // Senha padrão (vazia)
  database: "bd_infoconnect" // Nome da nossa base de dados
});




const app = express();
app.use(express.json());
app.use(cors());

// Serve uploaded files
// Serve a pasta 'uploads' publicamente para que o frontend possa aceder às imagens
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Configure multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage }); // Inicializa o uploader com as configurações acima

// Configuração do Nodemailer (Ethereal Email para testes)
const nodemailer = require("nodemailer");
let transporter;

async function createTestAccount() {
  try {
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    console.log("Ethereal Email Configured:", testAccount.user);
  } catch (err) {
    console.error("Failed to create test account", err);
  }
}
createTestAccount();

const sendEmail = async (to, subject, text) => {
  // Verificar se as notificações estão ativas
  console.log(`[Email] Attempting to send email to ${to}`);
  db.query("SELECT valor FROM configuracoes WHERE chave = 'email_notifications'", async (err, results) => {
    // Default to TRUE if missing or error
    const isEnabled = (results && results.length > 0) ? results[0].valor === 'true' : true;

    if (!isEnabled) {
      console.log("[Email] Notification skipped (disabled in settings).");
      return;
    }

    try {
      if (!transporter) await createTestAccount();
      const info = await transporter.sendMail({
        from: '"InfoConnect Support" <support@infoconnect.com>',
        to: to,
        subject: subject,
        text: text,
        html: `<b>${text}</b>`
      });
      console.log("Email sent: %s", info.messageId);
      console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
    } catch (error) {
      console.error("Error sending email:", error);
    }
  });
};


app.get("/api/debug/tables", (req, res) => {
  db.query("SHOW TABLES", (err, results) => {
    if (err) return res.json(err);
    res.json(results);
  });
});
app.get("/teste-bd", (req, res) => {
  db.query("SELECT 1", (err) => {
    if (err) return res.status(500).json({ erro: err });
    res.json({ mensagem: "Ligação à BD está a funcionar!" });
  });
});

// 0. Registar (Cliente) - Cria nova conta de utilizador e perfil de cliente
app.post("/api/register", (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ erro: "Preencha todos os campos obrigatórios." });
  }

  // 1. Verificar se email já existe
  db.query("SELECT id_utilizador FROM utilizadores WHERE email = ?", [email], async (err, results) => {
    if (err) return res.status(500).json(err);
    if (results.length > 0) {
      return res.status(400).json({ erro: "Este email já se encontra registado." });
    }

    try {
      // 2. Encriptar password
      const hashedPassword = await bcrypt.hash(password, 10);

      // 3. Criar Utilizador
      const sqlUser = "INSERT INTO utilizadores (email, senha, tipo_utilizador, data_registo) VALUES (?, ?, 'Cliente', NOW())";
      db.query(sqlUser, [email, hashedPassword], (errUser, resUser) => {
        if (errUser) return res.status(500).json(errUser);

        const newUserId = resUser.insertId;

        // 4. Criar Cliente (Usando o mesmo ID, já que é 1:1 e id_cliente não é auto_increment na definicao usual de herança, mas vamos verificar schema. Se for auto_increment, falha. O schema diz 'id_cliente int(11) NOT NULL', PRIMARY KEY. Sem auto_increment. OK.)
        const sqlClient = "INSERT INTO clientes (id_cliente, nome, telemovel) VALUES (?, ?, NULL)";
        db.query(sqlClient, [newUserId, name], (errClient, resClient) => {
          if (errClient) {
            console.error("Erro ao criar perfil de cliente:", errClient);
            // Idealmente fariamos rollback, mas em MyISAM/sem transacão manual, fica orfão.
            return res.status(500).json({ erro: "Erro ao criar perfil de cliente." });
          }

          // 5. Retornar sucesso (login automático)
          res.json({
            id: String(newUserId),
            name: name,
            email: email,
            role: 'Cliente',
            companyName: 'Cliente Particular',
            phone: '',
            avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`
          });
        });
      });

    } catch (e) {
      return res.status(500).json({ erro: "Erro de servidor ao processar registo." });
    }
  });
});

// 1. Login - Autentica o utilizador e retorna seus dados (Cliente, Técnico ou Admin)
app.post("/api/login", (req, res) => {
  const { email, password } = req.body;

  const sqlUser = "SELECT * FROM utilizadores WHERE email = ?";

  db.query(sqlUser, [email], async (err, results) => {
    if (err) return res.status(500).json(err);

    if (results.length === 0) {
      return res.status(401).json({ erro: "Email ou palavra-passe incorretos" });
    }

    const user = results[0];

    // Compare provided password with stored hash
    const match = await bcrypt.compare(password, user.senha);
    if (!match) {
      return res.status(401).json({ erro: "Email ou palavra-passe incorretos" });
    }

    let sqlDetails = "";

    if (user.tipo_utilizador === 'Cliente') {
      sqlDetails = "SELECT nome, telemovel FROM clientes WHERE id_cliente = ?";
    } else if (user.tipo_utilizador === 'Tecnico') {
      sqlDetails = "SELECT nome, telemovel FROM tecnicos WHERE id_tecnico = ?";
    } else {
      return res.json({
        id: String(user.id_utilizador),
        name: "Administrador",
        email: user.email,
        role: user.tipo_utilizador
      });
    }

    db.query(sqlDetails, [user.id_utilizador], (errDetails, resultsDetails) => {
      if (errDetails) return res.status(500).json(errDetails);

      if (resultsDetails.length > 0) {
        const details = resultsDetails[0];
        res.json({
          id: String(user.id_utilizador),
          name: details.nome,
          email: user.email,
          role: user.tipo_utilizador,
          phone: details.telemovel || "",
          companyName: user.tipo_utilizador === 'Cliente' ? 'Cliente Particular' : undefined,
          avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`
        });
      } else {
        res.json({
          id: String(user.id_utilizador),
          name: user.email.split('@')[0],
          email: user.email,
          role: user.tipo_utilizador,
          phone: "",
          avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`
        });
      }
    });
  });
});

// 1.1 Atualizar Perfil
app.put("/api/users/:id", (req, res) => {
  const userId = req.params.id;
  const { name, email, phone } = req.body;

  db.query("UPDATE utilizadores SET email = ? WHERE id_utilizador = ?", [email, userId], (err) => {
    if (err) return res.status(500).json(err);

    db.query("SELECT tipo_utilizador FROM utilizadores WHERE id_utilizador = ?", [userId], (err, results) => {
      if (err || results.length === 0) return res.json({ success: true, message: "Email atualizado" });

      const type = results[0].tipo_utilizador;

      if (type === 'Cliente') {
        db.query("UPDATE clientes SET nome = ?, telemovel = ? WHERE id_cliente = ?", [name, phone, userId], (errC) => {
          if (errC) console.error(errC);
          res.json({ success: true, name, email, phone });
        });
      } else if (type === 'Tecnico') {
        db.query("UPDATE tecnicos SET nome = ?, telemovel = ? WHERE id_tecnico = ?", [name, phone, userId], (errT) => {
          if (errT) console.error(errT);
          res.json({ success: true, name, email, phone });
        });
      } else {
        res.json({ success: true, name: "Administrador", email, phone: "" });
      }
    });
  });
});



// 2. Obter Tickets - Lista todos os pedidos de suporte (com filtros de visualização)
app.get("/api/tickets", (req, res) => {
  const sql = `
    SELECT p.*, c.nome as nome_cliente, u.email as client_email,
           o.id_orcamento, o.valor, o.descricao_servico, o.estado_orcamento, o.data_envio as data_orcamento,
           COALESCE(t.nome, IF(ut.tipo_utilizador = 'Admin', 'Administrador', SUBSTRING_INDEX(ut.email, '@', 1))) as nome_tecnico
    FROM pedidos p 
    LEFT JOIN clientes c ON p.id_cliente = c.id_cliente
    LEFT JOIN utilizadores u ON c.id_cliente = u.id_utilizador
    LEFT JOIN orcamentos o ON p.id_pedido = o.id_pedido
    LEFT JOIN tecnicos t ON p.id_tecnico = t.id_tecnico
    LEFT JOIN utilizadores ut ON p.id_tecnico = ut.id_utilizador
    ORDER BY p.data_pedido DESC
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error("Error fetching tickets:", err); // Debug
      return res.status(500).json(err);
    }
    console.log(`Fetched ${results.length} tickets from DB`); // Debug

    const tickets = results.map(row => {
      const ticket = {
        id: String(row.id_pedido || row.id),
        description: row.descricao_problema,
        clientId: String(row.id_cliente),
        clientName: row.nome_cliente || "Cliente Desconhecido",
        clientEmail: row.client_email,
        technicianId: row.id_tecnico ? String(row.id_tecnico) : undefined,
        technicianName: row.nome_tecnico,
        status: row.estado_pedido || "Em análise",
        createdAt: row.data_pedido,
        attachment: row.anexo,
        messages: []
      };

      if (row.id_orcamento) {
        ticket.budget = {
          id: String(row.id_orcamento),
          value: Number(row.valor),
          description: row.descricao_servico,
          status: row.estado_orcamento,
          createdAt: row.data_orcamento
        };
      }

      return ticket;
    });

    res.json(tickets);
  });
});

// 2.1 Apagar Ticket (Admin)
app.delete("/api/tickets/:id", (req, res) => {
  const ticketId = req.params.id;

  // Apagar mensagens
  db.query("DELETE FROM mensagens WHERE id_pedido = ?", [ticketId], (errM) => {
    if (errM) console.error(errM);

    // Apagar orçamentos
    db.query("DELETE FROM orcamentos WHERE id_pedido = ?", [ticketId], (errO) => {
      if (errO) console.error(errO);

      // Apagar o pedido em si
      db.query("DELETE FROM pedidos WHERE id_pedido = ?", [ticketId], (err, result) => {
        if (err) return res.status(500).json(err);
        res.json({ success: true });
      });
    });
  });
});

// 3. Criar Ticket - Regista um novo pedido de suporte (permite anexo)
app.post("/api/tickets", upload.single('file'), (req, res) => {
  const { clientId, description } = req.body;
  const attachment = req.file ? `/uploads/${req.file.filename}` : null;

  const sql = "INSERT INTO pedidos (id_cliente, descricao_problema, estado_pedido, data_pedido, anexo) VALUES (?, ?, 'Em análise', NOW(), ?)";

  db.query(sql, [clientId, description, attachment], (err, result) => {
    if (err) return res.status(500).json(err);

    // Notificar Admin (Simulado)
    sendEmail('admin@infoconnect.com', 'Novo Pedido de Assistência', `Novo pedido criado pelo cliente ${clientId}: ${description}`);

    res.json({
      mensagem: "Pedido criado com sucesso!",
      id: String(result.insertId),
      attachment: attachment
    });
  });
});

// 4. Obter Mensagens - Busca o histórico de conversa de um ticket específico
app.get("/api/tickets/:id/messages", (req, res) => {
  const ticketId = req.params.id;
  const sql = "SELECT * FROM mensagens WHERE id_pedido = ? ORDER BY data_envio ASC";

  db.query(sql, [ticketId], (err, results) => {
    if (err) return res.status(500).json(err);

    const messages = results.map(m => ({
      id: String(m.id_mensagem || m.id),
      senderType: m.remetente,
      text: m.mensagem,
      timestamp: m.data_envio
    }));

    res.json(messages);
  });
});

// 5. Enviar Mensagem
app.post("/api/tickets/:id/messages", (req, res) => {
  const ticketId = req.params.id;
  const { senderType, text } = req.body;
  const sql = "INSERT INTO mensagens (id_pedido, remetente, mensagem, data_envio) VALUES (?, ?, ?, NOW())";

  db.query(sql, [ticketId, senderType, text], (err, result) => {
    if (err) return res.status(500).json(err);

    // Enviar notificação por email
    // Obter dados do pedido e cliente para enviar email
    const queryTicket = `
      SELECT p.descripcion_problema, c.nome, u.email 
      FROM pedidos p 
      JOIN clientes c ON p.id_cliente = c.id_cliente 
      JOIN utilizadores u ON c.id_cliente = u.id_utilizador 
      WHERE p.id_pedido = ?
    `;

    db.query(queryTicket, [ticketId], (errTick, resTick) => {
      if (!errTick && resTick.length > 0) {
        const ticketInfo = resTick[0];

        if (senderType === 'Technician' || senderType === 'Técnico') {
          // Se foi técnico, notificar cliente
          sendEmail(ticketInfo.email, `Nova mensagem no Pedido #${ticketId}`, `O técnico respondeu: "${text}"`);
        } else {
          // Se foi cliente, notificar admin/tech (email fixo simulado ou buscar tecnicos)
          sendEmail('admin@infoconnect.com', `Nova mensagem do cliente no Pedido #${ticketId}`, `Mensagem: "${text}"`);
        }
      }
    });

    res.json({
      id: String(result.insertId),
      senderType,
      text,
      timestamp: new Date()
    });
  });
});

// 6. Atualizar Estado - Modifica o status (ex: 'Em análise' -> 'Concluído')
app.patch("/api/tickets/:id/status", (req, res) => {
  const ticketId = req.params.id;
  const { status } = req.body;
  const sql = "UPDATE pedidos SET estado_pedido = ? WHERE id_pedido = ?";

  db.query(sql, [status, ticketId], (err, result) => {
    if (err) return res.status(500).json(err);

    // Notificar Cliente da mudança de estado
    const queryClient = `
      SELECT u.email, c.nome 
      FROM pedidos p 
      JOIN clientes c ON p.id_cliente = c.id_cliente 
      JOIN utilizadores u ON c.id_cliente = u.id_utilizador 
      WHERE p.id_pedido = ?
    `;
    db.query(queryClient, [ticketId], (errC, resC) => {
      if (!errC && resC.length > 0) {
        const client = resC[0];
        sendEmail(client.email, `Atualização do Pedido #${ticketId}`, `O estado do seu pedido foi alterado para: ${status}`);
      }
    });

    res.json({ success: true });
  });
});

// 7. Orçamento - Cria ou atualiza o orçamento um ticket
app.post("/api/tickets/:id/budget", (req, res) => {
  const ticketId = req.params.id;
  const { value, description } = req.body;

  const checkSql = "SELECT * FROM orcamentos WHERE id_pedido = ?";
  db.query(checkSql, [ticketId], (err, results) => {
    if (err) return res.status(500).json(err);

    if (results.length > 0) {
      const updateSql = "UPDATE orcamentos SET valor = ?, descricao_servico = ?, estado_orcamento = 'Pendente', data_envio = NOW() WHERE id_pedido = ?";
      db.query(updateSql, [value, description, ticketId], (errUpd, resultUpd) => {
        if (errUpd) return res.status(500).json(errUpd);
        res.json({ success: true, message: "Orçamento atualizado" });
      });
    } else {
      const insertSql = "INSERT INTO orcamentos (id_pedido, valor, descricao_servico, estado_orcamento, data_envio) VALUES (?, ?, ?, 'Pendente', NOW())";
      db.query(insertSql, [ticketId, value, description], (errIns, resultIns) => {
        if (errIns) return res.status(500).json(errIns);
        res.json({
          success: true,
          id: String(resultIns.insertId),
          value,
          description,
          status: 'Pendente',
          createdAt: new Date()
        });
      });
    }
  });
});

// 8. Atualizar Estado do Orçamento
app.patch("/api/tickets/:id/budget/status", (req, res) => {
  const ticketId = req.params.id;
  const { status } = req.body;
  const sql = "UPDATE orcamentos SET estado_orcamento = ? WHERE id_pedido = ?";

  db.query(sql, [status, ticketId], (err, result) => {
    if (err) return res.status(500).json(err);
    res.json({ success: true });
  });
});

// 8.1 Enviar Email Manual (Admin/Técnico)
app.post("/api/tickets/:id/email", (req, res) => {
  const { to, subject, body } = req.body;
  if (!to || !subject || !body) {
    return res.status(400).json({ error: "Campos obrigatórios em falta." });
  }

  sendEmail(to, subject, body);
  res.json({ success: true, message: "Email enviado com sucesso" });
});

// 9. Obter Utilizadores - Lista todos para o ecrã de administração
app.get("/api/users", (req, res) => {
  const sql = "SELECT * FROM utilizadores";

  db.query(sql, (err, users) => {
    if (err) return res.status(500).json(err);

    const sqlClients = "SELECT id_cliente, nome, telemovel FROM clientes";
    const sqlTechs = "SELECT id_tecnico, nome, telemovel, especialidade FROM tecnicos";

    db.query(sqlClients, (errC, clients) => {
      if (errC) return res.status(500).json(errC);

      db.query(sqlTechs, (errT, techs) => {
        if (errT) return res.status(500).json(errT);

        const clientMap = {};
        clients.forEach(c => clientMap[c.id_cliente] = c);

        const techMap = {};
        techs.forEach(t => techMap[t.id_tecnico] = t);

        const fullUsers = users.map(u => {
          let name = "Utilizador";
          let company = "";
          let phone = "";
          let avatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.email}`;

          if (u.tipo_utilizador === 'Cliente' && clientMap[u.id_utilizador]) {
            name = clientMap[u.id_utilizador].nome;
            phone = clientMap[u.id_utilizador].telemovel;
            company = "Cliente Particular";
          } else if (u.tipo_utilizador === 'Tecnico' && techMap[u.id_utilizador]) {
            name = techMap[u.id_utilizador].nome;
            phone = techMap[u.id_utilizador].telemovel;
            company = "InfoConnect";
          } else if (u.tipo_utilizador === 'Admin') {
            name = "Administrador";
            company = "InfoConnect HQ";
          }

          return {
            id: String(u.id_utilizador),
            name: name,
            email: u.email,
            role: u.tipo_utilizador,
            companyName: company,
            phone: phone,
            avatarUrl: avatar
          };
        });

        res.json(fullUsers);
      });
    });
  });
});

// 10. Obter lista de clientes
// Removed duplicated code

// 10. Obter lista de clientes
app.get("/api/clients", (req, res) => {
  const sql = `
    SELECT c.*, u.email 
    FROM clientes c 
    JOIN utilizadores u ON c.id_cliente = u.id_utilizador 
    WHERE u.tipo_utilizador = 'Cliente'
      `;

  db.query(sql, (err, results) => {
    if (err) return res.status(500).json(err);

    const clients = results.map(row => ({
      id: String(row.id_cliente),
      name: row.nome,
      email: row.email,
      role: 'Cliente',
      companyName: 'Cliente Particular',
      phone: row.telemovel,
      avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${row.nome}`
    }));
    res.json(clients);
  });
});

// 13. Apagar Utilizador (Admin)
app.delete("/api/users/:id", (req, res) => {
  const userId = req.params.id;
  console.log(`Attempting to delete user ${userId}`);

  // Proteger o Admin principal (ID 1)
  if (userId === '1') {
    return res.status(403).json({ erro: "Não é permitido remover o administrador principal." });
  }

  // Apagar de clientes
  db.query("DELETE FROM clientes WHERE id_cliente = ?", [userId], (errC, resC) => {
    if (errC) { console.error("Error deleting client:", errC); return res.status(500).json(errC); }
    console.log(`Deleted from clientes: ${resC.affectedRows} rows`);

    // Apagar de tecnicos
    db.query("DELETE FROM tecnicos WHERE id_tecnico = ?", [userId], (errT, resT) => {
      if (errT) { console.error("Error deleting technician:", errT); return res.status(500).json(errT); }
      console.log(`Deleted from tecnicos: ${resT.affectedRows} rows`);

      // Apagar de utilizadores
      const sql = "DELETE FROM utilizadores WHERE id_utilizador = ?";
      db.query(sql, [userId], (err, result) => {
        if (err) { console.error("Error deleting user:", err); return res.status(500).json(err); }
        console.log(`Deleted from utilizadores: ${result.affectedRows} rows`);
        res.json({ success: true });
      });
    });
  });
});

// 13.1 Criar Utilizador (Admin)
app.post("/api/users", async (req, res) => {
  const { name, email, password, role, phone, company, specialty } = req.body;

  if (!email || !password || !role) {
    return res.status(400).json({ erro: "Campos obrigatórios em falta." });
  }

  // 1. Verificar se email já existe
  db.query("SELECT id_utilizador FROM utilizadores WHERE email = ?", [email], async (err, results) => {
    if (err) return res.status(500).json(err);
    if (results.length > 0) {
      return res.status(400).json({ erro: "Este email já se encontra registado." });
    }

    try {
      // 2. Encriptar password
      const hashedPassword = await bcrypt.hash(password, 10);

      // 3. Criar Utilizador Base
      const sqlUser = "INSERT INTO utilizadores (email, senha, tipo_utilizador, data_registo) VALUES (?, ?, ?, NOW())";
      db.query(sqlUser, [email, hashedPassword, role], (errUser, resUser) => {
        if (errUser) return res.status(500).json(errUser);

        const newUserId = resUser.insertId;

        // 4. Criar Detalhes Específicos
        if (role === 'Cliente') {
          const sqlClient = "INSERT INTO clientes (id_cliente, nome, telemovel) VALUES (?, ?, ?)";
          db.query(sqlClient, [newUserId, name || 'Novo Cliente', phone || null], (errClient) => {
            if (errClient) console.error("Erro perfil cliente:", errClient);
            res.json({ success: true, id: String(newUserId) });
          });
        } else if (role === 'Tecnico') {
          const sqlTech = "INSERT INTO tecnicos (id_tecnico, nome, telemovel, especialidade) VALUES (?, ?, ?, ?)";
          db.query(sqlTech, [newUserId, name || 'Novo Técnico', phone || null, specialty || 'Geral'], (errTech) => {
            if (errTech) console.error("Erro perfil tecnico:", errTech);
            res.json({ success: true, id: String(newUserId) });
          });
        } else {
          // Admin não tem tabela própria extra neste schema simplificado, ou se tiver, adicionar aqui.
          // Assumindo que Admin só precisa de estar em 'utilizadores'.
          res.json({ success: true, id: String(newUserId) });
        }
      });

    } catch (e) {
      return res.status(500).json({ erro: "Erro de servidor ao criar utilizador." });
    }
  });
});

// 13.2 Alterar Senha
app.patch("/api/users/:id/password", async (req, res) => {
  const userId = req.params.id;
  const { currentPassword, newPassword } = req.body;

  if (!newPassword) {
    return res.status(400).json({ erro: "Nova senha é obrigatória." });
  }

  // Buscar senha atual
  db.query("SELECT senha FROM utilizadores WHERE id_utilizador = ?", [userId], async (err, results) => {
    if (err) return res.status(500).json(err);
    if (results.length === 0) return res.status(404).json({ erro: "Utilizador não encontrado." });

    const user = results[0];

    // Se forneceu senha atual (usuário trocando a própria senha), verificar
    if (currentPassword) {
      const match = await bcrypt.compare(currentPassword, user.senha);
      if (!match) {
        return res.status(401).json({ erro: "A senha atual está incorreta." });
      }
    }
    // Se não forneceu currentPassword, assumimos que é um Admin a fazer reset (poderíamos adicionar verificação de role via middleware, mas aqui simplificamos)

    try {
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      db.query("UPDATE utilizadores SET senha = ? WHERE id_utilizador = ?", [hashedPassword, userId], (errUpd) => {
        if (errUpd) return res.status(500).json(errUpd);
        res.json({ success: true, message: "Senha alterada com sucesso." });
      });
    } catch (e) {
      res.status(500).json({ erro: "Erro ao encriptar nova senha." });
    }
  });
});


// 14. Gestão de FAQs
app.get("/api/faqs", (req, res) => {
  db.query("SELECT * FROM faq ORDER BY categoria, pergunta", (err, results) => {
    if (err) return res.status(500).json(err);
    // Map to frontend expected format if needed, but assuming direct mapping is fine for now
    // or adjust frontend later.
    const faqs = results.map(row => ({
      id: row.id_faq,
      question: row.pergunta,
      answer: row.resposta,
      category: row.categoria
    }));
    res.json(faqs);
  });
});

app.post("/api/faqs", (req, res) => {
  const { question, answer, category } = req.body;
  // Note: data_criacao is NOT NULL and has no default in the inspected table, so we must provide NOW()
  db.query("INSERT INTO faq (pergunta, resposta, categoria, data_criacao) VALUES (?, ?, ?, NOW())", [question, answer, category], (err, result) => {
    if (err) return res.status(500).json(err);
    res.json({ id: result.insertId, question, answer, category });
  });
});

app.delete("/api/faqs/:id", (req, res) => {
  db.query("DELETE FROM faq WHERE id_faq = ?", [req.params.id], (err) => {
    if (err) return res.status(500).json(err);
    res.json({ success: true });
  });
});

// 15. Comentários Internos - REMOVED (Not in DER)
// 16. Gestão de Categorias - REMOVED (Not in DER)

// 17. Dashboard Estatísticas
app.get("/api/dashboard/stats", (req, res) => {
  const stats = {
    totalTickets: 0,
    pendingTickets: 0,
    activeTickets: 0,
    completedTickets: 0,
    ticketsByTechnician: [],
    recentActivity: []
  };

  // Consultas paralelas para montar o dashboard
  const q1 = "SELECT COUNT(*) as total FROM pedidos";
  const q2 = "SELECT estado_pedido, COUNT(*) as count FROM pedidos GROUP BY estado_pedido";
  const q3 = "SELECT t.nome, COUNT(p.id_pedido) as count FROM tecnicos t LEFT JOIN pedidos p ON p.id_tecnico_responsavel = t.id_tecnico GROUP BY t.id_tecnico";
  const q4 = "SELECT * FROM pedidos ORDER BY data_pedido DESC LIMIT 5";

  db.query(q1, (err, r1) => {
    if (err) return res.status(500).json(err);
    stats.totalTickets = r1[0].total;

    db.query(q2, (err, r2) => {
      if (err) return res.status(500).json(err);
      r2.forEach(row => {
        if (row.estado_pedido === 'Em análise') stats.pendingTickets += row.count;
        if (row.estado_pedido === 'Em reparação') stats.activeTickets += row.count;
        if (row.estado_pedido === 'Concluído') stats.completedTickets += row.count;
      });

      // Nota: q3 e q4 simplificados para este exemplo, podem ser expandidos
      res.json(stats);
    });
  });
});

// 18. Relatórios (PDF)
const PDFDocument = require('pdfkit');

app.get("/api/reports/tickets/pdf", (req, res) => {
  const doc = new PDFDocument();
  const filename = `relatorio_pedidos_${Date.now()}.pdf`;

  res.setHeader('Content-disposition', `attachment; filename="${filename}"`);
  res.setHeader('Content-type', 'application/pdf');

  doc.pipe(res);

  doc.fontSize(20).text('Relatório de Pedidos - InfoConnect', { align: 'center' });
  doc.moveDown();

  db.query("SELECT p.*, c.nome as nome_cliente FROM pedidos p JOIN clientes c ON p.id_cliente = c.id_cliente ORDER BY data_pedido DESC", (err, results) => {
    if (err) {
      doc.text("Erro ao buscar dados.");
      doc.end();
      return;
    }

    results.forEach(ticket => {
      doc.fontSize(14).text(`Pedido #${ticket.id_pedido} - ${ticket.estado_pedido}`);
      doc.fontSize(10).text(`Cliente: ${ticket.nome_cliente}`);
      doc.text(`Data: ${new Date(ticket.data_pedido).toLocaleDateString()}`);
      doc.text(`Descrição: ${ticket.descricao_problema}`);
      doc.moveDown();
      doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke(); // Linha separadora
      doc.moveDown();
    });

    doc.end();
  });
});

// 19. System Logs (New)
app.get("/api/logs", (req, res) => {
  db.query("SELECT * FROM logs ORDER BY timestamp DESC LIMIT 100", (err, results) => {
    if (err) {
      // If table doesn't exist, return empty array instead of crashing
      if (err.code === 'ER_NO_SUCH_TABLE') return res.json([]);
      return res.status(500).json(err);
    }
    res.json(results);
  });
});

app.post("/api/logs", (req, res) => {
  const { action, details, userId, userName, type } = req.body;
  const sql = "INSERT INTO logs (action, details, userId, userName, type, timestamp) VALUES (?, ?, ?, ?, ?, NOW())";
  db.query(sql, [action, details, userId, userName, type], (err, result) => {
    if (err) {
      // Create table if it doesn't exist
      if (err.code === 'ER_NO_SUCH_TABLE') {
        const createParams = "CREATE TABLE logs (id INT AUTO_INCREMENT PRIMARY KEY, action VARCHAR(50), details TEXT, userId VARCHAR(50), userName VARCHAR(100), type VARCHAR(20), timestamp DATETIME)";
        db.query(createParams, (errC) => {
          if (errC) return res.status(500).json(errC);
          // Retry insert
          db.query(sql, [action, details, userId, userName, type], (errI, resI) => {
            if (errI) return res.status(500).json(errI);
            return res.json({ success: true, id: resI.insertId });
          });
        });
        return;
      }
      return res.status(500).json(err);
    }
    res.json({ success: true, id: result.insertId });
  });
});

// 19. Configurações
app.get("/api/settings", (req, res) => {
  db.query("SELECT * FROM configuracoes", (err, results) => {
    if (err) return res.status(500).json(err);
    const settings = {};
    results.forEach(row => {
      settings[row.chave] = row.valor;
    });
    res.json(settings);
  });
});

app.post("/api/settings", (req, res) => {
  const { key, value } = req.body;
  const sql = "INSERT INTO configuracoes (chave, valor) VALUES (?, ?) ON DUPLICATE KEY UPDATE valor = ?";
  db.query(sql, [key, value, value], (err) => {
    if (err) return res.status(500).json(err);
    res.json({ success: true });
  });
});

// 18.2 Obter Logs do Sistema
app.get("/api/logs", (req, res) => {
  const sql = `
    SELECT l.*, 
           u.email as email_utilizador,
           COALESCE(t.nome, IF(u.tipo_utilizador = 'Admin', 'Administrador', SUBSTRING_INDEX(u.email, '@', 1))) as nome_utilizador
    FROM logs l
    LEFT JOIN utilizadores u ON l.id_utilizador = u.id_utilizador
    LEFT JOIN tecnicos t ON l.id_utilizador = t.id_tecnico
    ORDER BY l.data_registo DESC
    LIMIT 100
  `;
  db.query(sql, (err, results) => {
    if (err) {
      console.error("Error fetching logs:", err);
      return res.status(500).json(err);
    }
    // Mapear para o formato do frontend
    const formattedLogs = results.map(row => ({
      id: row.id_log,
      action: row.tipo_log === 'Sistema' ? 'Sistema' : row.descricao.split(':')[0] || 'Ação', // Tenta extrair ação da descrição
      details: row.descricao,
      userId: row.id_utilizador,
      userName: row.nome_utilizador || "Utilizador Desconhecido", // Fallback
      timestamp: row.data_registo,
      type: row.tipo_log
    }));
    res.json(formattedLogs);
  });
});

// 18.3 Criar Log (Backend)
app.post("/api/logs", (req, res) => {
  const { action, details, userId, type } = req.body;
  // Concatenar ação e detalhes para a descrição, já que a tabela logs usa 'descricao'
  const descricao = `${action}: ${details}`;
  const sql = `INSERT INTO logs (id_utilizador, tipo_log, descricao, data_registo) VALUES (?, ?, ?, NOW())`;

  db.query(sql, [userId === 'anonymous' ? null : userId, type, descricao], (err, result) => {
    if (err) {
      console.error("Error creating log:", err);
      return res.status(500).json(err);
    }
    res.json({ success: true, id: result.insertId });
  });
});

// Drop old table if exists (Cleanup)
app.get("/api/debug/cleanup-logs", (req, res) => {
  db.query("DROP TABLE IF EXISTS logs_sistema", (err) => {
    if (err) return res.status(500).json(err);
    res.json({ message: "Old logs table dropped" });
  });
});

// ==========================================
// Arranque do Servidor Backend
// ==========================================

app.listen(3000, () => {
  console.log("Servidor InfoConnect a correr na porta 3000");
});

