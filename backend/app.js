const express = require('express');
const cors = require('cors');
require('dotenv').config();
const authRoutes = require('./routes/auth');
const protectedRoutes = require('./routes/protected');
const { pool } = require('./config/db');

const app = express();
app.use(cors());
app.use(express.json());

// Routes
app.use('/api', authRoutes);
app.use('/api', protectedRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
