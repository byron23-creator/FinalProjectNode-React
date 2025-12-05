const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getTestPool } = require('./testDb');

const createTestUser = async (userData = {}) => {
  const pool = getTestPool();
  
  const defaultData = {
    email: `test${Date.now()}@example.com`,
    password: 'password123',
    first_name: 'Test',
    last_name: 'User',
    role: 'user'
  };

  const data = { ...defaultData, ...userData };
  
  const hashedPassword = await bcrypt.hash(data.password, 10);
  
  const [roles] = await pool.query('SELECT id FROM roles WHERE name = ?', [data.role]);
  
  const [result] = await pool.query(
    'INSERT INTO users (email, password, first_name, last_name, phone, role_id) VALUES (?, ?, ?, ?, ?, ?)',
    [data.email, hashedPassword, data.first_name, data.last_name, data.phone || null, roles[0].id]
  );

  return {
    id: result.insertId,
    email: data.email,
    password: data.password, // Return plain password for testing
    first_name: data.first_name,
    last_name: data.last_name,
    role: data.role
  };
};

const generateToken = (user) => {
  return jwt.sign(
    { 
      id: user.id, 
      email: user.email,
      role: user.role
    },
    process.env.JWT_SECRET || 'test-secret-key',
    { expiresIn: '7d' }
  );
};

const createTestEvent = async (eventData = {}, organizerId) => {
  const pool = getTestPool();
  
  const defaultData = {
    title: 'Test Event',
    description: 'Test event description',
    location: 'Test Location',
    event_date: '2025-12-31 18:00:00',
    price: 50.00,
    available_tickets: 100,
    category_id: 1,
    is_featured: false
  };

  const data = { ...defaultData, ...eventData };
  
  const [result] = await pool.query(
    `INSERT INTO events (title, description, location, event_date, price, available_tickets, category_id, organizer_id, is_featured)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [data.title, data.description, data.location, data.event_date, data.price, data.available_tickets, data.category_id, organizerId, data.is_featured]
  );

  return {
    id: result.insertId,
    ...data,
    organizer_id: organizerId
  };
};

const createTestCategory = async (categoryData = {}) => {
  const pool = getTestPool();
  
  const defaultData = {
    name: `Test Category ${Date.now()}`,
    description: 'Test category description'
  };

  const data = { ...defaultData, ...categoryData };
  
  const [result] = await pool.query(
    'INSERT INTO categories (name, description) VALUES (?, ?)',
    [data.name, data.description]
  );

  return {
    id: result.insertId,
    ...data
  };
};

const createTestTicket = async (ticketData = {}) => {
  const pool = getTestPool();
  
  const defaultData = {
    quantity: 1,
    total_price: 50.00
  };

  const data = { ...defaultData, ...ticketData };
  
  const [result] = await pool.query(
    'INSERT INTO tickets (event_id, user_id, quantity, total_price) VALUES (?, ?, ?, ?)',
    [data.event_id, data.user_id, data.quantity, data.total_price]
  );

  return {
    id: result.insertId,
    ...data
  };
};

module.exports = {
  createTestUser,
  generateToken,
  createTestEvent,
  createTestCategory,
  createTestTicket
};
