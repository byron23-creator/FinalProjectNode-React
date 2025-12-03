const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const { verifyToken, isAdmin } = require('../middleware/auth');

router.get('/dashboard', verifyToken, isAdmin, async (req, res) => {
    try {
        const [totalEvents] = await pool.query(
            'SELECT COUNT(*) as count FROM events'
        );

        const [activeEvents] = await pool.query(
            'SELECT COUNT(*) as count FROM events WHERE status = "active"'
        );

        const [totalTickets] = await pool.query(
            'SELECT SUM(quantity) as count FROM tickets WHERE status = "confirmed"'
        );

        const [totalRevenue] = await pool.query(
            'SELECT SUM(total_price) as revenue FROM tickets WHERE status = "confirmed"'
        );

        const [totalUsers] = await pool.query(
            'SELECT COUNT(*) as count FROM users'
        );

        const [upcomingEvents] = await pool.query(
            `SELECT COUNT(*) as count 
             FROM events 
             WHERE status = "active" 
             AND event_date BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL 30 DAY)`
        );

        const [recentSales] = await pool.query(
            `SELECT COUNT(*) as count, SUM(total_price) as revenue
             FROM tickets 
             WHERE purchase_date >= DATE_SUB(NOW(), INTERVAL 7 DAY)`
        );

        const [topEvents] = await pool.query(
            `SELECT 
                e.id, e.title, 
                COUNT(t.id) as tickets_sold,
                SUM(t.total_price) as revenue
             FROM events e
             LEFT JOIN tickets t ON e.id = t.event_id
             WHERE t.status = "confirmed"
             GROUP BY e.id, e.title
             ORDER BY tickets_sold DESC
             LIMIT 5`
        );

        const [eventsByCategory] = await pool.query(
            `SELECT 
                c.name as category,
                COUNT(e.id) as count
             FROM categories c
             LEFT JOIN events e ON c.id = e.category_id
             GROUP BY c.id, c.name
             ORDER BY count DESC`
        );

        res.json({
            success: true,
            data: {
                overview: {
                    totalEvents: totalEvents[0].count,
                    activeEvents: activeEvents[0].count,
                    totalTicketsSold: totalTickets[0].count || 0,
                    totalRevenue: totalRevenue[0].revenue || 0,
                    totalUsers: totalUsers[0].count,
                    upcomingEvents: upcomingEvents[0].count
                },
                recentActivity: {
                    salesLast7Days: recentSales[0].count || 0,
                    revenueLast7Days: recentSales[0].revenue || 0
                },
                topEvents: topEvents,
                eventsByCategory: eventsByCategory
            }
        });

    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error while fetching dashboard statistics' 
        });
    }
});

router.get('/reports/sales', verifyToken, isAdmin, async (req, res) => {
    try {
        const { startDate, endDate, eventId } = req.query;

        let query = `
            SELECT 
                t.id,
                t.quantity,
                t.total_price,
                t.purchase_date,
                t.status,
                e.title as event_title,
                e.event_date,
                c.name as category_name,
                u.email as buyer_email,
                u.first_name as buyer_first_name,
                u.last_name as buyer_last_name
            FROM tickets t
            JOIN events e ON t.event_id = e.id
            JOIN categories c ON e.category_id = c.id
            JOIN users u ON t.user_id = u.id
            WHERE 1=1
        `;

        const queryParams = [];

        if (startDate) {
            query += ' AND t.purchase_date >= ?';
            queryParams.push(startDate);
        }
        if (endDate) {
            query += ' AND t.purchase_date <= ?';
            queryParams.push(endDate);
        }

        if (eventId) {
            query += ' AND t.event_id = ?';
            queryParams.push(eventId);
        }

        query += ' ORDER BY t.purchase_date DESC';

        const [sales] = await pool.query(query, queryParams);

        const totalSales = sales.length;
        const totalRevenue = sales.reduce((sum, sale) => sum + parseFloat(sale.total_price), 0);
        const totalTickets = sales.reduce((sum, sale) => sum + sale.quantity, 0);

        res.json({
            success: true,
            data: {
                sales: sales,
                summary: {
                    totalSales: totalSales,
                    totalRevenue: totalRevenue,
                    totalTickets: totalTickets
                }
            }
        });

    } catch (error) {
        console.error('Error fetching sales report:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error while fetching sales report' 
        });
    }
});

router.get('/reports/attendees/:eventId', verifyToken, isAdmin, async (req, res) => {
    try {
        const eventId = req.params.eventId;

        const [events] = await pool.query(
            'SELECT * FROM events WHERE id = ?',
            [eventId]
        );

        if (events.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Event not found' 
            });
        }

        const [attendees] = await pool.query(
            `SELECT 
                t.id as ticket_id,
                t.quantity,
                t.total_price,
                t.purchase_date,
                t.status,
                u.email,
                u.first_name,
                u.last_name,
                u.phone
            FROM tickets t
            JOIN users u ON t.user_id = u.id
            WHERE t.event_id = ?
            ORDER BY t.purchase_date DESC`,
            [eventId]
        );

        const totalAttendees = attendees.reduce((sum, ticket) => sum + ticket.quantity, 0);
        const totalRevenue = attendees.reduce((sum, ticket) => sum + parseFloat(ticket.total_price), 0);

        res.json({
            success: true,
            data: {
                event: events[0],
                attendees: attendees,
                statistics: {
                    totalTicketsSold: attendees.length,
                    totalAttendees: totalAttendees,
                    totalRevenue: totalRevenue
                }
            }
        });

    } catch (error) {
        console.error('Error fetching attendees report:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error while fetching attendees report' 
        });
    }
});

module.exports = router;
