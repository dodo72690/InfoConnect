const http = require('http');

function request(path, method = 'GET', body = null) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 3000,
            path: path,
            method: method,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        if (body) {
            options.headers['Content-Length'] = Buffer.byteLength(body);
        }

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    resolve({ status: res.statusCode, body: JSON.parse(data) });
                } catch (e) {
                    resolve({ status: res.statusCode, body: data });
                }
            });
        });

        req.on('error', reject);

        if (body) {
            req.write(body);
        }
        req.end();
    });
}

async function runTests() {
    console.log("--- Testing /api/users ---");
    try {
        const users = await request('/api/users');
        console.log("Status:", users.status);
        console.log("Users count:", Array.isArray(users.body) ? users.body.length : 'Not an array');
        if (Array.isArray(users.body) && users.body.length > 0) {
            console.log("Sample User:", JSON.stringify(users.body[0], null, 2));
        }
    } catch (e) {
        console.error("Failed /api/users", e);
    }

    console.log("\n--- Testing /api/clients ---");
    try {
        const clients = await request('/api/clients');
        console.log("Status:", clients.status);
        console.log("Clients count:", Array.isArray(clients.body) ? clients.body.length : 'Not an array');
    } catch (e) {
        console.error("Failed /api/clients", e);
    }

    console.log("\n--- Testing Ticket Creation with Attachment ---");
    try {
        const ticketData = JSON.stringify({
            clientId: "1", // Assuming client 1 exists
            description: "Test ticket with attachment via script",
            attachment: "http://example.com/file.pdf"
        });

        const ticket = await request('/api/tickets', 'POST', ticketData);
        console.log("Status:", ticket.status);
        console.log("Response:", ticket.body);
    } catch (e) {
        console.error("Failed create ticket", e);
    }
}

runTests();
