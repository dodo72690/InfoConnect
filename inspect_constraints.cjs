const mysql = require('mysql2');

const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "bd_infoconnect"
});

db.connect(err => {
    if (err) throw err;
    console.log("Connected to database.");

    const sql = `
    SELECT 
      TABLE_NAME, 
      COLUMN_NAME, 
      CONSTRAINT_NAME, 
      REFERENCED_TABLE_NAME, 
      REFERENCED_COLUMN_NAME
    FROM
      INFORMATION_SCHEMA.KEY_COLUMN_USAGE
    WHERE
      REFERENCED_TABLE_SCHEMA = 'bd_infoconnect' AND
      REFERENCED_TABLE_NAME = 'utilizadores';
  `;

    db.query(sql, (err, results) => {
        if (err) throw err;
        console.log("Foreign keys referencing 'utilizadores':");
        console.table(results);
        db.end();
    });
});
