const express = require('express');
const verifyToken = require('../middleware/auth');
const router = express.Router();

router.get('/protected', verifyToken, (req, res) => {
    res.json({ message: 'This is a protected route', user: req.user });
});

module.exports = router;
