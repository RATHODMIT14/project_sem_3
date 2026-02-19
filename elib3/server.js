const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const axios = require('axios');
const bcrypt = require('bcrypt');
const os = require('os');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();

// --- MIDDLEWARE ---
app.use(cors());
app.use(bodyParser.json());

// --- STATIC FILES (For Images) ---
app.use('/uploads', express.static('uploads'));

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
let activeTransactions = {}; // Store for QR payment statuses

// --- MULTER CONFIG (File Uploads) ---
// Ensure uploads directory exists
if (!fs.existsSync('./uploads')) {
    fs.mkdirSync('./uploads');
}

const storage = multer.diskStorage({
    destination: './uploads/',
    filename: (req, file, cb) => {
        cb(null, 'slide-' + Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage });

// --- HELPERS ---
const getLocalMySQLDate = (dateObj = new Date()) => {
    const offset = dateObj.getTimezoneOffset() * 60000;
    const localTime = new Date(dateObj.getTime() - offset);
    return localTime.toISOString().slice(0, 19).replace('T', ' ');
};

// --- IP HELPER (To allow phone to connect to localhost) ---
const getLocalIp = () => {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal) {
                return iface.address;
            }
        }
    }
    return 'localhost';
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
app.post('/api/register', async (req, res) => {
    const { username, email, password, otp } = req.body;
    if (!otpStore[email] || otpStore[email] != otp) {
        return res.json({ success: false, message: "Invalid OTP" });
    }
    
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const sql = "INSERT INTO users (username, email, password, membership_plan) VALUES (?, ?, ?, 'free')";
        db.query(sql, [username, email, hashedPassword], (err) => {
            if (err) return res.status(500).json({ success: false });
            delete otpStore[email];
            res.json({ success: true, message: "Registered!" });
        });
    } catch (e) {
        res.status(500).json({ success: false, message: "Encryption Error" });
    }
});

