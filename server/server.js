import express from 'express';
import mysql from 'mysql2';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import sharp from 'sharp';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname, 'public'))); // Serve Frontend

// Ensure upload directories exist
const uploadDirs = ['uploads', 'uploads/profiles', 'uploads/proofs'];
uploadDirs.forEach(dir => {
    const dirPath = path.join(__dirname, dir);
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
        console.log(`Created directory: ${dirPath}`);
    }
});

// Configure Multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        if (file.fieldname === 'profileImage') {
            cb(null, path.join(__dirname, 'uploads/profiles/'));
        } else if (file.fieldname === 'proofImage') {
            cb(null, path.join(__dirname, 'uploads/proofs/'));
        } else {
            cb(null, path.join(__dirname, 'uploads/'));
        }
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only images are allowed'));
        }
    }
});

const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME
});

let dbConnected = false;

db.connect(err => {
    if (err) {
        console.error('Error connecting to MySQL:', err);
        return;
    }
    console.log('Connected to MySQL Database');

    // Create users table if not exists
    const createUsersTable = `
    CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        displayName VARCHAR(255) NOT NULL,
        username VARCHAR(255) NOT NULL UNIQUE,
        email VARCHAR(255) NOT NULL UNIQUE,
        phone VARCHAR(20) NOT NULL,
        password VARCHAR(255) NOT NULL,
        balance DECIMAL(10, 2) DEFAULT 0.00,
        wonBalance DECIMAL(10, 2) DEFAULT 0.00,
        ticketsOwned INT DEFAULT 0,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`;

    db.query(createUsersTable, (err) => {
        if (err) console.error('Error creating users table:', err);
        else {
            // Add wonBalance and ticketsOwned columns if they don't exist
            db.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS wonBalance DECIMAL(10, 2) DEFAULT 0.00");
            db.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS commissionBalance DECIMAL(10, 2) DEFAULT 0.00");
            db.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS ticketsOwned INT DEFAULT 0");

            // Create tickets table for serial numbers
            const createTicketsTable = `
            CREATE TABLE IF NOT EXISTS tickets (
                id INT AUTO_INCREMENT PRIMARY KEY,
                userId INT,
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (userId) REFERENCES users(id)
            )`;

            db.query(createTicketsTable, (err) => {
                if (err) console.error('Error creating tickets table:', err);
                else console.log('Tickets table ready');
            });

            // Add role column if not exists
            db.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'user'", (err) => {
                if (err) console.error('Error adding role column:', err);
                else {
                    // Set shinybuchay as admin for initial setup (optional, but requested by user feeling)
                    db.query("UPDATE users SET role = 'admin' WHERE username = 'shinebuchay' OR username = 'admin'");
                }
            });

            // Add profileImage column
            db.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS profileImage VARCHAR(255)");
        }
    });

    const createTransactionsTable = `
    CREATE TABLE IF NOT EXISTS transactions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        userId INT,
        type ENUM('deposit', 'withdrawal') NOT NULL,
        amount DECIMAL(10, 2) NOT NULL,
        status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
        method VARCHAR(50) DEFAULT 'manual',
        note TEXT,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (userId) REFERENCES users(id)
    )`;

    db.query(createTransactionsTable, (err) => {
        if (err) console.error('Error creating transactions table:', err);
        else {
            // Safer column additions
            const addCols = [
                "ALTER TABLE transactions ADD COLUMN method VARCHAR(50) DEFAULT 'manual'",
                "ALTER TABLE transactions ADD COLUMN note TEXT",
                "ALTER TABLE transactions ADD COLUMN proofImage VARCHAR(255)"
            ];
            addCols.forEach(q => {
                db.query(q, (err) => {
                    if (err && err.code !== 'ER_DUP_COLUMN_NAMES' && err.errno !== 1060) {
                        console.error(`Error adding column: ${q}`, err.message);
                    }
                });
            });
            console.log('Transactions table checked/updated');
        }
    });

    const createStatsTable = `
    CREATE TABLE IF NOT EXISTS lottery_stats (
        id INT PRIMARY KEY,
        totalSold INT DEFAULT 0,
        lastWinnerName VARCHAR(255),
        lastWinningTicketId INT
    )`;

    db.query(createStatsTable, (err) => {
        if (err) console.error('Error creating stats table:', err);
        else {
            db.query('INSERT IGNORE INTO lottery_stats (id, totalSold) VALUES (1, 0)', () => {
                // Add columns if not exists (for existing DB)
                db.query("ALTER TABLE lottery_stats ADD COLUMN IF NOT EXISTS lastWinnerName VARCHAR(255)");
                db.query("ALTER TABLE lottery_stats ADD COLUMN IF NOT EXISTS lastWinningTicketId INT");
                db.query("ALTER TABLE lottery_stats ADD COLUMN IF NOT EXISTS lastWinnerName2 VARCHAR(255)");
                db.query("ALTER TABLE lottery_stats ADD COLUMN IF NOT EXISTS lastWinningTicketId2 INT");
                db.query("ALTER TABLE lottery_stats ADD COLUMN IF NOT EXISTS lastWinnerName3 VARCHAR(255)");
                db.query("ALTER TABLE lottery_stats ADD COLUMN IF NOT EXISTS lastWinningTicketId3 INT");
                // New Columns for Prize Amounts
                db.query("ALTER TABLE lottery_stats ADD COLUMN IF NOT EXISTS lastWinnerPrize DECIMAL(10, 2) DEFAULT 0.00");
                db.query("ALTER TABLE lottery_stats ADD COLUMN IF NOT EXISTS lastWinnerPrize2 DECIMAL(10, 2) DEFAULT 0.00");
                db.query("ALTER TABLE lottery_stats ADD COLUMN IF NOT EXISTS lastWinnerPrize3 DECIMAL(10, 2) DEFAULT 0.00");
                db.query("ALTER TABLE lottery_stats ADD COLUMN IF NOT EXISTS autoDrawDays INT DEFAULT 0");
                db.query("ALTER TABLE lottery_stats ADD COLUMN IF NOT EXISTS nextDrawTime BIGINT DEFAULT 0");
                db.query("ALTER TABLE lottery_stats ADD COLUMN IF NOT EXISTS ticketPrice INT DEFAULT 1000"); // Default price
                console.log('Stats table ready (3 Winners + Prizes + Auto Draw + Ticket Price)');
                dbConnected = true;
            });
        }
    });
});

