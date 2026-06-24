const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const path = require('path');
const crypto = require('crypto');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// ==========================================================================
// MYSQL CONNECTION POOL CONFIGURATION & IN-MEMORY MOCK FALLBACK
// ==========================================================================
let pool;
let isMockDb = false;

// Seed data stored in-memory in case MySQL is offline
const mockDb = {
    users: [
        {
            id: 1,
            username: 'admin',
            email: 'admin@apexstrength.com',
            password: '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918', // SHA-256 hash of 'admin'
            full_name: 'Alex Stryker',
            role: 'Facility Manager'
        },
        {
            id: 2,
            username: 'member',
            email: 'member@apexstrength.com',
            password: 'e31ab643c44f7a0ec824b59d1194d60dac334200d845e61d2d289daa0f087ea4', // SHA-256 hash of 'member'
            full_name: 'Franco Columbu',
            role: 'Member'
        }
    ]
};

function executeMockQuery(sql, params = []) {
    const query = sql.replace(/\s+/g, " ").trim();

    // 1. Get user details for login check
    if (query.includes("SELECT id, username, email, full_name as fullName, role FROM users WHERE (username = ? OR email = ?) AND password = ?")) {
        const identifier = params[0]; // username or email
        const pwdHash = params[2];
        const u = mockDb.users.find(x => (x.username === identifier || x.email === identifier) && x.password === pwdHash);
        if (u) {
            return [[{
                id: u.id,
                username: u.username,
                email: u.email,
                fullName: u.full_name,
                role: u.role
            }]];
        }
        return [[]];
    }

    // 2. Check if username or email already exists for registration
    if (query.includes("SELECT id FROM users WHERE username = ? OR email = ?")) {
        const u = mockDb.users.find(x => x.username === params[0] || x.email === params[1]);
        return [u ? [u] : []];
    }

    // 3. Insert new user registration
    if (query.includes("INSERT INTO users (username, email, password, full_name, role) VALUES (?, ?, ?, ?, ?)")) {
        const [username, email, password, fullName, role] = params;
        const newId = mockDb.users.length + 1;
        mockDb.users.push({
            id: newId,
            username,
            email,
            password,
            full_name: fullName,
            role: role || 'Member'
        });
        return [{ insertId: newId }];
    }

    // 4. Fetch user details by username
    if (query.includes("SELECT id, username, email, full_name as fullName, role FROM users WHERE username = ?")) {
        const u = mockDb.users.find(x => x.username === params[0]);
        if (u) {
            return [[{
                id: u.id,
                username: u.username,
                email: u.email,
                fullName: u.full_name,
                role: u.role
            }]];
        }
        return [[]];
    }

    console.warn(`[Mock Database] Unhandled query: ${query}`);
    return [[]];
}

function initMockDb() {
    isMockDb = true;
    console.log("[Database Fallback] Real MySQL Connection unavailable. Activating In-Memory Sandbox Mock Database.");
    pool = {
        async getConnection() {
            return {
                async release() {}
            };
        },
        async query(sql, params = []) {
            try {
                return executeMockQuery(sql, params);
            } catch (err) {
                console.error(`[Mock Database Error] query failed: ${sql}`, err);
                throw err;
            }
        }
    };
}

try {
    pool = mysql.createPool({
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '3306'),
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'gym_auth_db',
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        enableKeepAlive: true,
        keepAliveInitialDelay: 0
    });
    console.log(`[Database] Connection pool initialized for database: ${process.env.DB_NAME || 'gym_auth_db'}`);

    // Test connection on startup
    (async () => {
        try {
            const connection = await pool.getConnection();
            connection.release();
            console.log("[Database] Real MySQL connection verified successfully.");
        } catch (err) {
            console.warn(`[Database Warning] Real MySQL connection failed: ${err.message}. Switching to In-Memory Sandbox Mock Database.`);
            initMockDb();
        }
    })();
} catch (err) {
    console.error(`[Database Error] Pool creation failure: ${err.message}. Initializing fallback mock database.`);
    initMockDb();
}

// Database connectivity verification middleware
async function checkDbConnection(req, res, next) {
    if (isMockDb) {
        return next();
    }
    try {
        const connection = await pool.getConnection();
        connection.release();
        next();
    } catch (err) {
        console.warn(`[Database Error] Request failed connection check: ${err.message}. Initializing fallback mock database.`);
        initMockDb();
        next();
    }
}

