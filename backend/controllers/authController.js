const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/db');
const transporter = require('../config/email');
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

// Register
const register = async (req, res) => {
    const { username, email, password } = req.body;

    try {
        const userExists = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (userExists.rows.length > 0) {
            return res.status(400).json({ success: false, message: 'User already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const verificationToken = jwt.sign({ email }, JWT_SECRET, { expiresIn: '7d' });

        await pool.query(
            'INSERT INTO users (username, email, password, is_verified, verification_token) VALUES ($1, $2, $3, $4, $5)',
            [username, email, hashedPassword, false, verificationToken]
        );

        await transporter.sendMail({
            from: '"My App" <youremail@example.com>',
            to: email,
            subject: 'Verify Your Email',
            text: `Click this link to verify your email: http://localhost:5173/verify-email/${verificationToken}`,
            html: `<a href="http://localhost:5173/verify-email/${verificationToken}">Verify Email</a>`
        });

        res.json({ success: true, message: 'User registered. Check your email to verify your account.' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Error registering user' });
    }
};

// Login
const login = async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await pool.query('SELECT * FROM users WHERE email = $1', [email]);

        if (!user.rows.length || !(await bcrypt.compare(password, user.rows[0].password))) {
            return res.status(400).json({ success: false, message: 'Invalid email or password' });
        }

        if (!user.rows[0].is_verified) {
            return res.status(400).json({ success: false, message: 'Please verify your email first' });
        }

        const token = jwt.sign({ userId: user.rows[0].id }, JWT_SECRET, { expiresIn: '1h' });
        res.json({ success: true, token });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Error during login' });
    }
};

// Verify Email
const verifyEmail = async (req, res) => {
    const { token } = req.params;

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        await pool.query('UPDATE users SET is_verified = true WHERE email = $1', [decoded.email]);
        res.json({ message: 'Email verified successfully' });
    } catch (err) {
        res.status(400).json({ message: 'Invalid or expired token' });
    }
};

// Reset Password Request
const resetPasswordRequest = async (req, res) => {
    const { email } = req.body;

    try {
        const user = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (!user.rows.length) return res.status(404).json({ message: 'User not found' });

        const resetToken = jwt.sign({ userId: user.rows[0].id }, JWT_SECRET, { expiresIn: '1h' });

        await transporter.sendMail({
            from: '"My App" <youremail@example.com>',
            to: email,
            subject: 'Password Reset',
            text: `Click this link to reset your password: http://localhost:5173/reset-password/${resetToken}`,
            html: `<a href="http://localhost:5173/reset-password/${resetToken}">Reset Password</a>`
        });

        res.json({ message: 'Password reset email sent' });
    } catch (err) {
        res.status(500).json({ message: 'Error sending password reset email' });
    }
};

// Reset Password
const resetPassword = async (req, res) => {
    const { token, newPassword } = req.body;

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await pool.query('UPDATE users SET password = $1 WHERE id = $2', [hashedPassword, decoded.userId]);
        res.json({ message: 'Password reset successful' });
    } catch (err) {
        res.status(400).json({ message: 'Invalid or expired token' });
    }
};

module.exports = { register, login, verifyEmail, resetPasswordRequest, resetPassword };