// Middleware to authenticate JWT
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.sendStatus(401);

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) return res.sendStatus(403);

        // Get full user row to have the latest role
        db.query('SELECT id, role, displayName, username FROM users WHERE id = ?', [decoded.id], (err, results) => {
            if (err || results.length === 0) return res.sendStatus(403);
            req.user = results[0];
            next();
        });
    });
};

// Middleware to check Admin role
const isAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ message: 'Admin access required' });
    }
};

// Debug Route for Database Connection (Placed here to avoid checkDB middleware blocking it)
app.get('/api/debug-db', (req, res) => {
    const tempDb = mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASS,
        database: process.env.DB_NAME
    });

    tempDb.connect(err => {
        if (err) {
            return res.status(500).json({
                status: 'Error',
                message: err.message,
                code: err.code,
                config: {
                    host: process.env.DB_HOST,
                    user: process.env.DB_USER,
                    database: process.env.DB_NAME
                }
            });
        }
        res.json({ status: 'Success', message: 'Connected to Database successfully!' });
        tempDb.end();
    });
});

// Middleware to check DB connection
const checkDB = (req, res, next) => {
    console.log(`Checking DB connection for ${req.url}...`, { dbConnected });
    if (!dbConnected) {
        console.warn('DB not connected, sending 503');
        return res.status(503).json({ message: '[SHINE-DEBUG] Database connection failed. Please check the DB_HOST configuration in .env' });
    }
    next();
};

// Signup Route
app.post('/api/signup', checkDB, async (req, res) => {
    const { displayName, email, phone, password } = req.body;
    let { username } = req.body;

    // Auto-generate username from displayName
    if (!username) {
        const baseName = displayName.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 10);
        username = `${baseName}${Math.floor(100 + Math.random() * 899)}`;
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const query = 'INSERT INTO users (displayName, username, email, phone, password) VALUES (?, ?, ?, ?, ?)';

        db.query(query, [displayName, username, email, phone, hashedPassword], (err, result) => {
            if (err) {
                if (err.code === 'ER_DUP_ENTRY') {
                    return res.status(400).json({ message: 'Email or Username already exists' });
                }
                return res.status(500).json({ message: 'Database error', error: err });
            }
            res.status(201).json({ message: 'User registered successfully! Your username is: ' + username });
        });
    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Login Route
app.post('/api/login', checkDB, (req, res) => {
    const { email, password } = req.body;

    const query = 'SELECT * FROM users WHERE email = ?';
    db.query(query, [email], async (err, results) => {
        if (err) return res.status(500).json({ message: 'Database error' });
        if (results.length === 0) return res.status(400).json({ message: 'User not found' });

        const user = results[0];
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

        const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '1d' });

        res.json({
            token,
            user: {
                id: user.id,
                displayName: user.displayName,
                username: user.username,
                email: user.email,
                phone: user.phone,
                balance: user.balance,
                wonBalance: user.wonBalance,
                role: user.role
            }
        });
    });
});

