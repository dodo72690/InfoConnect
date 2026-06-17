const mysql = require("mysql2");
const bcrypt = require("bcrypt");

const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "bd_infoconnect"
});

const SALT_ROUNDS = 10;

db.connect(err => {
    if (err) {
        console.error("Error connecting to database:", err);
        process.exit(1);
    }
    console.log("Connected to database.");

    // Get all users
    db.query("SELECT id_utilizador, email, senha FROM utilizadores", async (err, users) => {
        if (err) {
            console.error("Error fetching users:", err);
            db.end();
            return;
        }

        console.log(`Found ${users.length} users to migrate.`);
        let migratedCount = 0;

        for (const user of users) {
            // Check if password is already hashed (bcrypt hashes start with $2b$ or $2a$)
            if (user.senha.startsWith("$2b$") || user.senha.startsWith("$2a$")) {
                console.log(`User ${user.email} already has a hashed password. Skipping.`);
                migratedCount++;
                continue;
            }

            try {
                const hashedPassword = await bcrypt.hash(user.senha, SALT_ROUNDS);

                // Update user
                await new Promise((resolve, reject) => {
                    db.query("UPDATE utilizadores SET senha = ? WHERE id_utilizador = ?", [hashedPassword, user.id_utilizador], (err, result) => {
                        if (err) reject(err);
                        else resolve(result);
                    });
                });

                console.log(`Migrated password for user ${user.email}`);
                migratedCount++;
            } catch (error) {
                console.error(`Failed to migrate user ${user.email}:`, error);
            }
        }

        console.log(`Migration complete. ${migratedCount}/${users.length} users processed.`);
        db.end();
    });
});
