const mysql = require('mysql2');

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "bd_infoconnect"
});

db.connect(err => {
  if (err) throw err;
  console.log("Connected to database.");

  const queries = [
    `CREATE TABLE IF NOT EXISTS faqs (
      id INT AUTO_INCREMENT PRIMARY KEY,
      pergunta TEXT NOT NULL,
      resposta TEXT NOT NULL,
      categoria VARCHAR(100),
      criado_em DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS comentarios_internos (
      id INT AUTO_INCREMENT PRIMARY KEY,
      id_pedido INT NOT NULL,
      id_tecnico INT NOT NULL,
      comentario TEXT NOT NULL,
      data_comentario DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (id_pedido) REFERENCES pedidos(id_pedido),
      FOREIGN KEY (id_tecnico) REFERENCES tecnicos(id_tecnico)
    )`,
    `CREATE TABLE IF NOT EXISTS categorias (
      id INT AUTO_INCREMENT PRIMARY KEY,
      nome VARCHAR(100) NOT NULL UNIQUE,
      descricao TEXT
    )`,
    `CREATE TABLE IF NOT EXISTS recuperacao_senha (
      email VARCHAR(255) NOT NULL,
      token VARCHAR(255) NOT NULL,
      expiracao DATETIME NOT NULL,
      PRIMARY KEY (email)
    )`
  ];

  let completed = 0;
  queries.forEach(query => {
    db.query(query, (err, result) => {
      if (err) console.error("Error creating table:", err);
      else console.log("Table created/verified.");

      completed++;
      if (completed === queries.length) {
        console.log("All tables processed.");
        db.end();
      }
    });
  });
});
