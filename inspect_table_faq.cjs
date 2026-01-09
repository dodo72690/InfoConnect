const mysql = require("mysql2");

const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "bd_infoconnect"
});

db.connect(err => {
    if (err) throw err;
    db.query("DESCRIBE faq", (err, results) => {
        if (err) console.log("Table 'faq' does not exist or error:", err.message);
        else console.log(results);
        db.end();
    });
});
