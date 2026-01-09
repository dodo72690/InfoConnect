const mysql = require("mysql2");

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

    db.query("SHOW TABLES", (err, results) => {
        if (err) {
            console.error("Error showing tables:", err);
        } else {
            console.log("Tables in bd_infoconnect:");
            const tables = results.map(row => Object.values(row)[0]);
            console.log(tables);

            const expected = ['recuperacao_senha', 'comentarios_internos', 'faqs', 'categorias'];
            const missing = expected.filter(t => !tables.includes(t));

            if (missing.length === 0) {
                console.log("SUCCESS: All deleted tables restored.");
            } else {
                console.log("FAILURE: Missing tables:", missing);
            }
        }
        db.end();
    });
});
