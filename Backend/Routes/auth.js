const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../db'); // Go up one level to find db.js

const register = async (req, res) => {
    const { name, email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const sql = "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, 'Member')";
    db.query(sql, [name, email, hashedPassword], (err, result) => {
        if (err) return res.status(500).json({ error: "Email already exists" });
        res.status(201).json({ message: "User Registered" });
    });
};

const login = (req, res) => {
    const { email, password } = req.body;
    const sql = "SELECT * FROM users WHERE email = ?";
    
    db.query(sql, [email], async (err, results) => {
        if (results.length === 0) return res.status(404).json({ error: "User not found" });

        const user = results[0];
        const isMatch = await bcrypt.compare(password, user.password);
        
        if (!isMatch) return res.status(401).json({ error: "Invalid credentials" });

        // Create Token valid for 2 hours
        const secret = process.env.JWT_SECRET || 'MARIDADI_KEY_2026';
        const token = jwt.sign({ id: user.id, role: user.role }, secret, { expiresIn: '2h' });
        res.json({ token, role: user.role, name: user.name });
    });
};

router.post('/register', register);
router.post('/login', login);

module.exports = router;