// Get Lottery Stats
app.get('/api/stats', checkDB, (req, res) => {
    db.query('SELECT totalSold, lastWinnerName, lastWinningTicketId, lastWinnerName2, lastWinningTicketId2, lastWinnerName3, lastWinningTicketId3, lastWinnerPrize, lastWinnerPrize2, lastWinnerPrize3, nextDrawTime, ticketPrice FROM lottery_stats WHERE id = 1', (err, results) => {
        if (err) return res.status(500).json({ message: 'Database error' });
        res.json(results[0]);
    });
});

// Admin: Update Ticket Price
app.post('/api/admin/update-ticket-price', checkDB, authenticateToken, isAdmin, (req, res) => {
    const { price } = req.body;
    if (!price || isNaN(price) || price <= 0) {
        return res.status(400).json({ message: 'Invalid price' });
    }
    db.query('UPDATE lottery_stats SET ticketPrice = ? WHERE id = 1', [price], (err) => {
        if (err) return res.status(500).json({ message: 'Database error' });
        res.json({ message: 'Ticket price updated', price });
    });
});

// Get My Tickets
app.get('/api/my-tickets', checkDB, authenticateToken, (req, res) => {
    db.query('SELECT id, createdAt FROM tickets WHERE userId = ? ORDER BY id DESC', [req.user.id], (err, results) => {
        if (err) return res.status(500).json({ message: 'Database error' });
        res.json(results);
    });
});

// Update Transaction Request to handle file upload
app.post('/api/request-transaction', checkDB, authenticateToken, upload.single('proofImage'), (req, res) => {
    // req.body fields are strings now due to FormData
    const { amount, type, method, note, withdrawInfo } = req.body;
    const userId = req.user.id;
    const proofImage = req.file ? req.file.path.replace(/\\/g, '/').replace('server/', '') : null;

    if (type === 'withdrawal') {
        // For withdrawals, check total funds (balance + wonBalance)
        db.query('SELECT balance, wonBalance FROM users WHERE id = ?', [userId], (err, results) => {
            // ... existing logic ...
            if (err) return res.status(500).json({ message: 'Database error' });

            const totalAvailable = parseFloat(results[0].balance) + parseFloat(results[0].wonBalance);
            if (totalAvailable < parseFloat(amount)) {
                return res.status(400).json({ message: 'Insufficient total funds for withdrawal' });
            }
            performInsert();
        });
    } else {
        performInsert();
    }

    function performInsert() {
        let finalNote = note || '';
        if (type === 'withdrawal' && withdrawInfo) {
            const wInfo = typeof withdrawInfo === 'string' ? JSON.parse(withdrawInfo) : withdrawInfo;
            finalNote = `KPay: ${wInfo.name} (${wInfo.phone})`;
        }

        const query = 'INSERT INTO transactions (userId, type, amount, status, method, note, proofImage) VALUES (?, ?, ?, ?, ?, ?, ?)';
        db.query(query, [userId, type, amount, 'pending', method || 'manual', finalNote, proofImage], (err) => {
            if (err) return res.status(500).json({ message: 'Database error', error: err });
            res.json({ message: 'Request submitted. Waiting for admin approval.' });
        });
    }
});

// 2C2P KBZPay Payment Token (Simulation/Integration)
app.post('/api/payment/token', checkDB, authenticateToken, (req, res) => {
    const { amount } = req.body;
    const userId = req.user.id;

    // 1. Prepare Payment Request (As per 2C2P Docs)
    const invoiceNo = `INV${Date.now()}`;
    const payload = {
        merchantID: process.env.KBZPAY_MERCHANT_ID || "JT04", // Default from docs or env
        invoiceNo: invoiceNo,
        description: `Wallet Deposit: ${req.user.displayName}`,
        amount: parseFloat(amount),
        currencyCode: "MMK",
        nonceStr: Math.random().toString(36).substring(7),
        paymentChannel: ["DPAY"] // For KBZPay
    };

    // 2. In a real app, you would POST this payload to 2C2P API using JWT/HMAC signature.
    // For now, we Simulate receiving a Payment Token.
    const mockPaymentToken = `kbz_token_${Math.random().toString(36).substring(2)}_${Date.now()}`;

    // 3. Create a pending transaction record
    const query = 'INSERT INTO transactions (userId, type, amount, status) VALUES (?, ?, ?, ?)';
    db.query(query, [userId, 'deposit', amount, 'pending'], (err) => {
        if (err) return res.status(500).json({ message: 'DB Error' });

        // Return the token to Frontend (to be used by SDK or Redirect)
        res.json({
            message: 'Payment Token Generated',
            paymentToken: mockPaymentToken,
            payload: payload
        });
    });
});

