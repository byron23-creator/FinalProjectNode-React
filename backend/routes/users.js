const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const { verifyToken, isAdmin } = require('../middleware/auth');
const bcrypt = require('bcryptjs');

router.get('/', verifyToken, isAdmin, async (req, res) => {
    try {
        const [users] = await pool.query(
            `SELECT 
                u.id, u.email, u.first_name, u.last_name, u.phone, u.created_at,
                u.role_id, r.name as role_name
            FROM users u
            JOIN roles r ON u.role_id = r.id
            ORDER BY u.created_at DESC`
        );

        res.json({
            success: true,
            users: users
        });

    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error while fetching users' 
        });
    }
});

router.get('/profile', verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;

        const [users] = await pool.query(
            `SELECT 
                u.id, u.email, u.first_name, u.last_name, u.phone, u.created_at,
                r.name as role_name
            FROM users u
            JOIN roles r ON u.role_id = r.id
            WHERE u.id = ?`,
            [userId]
        );

        if (users.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'User not found' 
            });
        }

        res.json({
            success: true,
            data: users[0]
        });

    } catch (error) {
        console.error('Error fetching profile:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error while fetching profile' 
        });
    }
});

router.put('/profile', verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { first_name, last_name, phone, current_password, new_password } = req.body;

        if (!first_name || !last_name) {
            return res.status(400).json({ 
                success: false, 
                message: 'First name and last name are required' 
            });
        }

        if (new_password) {
            if (!current_password) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Current password is required to set a new password' 
                });
            }

            const [users] = await pool.query(
                'SELECT password FROM users WHERE id = ?',
                [userId]
            );

            const isValidPassword = await bcrypt.compare(current_password, users[0].password);
            
            if (!isValidPassword) {
                return res.status(401).json({ 
                    success: false, 
                    message: 'Current password is incorrect' 
                });
            }

            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(new_password, salt);

            await pool.query(
                'UPDATE users SET first_name = ?, last_name = ?, phone = ?, password = ? WHERE id = ?',
                [first_name, last_name, phone || null, hashedPassword, userId]
            );
        } else {
            await pool.query(
                'UPDATE users SET first_name = ?, last_name = ?, phone = ? WHERE id = ?',
                [first_name, last_name, phone || null, userId]
            );
        }

        res.json({
            success: true,
            message: 'Profile updated successfully'
        });

    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error while updating profile' 
        });
    }
});

router.put('/:id/role', verifyToken, isAdmin, async (req, res) => {
    try {
        const userId = req.params.id;
        const { role_id } = req.body;

        if (!role_id) {
            return res.status(400).json({ 
                success: false, 
                message: 'Role ID is required' 
            });
        }

        const [roles] = await pool.query(
            'SELECT id FROM roles WHERE id = ?',
            [role_id]
        );

        if (roles.length === 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid role ID' 
            });
        }

        const [users] = await pool.query(
            'SELECT id FROM users WHERE id = ?',
            [userId]
        );

        if (users.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'User not found' 
            });
        }

        await pool.query(
            'UPDATE users SET role_id = ? WHERE id = ?',
            [role_id, userId]
        );

        res.json({
            success: true,
            message: 'User role updated successfully'
        });

    } catch (error) {
        console.error('Error updating user role:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error while updating user role' 
        });
    }
});

router.get('/stats', verifyToken, isAdmin, async (req, res) => {
    try {
        const [totalUsers] = await pool.query(
            'SELECT COUNT(*) as count FROM users'
        );

        const [usersByRole] = await pool.query(
            `SELECT r.name as role, COUNT(u.id) as count
             FROM roles r
             LEFT JOIN users u ON r.id = u.role_id
             GROUP BY r.id, r.name`
        );

        const [recentUsers] = await pool.query(
            `SELECT COUNT(*) as count 
             FROM users 
             WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)`
        );

        res.json({
            success: true,
            data: {
                totalUsers: totalUsers[0].count,
                usersByRole: usersByRole,
                recentRegistrations: recentUsers[0].count
            }
        });

    } catch (error) {
        console.error('Error fetching user stats:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error while fetching statistics' 
        });
    }
});

module.exports = router;
