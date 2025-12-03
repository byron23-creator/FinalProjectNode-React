const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { pool } = require('../config/database');

router.post('/register', [
    body('email').isEmail().withMessage('Please provide a valid email'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('first_name').notEmpty().withMessage('First name is required'),
    body('last_name').notEmpty().withMessage('Last name is required')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ 
                success: false, 
                errors: errors.array() 
            });
        }

        const { email, password, first_name, last_name, phone } = req.body;

        const [existingUsers] = await pool.query(
            'SELECT id FROM users WHERE email = ?',
            [email]
        );

        if (existingUsers.length > 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'Email already registered' 
            });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const [roles] = await pool.query(
            'SELECT id FROM roles WHERE name = ?',
            ['user']
        );

        const [result] = await pool.query(
            'INSERT INTO users (email, password, first_name, last_name, phone, role_id) VALUES (?, ?, ?, ?, ?, ?)',
            [email, hashedPassword, first_name, last_name, phone || null, roles[0].id]
        );

        const token = jwt.sign(
            { 
                id: result.insertId, 
                email: email,
                role: 'user'
            },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            token: token,
            user: {
                id: result.insertId,
                email: email,
                first_name: first_name,
                last_name: last_name,
                role: 'user'
            }
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error during registration' 
        });
    }
});

router.post('/login', [
    body('email').isEmail().withMessage('Please provide a valid email'),
    body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ 
                success: false, 
                errors: errors.array() 
            });
        }

        const { email, password } = req.body;

        const [users] = await pool.query(
            `SELECT u.*, r.name as role_name 
             FROM users u 
             JOIN roles r ON u.role_id = r.id 
             WHERE u.email = ?`,
            [email]
        );

        if (users.length === 0) {
            return res.status(401).json({ 
                success: false, 
                message: 'Invalid email or password' 
            });
        }

        const user = users[0];

        const isValidPassword = await bcrypt.compare(password, user.password);

        if (!isValidPassword) {
            return res.status(401).json({ 
                success: false, 
                message: 'Invalid email or password' 
            });
        }

        const token = jwt.sign(
            { 
                id: user.id, 
                email: user.email,
                role: user.role_name
            },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            success: true,
            message: 'Login successful',
            token: token,
            user: {
                id: user.id,
                email: user.email,
                first_name: user.first_name,
                last_name: user.last_name,
                role: user.role_name
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error during login' 
        });
    }
});

module.exports = router;
