const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const { verifyToken, isAdminOrOrganizer } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.get('/', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;
        
        const category = req.query.category;
        const search = req.query.search;
        const featured = req.query.featured;
        const startDate = req.query.startDate;
        const endDate = req.query.endDate;

        let query = `
            SELECT 
                e.*,
                c.name as category_name,
                u.first_name as organizer_first_name,
                u.last_name as organizer_last_name,
                (SELECT image_url FROM event_images WHERE event_id = e.id AND is_primary = 1 LIMIT 1) as primary_image
            FROM events e
            JOIN categories c ON e.category_id = c.id
            JOIN users u ON e.organizer_id = u.id
            WHERE e.status = 'active'
        `;

        const queryParams = [];

        if (category) {
            query += ' AND e.category_id = ?';
            queryParams.push(category);
        }

        if (search) {
            query += ' AND (e.title LIKE ? OR e.description LIKE ?)';
            queryParams.push(`%${search}%`, `%${search}%`);
        }

        if (featured === 'true') {
            query += ' AND e.is_featured = 1';
        }

        if (startDate) {
            query += ' AND e.event_date >= ?';
            queryParams.push(startDate);
        }
        if (endDate) {
            query += ' AND e.event_date <= ?';
            queryParams.push(endDate);
        }

        query += ' ORDER BY e.event_date ASC LIMIT ? OFFSET ?';
        queryParams.push(limit, offset);

        const [events] = await pool.query(query, queryParams);

        let countQuery = `
            SELECT COUNT(*) as total
            FROM events e
            WHERE e.status = 'active'
        `;
        const countParams = [];

        if (category) {
            countQuery += ' AND e.category_id = ?';
            countParams.push(category);
        }
        if (search) {
            countQuery += ' AND (e.title LIKE ? OR e.description LIKE ?)';
            countParams.push(`%${search}%`, `%${search}%`);
        }
        if (featured === 'true') {
            countQuery += ' AND e.is_featured = 1';
        }
        if (startDate) {
            countQuery += ' AND e.event_date >= ?';
            countParams.push(startDate);
        }
        if (endDate) {
            countQuery += ' AND e.event_date <= ?';
            countParams.push(endDate);
        }

        const [countResult] = await pool.query(countQuery, countParams);
        const totalEvents = countResult[0].total;
        const totalPages = Math.ceil(totalEvents / limit);

        res.json({
            success: true,
            events: events,
            pagination: {
                currentPage: page,
                totalPages: totalPages,
                totalItems: totalEvents,
                itemsPerPage: limit
            }
        });

    } catch (error) {
        console.error('Error fetching events:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error while fetching events' 
        });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const eventId = req.params.id;

        const [events] = await pool.query(
            `SELECT 
                e.*,
                c.name as category_name,
                u.first_name as organizer_first_name,
                u.last_name as organizer_last_name,
                u.email as organizer_email,
                (SELECT image_url FROM event_images WHERE event_id = e.id AND is_primary = 1 LIMIT 1) as primary_image
            FROM events e
            JOIN categories c ON e.category_id = c.id
            JOIN users u ON e.organizer_id = u.id
            WHERE e.id = ?`,
            [eventId]
        );

        if (events.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Event not found' 
            });
        }

        const [images] = await pool.query(
            'SELECT * FROM event_images WHERE event_id = ? ORDER BY is_primary DESC',
            [eventId]
        );

        const event = events[0];
        event.images = images;

        res.json({
            success: true,
            event: event
        });

    } catch (error) {
        console.error('Error fetching event:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error while fetching event' 
        });
    }
});

router.post('/', verifyToken, isAdminOrOrganizer, upload.single('image'), async (req, res) => {
    try {
        const { title, description, location, event_date, price, available_tickets, category_id, is_featured } = req.body;

        if (!title || !description || !location || !event_date || !price || !available_tickets || !category_id) {
            return res.status(400).json({ 
                success: false, 
                message: 'All fields are required' 
            });
        }

        const [result] = await pool.query(
            `INSERT INTO events (title, description, location, event_date, price, available_tickets, category_id, organizer_id, is_featured)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [title, description, location, event_date, price, available_tickets, category_id, req.user.id, is_featured || false]
        );

        const eventId = result.insertId;

        if (req.file) {
            const imageUrl = `/uploads/events/${req.file.filename}`;
            await pool.query(
                'INSERT INTO event_images (event_id, image_url, is_primary) VALUES (?, ?, ?)',
                [eventId, imageUrl, true]
            );
        }

        res.status(201).json({
            success: true,
            message: 'Event created successfully',
            data: {
                id: eventId,
                title: title
            }
        });

    } catch (error) {
        console.error('Error creating event:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error while creating event' 
        });
    }
});

router.put('/:id', verifyToken, isAdminOrOrganizer, upload.single('image'), async (req, res) => {
    try {
        const eventId = req.params.id;
        const { title, description, location, event_date, price, available_tickets, category_id, is_featured, status } = req.body;

        const [events] = await pool.query('SELECT * FROM events WHERE id = ?', [eventId]);
        
        if (events.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Event not found' 
            });
        }

        await pool.query(
            `UPDATE events 
             SET title = ?, description = ?, location = ?, event_date = ?, price = ?, 
                 available_tickets = ?, category_id = ?, is_featured = ?, status = ?
             WHERE id = ?`,
            [title, description, location, event_date, price, available_tickets, category_id, is_featured, status || 'active', eventId]
        );

        if (req.file) {
            const imageUrl = `/uploads/events/${req.file.filename}`;
            
            await pool.query(
                'UPDATE event_images SET is_primary = 0 WHERE event_id = ?',
                [eventId]
            );
            
            await pool.query(
                'INSERT INTO event_images (event_id, image_url, is_primary) VALUES (?, ?, ?)',
                [eventId, imageUrl, true]
            );
        }

        res.json({
            success: true,
            message: 'Event updated successfully'
        });

    } catch (error) {
        console.error('Error updating event:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error while updating event' 
        });
    }
});

router.delete('/:id', verifyToken, isAdminOrOrganizer, async (req, res) => {
    try {
        const eventId = req.params.id;

        const [events] = await pool.query('SELECT * FROM events WHERE id = ?', [eventId]);
        
        if (events.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Event not found' 
            });
        }

        await pool.query('DELETE FROM events WHERE id = ?', [eventId]);

        res.json({
            success: true,
            message: 'Event deleted successfully'
        });

    } catch (error) {
        console.error('Error deleting event:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error while deleting event' 
        });
    }
});

module.exports = router;
