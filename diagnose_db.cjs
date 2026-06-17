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

    db.query('DESCRIBE utilizadores', (err, res) => {
        if (err) {
            fs.writeFileSync("db_diagnosis.txt", "Query Error: " + JSON.stringify(err));
        } else {
            const columns = res.map(c => `${c.Field} (${c.Type})`).join('\n');
            fs.writeFileSync("db_diagnosis.txt", "Columns in utilizadores:\n" + columns);
        }
        db.end();
    });
});
