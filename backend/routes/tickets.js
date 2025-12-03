const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const { verifyToken } = require('../middleware/auth');

router.post('/', verifyToken, async (req, res) => {
    try {
        const { event_id, quantity } = req.body;
        const user_id = req.user.id;

        if (!event_id || !quantity || quantity < 1) {
            return res.status(400).json({ 
                success: false, 
                message: 'Event ID and valid quantity are required' 
            });
        }

        const [events] = await pool.query(
            'SELECT * FROM events WHERE id = ? AND status = "active"',
            [event_id]
        );

        if (events.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Event not found or not available' 
            });
        }

        const event = events[0];

        if (event.available_tickets < quantity) {
            return res.status(400).json({ 
                success: false, 
                message: `Only ${event.available_tickets} tickets available` 
            });
        }

        const total_price = event.price * quantity;

        const connection = await pool.getConnection();
        await connection.beginTransaction();

        try {
            const [ticketResult] = await connection.query(
                'INSERT INTO tickets (event_id, user_id, quantity, total_price) VALUES (?, ?, ?, ?)',
                [event_id, user_id, quantity, total_price]
            );

            await connection.query(
                'UPDATE events SET available_tickets = available_tickets - ? WHERE id = ?',
                [quantity, event_id]
            );

            await connection.commit();
            connection.release();

            res.status(201).json({
                success: true,
                message: 'Tickets purchased successfully',
                data: {
                    ticket_id: ticketResult.insertId,
                    event_id: event_id,
                    quantity: quantity,
                    total_price: total_price
                }
            });

        } catch (error) {
            await connection.rollback();
            connection.release();
            throw error;
        }

    } catch (error) {
        console.error('Error purchasing tickets:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error while purchasing tickets' 
        });
    }
});

router.get('/user', verifyToken, async (req, res) => {
    try {
        const user_id = req.user.id;

        const [tickets] = await pool.query(
            `SELECT 
                t.*,
                e.title as event_title,
                e.description as event_description,
                e.location as event_location,
                e.event_date,
                e.status as event_status,
                c.name as category_name,
                (SELECT image_url FROM event_images WHERE event_id = e.id AND is_primary = 1 LIMIT 1) as event_image
            FROM tickets t
            JOIN events e ON t.event_id = e.id
            JOIN categories c ON e.category_id = c.id
            WHERE t.user_id = ?
            ORDER BY t.purchase_date DESC`,
            [user_id]
        );

        res.json({
            success: true,
            data: tickets
        });

    } catch (error) {
        console.error('Error fetching user tickets:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error while fetching tickets' 
        });
    }
});

router.get('/:id', verifyToken, async (req, res) => {
    try {
        const ticket_id = req.params.id;
        const user_id = req.user.id;

        const [tickets] = await pool.query(
            `SELECT 
                t.*,
                e.title as event_title,
                e.description as event_description,
                e.location as event_location,
                e.event_date,
                e.status as event_status,
                c.name as category_name,
                (SELECT image_url FROM event_images WHERE event_id = e.id AND is_primary = 1 LIMIT 1) as event_image
            FROM tickets t
            JOIN events e ON t.event_id = e.id
            JOIN categories c ON e.category_id = c.id
            WHERE t.id = ? AND t.user_id = ?`,
            [ticket_id, user_id]
        );

        if (tickets.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Ticket not found' 
            });
        }

        res.json({
            success: true,
            data: tickets[0]
        });

    } catch (error) {
        console.error('Error fetching ticket:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error while fetching ticket' 
        });
    }
});

module.exports = router;
