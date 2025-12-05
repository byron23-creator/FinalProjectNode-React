const mysql = require('mysql2/promise');
require('dotenv').config();

let testPool;

const getTestPool = () => {
  if (!testPool) {
    testPool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME_TEST || 'event_management_test',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });
  }
  return testPool;
};

const setupTestDatabase = async () => {
  const pool = getTestPool();
  
  try {
    // Drop all tables
    await pool.query('SET FOREIGN_KEY_CHECKS = 0');
    await pool.query('DROP TABLE IF EXISTS tickets');
    await pool.query('DROP TABLE IF EXISTS event_images');
    await pool.query('DROP TABLE IF EXISTS events');
    await pool.query('DROP TABLE IF EXISTS categories');
    await pool.query('DROP TABLE IF EXISTS users');
    await pool.query('DROP TABLE IF EXISTS roles');
    await pool.query('SET FOREIGN_KEY_CHECKS = 1');

    // Create tables
    await pool.query(`
      CREATE TABLE roles (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(50) NOT NULL UNIQUE,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      CREATE TABLE users (
        id INT PRIMARY KEY AUTO_INCREMENT,
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        phone VARCHAR(20),
        role_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (role_id) REFERENCES roles(id)
      )
    `);

    await pool.query(`
      CREATE TABLE categories (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(100) NOT NULL UNIQUE,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      CREATE TABLE events (
        id INT PRIMARY KEY AUTO_INCREMENT,
        title VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        location VARCHAR(255) NOT NULL,
        event_date DATETIME NOT NULL,
        price DECIMAL(10, 2) NOT NULL,
        available_tickets INT NOT NULL,
        category_id INT NOT NULL,
        organizer_id INT NOT NULL,
        is_featured BOOLEAN DEFAULT FALSE,
        status ENUM('active', 'cancelled', 'completed') DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES categories(id),
        FOREIGN KEY (organizer_id) REFERENCES users(id)
      )
    `);

    await pool.query(`
      CREATE TABLE event_images (
        id INT PRIMARY KEY AUTO_INCREMENT,
        event_id INT NOT NULL,
        image_url VARCHAR(500) NOT NULL,
        is_primary BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
      )
    `);

    await pool.query(`
      CREATE TABLE tickets (
        id INT PRIMARY KEY AUTO_INCREMENT,
        event_id INT NOT NULL,
        user_id INT NOT NULL,
        quantity INT NOT NULL DEFAULT 1,
        total_price DECIMAL(10, 2) NOT NULL,
        purchase_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        status ENUM('confirmed', 'cancelled', 'used') DEFAULT 'confirmed',
        FOREIGN KEY (event_id) REFERENCES events(id),
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);

    // Insert default roles
    await pool.query(`
      INSERT INTO roles (name, description) VALUES 
      ('admin', 'Administrator with full access'),
      ('organizer', 'Event organizer who can create and manage events'),
      ('user', 'Regular user who can purchase tickets')
    `);

    // Insert default categories
    await pool.query(`
      INSERT INTO categories (name, description) VALUES 
      ('Music', 'Concerts, festivals, and music events'),
      ('Sports', 'Sports events and competitions'),
      ('Technology', 'Tech conferences and workshops'),
      ('Arts', 'Art exhibitions and cultural events')
    `);

    console.log('✅ Test database setup completed');
  } catch (error) {
    console.error('❌ Error setting up test database:', error);
    throw error;
  }
};

const cleanupTestDatabase = async () => {
  const pool = getTestPool();
  
  try {
    await pool.query('SET FOREIGN_KEY_CHECKS = 0');
    await pool.query('TRUNCATE TABLE tickets');
    await pool.query('TRUNCATE TABLE event_images');
    await pool.query('TRUNCATE TABLE events');
    await pool.query('DELETE FROM users WHERE email != "admin@events.com"');
    await pool.query('SET FOREIGN_KEY_CHECKS = 1');
  } catch (error) {
    console.error('Error cleaning up test database:', error);
    throw error;
  }
};

const closeTestDatabase = async () => {
  if (testPool) {
    await testPool.end();
    testPool = null;
  }
};

module.exports = {
  getTestPool,
  setupTestDatabase,
  cleanupTestDatabase,
  closeTestDatabase
};
