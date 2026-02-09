const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');

const app = express();
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
    host: 'smtp.gmail.com',
    port: 465,
    secure: true, // Use SSL
    auth: {
        user: 'rathodmr326@gmail.com', 
        pass: 'qcftissrnsvnoeqx' // REMEMBER: No spaces here!
    },
    tls: {
        rejectUnauthorized: false // Helps bypass some local network blocks
    }
});

// Verify mail connection on server start
transporter.verify((error, success) => {
    if (error) {
        console.error("❌ Mail Server Error:", error.message);
    } else {
        console.log("✅ Mail Server is ready to send OTPs");
    }
});

// Temporary memory store for OTP codes
let otpStore = {}; 

// --- HELPERS ---
const getLocalMySQLDate = (dateObj = new Date()) => {
    const offset = dateObj.getTimezoneOffset() * 60000;
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

// --- 2. OTP SEND LOGIC ---
app.post('/api/send-otp', (req, res) => {
    const { email } = req.body;
    
    db.query("SELECT * FROM users WHERE email = ?", [email], (err, results) => {
        if (err) return res.status(500).json({ success: false });
        if (results.length > 0) return res.json({ success: false, message: "Email already exists" });

        const otp = Math.floor(100000 + Math.random() * 900000);
        otpStore[email] = otp;

        // Auto-delete OTP after 5 minutes
        setTimeout(() => { delete otpStore[email]; }, 300000);

        const mailOptions = {
            from: '"BookHaven Support" <your-email@gmail.com>',
            to: email,
            subject: 'Verify your BookHaven Account',
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #eee;">
                    <h2 style="color: #ff8906;">Welcome to BookHaven!</h2>
                    <p>Your registration OTP is:</p>
                    <h1 style="background: #eee; padding: 10px; display: inline-block; letter-spacing: 5px;">${otp}</h1>
                    <p style="color: #666;">This code will expire in 5 minutes.</p>
                </div>
            `
        };

        transporter.sendMail(mailOptions, (error) => {
            if (error) {
                console.error("Detailed Mail Error:", error); // LOOK AT YOUR TERMINAL FOR THIS
                return res.json({ success: false, message: "Email failed to send. Check server logs." });
            }
            res.json({ success: true, message: "OTP sent to your email!" });
        });
    });
});

// --- 3. REGISTRATION ---
app.post('/api/register', (req, res) => {
    const { username, email, password, otp } = req.body;

    if (!otpStore[email] || otpStore[email] != otp) {
        return res.json({ success: false, message: "Invalid or expired OTP" });
    }

    const sql = "INSERT INTO users (username, email, password, membership_plan) VALUES (?, ?, ?, 'free')";
    db.query(sql, [username, email, password], (err) => {
        if (err) return res.status(500).json({ success: false });
        
        delete otpStore[email];
        res.json({ success: true, message: "Registered successfully!" });
    });
});

// --- 4. LOGIN ---
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
                user.start_date = null;
                user.end_date = null;
            }
            res.json({ success: true, user: user });
        } else {
            res.json({ success: false, message: 'Invalid Login' });
        }
    });
});

// --- 5. PAYMENT & MEMBERSHIP UPDATE ---
app.post('/api/update-membership-status', (req, res) => {
    const { email, plan, end_date, price, item_name } = req.body;
    
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

        if (plan !== 'free') {
            const paySql = "INSERT INTO payments (user_email, item_name, amount, transaction_date) VALUES (?, ?, ?, ?)";
            db.query(paySql, [email, item_name || plan, price || 0, getLocalMySQLDate()], (payErr) => {
                if (payErr) console.error("Payment log failed:", payErr);
            });
        }
        res.json({ success: true, message: "Membership and Payment Recorded" });
    });
});

// --- 6. ADMIN ROUTES ---
app.get('/api/admin/users', (req, res) => {
    db.query("SELECT id, username, email, membership_plan, end_date FROM users", (err, results) => {
        if (err) return res.status(500).json({ success: false });
        res.json(results);
    });
});

app.get('/api/admin/payments', (req, res) => {
    db.query("SELECT * FROM payments ORDER BY transaction_date DESC", (err, results) => {
        if (err) return res.status(500).json({ success: false });
        res.json(results);
    });
});

app.post('/api/admin/add-book', (req, res) => {
    const { title, author, cover_url, book_url, price, is_free } = req.body;
    const sql = "INSERT INTO books (title, author, cover_url, book_url, price, is_free) VALUES (?, ?, ?, ?, ?, ?)";
    db.query(sql, [title, author, cover_url, book_url, price, is_free], (err) => {
        if (err) return res.status(500).json({ success: false, message: err.message });
        res.json({ success: true, message: "Book added successfully!" });
    });
});         



// --- CAROUSEL ROUTES ---
app.get('/api/admin/carousel', (req, res) => {
    db.query("SELECT * FROM carousel_slides", (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results);
    });
});

app.post('/api/admin/carousel', (req, res) => {
    const { title, subtitle, image_url } = req.body;
    db.query("INSERT INTO carousel_slides (title, subtitle, image_url) VALUES (?, ?, ?)", 
    [title, subtitle, image_url], (err) => {
        if (err) return res.status(500).json({ success: false });
        res.json({ success: true });
    });
});


// server.js
app.get('/api/download', async (req, res) => {
    const fileUrl = req.query.url;
    const fileName = req.query.filename || 'book.pdf';

    try {
        const response = await axios({
            url: fileUrl,
            method: 'GET',
            responseType: 'stream',
            headers: {
                // This makes the request look like it's from a real browser
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);

        response.data.pipe(res);
    } catch (error) {
        console.error('Download Error:', error.message);
        // If the server fails, we send a 302 redirect as a fallback
        // This tells the browser to try downloading it directly
        res.redirect(fileUrl); 
    }
});

// --- PROMOTE USER ROUTE (For admin-users.html) ---
app.post('/api/admin/promote', (req, res) => {
    const { email } = req.body;
    db.query("UPDATE users SET role = 'admin' WHERE email = ?", [email], (err) => {
        if (err) return res.status(500).json({ success: false });
        res.json({ success: true });
    });
});


app.listen(5000, () => console.log('🚀 Server running on http://localhost:5000'));