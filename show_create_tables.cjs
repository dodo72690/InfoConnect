const mysql = require('mysql2');
const fs = require('fs');

const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "bd_infoconnect"
});

db.connect(async err => {
    if (err) throw err;
    console.log("Connected to database.");

    const tables = ['utilizadores', 'clientes', 'tecnicos', 'pedidos', 'mensagens', 'orcamentos'];
    const outputFile = 'constraints.txt';
    fs.writeFileSync(outputFile, ''); // Clear file

    for (const table of tables) {
        await new Promise(resolve => {
            db.query(`SHOW CREATE TABLE ${table}`, (err, results) => {
                if (err) {
                    fs.appendFileSync(outputFile, `Error showing table ${table}: ${err}\n`);
                } else {
                    fs.appendFileSync(outputFile, `\n--- ${table} ---\n`);
                    const lines = results[0]['Create Table'].split('\n');
                    lines.forEach(line => {
                        if (line.includes('CONSTRAINT') || line.includes('FOREIGN KEY') || line.includes('CREATE TABLE')) {
                            fs.appendFileSync(outputFile, line + '\n');
                        }
                    });
                }
                resolve();
            });
        });
    }
    db.end();
    console.log("Done writing to file.");
});
