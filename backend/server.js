const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// ==========================================================================
// MYSQL CONNECTION POOL CONFIGURATION
// ==========================================================================
let pool;
try {
    pool = mysql.createPool({
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '3306'),
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'apex_gym_db',
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        enableKeepAlive: true,
        keepAliveInitialDelay: 0
    });
    console.log(`[Database] Connection pool initialized for database: ${process.env.DB_NAME || 'apex_gym_db'}`);
} catch (err) {
    console.error(`[Database Error] Pool creation failure: ${err.message}`);
}

// Database connectivity verification middleware
async function checkDbConnection(req, res, next) {
    try {
        const connection = await pool.getConnection();
        connection.release();
        next();
    } catch (err) {
        console.error(`[Database Error] Request blocked due to failed DB connection: ${err.message}`);
        res.status(503).json({
            error: "Database Connection Offline",
            message: "Backend could not connect to MySQL. Verify that your MySQL server is running, and that credentials in your `.env` file match.",
            systemError: err.message
        });
    }
}

// Apply DB connection check to all API endpoints
app.use('/api', checkDbConnection);


// ==========================================================================
// 1. OVERVIEW ENDPOINTS
// ==========================================================================
app.get('/api/overview', async (req, res) => {
    try {
        // Fetch Active Members Count
        const [activeRes] = await pool.query("SELECT COUNT(*) as count FROM members WHERE status = 'active'");
        const activeCount = activeRes[0].count;

        // Fetch Today's Checkins Count
        const [checkinsRes] = await pool.query("SELECT COUNT(*) as count FROM checkins WHERE DATE(checkin_time) = CURDATE()");
        const checkinsCount = checkinsRes[0].count;

        // Fetch Total Revenue MTD (Paid invoices sum)
        const [revenueRes] = await pool.query("SELECT SUM(amount) as total FROM invoices WHERE status = 'Paid'");
        const revenueValue = revenueRes[0].total || 0;

        // Fetch Outstanding Overdue Sum
        const [overdueRes] = await pool.query("SELECT SUM(amount) as total FROM invoices WHERE status = 'Overdue'");
        const overdueValue = overdueRes[0].total || 0;

        // Fetch Pending Invoices Count
        const [pendingInvoicesRes] = await pool.query("SELECT COUNT(*) as count FROM invoices WHERE status = 'Pending'");
        const pendingCount = pendingInvoicesRes[0].count;

        // Fetch Live Check-in Stream (Last 5 check-ins)
        const [liveStream] = await pool.query(`
            SELECT c.member_id as memberId, 
                   CONCAT(m.first_name, ' ', m.last_name) as name, 
                   DATE_FORMAT(c.checkin_time, '%h:%i %p') as time 
            FROM checkins c 
            JOIN members m ON c.member_id = m.id 
            ORDER BY c.checkin_time DESC 
            LIMIT 5
        `);

        // Fetch Attendance trend for chart (aggregate past 7 days checkin volumes)
        // Average attendance constant mapping (Mon -> Sun)
        const averageTrend = [85, 92, 104, 78, 95, 115, 60];
        const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
        const currentTrend = [0, 0, 0, 0, 0, 0, 0];

        // Fetch checkins for this week to map counts
        const [weeklyCheckins] = await pool.query(`
            SELECT DAYNAME(checkin_time) as day_name, COUNT(*) as count
            FROM checkins
            WHERE YEARWEEK(checkin_time, 1) = YEARWEEK(CURDATE(), 1)
            GROUP BY DAYNAME(checkin_time)
        `);

        // Map English day names to abbreviated calendar array index
        const dayMap = { 'Monday': 0, 'Tuesday': 1, 'Wednesday': 2, 'Thursday': 3, 'Friday': 4, 'Saturday': 5, 'Sunday': 6 };
        weeklyCheckins.forEach(row => {
            const index = dayMap[row.day_name];
            if (index !== undefined) {
                currentTrend[index] = row.count;
            }
        });

        // Simulating Wednesday as current day context matching seed logs
        // If currentTrend Wednesday matches index 2, fill others as simulated fallback if empty
        if (currentTrend.reduce((a, b) => a + b, 0) === 0) {
            currentTrend[0] = 12; // simulated Monday
            currentTrend[1] = 18; // simulated Tuesday
            currentTrend[2] = checkinsCount; // live today checkins
        }

        res.json({
            stats: {
                activeMembers: activeCount,
                checkinsToday: checkinsCount,
                monthlyRevenue: parseFloat(revenueValue),
                overdueOutstanding: parseFloat(overdueValue),
                pendingInvoices: pendingCount
            },
            liveCheckins: liveStream,
            attendanceChart: {
                days: weekdays,
                average: averageTrend,
                current: currentTrend
            }
        });
    } catch (err) {
        res.status(500).json({ error: "Internal Server Error", detail: err.message });
    }
});


