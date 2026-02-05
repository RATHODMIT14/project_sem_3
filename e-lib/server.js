const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
app.use(cors());
app.use(bodyParser.json());

const db = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'elibrary',
    waitForConnections: true,
    connectionLimit: 10
});

// Helper function to get local MySQL formatted date (fixes the 12 vs 5 time issue)
const getLocalMySQLDate = (dateObj = new Date()) => {
    const offset = dateObj.getTimezoneOffset() * 60000; // MS offset
    const localTime = new Date(dateObj.getTime() - offset);
    return localTime.toISOString().slice(0, 19).replace('T', ' ');
};

// --- 1. GET ALL BOOKS ---
app.get('/api/books', (req, res) => {
    db.query("SELECT * FROM books", (err, results) => {
        if (err) return res.status(500).json({ success: false, error: err.message });
        res.json(results);
    });
});

// --- 2. REGISTRATION ---
app.post('/api/register', (req, res) => {
    const { username, email, password } = req.body;
    db.query("SELECT * FROM users WHERE email = ?", [email], (err, results) => {
        if (err) return res.status(500).json({ success: false });
        if (results.length > 0) return res.json({ success: false, message: "Email exists" });

        const sql = "INSERT INTO users (username, email, password, membership_plan) VALUES (?, ?, ?, 'free')";
        db.query(sql, [username, email, password], (err) => {
            if (err) return res.status(500).json({ success: false });
            res.json({ success: true, message: "Registered!" });
        });
    });
});

// --- 3. LOGIN ---
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    db.query('SELECT * FROM users WHERE email = ? AND password = ?', [email, password], (err, results) => {
        if (err) return res.status(500).json({ success: false });
        if (results.length > 0) {
            let user = results[0];
            const now = new Date();
            if (user.end_date && new Date(user.end_date) < now) {
                db.query('UPDATE users SET membership_plan = "free", start_date = NULL, end_date = NULL WHERE id = ?', [user.id]);
                user.membership_plan = "free";
            }
            res.json({ success: true, user: user });
        } else {
            res.json({ success: false, message: 'Invalid Login' });
        }
    });
});

// --- 4. NEW: PAYMENT & MEMBERSHIP UPDATE ---
app.post('/api/update-membership-status', (req, res) => {
    const { email, plan, end_date, price, item_name } = req.body;
    
    // 1. Update the User's Membership
    let userSql, params;
    if (plan === 'free') {
        userSql = "UPDATE users SET membership_plan = 'free', start_date = NULL, end_date = NULL WHERE email = ?";
        params = [email];
    } else {
        const startDate = getLocalMySQLDate(new Date());
        const endDate = getLocalMySQLDate(new Date(end_date));
        userSql = "UPDATE users SET membership_plan = ?, start_date = ?, end_date = ? WHERE email = ?";
        params = [plan, startDate, endDate, email];
    }

    db.query(userSql, params, (err) => {
        if (err) return res.status(500).json({ success: false });

        // 2. Record the payment in the separate 'payments' table
        if (plan !== 'free') {
            const paySql = "INSERT INTO payments (user_email, item_name, amount, transaction_date) VALUES (?, ?, ?, ?)";
            db.query(paySql, [email, item_name || plan, price || 0, getLocalMySQLDate()], (payErr) => {
                if (payErr) console.error("Payment log failed:", payErr);
            });
        }
        
        res.json({ success: true, message: "Membership and Payment Recorded" });
    });
});

// --- ADMIN: GET ALL USERS ---
app.get('/api/admin/users', (req, res) => {
    db.query("SELECT id, username, email, membership_plan, end_date FROM users", (err, results) => {
        if (err) return res.status(500).json({ success: false });
        res.json(results);
    });
});

// --- ADMIN: GET ALL PAYMENTS ---
app.get('/api/admin/payments', (req, res) => {
    db.query("SELECT * FROM payments ORDER BY transaction_date DESC", (err, results) => {
        if (err) return res.status(500).json({ success: false });
        res.json(results);
    });
});

// --- ADMIN: ADD NEW BOOK ---
app.post('/api/admin/add-book', (req, res) => {
    const { title, author, cover_url, book_url, price, is_free } = req.body;
    const sql = "INSERT INTO books (title, author, cover_url, book_url, price, is_free) VALUES (?, ?, ?, ?, ?, ?)";
    db.query(sql, [title, author, cover_url, book_url, price, is_free], (err) => {
        if (err) return res.status(500).json({ success: false, message: err.message });
        res.json({ success: true, message: "Book added successfully!" });
    });
});         

app.listen(5000, () => console.log('Server running on http://localhost:5000'));