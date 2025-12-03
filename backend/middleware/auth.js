const jwt = require('jsonwebtoken');
require('dotenv').config();

const verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ 
            success: false, 
            message: 'Access denied. No token provided.' 
        });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(403).json({ 
            success: false, 
            message: 'Invalid or expired token.' 
        });
    }
};

const isAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ 
            success: false, 
            message: 'Access denied. Admin privileges required.' 
        });
    }
    next();
};

const isAdminOrOrganizer = (req, res, next) => {
    if (req.user.role !== 'admin' && req.user.role !== 'organizer') {
        return res.status(403).json({ 
            success: false, 
            message: 'Access denied. Organizer or Admin privileges required.' 
        });
    }
    next();
};

module.exports = {
    verifyToken,
    isAdmin,
    isAdminOrOrganizer
};
