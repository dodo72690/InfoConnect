const mysql = require("mysql2");
const bcrypt = require("bcrypt");

const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "bd_infoconnect"
});

const TEST_EMAIL = "test_bcrypt_verify@example.com";
const TEST_PASSWORD = "password123";
const SALT_ROUNDS = 10;

db.connect(async err => {
    if (err) throw err;
    console.log("Connected to DB.");

    try {
        // 1. Clean up potential leftovers
        await new Promise(r => db.query("DELETE FROM utilizadores WHERE email = ?", [TEST_EMAIL], r));

        // 2. Hash password
        const hash = await bcrypt.hash(TEST_PASSWORD, SALT_ROUNDS);
        console.log("Generated Hash:", hash);

        // 3. Insert test user
        // We need to provide all NOT NULL fields. 
        // Checking schema_dump: email, senha, tipo_utilizador, data_registo are NOT NULL.
        await new Promise((resolve, reject) => {
            db.query("INSERT INTO utilizadores (email, senha, tipo_utilizador, data_registo) VALUES (?, ?, 'Cliente', NOW())",
                [TEST_EMAIL, hash],
                (err, res) => err ? reject(err) : resolve(res)
            );
        });
        console.log("Test user inserted.");

        // 4. Retrieve user (Simulate Login)
        const users = await new Promise((resolve, reject) => {
            db.query("SELECT * FROM utilizadores WHERE email = ?", [TEST_EMAIL], (err, res) => err ? reject(err) : resolve(res));
        });

        if (users.length === 0) throw new Error("User not found");
        const user = users[0];

        // 5. Verify Password
        const match = await bcrypt.compare(TEST_PASSWORD, user.senha);
        const matchWrong = await bcrypt.compare("wrongpassword", user.senha);

        console.log("---------------------------------------------------");
        console.log("Bcrypt Logic Verification:");
        console.log(`Login with correct password ('${TEST_PASSWORD}'):`, match ? "SUCCESS" : "FAILURE");
        console.log(`Login with wrong password ('wrongpassword'):`, !matchWrong ? "SUCCESS" : "FAILURE");
        console.log("---------------------------------------------------");

        // 6. Cleanup
        await new Promise(r => db.query("DELETE FROM utilizadores WHERE email = ?", [TEST_EMAIL], r));
        console.log("Cleanup done.");

    } catch (err) {
        console.error("Verification failed:", err);
    } finally {
        db.end();
    }
});
