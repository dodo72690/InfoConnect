// ==========================================
// InfoConnect - Backend (server.cjs)
// ==========================================

require("dotenv").config();
const express = require("express"); // Framework web para Node.js
const cors = require("cors"); // Permite requisições de outros domínios (Frontend)
const mysql = require("mysql2"); // Driver para conectar à base de dados MySQL
const multer = require("multer"); // Middleware para gerir uploads de ficheiros
const path = require("path"); // Utilitário para lidar com caminhos de ficheiros
const fs = require("fs"); // Sistema de ficheiros (para criar pastas, etc.)
const bcrypt = require("bcrypt"); // Biblioteca para encriptar senhas (segurança)
const crypto = require("crypto"); // Para gerar tokens aleatórios
// ==========================================
// Ligação à Base de Dados (MySQL - XAMPP)
// ==========================================

const db = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "bd_infoconnect",
  port: process.env.DB_PORT || 3306,
  // Importante: A Clever Cloud e outros serviços exigem SSL, mas aceitam certificados auto-assinados
  ssl: process.env.DB_HOST !== 'localhost' ? { rejectUnauthorized: false } : undefined
});

// Testar ligação imediatamente ao iniciar
db.getConnection((err, connection) => {
  if (err) {
    console.error("ERRO CRÍTICO DE LIGAÇÃO À BASE DE DADOS:");
    console.error("Código:", err.code);
    console.error("Mensagem:", err.message);
    console.error("Host tentado:", process.env.DB_HOST);
  } else {
    console.log("Ligado à Base de Dados com sucesso!");
    connection.release();
    runDbMigrations();
  }
});

// Função para aplicar alterações e criar tabelas na BD automaticamente
function runDbMigrations() {
  // 1. Criar tabela notificacoes se não existir
  const createNotificationsTable = `
    CREATE TABLE IF NOT EXISTS notificacoes (
      id_notificacao INT AUTO_INCREMENT PRIMARY KEY,
      id_utilizador INT NOT NULL,
      mensagem VARCHAR(255) NOT NULL,
      lida TINYINT(1) DEFAULT 0,
      data_criacao DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (id_utilizador) REFERENCES utilizadores(id_utilizador) ON DELETE CASCADE
    )
  `;
  db.query(createNotificationsTable, (err) => {
    if (err) {
      console.error("Erro ao criar tabela notificacoes:", err);
    } else {
      console.log("Tabela 'notificacoes' verificada/criada.");
    }
  });

  // 2. Adicionar colunas de avaliação na tabela pedidos se não existirem
  const checkColumnsQuery = `
    SELECT COLUMN_NAME 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'pedidos' 
      AND COLUMN_NAME IN ('avaliacao_estrelas', 'avaliacao_comentario')
  `;
  db.query(checkColumnsQuery, (err, rows) => {
    if (err) {
      console.error("Erro ao verificar colunas de avaliacao na tabela pedidos:", err);
      return;
    }
    const cols = (rows || []).map(r => r.COLUMN_NAME || r.column_name || r.Column_name);
    if (!cols.includes('avaliacao_estrelas')) {
      db.query("ALTER TABLE pedidos ADD COLUMN avaliacao_estrelas INT NULL", (err) => {
        if (err) console.error("Erro ao adicionar coluna 'avaliacao_estrelas':", err);
        else console.log("Coluna 'avaliacao_estrelas' adicionada com sucesso.");
      });
    }
    if (!cols.includes('avaliacao_comentario')) {
      db.query("ALTER TABLE pedidos ADD COLUMN avaliacao_comentario TEXT NULL", (err) => {
        if (err) console.error("Erro ao adicionar coluna 'avaliacao_comentario':", err);
        else console.log("Coluna 'avaliacao_comentario' adicionada com sucesso.");
      });
    }
  });

  // 3. Adicionar coluna 'foto_perfil' na tabela utilizadores se não existir
  const checkUserColsQuery = `
    SELECT COLUMN_NAME 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'utilizadores' 
      AND COLUMN_NAME = 'foto_perfil'
  `;
  db.query(checkUserColsQuery, (err, rows) => {
    if (err) {
      console.error("Erro ao verificar colunas em utilizadores:", err);
      return;
    }
    if (!rows || rows.length === 0) {
      db.query("ALTER TABLE utilizadores ADD COLUMN foto_perfil VARCHAR(255) NULL", (errUpd) => {
        if (errUpd) console.error("Erro ao adicionar coluna 'foto_perfil':", errUpd);
        else console.log("Coluna 'foto_perfil' adicionada com sucesso.");
      });
    }
  });

  // 4. Adicionar colunas de contraproposta na tabela orcamentos se não existirem
  const checkBudgetColsQuery = `
    SELECT COLUMN_NAME 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'orcamentos' 
      AND COLUMN_NAME IN ('contraproposta_valor', 'contraproposta_motivo')
  `;
  db.query(checkBudgetColsQuery, (err, rows) => {
    if (err) {
      console.error("Erro ao verificar colunas em orcamentos:", err);
      return;
    }
    const cols = (rows || []).map(r => r.COLUMN_NAME || r.column_name || r.Column_name);
    if (!cols.includes('contraproposta_valor')) {
      db.query("ALTER TABLE orcamentos ADD COLUMN contraproposta_valor DECIMAL(10,2) NULL", (errUpd) => {
        if (errUpd) console.error("Erro ao adicionar coluna 'contraproposta_valor':", errUpd);
        else console.log("Coluna 'contraproposta_valor' adicionada com sucesso.");
      });
    }
    if (!cols.includes('contraproposta_motivo')) {
      db.query("ALTER TABLE orcamentos ADD COLUMN contraproposta_motivo TEXT NULL", (errUpd) => {
        if (errUpd) console.error("Erro ao adicionar coluna 'contraproposta_motivo':", errUpd);
        else console.log("Coluna 'contraproposta_motivo' adicionada com sucesso.");
      });
    }
  });

}

