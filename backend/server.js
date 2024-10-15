const express = require('express');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

const JWT_SECRET = process.env.JWT_SECRET;

// Middleware to verify JWT
const verifyToken = (req, res, next) => {
    const token = req.header('Authorization')?.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        res.status(400).json({ message: 'Invalid token.' });
    }
};

// Email transporter
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Registration route
app.post('/api/register', async (req, res) => {
    const { username, email, password } = req.body;

    try {
        // Check if user already exists
        const userExists = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (userExists.rows.length > 0) {
            return res.status(400).json({ success: false, message: 'User already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const verificationToken = jwt.sign({ email }, JWT_SECRET, { expiresIn: '7d' });

        const result = await pool.query(
            'INSERT INTO users (username, email, password, is_verified, verification_token) VALUES ($1, $2, $3, $4, $5) RETURNING id',
            [username, email, hashedPassword, false, verificationToken]
        );

        // Send verification email
        await transporter.sendMail({
            from: '"My App" <youremail@example.com>',
            to: email,
            subject: 'Verify Your Email',
            text: `Click this link to verify your email: http://localhost:5173/verify-email/${verificationToken}`,
            html: `<p>Click this link to verify your email: <a href="http://localhost:5173/verify-email/${verificationToken}">Verify Email</a></p>`
        });

        res.json({ success: true, message: 'User registered. Please check your email to verify your account.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Error registering user' });
    }
});

// Email verification route
app.get('/api/verify-email/:token', async (req, res) => {
    const { token } = req.params;

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        await pool.query('UPDATE users SET is_verified = true, verification_token = null WHERE email = $1', [decoded.email]);
        res.json({ message: 'Email verified successfully' });
    } catch (err) {
        console.error(err);
        res.status(400).json({ message: 'Invalid or expired token' });
    }
});

// Login route
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await pool.query('SELECT * FROM users WHERE email = $1', [email]);

        if (user.rows.length === 0) {
            return res.status(400).json({ success: false, message: 'Invalid email or password' });
        }

        if (!user.rows[0].is_verified) {
            return res.status(400).json({ success: false, message: 'Please verify your email before logging in' });
        }

        const validPassword = await bcrypt.compare(password, user.rows[0].password);

        if (!validPassword) {
            return res.status(400).json({ success: false, message: 'Invalid email or password' });
        }

        const token = jwt.sign(
            { userId: user.rows[0].id, username: user.rows[0].username, email: user.rows[0].email },
            JWT_SECRET,
            { expiresIn: '1h' }
        );

        res.json({
            success: true,
            message: 'Logged in successfully',
            token,
            userId: user.rows[0].id,
            username: user.rows[0].username,
            email: user.rows[0].email
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Error during login' });
    }
});

// Protected route example
app.get('/api/protected', verifyToken, (req, res) => {
    res.json({ message: 'This is a protected route', user: req.user });
});

// Password reset request
app.post('/api/reset-password-request', async (req, res) => {
    console.log("Request body:", req.body)
    const { email } = req.body;

    try {
        const user = await pool.query('SELECT * FROM users WHERE email = $1', [email]);

        if (user.rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        const resetToken = jwt.sign({ userId: user.rows[0].id }, JWT_SECRET, { expiresIn: '1h' });

        await transporter.sendMail({
            from: '"My App" <youremail@example.com>',
            to: email,
            subject: 'Password Reset',
            text: `Click this link to reset your password: http://localhost:5173/reset-password/${resetToken}`,
            html: `<p>Click this link to reset your password: <a href="http://localhost:5173/reset-password/${resetToken}">Reset Password</a></p>`
        });

        res.json({ message: 'Password reset email sent' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error sending password reset email' });
    }
});

// Password reset
app.post('/api/reset-password', async (req, res) => {
    const { token, newPassword } = req.body;

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await pool.query('UPDATE users SET password = $1 WHERE id = $2', [hashedPassword, decoded.userId]);

        res.json({ message: 'Password reset successful' });
    } catch (err) {
        console.error(err);
        res.status(400).json({ message: 'Invalid or expired token' });
    }
});


// Edit account route
app.get('/api/edit-account', verifyToken, async (req, res) => {
    const userId = req.user.userId;

    try {
        const user = await pool.query('SELECT username, email FROM users WHERE id = $1', [userId]);

        if (user.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        res.json({
            success: true,
            user: {
                username: user.rows[0].username,
                email: user.rows[0].email
            }
        });
    } catch (err) {
        console.error('Error fetching user details:', err);
        res.status(500).json({ success: false, message: 'Error fetching user details' });
    }
});

// Edit account (PUT request)
app.put('/api/edit-account', verifyToken, async (req, res) => {
    console.log("Request body:", req.body);

    // Extract userId from JWT
    const userId = req.user.userId;
    const { username, email, currentPassword, newPassword } = req.body;

    console.log('Current password from client:', currentPassword);

    try {
        // Fetch the user by ID from the database
        const user = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);

        if (user.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const dbPassword = user.rows[0].password;
        console.log('Password from DB:', dbPassword);

        // Ensure the current password is provided
        if (!dbPassword || !currentPassword) {
            return res.status(400).json({ success: false, message: 'Current password is required' });
        }

        // Verify current password
        const validPassword = await bcrypt.compare(currentPassword, dbPassword);
        if (!validPassword) {
            return res.status(400).json({ success: false, message: 'Incorrect current password' });
        }

        // Update password if a new one is provided
        let updatedPassword = dbPassword;  // Default to the current password if no new password is provided
        if (newPassword) {
            updatedPassword = await bcrypt.hash(newPassword, 10);
        }

        // Update username, email, and password in the database
        await pool.query(
            'UPDATE users SET username = $1, email = $2, password = $3 WHERE id = $4',
            [username || user.rows[0].username, email || user.rows[0].email, updatedPassword, userId]
        );

        res.json({ success: true, message: 'Account updated successfully' });
    } catch (err) {
        console.error('Error updating account:', err);
        res.status(500).json({ success: false, message: 'Error updating account' });
    }
});




const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));