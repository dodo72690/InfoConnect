require("dotenv").config();
const mysql = require("mysql2");

const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT
});

db.connect(err => {
    if (err) { console.error("Connection Error", err); process.exit(1); }
    console.log("Connected to DB, attempting to add columns...");

    const q1 = "ALTER TABLE utilizadores ADD COLUMN token_verificacao VARCHAR(255) NULL";
    const q2 = "ALTER TABLE utilizadores ADD COLUMN email_verificado BOOLEAN DEFAULT FALSE";

    db.query(q1, (err) => {
        if (err) console.log("Token column might exist or error:", err.sqlMessage);
        else console.log("Added token_verificacao");

        db.query(q2, (err) => {
            if (err) console.log("Verified column might exist or error:", err.sqlMessage);
            else console.log("Added email_verificado");

            db.end();
        });
    });
});