// Função auxiliar para inserir notificações na BD
const createNotification = (userId, message) => {
  const sql = "INSERT INTO notificacoes (id_utilizador, mensagem) VALUES (?, ?)";
  db.query(sql, [userId, message], (err) => {
    if (err) console.error("Erro ao criar notificação:", err);
  });
};

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
// Configuração de Email
const nodemailer = require("nodemailer");
let transporter;

async function createTransporter() {
  // 1. Tentar usar credenciais reais do .env ou ambiente
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    console.log("[Email] Configuring Real SMTP Transport...");
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT || 587,
      secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
    console.log(`[Email] Real SMTP Configured for user: ${process.env.SMTP_USER}`);
    return;
  }

  // 2. Fallback para Ethereal (Ambiente de Teste)
  console.log("[Email] No SMTP credentials found. Attempting to create Ethereal Test Account...");
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
    console.log("[Email] Ethereal Test Email Configured:", testAccount.user);
    console.log("[Email] NOTE: Emails will NOT be delivered. Check console for Preview URL.");
  } catch (err) {
    console.error("[Email] Failed to create Ethereal account (Offline Mode activated).");
    console.warn("[Email] Emails will be logged to this console instead.");
  }
}

// Inicializar transporte
createTransporter();

const sendEmail = async (to, subject, text) => {
  console.log(`[Email] Attempting to send email to ${to}`);

  // MODO OFFLINE / FALLBACK
  if (!transporter) {
    console.log("\n==================================================");
    console.log(" [EMAIL MOCK / OFFLINE MODE] ");
    console.log(` TO: ${to}`);
    console.log(` SUBJECT: ${subject}`);
    console.log(" --------------------------------------------------");
    console.log(` MESSAGE: ${text}`);
    console.log("==================================================\n");
    return;
  }

  try {
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
    // Fallback log on error
    console.log("\n[EMAIL ERROR FALLBACK]");
    console.log(`TO: ${to} | SUBJECT: ${subject} | MSG: ${text}\n`);
  }
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
      // 2. Encriptar password e gerar token (Código de 6 dígitos)
      const hashedPassword = await bcrypt.hash(password, 10);
      const verificationToken = Math.floor(100000 + Math.random() * 900000).toString();

      // 3. Criar Utilizador (Não verificado)
      const sqlUser = "INSERT INTO utilizadores (email, senha, tipo_utilizador, data_registo, email_verificado, token_verificacao) VALUES (?, ?, 'Cliente', NOW(), FALSE, ?)";
      db.query(sqlUser, [email, hashedPassword, verificationToken], (errUser, resUser) => {
        if (errUser) return res.status(500).json(errUser);

        const newUserId = resUser.insertId;

        // 4. Criar Cliente
        const sqlClient = "INSERT INTO clientes (id_cliente, nome, telemovel) VALUES (?, ?, NULL)";
        db.query(sqlClient, [newUserId, name], (errClient, resClient) => {
          if (errClient) {
            console.error("Erro ao criar perfil de cliente:", errClient);
            return res.status(500).json({ erro: "Erro ao criar perfil de cliente." });
          }

          // 5. Enviar Email de Verificação (Código numérico)
          sendEmail(email, "Código de Verificação - InfoConnect",
            `Bem-vindo ao InfoConnect! \n\nO seu código de verificação é: ${verificationToken}\n\nInsira este código na aplicação para ativar a sua conta.`);

          res.json({
            message: "Registo efetuado com sucesso. Verifique o seu email para ativar a conta.",
            requireVerification: true
          });
        });
      });

    } catch (e) {
      return res.status(500).json({ erro: "Erro de servidor ao processar registo." });
    }
  });
});

