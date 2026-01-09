const fs = require('fs');

const API_URL = 'http://localhost:3000/api';

async function verifyFeatures() {
    console.log("Starting verification of new features...");

    try {
        // 1. Categories
        console.log("\n--- Verifying Categories ---");
        let res = await fetch(`${API_URL}/categories`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: 'Test Category ' + Date.now() })
        });
        let text = await res.text();
        if (!res.ok) throw new Error(`Create Category Failed: ${res.status} ${text}`);
        let catData = JSON.parse(text);
        console.log("Create Category: OK", catData);
        const catId = catData.id;

        res = await fetch(`${API_URL}/categories`);
        text = await res.text();
        if (!res.ok) throw new Error(`Get Categories Failed: ${res.status} ${text}`);
        let getCatData = JSON.parse(text);
        console.log("Get Categories: OK", getCatData.length > 0);

        res = await fetch(`${API_URL}/categories/${catId}`, { method: 'DELETE' });
        text = await res.text();
        if (!res.ok) throw new Error(`Delete Category Failed: ${res.status} ${text}`);
        console.log("Delete Category: OK", JSON.parse(text));

        // 2. Dashboard
        console.log("\n--- Verifying Dashboard ---");
        res = await fetch(`${API_URL}/dashboard/stats`);
        text = await res.text();
        if (!res.ok) throw new Error(`Get Dashboard Stats Failed: ${res.status} ${text}`);
        console.log("Get Dashboard Stats: OK", JSON.parse(text));

        // 3. Reports
        console.log("\n--- Verifying Reports ---");
        res = await fetch(`${API_URL}/reports/tickets/pdf`);
        if (!res.ok) throw new Error(`Get PDF Report Failed: ${res.status}`);
        console.log("Get PDF Report: OK", res.headers.get('content-type') === 'application/pdf');

        // 4. Settings
        console.log("\n--- Verifying Settings ---");
        res = await fetch(`${API_URL}/settings`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ key: 'test_setting', value: '123' })
        });
        text = await res.text();
        if (!res.ok) throw new Error(`Update Setting Failed: ${res.status} ${text}`);
        console.log("Update Setting: OK", JSON.parse(text));

        res = await fetch(`${API_URL}/settings`);
        text = await res.text();
        if (!res.ok) throw new Error(`Get Settings Failed: ${res.status} ${text}`);
        let settings = JSON.parse(text);
        console.log("Get Settings: OK", settings.test_setting === '123');

        // 5. Internal Comments (Need a ticket first)
        console.log("\n--- Verifying Internal Comments ---");
        res = await fetch(`${API_URL}/clients`);
        text = await res.text();
        if (!res.ok) throw new Error(`Get Clients Failed: ${res.status} ${text}`);
        let clientsData = JSON.parse(text);

        if (clientsData.length > 0) {
            const clientId = clientsData[0].id;
            res = await fetch(`${API_URL}/tickets`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ clientId, description: 'Test Ticket for Comments' })
            });
            text = await res.text();
            if (!res.ok) throw new Error(`Create Ticket Failed: ${res.status} ${text}`);
            let ticketData = JSON.parse(text);
            const ticketId = ticketData.id;
            console.log("Created Test Ticket:", ticketId);

            res = await fetch(`${API_URL}/tickets/${ticketId}/internal-comments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ technicianId: 1, text: 'Test Internal Comment' })
            });
            text = await res.text();
            if (!res.ok) throw new Error(`Add Internal Comment Failed: ${res.status} ${text}`);
            console.log("Add Internal Comment: OK", JSON.parse(text));

            res = await fetch(`${API_URL}/tickets/${ticketId}/internal-comments`);
            text = await res.text();
            if (!res.ok) throw new Error(`Get Internal Comments Failed: ${res.status} ${text}`);
            let comments = JSON.parse(text);
            console.log("Get Internal Comments: OK", comments.length > 0);
        } else {
            console.log("Skipping Internal Comments verification (no clients found).");
        }

        console.log("\nAll verifications passed!");

    } catch (error) {
        console.error("Verification Failed:", error.message);
    }
}

verifyFeatures();
