require("dotenv").config();
const mysql = require("mysql2");
const fs = require("fs");

const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT
});

db.connect(err => {
    if (err) {
        fs.writeFileSync("db_diagnosis.txt", "Connection Error: " + JSON.stringify(err));
        process.exit(1);
    }

    db.query('DESCRIBE orcamentos', (err, res) => {
        if (err) {
            fs.writeFileSync("db_diagnosis.txt", "Query Error orcamentos: " + JSON.stringify(err));
        } else {
            const columns = res.map(c => `${c.Field} (${c.Type})`).join('\n');
            fs.appendFileSync("db_diagnosis.txt", "\nColumns in orcamentos:\n" + columns);
        }
        db.query('DESCRIBE notificacoes', (err2, res2) => {
            if (err2) {
                fs.appendFileSync("db_diagnosis.txt", "\nQuery Error notificacoes: " + JSON.stringify(err2));
            } else {
                const columns2 = res2.map(c => `${c.Field} (${c.Type})`).join('\n');
                fs.appendFileSync("db_diagnosis.txt", "\nColumns in notificacoes:\n" + columns2);
            }
            db.end();
        });
    });
});
