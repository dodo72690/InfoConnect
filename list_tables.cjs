const mysql = require("mysql2");

const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "bd_infoconnect"
});

db.connect(err => {
    if (err) throw err;
    db.query("SHOW TABLES", (err, results) => {
        if (err) throw err;
        console.log("CURRENT TABLES:", results.map(r => Object.values(r)[0]));
        db.end();
    });
});
