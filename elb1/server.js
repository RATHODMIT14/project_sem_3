const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const axios = require('axios');

const app = express();

// --- MIDDLEWARE ---
app.use(cors());
app.use(bodyParser.json());

// --- DATABASE CONNECTION ---
const db = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'elibrary',
    waitForConnections: true,
    connectionLimit: 10
});

// --- EMAIL CONFIGURATION ---
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'rathodmr326@gmail.com', 
        pass: 'qcftissrnsvnoeqx' 
    }
});

let otpStore = {}; 

// --- HELPERS ---
const getLocalMySQLDate = (dateObj = new Date()) => {
    const offset = dateObj.getTimezoneOffset() * 60000;
    const localTime = new Date(dateObj.getTime() - offset);
    return localTime.toISOString().slice(0, 19).replace('T', ' ');
};

// --- ROUTES ---

// 1. GET ALL BOOKS
app.get('/api/books', (req, res) => {
    db.query("SELECT * FROM books", (err, results) => {
        if (err) return res.status(500).json({ success: false, error: err.message });
        res.json(results);
    });
});

// 2. SEND OTP
app.post('/api/send-otp', (req, res) => {
    const { email } = req.body;
    db.query("SELECT * FROM users WHERE email = ?", [email], (err, results) => {
        if (err) return res.status(500).json({ success: false });
        if (results.length > 0) return res.json({ success: false, message: "Email already exists" });

        const otp = Math.floor(100000 + Math.random() * 900000);
        otpStore[email] = otp;

        const mailOptions = {
            from: '"BookHeaven Support" <rathodmr326@gmail.com>',
            to: email,
            subject: 'Verify your BookHaven Account',
            html: `<div style="font-family: sans-serif; padding: 20px;">
                    <h2>Welcome!</h2>
                    <p>Your OTP is: <b style="font-size: 24px; color: #7c3aed;">${otp}</b></p>
                   </div>`
        };

        transporter.sendMail(mailOptions, (error) => {
            if (error) return res.json({ success: false, message: "Mail failed" });
            res.json({ success: true, message: "OTP sent!" });
        });
    });
});

// 3. REGISTER
app.post('/api/register', (req, res) => {
    const { username, email, password, otp } = req.body;
    if (!otpStore[email] || otpStore[email] != otp) {
        return res.json({ success: false, message: "Invalid OTP" });
    }
    const sql = "INSERT INTO users (username, email, password, membership_plan) VALUES (?, ?, ?, 'free')";
    db.query(sql, [username, email, password], (err) => {
        if (err) return res.status(500).json({ success: false });
        delete otpStore[email];
        res.json({ success: true, message: "Registered!" });
    });
});

// 4. LOGIN (Updated to include persistent history)
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    db.query('SELECT * FROM users WHERE email = ? AND password = ?', [email, password], (err, results) => {
        if (err) return res.status(500).json({ success: false });

        if (results.length > 0) {
            let user = results[0];

            // Membership expiry check
            if (user.end_date && new Date(user.end_date) < new Date()) {
                db.query('UPDATE users SET membership_plan = "free", start_date = NULL, end_date = NULL WHERE id = ?', [user.id]);
                user.membership_plan = "free";
                user.end_date = null;
            }

            // Fetch History from Payments Table
            const historySql = "SELECT item_name AS title, transaction_date AS date FROM payments WHERE user_email = ?";
            db.query(historySql, [email], (payErr, payResults) => {
                user.history = payErr ? [] : payResults;
                res.json({ success: true, user });
            });
        } else {
            res.json({ success: false, message: 'Invalid Email or Password' });
        }
    });
});

// 5. USER DETAILS (For Profile Syncing)
app.get('/api/user-details', (req, res) => {
    const { email } = req.query;
    db.query('SELECT * FROM users WHERE email = ?', [email], (err, results) => {
        if (err || results.length === 0) return res.status(404).json({ success: false });

        let user = results[0];
        const historySql = "SELECT item_name AS title, transaction_date AS date FROM payments WHERE user_email = ?";
        db.query(historySql, [email], (payErr, payResults) => {
            user.history = payErr ? [] : payResults;
            res.json({ success: true, user });
        });
    });
});

// 6. UPDATE MEMBERSHIP & SAVE BOOKS (Persistence Fix)
app.post('/api/update-membership-status', (req, res) => {
    const { email, plan, end_date, price, item_name, purchasedBooks } = req.body;
    const startDate = getLocalMySQLDate();
    const endDate = end_date ? getLocalMySQLDate(new Date(end_date)) : null;

    // 1. Update Membership info in Users table
    const userSql = "UPDATE users SET membership_plan = ?, start_date = ?, end_date = ? WHERE email = ?";
    db.query(userSql, [plan, startDate, endDate, email], (err) => {
        if (err) return res.status(500).json({ success: false });

        // 2. Prepare records for the payments table
        let records = [];
        // Add individual books to history
        if (purchasedBooks && purchasedBooks.length > 0) {
            purchasedBooks.forEach(title => {
                records.push([email, title, 0, startDate]); 
            });
        }
        // Add the main transaction (Membership or total purchase)
        records.push([email, item_name || plan, price || 0, startDate]);

        const paySql = "INSERT INTO payments (user_email, item_name, amount, transaction_date) VALUES ?";
        db.query(paySql, [records], (payErr) => {
            if (payErr) return res.status(500).json({ success: false, message: "History save failed" });

            // 3. Return fresh user data to frontend to update localStorage immediately
            db.query('SELECT * FROM users WHERE email = ?', [email], (uErr, uRes) => {
                let user = uRes[0];
                db.query("SELECT item_name AS title, transaction_date AS date FROM payments WHERE user_email = ?", [email], (hErr, hRes) => {
                    user.history = hRes || [];
                    res.json({ success: true, user });
                });
            });
        });
    });
});

// 7. DOWNLOAD HANDLER
app.get('/api/download', async (req, res) => {
    const { url, filename } = req.query;
    try {
        const response = await axios({ url, method: 'GET', responseType: 'stream' });
        res.setHeader('Content-Disposition', `attachment; filename="${filename || 'book.pdf'}"`);
        response.data.pipe(res);
    } catch (e) {
        res.redirect(url); 
    }
});

// 8. ADMIN ROUTES
app.get('/api/admin/users', (req, res) => {
    db.query("SELECT id, username, email, membership_plan, role FROM users", (err, results) => {
        res.json(results);
    });
});

app.post('/api/admin/add-book', (req, res) => {
    const { title, author, cover_url, book_url, price, is_free } = req.body;
    const sql = "INSERT INTO books (title, author, cover_url, book_url, price, is_free) VALUES (?, ?, ?, ?, ?, ?)";
    db.query(sql, [title, author, cover_url, book_url, price, is_free], (err) => {
        if (err) return res.json({ success: false });
        res.json({ success: true });
    });
});

app.get('/api/admin/payments', (req, res) => {
    db.query("SELECT * FROM payments ORDER BY transaction_date DESC", (err, results) => {
        if (err) return res.status(500).json({ success: false });
        res.json(results);
    });
});

app.listen(5000, () => console.log('🚀 Server: http://localhost:5000'));