require("dotenv").config();
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

    const addVerificationToken = "ALTER TABLE utilizadores ADD COLUMN IF NOT EXISTS token_verificacao VARCHAR(255) NULL";
    const addVerifiedStatus = "ALTER TABLE utilizadores ADD COLUMN IF NOT EXISTS email_verificado BOOLEAN DEFAULT FALSE";

    db.query(addVerificationToken, (err, result) => {
        if (err) console.error("Error adding token_verificacao:", err);
        else console.log("Column token_verificacao added/checked.");

        db.query(addVerifiedStatus, (err, result) => {
            if (err) console.error("Error adding email_verificado:", err);
            else console.log("Column email_verificado added/checked.");

            // Opcional: Marcar utilizadores existentes como verificados para não travar contas antigas
            const updateExisting = "UPDATE utilizadores SET email_verificado = TRUE WHERE email_verificado IS FALSE AND data_registo < NOW()";
            db.query(updateExisting, (err, result) => {
                if (err) console.error("Error updating existing users:", err);
                else console.log(`Updated ${result.affectedRows} existing users to verified.`);

                db.end();
            });
        });
    });
});