// Bulk Buy Tickets Route
app.post('/api/buy-tickets-bulk', checkDB, authenticateToken, (req, res) => {
    const { quantity } = req.body; // Security Fix: Ignore costPerTicket from client
    const userId = req.user.id;

    // 1. Get current Ticket Price
    db.query('SELECT ticketPrice FROM lottery_stats WHERE id = 1', (err, statRes) => {
        if (err) return res.status(500).json({ message: 'Database error' });
        const ticketPrice = statRes[0].ticketPrice || 1000;
        const totalCost = quantity * ticketPrice;

        // Check combined balance
        db.query('SELECT balance, wonBalance FROM users WHERE id = ?', [userId], (err, results) => {
            if (err) return res.status(500).json({ message: 'Database error' });
            const user = results[0];
            const currentBalance = parseFloat(user.balance);
            const currentWon = parseFloat(user.wonBalance);

            if ((currentBalance + currentWon) < totalCost) {
                return res.status(400).json({ message: 'Insufficient funds (Deposit + Winnings)' });
            }

            // Calculate deduction
            let remainingCost = totalCost;
            let newBalance = currentBalance;
            let newWon = currentWon;

            // Deduct from Balance first (keep Winnings for withdrawal if possible)
            if (newBalance >= remainingCost) {
                newBalance -= remainingCost;
                remainingCost = 0;
            } else {
                remainingCost -= newBalance;
                newBalance = 0;
                newWon -= remainingCost;
            }

            db.beginTransaction((err) => {
                if (err) return res.status(500).json({ message: 'Transaction error' });

                db.query('UPDATE users SET balance = ?, wonBalance = ?, ticketsOwned = ticketsOwned + ? WHERE id = ?', [newBalance, newWon, quantity, userId], (err) => {
                    if (err) return db.rollback(() => res.status(500).json({ message: 'DB error' }));

                    // Bulk insert tickets to get serial numbers
                    const ticketValues = Array(parseInt(quantity)).fill([userId]);
                    db.query('INSERT INTO tickets (userId) VALUES ?', [ticketValues], (err, result) => {
                        if (err) return db.rollback(() => res.status(500).json({ message: 'Ticket generation error' }));

                        // Update global stats
                        db.query('UPDATE lottery_stats SET totalSold = totalSold + ? WHERE id = 1', [quantity], (err) => {
                            if (err) return db.rollback(() => res.status(500).json({ message: 'Stats error' }));

                            db.commit((err) => {
                                if (err) return db.rollback(() => res.status(500).json({ message: 'Commit error' }));

                                // Get fresh data
                                db.query('SELECT totalSold FROM lottery_stats WHERE id = 1', (err, stats) => {
                                    db.query('SELECT balance, wonBalance FROM users WHERE id = ?', [userId], (err, userRes) => {
                                        res.json({
                                            message: 'Purchase successful',
                                            totalSold: stats[0].totalSold,
                                            balance: userRes[0].balance,
                                            wonBalance: userRes[0].wonBalance,
                                            ticketCount: quantity,
                                            firstSerial: result.insertId,
                                            lastSerial: result.insertId + parseInt(quantity) - 1
                                        });
                                    });
                                });
                            });
                        });
                    });
                });
            });
        });
    });
});

// Admin: Get all users
app.get('/api/admin/users', checkDB, authenticateToken, isAdmin, (req, res) => {
    db.query('SELECT id, displayName, username, email, phone, balance, role, createdAt, profileImage FROM users', (err, results) => {
        if (err) return res.status(500).json({ message: 'Database error' });
        res.json(results);
    });
});

// Admin: Get all transactions
app.get('/api/admin/transactions', checkDB, authenticateToken, isAdmin, (req, res) => {
    const query = `
        SELECT t.*, u.username, u.displayName 
        FROM transactions t 
        JOIN users u ON t.userId = u.id 
        ORDER BY t.createdAt DESC
    `;
    db.query(query, (err, results) => {
        if (err) return res.status(500).json({ message: 'Database error' });
        res.json(results);
    });
});

