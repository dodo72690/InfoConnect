const mysql = require("mysql2");

const db = mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "bd_infoconnect",
    port: process.env.DB_PORT || 3306
});

db.connect(err => {
    if (err) {
        console.error("Error connecting:", err);
        process.exit(1);
    }

    const addToken = "ALTER TABLE utilizadores ADD COLUMN IF NOT EXISTS reset_token VARCHAR(255) NULL";
    const addExpires = "ALTER TABLE utilizadores ADD COLUMN IF NOT EXISTS reset_expires DATETIME NULL";

    db.query(addToken, (err, result) => {
        if (err) console.error("Error adding reset_token:", err);
        else console.log("Column reset_token added/checked.");

        db.query(addExpires, (err, result) => {
            if (err) console.error("Error adding reset_expires:", err);
            else console.log("Column reset_expires added/checked.");

            db.end();
        });
    });
});