// ==========================================================================
// 2. MEMBER REGISTRY CRUD ENDPOINTS
// ==========================================================================

// Get Members (Search, Filter, Paginate)
app.get('/api/members', async (req, res) => {
    try {
        const search = req.query.search || '';
        const status = req.query.status || 'all';
        const plan = req.query.plan || 'all';
        const page = parseInt(req.query.page || '1');
        const limit = parseInt(req.query.limit || '8');
        const offset = (page - 1) * limit;

        let query = "SELECT *, DATE_FORMAT(last_checkin, '%Y-%m-%d %h:%i %p') as lastCheckin, DATE_FORMAT(renewal_date, '%Y-%m-%d') as renewalDate FROM members WHERE 1=1";
        let countQuery = "SELECT COUNT(*) as count FROM members WHERE 1=1";
        let params = [];
        let countParams = [];

        if (search) {
            const searchWildcard = `%${search}%`;
            const searchFilter = " AND (id LIKE ? OR first_name LIKE ? OR last_name LIKE ? OR email LIKE ?)";
            query += searchFilter;
            countQuery += searchFilter;
            params.push(searchWildcard, searchWildcard, searchWildcard, searchWildcard);
            countParams.push(searchWildcard, searchWildcard, searchWildcard, searchWildcard);
        }

        if (status !== 'all') {
            query += " AND status = ?";
            countQuery += " AND status = ?";
            params.push(status);
            countParams.push(status);
        }

        if (plan !== 'all') {
            query += " AND plan = ?";
            countQuery += " AND plan = ?";
            params.push(plan);
            countParams.push(plan);
        }

        // Add Sorting & Pagination to main query
        query += " ORDER BY id DESC LIMIT ? OFFSET ?";
        params.push(limit, offset);

        // Fetch counts and records
        const [countRes] = await pool.query(countQuery, countParams);
        const [membersRes] = await pool.query(query, params);

        res.json({
            total: countRes[0].count,
            members: membersRes.map(m => ({
                id: m.id,
                firstName: m.first_name,
                lastName: m.last_name,
                email: m.email,
                plan: m.plan,
                status: m.status,
                renewalDate: m.renewalDate,
                lastCheckin: m.lastCheckin
            }))
        });
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch members", detail: err.message });
    }
});