// Admin: Approve/Reject Transaction
app.post('/api/admin/action-transaction', checkDB, authenticateToken, isAdmin, (req, res) => {
    const { txId, action } = req.body; // action: 'approved' or 'rejected'

    db.query('SELECT * FROM transactions WHERE id = ?', [txId], (err, results) => {
        if (err || results.length === 0) return res.status(404).json({ message: 'Transaction not found' });

        const tx = results[0];
        if (tx.status !== 'pending') return res.status(400).json({ message: 'Transaction already processed' });

        db.beginTransaction((err) => {
            if (err) return res.status(500).json({ message: 'Transaction error' });

            if (action === 'approved') {
                const finalAmount = req.body.adjustedAmount ? parseFloat(req.body.adjustedAmount) : parseFloat(tx.amount);

                // If amount changed, update transaction record first
                if (Math.abs(finalAmount - parseFloat(tx.amount)) > 0.01) {
                    db.query('UPDATE transactions SET amount = ? WHERE id = ?', [finalAmount, txId], (err) => {
                        if (err) return db.rollback(() => res.status(500).json({ message: 'Amount update error' }));
                        processBalance(finalAmount);
                    });
                } else {
                    processBalance(finalAmount);
                }

                function processBalance(amt) {
                    if (tx.type === 'deposit') {
                        db.query('UPDATE users SET balance = balance + ? WHERE id = ?', [amt, tx.userId], (err) => {
                            updateStatus(err);
                        });
                    } else {
                        // Withdrawal Logic (Keep original logic but use amt if we want to support partial withdrawal approval later)
                        // For now, assuming Full Withdrawal approval only to keep logic safe
                        db.query('SELECT balance, wonBalance FROM users WHERE id = ?', [tx.userId], (err, uRes) => {
                            if (err || uRes.length === 0) return db.rollback(() => res.status(500).json({ message: 'User error' }));

                            const user = uRes[0];
                            let remaining = amt; // Use the approved amount
                            let newWon = parseFloat(user.wonBalance);
                            let newBal = parseFloat(user.balance);

                            if (newWon >= remaining) {
                                newWon -= remaining;
                                remaining = 0;
                            } else {
                                remaining -= newWon;
                                newWon = 0;
                                newBal -= remaining;
                            }

                            db.query('UPDATE users SET balance = ?, wonBalance = ? WHERE id = ?', [newBal, newWon, tx.userId], (err) => {
                                updateStatus(err);
                            });
                        });
                    }
                }

                function updateStatus(err) {
                    if (err) return db.rollback(() => res.status(500).json({ message: 'User update error' }));
                    db.query('UPDATE transactions SET status = ? WHERE id = ?', [action, txId], (err) => {
                        if (err) return db.rollback(() => res.status(500).json({ message: 'Status update failed' }));
                        db.commit((err) => {
                            if (err) return db.rollback(() => res.status(500).json({ message: 'Commit error' }));
                            res.json({ message: `Transaction ${action}` });
                        });
                    });
                }
            } else { // action is 'rejected'
                db.query('UPDATE transactions SET status = ? WHERE id = ?', [action, txId], (err) => {
                    if (err) return db.rollback(() => res.status(500).json({ message: 'Status update failed' }));
                    db.commit((err) => {
                        if (err) return db.rollback(() => res.status(500).json({ message: 'Commit error' }));
                        res.json({ message: `Transaction ${action}` });
                    });
                });
            }
        });
    });
});

// Adjust User Balance (Admin)
app.post('/api/admin/adjust-balance', checkDB, authenticateToken, isAdmin, (req, res) => {
    const { userId, amount, type } = req.body;
    const column = 'balance'; // Only adjust main balance for simplicity, or add logic

    const operator = type === 'add' ? '+' : '-';
    db.query(`UPDATE users SET ${column} = ${column} ${operator} ? WHERE id = ?`, [amount, userId], (err) => {
        if (err) return res.status(500).json({ message: 'Database error' });
        res.json({ message: 'Balance adjusted' });
    });
});