// 4. LOGIN (Updated to include persistent history)
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    db.query('SELECT * FROM users WHERE email = ?', [email], async (err, results) => {
        if (err) return res.status(500).json({ success: false });

        if (results.length > 0) {
            let user = results[0];
            
            // Secure Password Check
            const match = await bcrypt.compare(password, user.password);

            if (!match) return res.json({ success: false, message: 'Invalid Email or Password' });

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
    console.log("Processing Payment for:", email, "| Books:", purchasedBooks); // Debug Log
    const startDate = getLocalMySQLDate();
    const endDate = end_date ? getLocalMySQLDate(new Date(end_date)) : null;

    // 1. Update Membership info in Users table
    const userSql = "UPDATE users SET membership_plan = ?, start_date = ?, end_date = ? WHERE email = ?";
    db.query(userSql, [plan, startDate, endDate, email], (err) => {
        if (err) return res.status(500).json({ success: false });

        // 2. Prepare records for the payments table
        let records = [];
        // Add individual books to history
        const booksToSave = Array.isArray(purchasedBooks) ? purchasedBooks : [];
        if (booksToSave.length > 0) {
            booksToSave.forEach(title => {
                records.push([email, title, 0, startDate]); 
            });
        }
        // Add the main transaction (Membership or total purchase)
        records.push([email, item_name || plan, price || 0, startDate]);

        const paySql = "INSERT INTO payments (user_email, item_name, amount, transaction_date) VALUES ?";
        db.query(paySql, [records], (payErr) => {
            if (payErr) {
                console.error("Payment DB Error:", payErr); // Log error to terminal
                return res.status(500).json({ success: false, message: "History save failed" });
            }

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
    const { title, author, cover_url, book_url, price, is_free, description } = req.body;
    const sql = "INSERT INTO books (title, author, cover_url, book_url, price, is_free, description) VALUES (?, ?, ?, ?, ?, ?, ?)";
    db.query(sql, [title, author, cover_url, book_url, price, is_free, description], (err) => {
        if (err) return res.json({ success: false });
        res.json({ success: true });
    });
});

// DELETE BOOK
app.delete('/api/admin/delete-book/:id', (req, res) => {
    const { id } = req.params;
    db.query("DELETE FROM books WHERE id = ?", [id], (err) => {
        if (err) return res.status(500).json({ success: false });
        res.json({ success: true });
    });
});

// EDIT BOOK
app.put('/api/admin/edit-book/:id', (req, res) => {
    const { id } = req.params;
    const { title, author, cover_url, book_url, price, is_free, description } = req.body;
    const sql = "UPDATE books SET title=?, author=?, cover_url=?, book_url=?, price=?, is_free=?, description=? WHERE id=?";
    db.query(sql, [title, author, cover_url, book_url, price, is_free, description, id], (err) => {
        if (err) return res.status(500).json({ success: false });
        res.json({ success: true });
    });
});

// DELETE USER
app.delete('/api/admin/delete-user/:id', (req, res) => {
    const { id } = req.params;
    db.query("DELETE FROM users WHERE id = ?", [id], (err) => {
        if (err) return res.status(500).json({ success: false });
        res.json({ success: true });
    });
});

app.get('/api/admin/payments', (req, res) => {
    db.query("SELECT * FROM payments ORDER BY transaction_date DESC", (err, results) => {
        if (err) return res.status(500).json({ success: false });
        res.json(results);
    });
});

// --- CAROUSEL ROUTES ---

// Get Slides (Public & Admin)
app.get('/api/admin/carousel', (req, res) => {
    db.query("SELECT * FROM carousel_slides ORDER BY id DESC", (err, results) => {
        if (err) return res.status(500).json({ success: false });
        res.json(results);
    });
});
app.get('/api/carousel', (req, res) => {
    db.query("SELECT * FROM carousel_slides ORDER BY id DESC", (err, results) => {
        if (err) return res.status(500).json({ success: false });
        res.json(results);
    });
});

// Add Slide
app.post('/api/admin/carousel', upload.single('image'), (req, res) => {
    const { title, subtitle } = req.body;
    const imageUrl = req.file ? '/uploads/' + req.file.filename : '';
    db.query("INSERT INTO carousel_slides (title, subtitle, image_url) VALUES (?, ?, ?)", [title, subtitle, imageUrl], (err) => {
        if (err) {
            console.error("Carousel DB Error:", err);
            return res.status(500).json({ success: false, message: err.message });
        }
        res.json({ success: true });
    });
});

// Delete Slide
app.delete('/api/admin/carousel/:id', (req, res) => {
    db.query("DELETE FROM carousel_slides WHERE id = ?", [req.params.id], (err) => {
        if (err) return res.status(500).json({ success: false });
        res.json({ success: true });
    });
});

// --- QR PAYMENT LOGIC ---

// 1. Generate QR Transaction ID
app.post('/api/qr/generate', (req, res) => {
    console.log("Received QR Request. Amount:", req.body.amount);
    const txId = 'TXN_' + Math.floor(100000 + Math.random() * 900000);
    activeTransactions[txId] = 'PENDING';
    
    // Generate a URL that points to THIS server's mobile payment page
    const ip = getLocalIp();
    const paymentUrl = `http://${ip}:5000/mobile-payment/${txId}?amount=${req.body.amount}`;
    
    res.json({ success: true, txId, paymentUrl });
});

// 2. Serve the Mobile Payment Page (The page user sees on Phone)
app.get('/mobile-payment/:txId', (req, res) => {
    const { txId } = req.params;
    const amount = req.query.amount || 0;

    const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Confirm Payment</title>
        <style>
            body { font-family: sans-serif; background: #0f0e17; color: white; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
            .card { background: #1c1b29; padding: 30px; border-radius: 20px; text-align: center; width: 90%; max-width: 400px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); border: 1px solid #333; }
            h2 { color: #fffffe; margin-bottom: 10px; }
            .amount { font-size: 40px; color: #2cb67d; font-weight: bold; margin: 20px 0; }
            .btn { display: block; width: 100%; padding: 15px; margin: 10px 0; border: none; border-radius: 10px; font-size: 18px; cursor: pointer; font-weight: bold; transition: 0.2s; }
            .btn-confirm { background: #7f5af0; color: white; }
            .btn-confirm:active { transform: scale(0.98); }
            .btn-cancel { background: transparent; border: 2px solid #ef4565; color: #ef4565; }
        </style>
    </head>
    <body>
        <div class="card">
            <h2>BookHeaven Pay</h2>
            <p style="opacity:0.6">Transaction ID: ${txId}</p>
            <div class="amount">₹${amount}</div>
            <button class="btn btn-confirm" onclick="updateStatus('SUCCESS')">Pay Securely</button>
            <button class="btn btn-cancel" onclick="updateStatus('FAILED')">Cancel Transaction</button>
        </div>
        <script>
            function updateStatus(status) {
                fetch('/api/qr/update/${txId}/' + status, { method: 'POST' })
                .then(res => res.json())
                .then(data => {
                    document.body.innerHTML = '<div style="text-align:center"><h1>' + (status === 'SUCCESS' ? '✅ Paid!' : '❌ Cancelled') + '</h1><p>Check your desktop screen.</p></div>';
                });
            }
        </script>
    </body>
    </html>`;
    res.send(html);
});

// 3. Handle Status Update from Phone
app.post('/api/qr/update/:txId/:status', (req, res) => {
    const { txId, status } = req.params;
    if(activeTransactions[txId]) {
        activeTransactions[txId] = status;
    }
    res.json({ success: true });
});

// 2. Check Status (Frontend polls this)
app.get('/api/qr/status/:txId', (req, res) => {
    const status = activeTransactions[req.params.txId] || 'PENDING';
    res.json({ success: true, status });
});

// 3. Simulate Phone Action (For Testing)
app.get('/api/qr/simulate/:txId/:status', (req, res) => {
    const { txId, status } = req.params;
    if(activeTransactions[txId]) activeTransactions[txId] = status.toUpperCase();
    res.send(`Transaction ${txId} set to ${status}`);
});


app.listen(5000, () => console.log('🚀 Server: http://localhost:5000'));