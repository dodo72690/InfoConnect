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

async function verifyFeatures() {
    try {
        const timestamp = Date.now();
        const newEmail = `testuser${timestamp}@example.com`;

        console.log("1. Testing Registration...");
        const registeredUser = await request('POST', '/register', {
            name: 'Test User',
            email: newEmail,
            password: 'password123'
        });
        console.log("Registered User:", registeredUser);

        if (registeredUser.email === newEmail) {
            console.log("SUCCESS: Registration works.");
        } else {
            console.error("FAILURE: Registration failed.");
        }

        console.log("\n2. Testing Admin Create User...");
        const adminCreatedEmail = `admincreated${timestamp}@example.com`;
        const createdUser = await request('POST', '/users', {
            name: 'Admin Created User',
            email: adminCreatedEmail,
            password: 'password123',
            role: 'Tecnico',
            specialty: 'Redes'
        });
        console.log("Created User Response:", createdUser);

        if (createdUser.success) {
            console.log("SUCCESS: Admin create user works.");
        } else {
            console.error("FAILURE: Admin create user failed.");
        }

        console.log("\n3. Testing Admin Delete User...");
        if (createdUser.id) {
            const deleteResult = await request('DELETE', `/users/${createdUser.id}`);
            console.log("Delete Result:", deleteResult);
            if (deleteResult.success) {
                console.log("SUCCESS: Admin delete user works.");
            } else {
                console.error("FAILURE: Admin delete user failed.");
            }
        }

    } catch (error) {
        console.error("Error:", error);
    }
}

verifyFeatures();