// Delete Transaction (Admin)
// Request Transaction (Deposit/Withdrawal) - User
app.post('/api/request-transaction', checkDB, authenticateToken, upload.single('proofImage'), (req, res) => {
    const { amount, type, method, note, withdrawInfo } = req.body;
    const userId = req.user.id;
    let finalNote = note || '';
    if (withdrawInfo) {
        const wInfo = JSON.parse(withdrawInfo);
        finalNote = `Name: ${wInfo.name}, Phone: ${wInfo.phone}`;
    }

    const proofImage = req.file ? req.file.path : null;

    if (!amount || isNaN(amount) || amount <= 0) return res.status(400).json({ message: 'Invalid amount' });

    // For withdrawals, check balance immediately? (Optional, but good UX)
    if (type === 'withdrawal') {
        db.query('SELECT balance, wonBalance FROM users WHERE id = ?', [userId], (err, results) => {
            if (err) return res.status(500).json({ message: 'DB Error' });
            const user = results[0];
            const available = parseFloat(user.balance) + parseFloat(user.wonBalance);
            if (available < amount) return res.status(400).json({ message: 'Insufficient funds' });

            insertTransaction();
        });
    } else {
        insertTransaction();
    }

    function insertTransaction() {
        const query = 'INSERT INTO transactions (userId, type, amount, status, method, note, proofImage) VALUES (?, ?, ?, "pending", ?, ?, ?)';
        db.query(query, [userId, type, amount, method, finalNote, proofImage], (err) => {
            if (err) {
                console.error('Transaction insertion error:', err);
                return res.status(500).json({
                    message: 'Transaction request failed',
                    error: err.message,
                    sql: query,
                    data: [userId, type, amount, method, finalNote, proofImage]
                });
            }
            res.json({ message: 'Transaction submitted successfully' });
        });
    }
});

// Delete Transaction (Admin) - with Photo Cleanup
app.delete('/api/admin/transaction/:id', checkDB, authenticateToken, isAdmin, (req, res) => {
    // First get the image path
    db.query('SELECT proofImage FROM transactions WHERE id = ?', [req.params.id], (err, results) => {
        if (err) return res.status(500).json({ message: 'Database error' });

        const imagePath = results[0]?.proofImage;

        db.query('DELETE FROM transactions WHERE id = ?', [req.params.id], (err) => {
            if (err) return res.status(500).json({ message: 'Database error' });

            // If deleted from DB, delete file
            if (imagePath) {
                const fullPath = path.join(__dirname, imagePath);
                if (fs.existsSync(fullPath)) {
                    fs.unlink(fullPath, (err) => {
                        if (err) console.error('Error deleting file:', err);
                    });
                }
            }
            res.json({ message: 'Transaction and associated proof deleted' });
        });
    });
});

// Get User Profile (to refresh balance)
app.get('/api/profile', checkDB, authenticateToken, (req, res) => {
    db.query('SELECT id, displayName, username, email, phone, balance, wonBalance, commissionBalance, ticketsOwned, role, profileImage FROM users WHERE id = ?', [req.user.id], (err, results) => {
        if (err) return res.status(500).json({ message: 'Database error' });
        res.json(results[0]);
    });
});