// 0.1 Verificar Email (Com Código)
app.post("/api/auth/verify", (req, res) => {
  const { email, code } = req.body;

  if (!email || !code) return res.status(400).json({ erro: "Email e código são obrigatórios." });

  db.query("SELECT * FROM utilizadores WHERE email = ? AND token_verificacao = ?", [email, code], (err, results) => {
    if (err) return res.status(500).json(err);
    if (results.length === 0) return res.status(400).json({ erro: "Código inválido ou expirado." });

    const user = results[0];

    // Atualizar utilizador para verificado
    db.query("UPDATE utilizadores SET email_verificado = TRUE, token_verificacao = NULL WHERE id_utilizador = ?", [user.id_utilizador], (errUpd) => {
      if (errUpd) return res.status(500).json(errUpd);

      res.json({ success: true, message: "Email verificado com sucesso! Pode agora fazer login." });
    });
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

    // Verificar se email está confirmado (apenas para Clientes, opcional para outros)
    // Se quiser impor a todos, remova o if
    if (user.tipo_utilizador === 'Cliente' && user.email_verificado === 0) {
      return res.status(403).json({ erro: "Por favor verifique o seu email antes de entrar." });
    }

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
        const userData = {
          id: String(user.id_utilizador),
          name: details.nome || user.email,
          email: user.email,
          role: user.tipo_utilizador,
          phone: details.telemovel || '',
          companyName: user.tipo_utilizador === 'Cliente' ? 'Cliente Particular' : undefined,
          avatarUrl: user.foto_perfil || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`
        };

        // Registo de Log de Login
        const logSql = "INSERT INTO logs (tipo_log, acao, id_utilizador, detalhes, data_registo) VALUES (?, ?, ?, ?, NOW())";
        db.query(logSql, ['Sistema', 'LOGIN', user.id_utilizador, `Utilizador ${user.email} entrou no sistema`], (errLog) => {
          if (errLog) console.error("Erro ao criar log de login:", errLog);
        });

        return res.json(userData);
      } else {
        // Fallback for users without detailed profiles (shouldn't happen for Cliente/Tecnico if DB is consistent)
        const userData = {
          id: String(user.id_utilizador),
          name: user.email.split('@')[0],
          email: user.email,
          role: user.tipo_utilizador,
          phone: "",
          avatarUrl: user.foto_perfil || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`
        };
        return res.json(userData);
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

// 1.1.1 Atualizar Foto de Perfil / Avatar
app.patch("/api/users/:id/avatar", upload.single('avatar'), (req, res) => {
  const userId = req.params.id;
  let avatarPath = null;

  if (req.file) {
    avatarPath = `/uploads/${req.file.filename}`;
  } else if (req.body.avatarName) {
    avatarPath = req.body.avatarName;
  } else {
    return res.status(400).json({ erro: "Nenhum ficheiro ou nome de avatar fornecido." });
  }

  const sql = "UPDATE utilizadores SET foto_perfil = ? WHERE id_utilizador = ?";
  db.query(sql, [avatarPath, userId], (err, result) => {
    if (err) return res.status(500).json(err);

    // Registar no log do sistema
    const logSql = "INSERT INTO logs (tipo_log, acao, id_utilizador, detalhes, data_registo) VALUES (?, ?, ?, ?, NOW())";
    db.query(logSql, ['Sistema', 'FOTO_PERFIL', userId, `Utilizador atualizou a foto de perfil para ${avatarPath}`], (errLog) => {
      if (errLog) console.error("Erro ao criar log de foto de perfil:", errLog);
    });

    res.json({ success: true, avatarUrl: avatarPath });
  });
});




// 1.2 Recuperar Senha - Solicitar Token
app.post("/api/auth/forgot-password", (req, res) => {
  const { email } = req.body;

  if (!email) return res.status(400).json({ erro: "Email é obrigatório." });

  db.query("SELECT * FROM utilizadores WHERE email = ?", [email], (err, results) => {
    db.query("SELECT * FROM utilizadores WHERE email = ?", [email], (err, results) => {
      if (err) {
        console.error("Error checking user for password recovery:", err);
        return res.status(500).json({ erro: "Erro ao verificar utilizador." });
      }
      if (results.length === 0) {
        // Retornar sucesso vago para segurança
        return res.json({ message: "Se o email existir, enviámos um código." });
      }

      const user = results[0];
      const token = crypto.randomBytes(4).toString('hex').toUpperCase(); // Token de 8 caracteres
      const expires = new Date(Date.now() + 3600000); // 1 hora de validade

      const sqlUpdate = "UPDATE utilizadores SET reset_token = ?, reset_expires = ? WHERE id_utilizador = ?";
      db.query(sqlUpdate, [token, expires, user.id_utilizador], (errUpd) => {
        if (errUpd) {
          console.error("Error updating reset token:", errUpd);
          return res.status(500).json({ erro: "Erro ao gerar token de recuperação." });
        }

        sendEmail(email, "Recuperação de Senha", `O seu código de recuperação é: ${token}`);
        res.json({ message: "Código enviado." });
      });
    });
  });
});

// 1.3 Redefinir Senha
app.post("/api/auth/reset-password", async (req, res) => {
  const { email, token, newPassword } = req.body;

  if (!email || !token || !newPassword) {
    return res.status(400).json({ erro: "Todos os campos são obrigatórios." });
  }

  const sql = "SELECT * FROM utilizadores WHERE email = ? AND reset_token = ? AND reset_expires > NOW()";
  db.query(sql, [email, token], async (err, results) => {
    if (err) {
      console.error("Error verifying reset token:", err);
      return res.status(500).json({ erro: "Erro ao verificar token." });
    }
    if (results.length === 0) {
      return res.status(400).json({ erro: "Token inválido ou expirado." });
    }

    const user = results[0];

    try {
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      const sqlUpdate = "UPDATE utilizadores SET senha = ?, reset_token = NULL, reset_expires = NULL WHERE id_utilizador = ?";

      db.query(sqlUpdate, [hashedPassword, user.id_utilizador], (errUpd) => {
        if (errUpd) {
          console.error("Error updating password:", errUpd);
          return res.status(500).json({ erro: "Erro ao atualizar a senha." });
        }
        res.json({ success: true, message: "Senha alterada com sucesso." });
      });
    } catch (e) {
      console.error("Error hashing password:", e);
      res.status(500).json({ erro: "Erro ao processar a nova senha." });
    }
  });
});

// 2. Obter Tickets - Lista todos os pedidos de suporte (com filtros de visualização)
app.get("/api/tickets", (req, res) => {
  const sql = `
    SELECT p.*, c.nome as nome_cliente, u.email as client_email,
           o.id_orcamento, o.valor, o.descricao_servico, o.estado_orcamento, o.data_envio as data_orcamento,
           o.contraproposta_valor, o.contraproposta_motivo,
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
        ratingStars: row.avaliacao_estrelas,
        ratingComment: row.avaliacao_comentario,
        messages: []
      };

      if (row.id_orcamento) {
        ticket.budget = {
          id: String(row.id_orcamento),
          value: Number(row.valor),
          description: row.descricao_servico,
          status: row.estado_orcamento,
          createdAt: row.data_orcamento,
          counterValue: row.contraproposta_valor ? Number(row.contraproposta_valor) : undefined,
          counterReason: row.contraproposta_motivo || undefined
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
  // Filtrar apenas mensagens públicas (chat normal)
  const sql = "SELECT * FROM mensagens WHERE id_pedido = ? AND (tipo = 'publico' OR tipo IS NULL) ORDER BY data_envio ASC";

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
  // Forçar tipo = 'publico'
  const sql = "INSERT INTO mensagens (id_pedido, remetente, mensagem, data_envio, tipo) VALUES (?, ?, ?, NOW(), 'publico')";

  db.query(sql, [ticketId, senderType, text], (err, result) => {
    if (err) return res.status(500).json(err);

    // Enviar notificação por email
    // Obter dados do pedido e cliente para enviar email
    const queryTicket = `
      SELECT p.id_cliente, p.id_tecnico, p.descricao_problema, c.nome, u.email 
      FROM pedidos p 
      JOIN clientes c ON p.id_cliente = c.id_cliente 
      JOIN utilizadores u ON c.id_cliente = u.id_utilizador 
      WHERE p.id_pedido = ?
    `;

    db.query(queryTicket, [ticketId], (errTick, resTick) => {
      if (!errTick && resTick.length > 0) {
        const ticketInfo = resTick[0];

        if (senderType === 'Technician' || senderType === 'Técnico' || senderType === 'Admin') {
          // Se foi técnico ou admin, notificar cliente
          sendEmail(ticketInfo.email, `Nova mensagem no Pedido #${ticketId}`, `O técnico respondeu: "${text}"`);
          createNotification(ticketInfo.id_cliente, `Nova mensagem no Pedido #${ticketId}: "${text}"`);
        } else {
          // Se foi cliente, notificar técnico (se houver) ou os admins
          sendEmail('admin@infoconnect.com', `Nova mensagem do cliente no Pedido #${ticketId}`, `Mensagem: "${text}"`);
          if (ticketInfo.id_tecnico) {
            createNotification(ticketInfo.id_tecnico, `O cliente enviou uma mensagem no Pedido #${ticketId}: "${text}"`);
          } else {
            // Notificar admins (procurar utilizadores do tipo 'Admin')
            db.query("SELECT id_utilizador FROM utilizadores WHERE tipo_utilizador = 'Admin'", (errA, admins) => {
              if (!errA && admins) {
                admins.forEach(admin => {
                  createNotification(admin.id_utilizador, `[Admin] Nova mensagem no Pedido #${ticketId}: "${text}"`);
                });
              }
            });
          }
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
      SELECT u.email, c.nome, p.id_cliente 
      FROM pedidos p 
      JOIN clientes c ON p.id_cliente = c.id_cliente 
      JOIN utilizadores u ON c.id_cliente = u.id_utilizador 
      WHERE p.id_pedido = ?
    `;
    db.query(queryClient, [ticketId], (errC, resC) => {
      if (!errC && resC.length > 0) {
        const client = resC[0];
        sendEmail(client.email, `Atualização do Pedido #${ticketId}`, `O estado do seu pedido foi alterado para: ${status}`);
        createNotification(client.id_cliente, `O estado do seu pedido #${ticketId} foi alterado para: ${status}`);
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

    const notifyClient = () => {
      const q = "SELECT id_cliente FROM pedidos WHERE id_pedido = ?";
      db.query(q, [ticketId], (errQ, resQ) => {
        if (!errQ && resQ.length > 0) {
          createNotification(resQ[0].id_cliente, `Foi enviado/atualizado um orçamento de ${value}€ para o seu pedido #${ticketId}.`);
        }
      });
    };

    if (results.length > 0) {
      const currentStatus = results[0].estado_orcamento;
      if (currentStatus === 'Pendente' || currentStatus === 'Contraproposta' || currentStatus === 'Aprovado') {
        return res.status(400).json({ erro: "Já existe um orçamento ativo para este pedido." });
      }

      const updateSql = "UPDATE orcamentos SET valor = ?, descricao_servico = ?, estado_orcamento = 'Pendente', contraproposta_valor = NULL, contraproposta_motivo = NULL, data_envio = NOW() WHERE id_pedido = ?";
      db.query(updateSql, [value, description, ticketId], (errUpd, resultUpd) => {
        if (errUpd) return res.status(500).json(errUpd);
        notifyClient();
        res.json({ success: true, message: "Orçamento atualizado" });
      });
    } else {
      const insertSql = "INSERT INTO orcamentos (id_pedido, valor, descricao_servico, estado_orcamento, data_envio) VALUES (?, ?, ?, 'Pendente', NOW())";
      db.query(insertSql, [ticketId, value, description], (errIns, resultIns) => {
        if (errIns) return res.status(500).json(errIns);
        notifyClient();
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

    // Notificar técnico ou admin de que o orçamento foi aprovado/recusado pelo cliente
    const q = "SELECT id_tecnico FROM pedidos WHERE id_pedido = ?";
    db.query(q, [ticketId], (errQ, resQ) => {
      if (!errQ && resQ.length > 0) {
        const techId = resQ[0].id_tecnico;
        const msg = `O orçamento para o pedido #${ticketId} foi ${status.toLowerCase()} pelo cliente.`;
        if (techId) {
          createNotification(techId, msg);
        } else {
          // Notificar admins
          db.query("SELECT id_utilizador FROM utilizadores WHERE tipo_utilizador = 'Admin'", (errA, admins) => {
            if (!errA && admins) {
              admins.forEach(admin => {
                createNotification(admin.id_utilizador, `[Admin] ${msg}`);
              });
            }
          });
        }
      }
    });

    res.json({ success: true });
  });
});

// 8.2 Contraproposta de Orçamento (Cliente)
app.post("/api/tickets/:id/budget/counter", (req, res) => {
  const ticketId = req.params.id;
  const { value, reason } = req.body;

  if (!value || !reason) {
    return res.status(400).json({ erro: "Valor e motivo da contraproposta são obrigatórios." });
  }

  // Verificar se o orçamento existe e está Pendente
  db.query("SELECT * FROM orcamentos WHERE id_pedido = ?", [ticketId], (err, results) => {
    if (err) return res.status(500).json(err);
    if (results.length === 0) {
      return res.status(404).json({ erro: "Orçamento não encontrado." });
    }
    if (results[0].estado_orcamento !== 'Pendente') {
      return res.status(400).json({ erro: "Apenas orçamentos com estado 'Pendente' podem receber uma contraproposta." });
    }

    const updateSql = `
      UPDATE orcamentos 
      SET contraproposta_valor = ?, contraproposta_motivo = ?, estado_orcamento = 'Contraproposta' 
      WHERE id_pedido = ?
    `;
    db.query(updateSql, [value, reason, ticketId], (errUpd) => {
      if (errUpd) return res.status(500).json(errUpd);

      // Notificar o técnico ou admin
      db.query("SELECT id_tecnico, id_cliente FROM pedidos WHERE id_pedido = ?", [ticketId], (errP, resP) => {
        if (!errP && resP.length > 0) {
          const { id_tecnico, id_cliente } = resP[0];
          const msg = `O cliente enviou uma contraproposta de ${value}€ para o pedido #${ticketId}.`;
          
          if (id_tecnico) {
            createNotification(id_tecnico, msg);
          } else {
            // Notificar admins
            db.query("SELECT id_utilizador FROM utilizadores WHERE tipo_utilizador = 'Admin'", (errA, admins) => {
              if (!errA && admins) {
                admins.forEach(admin => {
                  createNotification(admin.id_utilizador, `[Admin] ${msg}`);
                });
              }
            });
          }

          // Criar log de atividade
          const logSql = "INSERT INTO logs (tipo_log, acao, id_utilizador, detalhes, data_registo) VALUES (?, ?, ?, ?, NOW())";
          db.query(logSql, ['Intervencao', 'CONTRAPROPOSTA_ENVIO', id_cliente, `Cliente enviou contraproposta de ${value}€ para o pedido #${ticketId}.`], (errLog) => {
            if (errLog) console.error("Erro ao criar log de contraproposta:", errLog);
          });
        }
      });

      res.json({ success: true, message: "Contraproposta enviada com sucesso." });
    });
  });
});

// 8.3 Ação sobre Contraproposta (Técnico / Admin)
app.post("/api/tickets/:id/budget/counter/action", (req, res) => {
  const ticketId = req.params.id;
  const { action, userId } = req.body; // action: 'approve' ou 'reject'

  if (action !== 'approve' && action !== 'reject') {
    return res.status(400).json({ erro: "Ação inválida. Use 'approve' ou 'reject'." });
  }

  db.query("SELECT * FROM orcamentos WHERE id_pedido = ?", [ticketId], (err, results) => {
    if (err) return res.status(500).json(err);
    if (results.length === 0) {
      return res.status(404).json({ erro: "Orçamento não encontrado." });
    }
    if (results[0].estado_orcamento !== 'Contraproposta') {
      return res.status(400).json({ erro: "Não existe nenhuma contraproposta pendente para este orçamento." });
    }

    const budget = results[0];

    if (action === 'approve') {
      // Aceitar contraproposta
      const approveSql = `
        UPDATE orcamentos 
        SET valor = ?, estado_orcamento = 'Aprovado' 
        WHERE id_pedido = ?
      `;
      db.query(approveSql, [budget.contraproposta_valor, ticketId], (errAppr) => {
        if (errAppr) return res.status(500).json(errAppr);

        // Atualizar estado do ticket para 'Em reparação'
        db.query("UPDATE pedidos SET estado_pedido = 'Em reparação' WHERE id_pedido = ?", [ticketId], (errStatus) => {
          if (errStatus) console.error(errStatus);
        });

        // Notificar o cliente
        db.query("SELECT id_cliente, u.email FROM pedidos p JOIN utilizadores u ON p.id_cliente = u.id_utilizador WHERE id_pedido = ?", [ticketId], (errP, resP) => {
          if (!errP && resP.length > 0) {
            const { id_cliente, email } = resP[0];
            const msg = `A sua contraproposta para o pedido #${ticketId} foi ACEITE. O novo valor é de ${budget.contraproposta_valor}€ e a reparação vai iniciar.`;
            createNotification(id_cliente, msg);
            sendEmail(email, `Contraproposta Aceite - Pedido #${ticketId}`, msg);

            // Log de atividade
            const logSql = "INSERT INTO logs (tipo_log, acao, id_utilizador, detalhes, data_registo) VALUES (?, ?, ?, ?, NOW())";
            db.query(logSql, ['Intervencao', 'CONTRAPROPOSTA_ACEITE', userId || null, `Técnico aceitou contraproposta de ${budget.contraproposta_valor}€ para o pedido #${ticketId}.`], (errLog) => {
              if (errLog) console.error(errLog);
            });
          }
        });

        res.json({ success: true, message: "Contraproposta aceite com sucesso." });
      });
    } else {
      // Recusar contraproposta
      const rejectSql = `
        UPDATE orcamentos 
        SET estado_orcamento = 'Recusado' 
        WHERE id_pedido = ?
      `;
      db.query(rejectSql, [ticketId], (errRej) => {
        if (errRej) return res.status(500).json(errRej);

        // Atualizar estado do ticket para 'Em análise'
        db.query("UPDATE pedidos SET estado_pedido = 'Em análise' WHERE id_pedido = ?", [ticketId], (errStatus) => {
          if (errStatus) console.error(errStatus);
        });

        // Notificar o cliente
        db.query("SELECT id_cliente, u.email FROM pedidos p JOIN utilizadores u ON p.id_cliente = u.id_utilizador WHERE id_pedido = ?", [ticketId], (errP, resP) => {
          if (!errP && resP.length > 0) {
            const { id_cliente, email } = resP[0];
            const msg = `A sua contraproposta para o pedido #${ticketId} foi RECUSADA. O orçamento foi marcado como recusado.`;
            createNotification(id_cliente, msg);
            sendEmail(email, `Contraproposta Recusada - Pedido #${ticketId}`, msg);

            // Log de atividade
            const logSql = "INSERT INTO logs (tipo_log, acao, id_utilizador, detalhes, data_registo) VALUES (?, ?, ?, ?, NOW())";
            db.query(logSql, ['Intervencao', 'CONTRAPROPOSTA_RECUSADA', userId || null, `Técnico recusou contraproposta para o pedido #${ticketId}.`], (errLog) => {
              if (errLog) console.error(errLog);
            });
          }
        });

        res.json({ success: true, message: "Contraproposta recusada." });
      });
    }
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
          let avatar = u.foto_perfil || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.email}`;

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
    SELECT c.*, u.email, u.foto_perfil
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
      avatarUrl: row.foto_perfil || `https://api.dicebear.com/7.x/avataaars/svg?seed=${row.nome}`
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

  // 1. Apagar Logs do sistema associados a este utilizador
  db.query("DELETE FROM logs WHERE id_utilizador = ?", [userId], (errLog) => {
    if (errLog) console.error("Error deleting logs:", errLog); // Apenas logar, continuar

    // 2. Se for Técnico: Desassociar dos pedidos (set id_tecnico = NULL)
    db.query("UPDATE pedidos SET id_tecnico = NULL WHERE id_tecnico = ?", [userId], (errTechUpdates) => {
      if (errTechUpdates) console.error("Error unassigning technician tickets:", errTechUpdates);

      // 3. Se for Cliente: Precisamos apagar Tickets + Mensagens + Orçamentos associados
      // Primeiro, buscar IDs dos pedidos deste cliente
      db.query("SELECT id_pedido FROM pedidos WHERE id_cliente = ?", [userId], (errFindCalls, tickets) => {
        if (errFindCalls) {
          return res.status(500).json({ erro: "Erro ao verificar pedidos do cliente." });
        }

        const deleteClientData = () => {
          // 4. Apagar de clientes, tecnicos e utilizadores
          db.query("DELETE FROM clientes WHERE id_cliente = ?", [userId], (errC) => {
            if (errC) console.error("Error deleting client:", errC);

            db.query("DELETE FROM tecnicos WHERE id_tecnico = ?", [userId], (errT) => {
              if (errT) console.error("Error deleting technician:", errT);

              db.query("DELETE FROM utilizadores WHERE id_utilizador = ?", [userId], (errU, result) => {
                if (errU) {
                  console.error("Error deleting user:", errU);
                  return res.status(500).json({ erro: "Erro ao apagar utilizador final (FK constraint?)." });
                }
                console.log(`User ${userId} deleted successfully.`);
                res.json({ success: true });
              });
            });
          });
        };

        if (tickets.length === 0) {
          // Cliente não tem pedidos (ou não é cliente), prosseguir para apagar contas
          deleteClientData();
        } else {
          const ticketIds = tickets.map(t => t.id_pedido);

          // Apagar Mensagens desses pedidos
          db.query("DELETE FROM mensagens WHERE id_pedido IN (?)", [ticketIds], (errMsg) => {
            if (errMsg) console.error("Error deleting ticket messages:", errMsg);

            // Apagar Orçamentos desses pedidos
            db.query("DELETE FROM orcamentos WHERE id_pedido IN (?)", [ticketIds], (errBudg) => {
              if (errBudg) console.error("Error deleting ticket budgets:", errBudg);

              // Apagar Pedidos
              db.query("DELETE FROM pedidos WHERE id_cliente = ?", [userId], (errPed) => {
                if (errPed) {
                  console.error("Error deleting tickets:", errPed);
                  return res.status(500).json({ erro: "Erro ao apagar pedidos do cliente." });
                }
                // Agora que apámos os pedidos, apagar o utilizador
                deleteClientData();
              });
            });
          });
        }
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

// 14. Relatórios (CSV)
app.get("/api/reports/tickets/csv", (req, res) => {
  const sql = `
    SELECT p.id_pedido, c.nome as cliente, p.estado_pedido, p.data_pedido, p.descricao_problema as descricao_pedido
    FROM pedidos p
    JOIN clientes c ON p.id_cliente = c.id_cliente
    ORDER BY p.data_pedido DESC
  `;
  db.query(sql, (err, results) => {
    if (err) {
      console.error("Erro ao gerar CSV:", err);
      return res.status(500).send("Erro ao gerar relatório");
    }

    // Cabeçalho BOM para Excel reconhecer UTF-8
    let csv = "\uFEFFID,Cliente,Estado,Data,Descricao\n";

    results.forEach(row => {
      // Escape quotes for CSV
      const desc = row.descricao_pedido ? row.descricao_pedido.replace(/"/g, '""') : "";
      const nome = row.cliente ? row.cliente.replace(/"/g, '""') : "";

      csv += `${row.id_pedido},"${nome}",${row.estado_pedido},${new Date(row.data_pedido).toISOString().split('T')[0]},"${desc}"\n`;
    });

    res.header('Content-Type', 'text/csv; charset=utf-8');
    res.attachment('relatorio_pedidos.csv');
    return res.send(csv);
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

// 14.1 Sugestão de FAQ (Email)
app.post("/api/faqs/suggest", async (req, res) => {
  const { suggestion, userEmail, userName } = req.body;

  if (!suggestion) return res.status(400).json({ erro: "Sugestão vazia." });

  const mailOptions = {
    from: process.env.SMTP_USER,
    to: process.env.SMTP_USER, // Send to Admin (himself)
    subject: `Nova Sugestão de FAQ - InfoConnect`,
    html: `
      <h3>Nova Sugestão Recebida</h3>
      <p><strong>Utilizador:</strong> ${userName || 'Anónimo'} (${userEmail || 'Sem email'})</p>
      <p><strong>Sugestão:</strong></p>
      <blockquote style="background: #f9f9f9; padding: 10px; border-left: 5px solid #ccc;">
        ${suggestion}
      </blockquote>
      <p>Aceda ao painel para criar esta FAQ se achar pertinente.</p>
    `
  };

  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    await transporter.sendMail(mailOptions);
    res.json({ success: true, message: "Sugestão enviada por email." });
  } catch (error) {
    console.error("Erro ao enviar email de sugestão:", error);
    res.status(500).json({ erro: "Erro ao enviar email." });
  }
});

// 15. Comentários Internos
// Migração: Adicionar coluna 'tipo' à tabela de mensagens se não existir
const sqlAlterTable = `
  SELECT count(*) as col_count 
  FROM information_schema.columns 
  WHERE table_name = 'mensagens' 
  AND column_name = 'tipo' 
  AND table_schema = '${process.env.DB_NAME || 'bd_infoconnect'}';
`;

db.query(sqlAlterTable, (err, results) => {
  if (err) {
    console.error("Erro ao verificar schema de mensagens:", err);
  } else if (results && results[0] && results[0].col_count === 0) {
    console.log("Adicionando coluna 'tipo' à tabela mensagens...");
    db.query("ALTER TABLE mensagens ADD COLUMN tipo ENUM('publico', 'interno') DEFAULT 'publico'", (errAlter) => {
      if (errAlter) console.error("Erro ao alterar tabela mensagens:", errAlter);
      else console.log("Coluna 'tipo' adicionada com sucesso.");
    });
  }
});

app.get("/api/tickets/:id/internal-comments", (req, res) => {
  const ticketId = req.params.id;

  const sql = "SELECT * FROM mensagens WHERE id_pedido = ? AND tipo = 'interno' ORDER BY data_envio DESC";

  db.query(sql, [ticketId], (err, results) => {
    if (err) return res.status(500).json(err);

    const comments = results.map(m => ({
      id: m.id_mensagem || m.id,
      id_tecnico: 0,
      nome_tecnico: m.remetente,
      comentario: m.mensagem,
      data_comentario: m.data_envio
    }));

    res.json(comments);
  });
});

app.post("/api/tickets/:id/internal-comments", (req, res) => {
  const ticketId = req.params.id;
  const { technicianId, text } = req.body;

  // Buscar nome do técnico para gravar no campo 'remetente'
  db.query("SELECT nome FROM tecnicos WHERE id_tecnico = ?", [technicianId], (errT, resT) => {
    let techName = "Técnico";
    if (!errT && resT && resT.length > 0) {
      techName = resT[0].nome;
    } else {
      techName = "Staff";
    }

    const sql = "INSERT INTO mensagens (id_pedido, remetente, mensagem, data_envio, tipo) VALUES (?, ?, ?, NOW(), 'interno')";
    db.query(sql, [ticketId, techName, text], (err, result) => {
      if (err) return res.status(500).json(err);
      res.json({
        id: result.insertId,
        id_tecnico: technicianId,
        nome_tecnico: techName,
        comentario: text,
        data_comentario: new Date()
      });
    });
  });
});
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

      // Query for Recent Activity (Last 7 Days)
      const qActivity = `
        SELECT DATE(data_pedido) as date, COUNT(*) as count 
        FROM pedidos 
        WHERE data_pedido >= DATE(NOW()) - INTERVAL 7 DAY 
        GROUP BY DATE(data_pedido) 
        ORDER BY date ASC
      `;

      db.query(qActivity, (errA, rActivity) => {
        if (errA) console.error("Error fetching activity:", errA);

        // Transform for frontend
        if (rActivity) {
          stats.recentActivity = rActivity.map(row => ({
            date: row.date.toISOString().split('T')[0],
            count: row.count
          }));
        }

        res.json(stats);
      });
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

// 19. System Logs (Consolidated below)


// 19. Configurações
app.get("/api/settings", (req, res) => {
  res.json({ email_notifications: 'true' });
});

app.post("/api/settings", (req, res) => {
  res.json({ success: true });
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
      action: row.acao || (row.descricao ? row.descricao.split(':')[0] : 'Ação'),
      details: row.detalhes || row.descricao,
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
  // Concatenar ação e detalhes para a descrição, já que a tabela logs usa 'descricao' (backward compatibility)
  const descricao = `${action}: ${details}`;

  // Use new columns acao/detalhes
  const sql = `INSERT INTO logs (id_utilizador, tipo_log, acao, detalhes, descricao, data_registo) VALUES (?, ?, ?, ?, ?, NOW())`;

  db.query(sql, [userId === 'anonymous' ? null : userId, type, action, details, descricao], (err, result) => {
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

// 2. Relatório de Tickets para Excel (CSV)
app.get('/api/reports/tickets/excel', (req, res) => {
  const sql = `
    SELECT 
      t.id, t.titulo, t.prioridade, t.status, t.criado_em,
      c.nome as cliente,
      u_tec.nome as tecnico_nome
    FROM tickets t
    LEFT JOIN clientes c ON t.cliente_id = c.id_cliente
    LEFT JOIN tecnicos tec ON t.tecnico_id = tec.id_tecnico
    LEFT JOIN utilizadores u_tec ON tec.user_id = u_tec.id_utilizador
    ORDER BY t.criado_em DESC
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error("Erro ao exportar CSV:", err);
      return res.status(500).send("Erro ao gerar relatório");
    }

    let csv = "ID,Titulo,Prioridade,Estado,Data Criacao,Cliente,Tecnico\n";

    results.forEach(row => {
      const tecnico = row.tecnico_nome || "N/A";
      const cliente = row.cliente || "N/A";
      const data = new Date(row.criado_em).toLocaleDateString("pt-PT");
      const titulo = `"${(row.titulo || "").replace(/"/g, '""')}"`;

      csv += `${row.id},${titulo},${row.prioridade},${row.status},${data},${cliente},${tecnico}\n`;
    });

    res.header('Content-Type', 'text/csv');
    res.attachment(`relatorio_pedidos_${new Date().toISOString().split('T')[0]}.csv`);
    return res.send(csv);
  });
});

// ==========================================
// Novas Rotas (Notificações, Logs por Utilizador, Avaliação de Tickets)
// ==========================================

// 1. Obter notificações do utilizador
app.get("/api/users/:id/notifications", (req, res) => {
  const userId = req.params.id;
  const sql = "SELECT * FROM notificacoes WHERE id_utilizador = ? ORDER BY data_criacao DESC LIMIT 50";
  db.query(sql, [userId], (err, results) => {
    if (err) return res.status(500).json(err);
    res.json(results.map(row => ({
      id: row.id_notificacao,
      userId: row.id_utilizador,
      message: row.mensagem,
      read: row.lida === 1,
      createdAt: row.data_criacao
    })));
  });
});

// 2. Marcar uma notificação como lida
app.patch("/api/notifications/:id/read", (req, res) => {
  const notificationId = req.params.id;
  const sql = "UPDATE notificacoes SET lida = 1 WHERE id_notificacao = ?";
  db.query(sql, [notificationId], (err, result) => {
    if (err) return res.status(500).json(err);
    res.json({ success: true });
  });
});

// 3. Marcar todas as notificações do utilizador como lidas
app.patch("/api/users/:id/notifications/read-all", (req, res) => {
  const userId = req.params.id;
  const sql = "UPDATE notificacoes SET lida = 1 WHERE id_utilizador = ?";
  db.query(sql, [userId], (err, result) => {
    if (err) return res.status(500).json(err);
    res.json({ success: true });
  });
});

// 4. Obter histórico de logs de um utilizador específico
app.get("/api/users/:id/logs", (req, res) => {
  const userId = req.params.id;
  const sql = `
    SELECT * FROM logs 
    WHERE id_utilizador = ? 
    ORDER BY data_registo DESC 
    LIMIT 30
  `;
  db.query(sql, [userId], (err, results) => {
    if (err) return res.status(500).json(err);
    res.json(results.map(row => ({
      id: row.id_log,
      action: row.acao,
      details: row.detalhes || row.descricao,
      timestamp: row.data_registo,
      type: row.tipo_log
    })));
  });
});

// 5. Avaliar um pedido (ticket)
app.post("/api/tickets/:id/rate", (req, res) => {
  const ticketId = req.params.id;
  const { stars, comment } = req.body;
  const sql = "UPDATE pedidos SET avaliacao_estrelas = ?, avaliacao_comentario = ? WHERE id_pedido = ?";
  db.query(sql, [stars, comment, ticketId], (err, result) => {
    if (err) return res.status(500).json(err);
    
    // Registar a avaliação no log
    db.query("SELECT id_cliente FROM pedidos WHERE id_pedido = ?", [ticketId], (errP, resP) => {
      if (!errP && resP.length > 0) {
        const clientId = resP[0].id_cliente;
        const logSql = "INSERT INTO logs (tipo_log, acao, id_utilizador, detalhes, data_registo) VALUES (?, ?, ?, ?, NOW())";
        db.query(logSql, ['Intervencao', 'AVALIACAO', clientId, `Cliente avaliou o pedido #${ticketId} com ${stars} estrelas.`], (errLog) => {
          if (errLog) console.error("Erro ao criar log de avaliação:", errLog);
        });
      }
    });

    res.json({ success: true });
  });
});

// ==========================================
// Servir Frontend (Para Produção)
// ==========================================
// Serve os ficheiros estáticos da build do React (pasta dist)
app.use(express.static(path.join(__dirname, 'dist')));

// Qualquer rota que não seja da API retorna o index.html (SPA)
// Correção Final Express 5: Usar RegExp direta (/.*/) evita qualquer erro de sintaxe de string
app.get(/.*/, (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// ==========================================
// Arranque do Servidor Backend
// ==========================================

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor InfoConnect a correr na porta ${PORT}`);
});

