const http = require('http');

function request(method, path, data) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 3000,
            path: '/api' + path,
            method: method,
            headers: {
                'Content-Type': 'application/json',
            },
        };

        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(body));
                } catch (e) {
                    resolve(body);
                }
            });
        });

        req.on('error', (e) => reject(e));
        if (data) {
            req.write(JSON.stringify(data));
        }
        req.end();
    });
}

async function verifyBudget() {
    try {
        console.log("0. Fetching a valid client...");
        const clients = await request('GET', '/clients');
        if (!clients || clients.length === 0) {
            throw new Error("No clients found in the database. Please create a client first.");
        }
        const validClientId = clients[0].id;
        console.log(`Using Client ID: ${validClientId}`);

        console.log("1. Creating a test ticket...");
        const ticket = await request('POST', '/tickets', { clientId: validClientId, description: 'Test Ticket for Budget HTTP' });
        console.log("Ticket created:", ticket);
        const ticketId = ticket.id;

        console.log("\n2. Creating a budget...");
        const budget = await request('POST', `/tickets/${ticketId}/budget`, { value: 200.00, description: 'HTTP Module Test' });
        console.log("Budget created:", budget);

        console.log("\n3. Verifying budget in ticket details...");
        const tickets = await request('GET', '/tickets');
        const createdTicket = tickets.find(t => t.id === ticketId);
        console.log("Ticket details:", createdTicket);

        if (createdTicket.budget && createdTicket.budget.value === 200) {
            console.log("SUCCESS: Budget found in ticket.");
        } else {
            console.error("FAILURE: Budget not found or incorrect.");
        }

        console.log("\n4. Updating budget status to APPROVED...");
        const statusResult = await request('PATCH', `/tickets/${ticketId}/budget/status`, { status: 'Aprovado' });
        console.log("Status update result:", statusResult);

        console.log("\n5. Verifying status update...");
        const tickets2 = await request('GET', '/tickets');
        const updatedTicket = tickets2.find(t => t.id === ticketId);
        console.log("Updated Ticket details:", updatedTicket);

        if (updatedTicket.budget.status === 'Aprovado') {
            console.log("SUCCESS: Budget status updated.");
        } else {
            console.error("FAILURE: Budget status not updated.");
        }

    } catch (error) {
        console.error("Error:", error);
    }
}

verifyBudget();