// Admin: Draw Winner
app.post('/api/admin/draw-winner', checkDB, authenticateToken, isAdmin, (req, res) => {
    // 1. Get Prize Pool and Price
    db.query('SELECT totalSold, ticketPrice FROM lottery_stats WHERE id = 1', (err, statsRes) => {
        if (err) return res.status(500).json({ message: 'Database error' });
        const totalSold = statsRes[0].totalSold;
        const ticketPrice = statsRes[0].ticketPrice || 1000;

        // Calculate Prizes
        const grossPool = totalSold * ticketPrice;
        const netPool = grossPool * 0.90; // 90% to winners
        const adminFee = grossPool * 0.10; // 10% to admin

        const prize1 = netPool * 0.50;
        const prize2 = netPool * 0.30;
        const prize3 = netPool * 0.20;

        // 2. Pick 3 random WINNING TICKETS
        db.query('SELECT * FROM tickets ORDER BY RAND() LIMIT 3', (err, tickets) => {
            if (err) return res.status(500).json({ message: 'Database error' });
            if (tickets.length === 0) return res.status(400).json({ message: 'No tickets sold yet' });

            const winners = tickets; // Array of 1, 2, or 3 tickets

            // Need to fetch User Display Names for all winners
            const userIds = winners.map(t => t.userId);
            if (userIds.length === 0) return res.status(500).json({ message: 'No valid tickets' });

            db.query('SELECT id, displayName FROM users WHERE id IN (?)', [userIds], (err, users) => {
                if (err) return res.status(500).json({ message: 'Winner lookup error' });

                // Map user data to tickets
                const winningDetails = winners.map((ticket, index) => {
                    const user = users.find(u => u.id === ticket.userId);
                    return {
                        ticketId: ticket.id,
                        userId: ticket.userId,
                        name: user ? user.displayName : 'Unknown',
                        prize: index === 0 ? prize1 : (index === 1 ? prize2 : prize3)
                    };
                });

                // 3. Update balances and stats
                db.beginTransaction((err) => {
                    if (err) return res.status(500).json({ message: 'Transaction error' });

                    // A. Credit Admin (Commission)
                    db.query('UPDATE users SET commissionBalance = commissionBalance + ? WHERE id = 1', [adminFee], (err) => {
                        if (err) return db.rollback(() => res.status(500).json({ message: 'Admin fee error' }));

                        // B. Credit Winners (Loop)
                        const creditPromises = winningDetails.map(w => {
                            return new Promise((resolve, reject) => {
                                db.query('UPDATE users SET wonBalance = wonBalance + ? WHERE id = ?', [w.prize, w.userId], (err) => {
                                    if (err) reject(err);
                                    else resolve();
                                });
                            });
                        });

                        Promise.all(creditPromises).then(() => {
                            // C. Update Global Stats
                            const w1 = winningDetails[0];
                            const w2 = winningDetails[1] || { name: null, ticketId: null };
                            const w3 = winningDetails[2] || { name: null, ticketId: null };

                            db.query(`UPDATE lottery_stats SET 
                                totalSold = 0, 
                                lastWinnerName = ?, lastWinningTicketId = ?, lastWinnerPrize = ?,
                                lastWinnerName2 = ?, lastWinningTicketId2 = ?, lastWinnerPrize2 = ?,
                                lastWinnerName3 = ?, lastWinningTicketId3 = ?, lastWinnerPrize3 = ?
                                WHERE id = 1`,
                                [w1.name, w1.ticketId, w1.prize, w2.name, w2.ticketId, w2.prize, w3.name, w3.ticketId, w3.prize],
                                (err) => {
                                    if (err) return db.rollback(() => res.status(500).json({ message: 'Stats reset error' }));

                                    // D. Reset Tickets
                                    db.query('TRUNCATE TABLE tickets', (err) => {
                                        if (err) return db.rollback(() => res.status(500).json({ message: 'Tickets clear error' }));

                                        // E. Reset User Ticket Counts
                                        db.query('UPDATE users SET ticketsOwned = 0', (err) => {
                                            if (err) return db.rollback(() => res.status(500).json({ message: 'User tickets reset error' }));

                                            db.commit((err) => {
                                                if (err) return db.rollback(() => res.status(500).json({ message: 'Commit error' }));
                                                res.json({
                                                    message: 'Winners drawn successfully!',
                                                    winners: winningDetails
                                                });
                                            });
                                        });
                                    });
                                });
                        }).catch(() => {
                            db.rollback(() => res.status(500).json({ message: 'Awarding error' }));
                        });
                    });
                });
            });
        });
    });
});

// Update Display Name
app.post('/api/profile/update-display-name', checkDB, authenticateToken, (req, res) => {
    const { displayName } = req.body;
    const userId = req.user.id;

    if (!displayName || displayName.length < 2) {
        return res.status(400).json({ message: 'Name too short' });
    }

    db.query('UPDATE users SET displayName = ? WHERE id = ?', [displayName, userId], (err) => {
        if (err) return res.status(500).json({ message: 'Database error' });
        res.json({ message: 'Display name updated successfully' });
    });
});

// Update Password
app.post('/api/profile/update-password', checkDB, authenticateToken, (req, res) => {
    const { oldPassword, newPassword } = req.body;
    const userId = req.user.id;

    db.query('SELECT password FROM users WHERE id = ?', [userId], async (err, results) => {
        if (err || results.length === 0) return res.status(500).json({ message: 'Database error' });

        const isMatch = await bcrypt.compare(oldPassword, results[0].password);
        if (!isMatch) return res.status(400).json({ message: 'Incorrect old password' });

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        db.query('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, userId], (err) => {
            if (err) return res.status(500).json({ message: 'Database error' });
            res.json({ message: 'Password updated successfully' });
        });
    });
});

