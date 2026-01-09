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

    db.query("DESCRIBE pedidos", (err, results) => {
        if (err) {
            console.error("Error describing table:", err);
        } else {
            console.log("Columns in pedidos:");
            fs.writeFileSync('db_output.json', JSON.stringify(results, null, 2));
            console.log("Written to db_output.json");
        }
        db.end();
    });
});
