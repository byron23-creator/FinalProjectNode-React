const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const { testConnection } = require('./config/database');

const authRoutes = require('./routes/auth');
const eventsRoutes = require('./routes/events');
const ticketsRoutes = require('./routes/tickets');
const categoriesRoutes = require('./routes/categories');
const usersRoutes = require('./routes/users');
const adminRoutes = require('./routes/admin');

const app = express();

app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/events', eventsRoutes);
app.use('/api/tickets', ticketsRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/admin', adminRoutes);

app.get('/', (req, res) => {
    res.json({ 
        success: true, 
        message: 'Event Management API is running',
        version: '1.0.0'
    });
});

app.get('/health', async (req, res) => {
    const dbConnected = await testConnection();
    res.json({
        success: true,
        server: 'running',
        database: dbConnected ? 'connected' : 'disconnected'
    });
});

app.use((req, res) => {
    res.status(404).json({ 
        success: false, 
        message: 'Route not found' 
    });
});

app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({ 
        success: false, 
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

const PORT = process.env.PORT || 5000;

testConnection().then((connected) => {
    if (connected) {
        app.listen(PORT, () => {
            console.log('=================================');
            console.log('🚀 Server is running');
            console.log(`📡 Port: ${PORT}`);
            console.log(`🌐 URL: http://localhost:${PORT}`);
            console.log('=================================');
        });
    } else {
        console.error('❌ Failed to connect to database. Server not started.');
        console.error('Please check your database configuration in .env file');
        process.exit(1);
    }
});

module.exports = app;