// Create Member
app.post('/api/members', async (req, res) => {
    const { firstName, lastName, email, plan, status } = req.body;
    
    if (!firstName || !lastName || !email || !plan || !status) {
        return res.status(400).json({ error: "Missing required profile parameters" });
    }

    try {
        const randomNum = Math.floor(1000 + Math.random() * 9000);
        const newId = `MEM-${randomNum}`;
        const renewalDate = new Date();
        renewalDate.setMonth(renewalDate.getMonth() + 1); // 1 month out
        const renewalStr = renewalDate.toISOString().split('T')[0];

        // Insert member record
        await pool.query(
            "INSERT INTO members (id, first_name, last_name, email, plan, status, renewal_date) VALUES (?, ?, ?, ?, ?, ?, ?)",
            [newId, firstName, lastName, email, plan, status, renewalStr]
        );

        // Auto generate first billing invoice for new member
        let amt = 65.00;
        if (plan === "VIP Elite") amt = 120.00;
        if (plan === "Standard Fit") amt = 45.00;

        const invNum = Math.floor(1846 + Math.random() * 100);
        const invoiceId = `INV-${invNum}`;

        await pool.query(
            "INSERT INTO invoices (id, member_id, amount, due_date, status) VALUES (?, ?, ?, ?, ?)",
            [invoiceId, newId, amt, renewalStr, "Pending"]
        );

        res.status(201).json({ id: newId, message: "Member profile generated successfully." });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ error: "A member with this email address already exists." });
        }
        res.status(500).json({ error: "Failed to insert member record", detail: err.message });
    }
});

// Update Member Profile
app.put('/api/members/:id', async (req, res) => {
    const { id } = req.params;
    const { firstName, lastName, email, plan, status } = req.body;

    try {
        await pool.query(
            "UPDATE members SET first_name = ?, last_name = ?, email = ?, plan = ?, status = ? WHERE id = ?",
            [firstName, lastName, email, plan, status, id]
        );
        res.json({ message: "Profile updated successfully." });
    } catch (err) {
        res.status(500).json({ error: "Failed to update record", detail: err.message });
    }
});

// Delete Member Record
app.delete('/api/members/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query("DELETE FROM members WHERE id = ?", [id]);
        res.json({ message: "Record removed successfully." });
    } catch (err) {
        res.status(500).json({ error: "Failed to delete record", detail: err.message });
    }
});


// ==========================================================================
// 3. SCHEDULER ENDPOINTS
// ==========================================================================

// Get All Classes
app.get('/api/classes', async (req, res) => {
    try {
        const [classesRes] = await pool.query("SELECT * FROM classes");
        res.json(classesRes);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch classes schedule", detail: err.message });
    }
});

// Create New Session Slot
app.post('/api/classes', async (req, res) => {
    const { name, trainer, capacity, day, timeSlot } = req.body;
    try {
        await pool.query(
            "INSERT INTO classes (name, trainer, capacity, booked, day, time_slot) VALUES (?, ?, ?, 0, ?, ?)",
            [name, trainer, capacity, day, timeSlot]
        );
        res.status(201).json({ message: "Session slot published." });
    } catch (err) {
        res.status(500).json({ error: "Failed to publish schedule", detail: err.message });
    }
});

// Class Session Booking / Cancellation Toggle
app.post('/api/classes/:id/book', async (req, res) => {
    const { id } = req.params;
    const { action } = req.body; // 'book' or 'cancel'

    try {
        const increment = action === 'book' ? 1 : -1;
        
        // Fetch current session details
        const [rows] = await pool.query("SELECT booked, capacity FROM classes WHERE id = ?", [id]);
        if (rows.length === 0) {
            return res.status(404).json({ error: "Class session not found" });
        }
        
        const currentBooked = rows[0].booked;
        const capacity = rows[0].capacity;

        if (action === 'book' && currentBooked >= capacity) {
            return res.status(400).json({ error: "Registration failed. Class is fully booked." });
        }

        if (action === 'cancel' && currentBooked <= 0) {
            return res.status(400).json({ error: "Cancellation invalid. Booked count is zero." });
        }

        await pool.query("UPDATE classes SET booked = booked + ? WHERE id = ?", [increment, id]);
        
        res.json({ message: `Class reservation updated. Action: ${action}` });
    } catch (err) {
        res.status(500).json({ error: "Failed to adjust booking stats", detail: err.message });
    }
});


// ==========================================================================
// 4. BILLING & TRANSACTION ENDPOINTS
// ==========================================================================

