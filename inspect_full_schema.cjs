const mysql = require("mysql2");
const fs = require('fs');

const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "bd_infoconnect"
});

db.connect(err => {
    if (err) {
        console.error("Error connecting:", err);
        process.exit(1);
    }
    console.log("Connected!");

    const tables = ['tecnicos', 'mensagens', 'orcamentos', 'faq', 'logs'];
    let schema = {};
    let completed = 0;

    tables.forEach(table => {
        db.query(`DESCRIBE ${table}`, (err, results) => {
            if (err) {
                console.error(`Error describing ${table}:`, err);
                schema[table] = "ERROR";
            } else {
                schema[table] = results;
            }
            completed++;
            if (completed === tables.length) {
                fs.writeFileSync('full_schema.json', JSON.stringify(schema, null, 2));
                console.log("Schema written to full_schema.json");
                db.end();
            }
        });
    });
});