// Update Profile Icon
app.post('/api/profile/update-icon', checkDB, authenticateToken, upload.single('profileImage'), async (req, res) => {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    const userId = req.user.id;
    const tempPath = req.file.path;
    const filename = `resized-${req.file.filename}`;
    const outputPath = path.join(path.dirname(tempPath), filename);

    const logPath = path.join(__dirname, 'debug.txt');
    const log = (msg) => {
        try { fs.appendFileSync(logPath, `[${new Date().toISOString()}] ${msg}\n`); } catch (e) { }
    };

    log(`Processing icon: ${tempPath} -> ${outputPath}`);

    let finalDbPath = '';

    try {
        // Try resizing
        try {
            log('Attempting sharp resize...');
            await sharp(tempPath).resize(150, 150).toFile(outputPath);
            log('Sharp resize successful');
            fs.unlinkSync(tempPath); // Delete original large file
            finalDbPath = `uploads/profiles/${filename}`;
        } catch (resizeErr) {
            log(`Sharp resize failed: ${resizeErr.message}. Fallback to original.`);
            // Fallback: Use the original file
            finalDbPath = tempPath.replace(/\\/g, '/').replace('server/', '');
        }

        // Get old image to delete logic...
        db.query('SELECT profileImage FROM users WHERE id = ?', [userId], (err, results) => {
            if (err) {
                log(`DB Lookup Error: ${err.message}`);
                return res.status(500).json({ message: 'DB Error looking up user' });
            }

            if (results.length > 0 && results[0].profileImage) {
                if (!results[0].profileImage.includes(path.basename(tempPath))) {
                    const oldPath = path.join(__dirname, results[0].profileImage);
                    if (fs.existsSync(oldPath)) {
                        try {
                            fs.unlinkSync(oldPath);
                            log(`Deleted old icon: ${oldPath}`);
                        } catch (e) {
                            log(`Delete old icon warning: ${e.message}`);
                        }
                    }
                }
            }

            // Update DB
            log(`Updating DB with path: ${finalDbPath}`);
            db.query('UPDATE users SET profileImage = ? WHERE id = ?', [finalDbPath, userId], (err) => {
                if (err) {
                    log(`DB Update Error: ${err.message}`);
                    return res.status(500).json({ message: 'Database error' });
                }
                log('Profile icon updated successfully');
                res.json({ message: 'Profile icon updated', profileImage: finalDbPath });
            });
        });

    } catch (error) {
        log(`General Error: ${error.message}`);
        res.status(500).json({ message: 'Image processing failed', error: error.message });
    }
});

// --- Auto Draw Logic ---
setInterval(() => {
    db.query('SELECT * FROM lottery_stats WHERE id = 1', (err, results) => {
        if (err || !results.length) return;
        const stats = results[0];
        if (stats.autoDrawDays > 0 && stats.nextDrawTime > 0) {
            if (Date.now() >= stats.nextDrawTime) {
                console.log('AUTO DRAW TRIGGERED!');
                // Reset timer first
                const nextTime = Date.now() + (stats.autoDrawDays * 24 * 60 * 60 * 1000);
                db.query('UPDATE lottery_stats SET nextDrawTime = ? WHERE id = 1', [nextTime]);
                // Triggers would go here (requires refactoring draw logic to function)
            }
        }
    });
}, 60000);

// Claim Commission
app.post('/api/admin/claim-commission', authenticateToken, (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Admin only' });

    db.query('SELECT commissionBalance FROM users WHERE id = ?', [req.user.id], (err, results) => {
        if (err || !results.length) return res.status(500).json({ message: 'Error' });
        const commission = results[0].commissionBalance;

        if (commission <= 0) return res.status(400).json({ message: 'No commission to claim' });

        db.query('UPDATE users SET balance = balance + ?, commissionBalance = 0 WHERE id = ?', [commission, req.user.id], (err) => {
            if (err) return res.status(500).json({ message: 'Transfer failed' });
            res.json({ message: 'Commission transferred to main balance', claimed: commission });
        });
    });
});

// Auto Draw Settings
app.post('/api/admin/auto-draw-settings', authenticateToken, (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Admin only' });
    const { days } = req.body;
    const nextTime = Date.now() + (days * 24 * 60 * 60 * 1000);

    db.query('UPDATE lottery_stats SET autoDrawDays = ?, nextDrawTime = ? WHERE id = 1', [days, nextTime], (err) => {
        if (err) return res.status(500).json({ message: 'Settings failed' });
        res.json({ message: 'Auto Draw Updated', days, nextTime });
    });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT} and listening on 0.0.0.0`);
});

// SPA Fallback: Serve index.html for unknown routes
// SPA Fallback: Serve index.html for unknown routes
app.get(/(.*)/, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});


// Restart trigger for DB reconnection (Attempt 2)
