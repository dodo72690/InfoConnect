
const mysql = require("mysql2");

const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "bd_infoconnect"
});

db.connect((err) => {
    if (err) {
        console.error("Connection failed:", err);
        process.exit(1);
    }

    const addAcao = "ALTER TABLE logs ADD COLUMN acao VARCHAR(100) AFTER tipo_log";
    const addDetalhes = "ALTER TABLE logs ADD COLUMN detalhes TEXT AFTER acao";

    db.query(addAcao, (err) => {
        if (err && err.code !== 'ER_DUP_FIELDNAME') {
            console.error("Error adding acao:", err);
        } else {
            console.log("Column 'acao' checked/added.");
        }

        db.query(addDetalhes, (err) => {
            if (err && err.code !== 'ER_DUP_FIELDNAME') {
                console.error("Error adding detalhes:", err);
            } else {
                console.log("Column 'detalhes' checked/added.");
            }
            process.exit(0);
        });
    });
});
