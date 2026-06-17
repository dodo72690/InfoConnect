const fs = require('fs');
try {
    const lines = fs.readFileSync('debug_output.txt', 'utf8').split('\n');
    lines.forEach(line => {
        if (line.includes('SQL ERROR:')) {
            const jsonPart = line.substring(line.indexOf('{'));
            try {
                const errObj = JSON.parse(jsonPart);
                console.log("SQL MESSAGE:", errObj.sqlMessage);
                console.log("FULL ERROR:", errObj);
            } catch (e) { console.log("Raw Line:", line); }
        }
    });
} catch (e) {
    console.error(e);
}
