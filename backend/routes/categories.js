const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const { verifyToken, isAdmin } = require('../middleware/auth');

router.get('/', async (req, res) => {
    try {
        const [categories] = await pool.query(
            'SELECT * FROM categories ORDER BY name ASC'
        );

        res.json({
            success: true,
            categories: categories
        });

    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error while fetching categories' 
        });
    }
});

router.post('/', verifyToken, isAdmin, async (req, res) => {
    try {
        const { name, description } = req.body;

        if (!name) {
            return res.status(400).json({ 
                success: false, 
                message: 'Category name is required' 
            });
        }

        const [existing] = await pool.query(
            'SELECT id FROM categories WHERE name = ?',
            [name]
        );

        if (existing.length > 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'Category already exists' 
            });
        }

        const [result] = await pool.query(
            'INSERT INTO categories (name, description) VALUES (?, ?)',
            [name, description || null]
        );

        res.status(201).json({
            success: true,
            message: 'Category created successfully',
            data: {
                id: result.insertId,
                name: name,
                description: description
            }
        });

    } catch (error) {
        console.error('Error creating category:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error while creating category' 
        });
    }
});

router.put('/:id', verifyToken, isAdmin, async (req, res) => {
    try {
        const categoryId = req.params.id;
        const { name, description } = req.body;

        if (!name) {
            return res.status(400).json({ 
                success: false, 
                message: 'Category name is required' 
            });
        }

        const [categories] = await pool.query(
            'SELECT * FROM categories WHERE id = ?',
            [categoryId]
        );

        if (categories.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Category not found' 
            });
        }

        await pool.query(
            'UPDATE categories SET name = ?, description = ? WHERE id = ?',
            [name, description || null, categoryId]
        );

        res.json({
            success: true,
            message: 'Category updated successfully'
        });

    } catch (error) {
        console.error('Error updating category:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error while updating category' 
        });
    }
});

router.delete('/:id', verifyToken, isAdmin, async (req, res) => {
    try {
        const categoryId = req.params.id;

        const [categories] = await pool.query(
            'SELECT * FROM categories WHERE id = ?',
            [categoryId]
        );

        if (categories.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Category not found' 
            });
        }

        const [events] = await pool.query(
            'SELECT COUNT(*) as count FROM events WHERE category_id = ?',
            [categoryId]
        );

        if (events[0].count > 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'Cannot delete category that is being used by events' 
            });
        }

        await pool.query('DELETE FROM categories WHERE id = ?', [categoryId]);

        res.json({
            success: true,
            message: 'Category deleted successfully'
        });

    } catch (error) {
        console.error('Error deleting category:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error while deleting category' 
        });
    }
});

module.exports = router;
