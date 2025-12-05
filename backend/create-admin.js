const mysql = require('mysql2/promise');
require('dotenv').config();

async function createAdmin() {
    console.log('Creating admin user...');
    
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME
        });
        
        // Check if admin already exists
        const [existingUsers] = await connection.query(
            'SELECT * FROM users WHERE email = ?',
            ['admin@events.com']
        );
        
        if (existingUsers.length > 0) {
            console.log('⚠️  Admin user already exists');
            console.log('Email: admin@events.com');
            console.log('Password: admin123');
        } else {
            // Insert admin user
            // Password hash for 'admin123'
            const passwordHash = '$2a$10$DmWqaI2orA6c1PX5bH8P6eYrn6Aguvps.ZiQelPVFFFJMk/v2IxCy';
            
            await connection.query(
                'INSERT INTO users (email, password, first_name, last_name, role_id) VALUES (?, ?, ?, ?, ?)',
                ['admin@events.com', passwordHash, 'Admin', 'User', 1]
            );
            
            console.log('✅ Admin user created successfully!');
            console.log('');
            console.log('Login credentials:');
            console.log('Email: admin@events.com');
            console.log('Password: admin123');
        }
        
        // Check total users
        const [users] = await connection.query('SELECT COUNT(*) as count FROM users');
        console.log(`\nTotal users in database: ${users[0].count}`);
        
        await connection.end();
        process.exit(0);
        
    } catch (error) {
        console.error('❌ Error creating admin user:', error.message);
        process.exit(1);
    }
}

createAdmin();
