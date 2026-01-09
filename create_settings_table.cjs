const mysql = require("mysql2");

const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "bd_infoconnect"
});

db.connect((err) => {
    if (err) throw err;
    console.log("Connected to database.");

    const sql = `
    CREATE TABLE IF NOT EXISTS configuracoes (
      id INT AUTO_INCREMENT PRIMARY KEY,
      chave VARCHAR(50) NOT NULL UNIQUE,
      valor VARCHAR(255) NOT NULL
    )
  `;

    db.query(sql, (err, result) => {
        if (err) throw err;
        console.log("Table 'configuracoes' created or already exists.");

        // Insert default settings if not exists
        const insertSql = `
      INSERT IGNORE INTO configuracoes (chave, valor) VALUES ('email_notifications', 'true')
    `;
        db.query(insertSql, (err, res) => {
            if (err) throw err;
            console.log("Default settings inserted.");
            process.exit();
        });
    });
});
