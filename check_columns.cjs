const mysql = require('mysql2');

const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'bd_infoconnect'
});

connection.connect();

const tables = ['utilizadores', 'clientes', 'tecnicos'];

tables.forEach(table => {
    connection.query(`SHOW COLUMNS FROM ${table}`, (error, results, fields) => {
        if (error) throw error;
        console.log(`\nColumns for ${table}:`);
        results.forEach(col => console.log(col.Field));
        if (table === 'tecnicos') connection.end();
    });
});