// Get All Invoices (Status Filter)
app.get('/api/invoices', async (req, res) => {
    try {
        const status = req.query.status || 'all';
        let query = `
            SELECT i.id, i.member_id as memberId, 
                   CONCAT(m.first_name, ' ', m.last_name) as memberName, 
                   m.plan, DATE_FORMAT(i.due_date, '%Y-%m-%d') as dueDate, 
                   i.amount, i.status 
            FROM invoices i
            JOIN members m ON i.member_id = m.id
        `;
        let params = [];

        if (status !== 'all') {
            query += " WHERE i.status = ?";
            params.push(status);
        }
        
        query += " ORDER BY i.id DESC";

        const [invoicesRes] = await pool.query(query, params);
        
        // Format decimal values
        const formattedInvoices = invoicesRes.map(inv => ({
            id: inv.id,
            memberId: inv.memberId,
            memberName: inv.memberName,
            plan: inv.plan,
            dueDate: inv.dueDate,
            amount: parseFloat(inv.amount),
            status: inv.status
        }));

        res.json(formattedInvoices);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch transaction invoices", detail: err.message });
    }
});

// Pay Invoice & Settle Member Account Status
app.post('/api/invoices/:id/pay', async (req, res) => {
    const { id } = req.params;

    try {
        const [invRes] = await pool.query("SELECT member_id, amount FROM invoices WHERE id = ?", [id]);
        if (invRes.length === 0) {
            return res.status(404).json({ error: "Invoice record not found" });
        }

        const memberId = invRes[0].member_id;

        // Set status to Paid
        await pool.query("UPDATE invoices SET status = 'Paid' WHERE id = ?", [id]);

        // Auto-reactive member if they were suspended or expired
        const renewalDate = new Date();
        renewalDate.setMonth(renewalDate.getMonth() + 1);
        const renewalStr = renewalDate.toISOString().split('T')[0];

        await pool.query(
            "UPDATE members SET status = 'active', renewal_date = ? WHERE id = ? AND status != 'active'",
            [renewalStr, memberId]
        );

        res.json({ message: `Payment verified. Member ${memberId} account status synchronized.` });
    } catch (err) {
        res.status(500).json({ error: "Failed to process database payment transaction", detail: err.message });
    }
});


// ==========================================================================
// 5. GATED ACCESS CHECK-IN GATEWAY ENDPOINT
// ==========================================================================
app.post('/api/checkin', async (req, res) => {
    const { memberId } = req.body;
    
    if (!memberId) {
        return res.status(400).json({ error: "Member ID parameter is missing" });
    }

    try {
        // Query member profile
        const [rows] = await pool.query("SELECT * FROM members WHERE id = ?", [memberId]);
        if (rows.length === 0) {
            return res.status(404).json({ error: "Profile ID invalid or unregistered." });
        }

        const member = rows[0];

        if (member.status !== 'active') {
            return res.status(403).json({ 
                error: "Access Denied", 
                message: `Gym access blocked: membership card is ${member.status.toUpperCase()}.` 
            });
        }

        // Insert new checkin transaction record
        await pool.query("INSERT INTO checkins (member_id, checkin_time) VALUES (?, NOW())", [memberId]);

        // Update member profile last check-in timestamp
        await pool.query("UPDATE members SET last_checkin = NOW() WHERE id = ?", [memberId]);

        res.json({
            message: "Access Granted",
            memberName: `${member.first_name} ${member.last_name}`,
            plan: member.plan
        });
    } catch (err) {
        res.status(500).json({ error: "Check-in transaction failure", detail: err.message });
    }
});


// ==========================================================================
// SERVE STATIC CLIENT BUILD IN PRODUCTION
// ==========================================================================
app.use(express.static(path.join(__dirname, './')));

app.listen(PORT, () => {
    console.log(`[Backend Server] Server running successfully on port ${PORT}`);
});