// Apply DB connection check to all API endpoints
app.use('/api', checkDbConnection);

// In-memory active session tokens cache
const activeSessions = new Map();

// ==========================================================================
// AUTHENTICATION ENDPOINTS
// ==========================================================================

// Register Endpoint
app.post('/api/auth/register', async (req, res) => {
    const { username, email, password, fullName, role } = req.body;
    
    if (!username || !email || !password || !fullName) {
        return res.status(400).json({ error: "Username, email, password, and full name are required." });
    }

    try {
        // Hashing password
        const passwordHash = crypto.createHash('sha256').update(password).digest('hex');

        // Check if user already exists
        const [existing] = await pool.query(
            "SELECT id FROM users WHERE username = ? OR email = ?",
            [username, email]
        );

        if (existing.length > 0) {
            return res.status(409).json({ error: "Username or Email address already registered." });
        }

        // Insert new user
        const targetRole = role || 'Member';
        await pool.query(
            "INSERT INTO users (username, email, password, full_name, role) VALUES (?, ?, ?, ?, ?)",
            [username, email, passwordHash, fullName, targetRole]
        );

        res.status(201).json({
            message: "User registered successfully.",
            user: { username, email, fullName, role: targetRole }
        });
    } catch (err) {
        res.status(500).json({ error: "Internal Server Error during registration.", detail: err.message });
    }
});

// Login Endpoint
app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: "Username/Email and password are required." });
    }

    try {
        const passwordHash = crypto.createHash('sha256').update(password).digest('hex');

        // Query database
        const [rows] = await pool.query(
            "SELECT id, username, email, full_name as fullName, role FROM users WHERE (username = ? OR email = ?) AND password = ?",
            [username, username, passwordHash]
        );

        if (rows.length === 0) {
            return res.status(401).json({ error: "Invalid username/email or password." });
        }

        const user = rows[0];
        
        // Generate Token
        const token = crypto.randomBytes(32).toString('hex');
        
        // Store session cache
        activeSessions.set(token, { username: user.username, loginTime: new Date() });

        res.json({
            message: "Login successful.",
            token: token,
            isMockDb: isMockDb,
            user: {
                username: user.username,
                email: user.email,
                fullName: user.fullName || user.full_name,
                role: user.role
            }
        });
    } catch (err) {
        res.status(500).json({ error: "Internal Server Error during login.", detail: err.message });
    }
});

// Middleware to protect routes and verify tokens
function requireAuth(req, res, next) {
    const authHeader = req.headers['authorization'];
    if (!authHeader) {
        return res.status(401).json({ error: "Access denied. Authentication token required." });
    }

    const token = authHeader.replace('Bearer ', '');
    if (!activeSessions.has(token)) {
        return res.status(401).json({ error: "Session expired or invalid token." });
    }

    // Attach user profile username to req object
    req.currentUser = activeSessions.get(token);
    next();
}

// Me Profile Endpoint (Protected)
app.get('/api/auth/me', requireAuth, async (req, res) => {
    try {
        const [rows] = await pool.query(
            "SELECT id, username, email, full_name as fullName, role FROM users WHERE username = ?",
            [req.currentUser.username]
        );

        if (rows.length === 0) {
            return res.status(404).json({ error: "User profile not found." });
        }

        const user = rows[0];
        res.json({
            user: {
                username: user.username,
                email: user.email,
                fullName: user.fullName || user.full_name,
                role: user.role
            },
            isMockDb: isMockDb
        });
    } catch (err) {
        res.status(500).json({ error: "Internal Server Error retrieving profile.", detail: err.message });
    }
});

// Logout Endpoint
app.post('/api/auth/logout', (req, res) => {
    const authHeader = req.headers['authorization'];
    if (authHeader) {
        const token = authHeader.replace('Bearer ', '');
        activeSessions.delete(token);
    }
    res.json({ message: "Logout successful." });
});

// Serve Client Web Application Static Assets
app.use(express.static(path.join(__dirname, '../frontend')));

// Start listening
app.listen(PORT, () => {
    console.log(`[Backend Server] Server running successfully on port ${PORT}`);
});
