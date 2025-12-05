const mysql = require('mysql2/promise');
require('dotenv').config();

async function testConnection() {
    console.log('Testing database connection...');
    console.log('Host:', process.env.DB_HOST);
    console.log('User:', process.env.DB_USER);
    console.log('Database:', process.env.DB_NAME);
    console.log('');

    try {
        // First, try to connect without specifying database
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD
        });
        
        console.log('✅ MySQL server is accessible');
        
        // Check if database exists
        const [databases] = await connection.query('SHOW DATABASES');
        const dbExists = databases.some(db => db.Database === process.env.DB_NAME);
        
        if (dbExists) {
            console.log(`✅ Database '${process.env.DB_NAME}' exists`);
            
            // Connect to the database
            await connection.query(`USE ${process.env.DB_NAME}`);
            
            // Check tables
            const [tables] = await connection.query('SHOW TABLES');
            console.log(`✅ Found ${tables.length} tables:`);
            tables.forEach(table => {
                console.log(`   - ${Object.values(table)[0]}`);
            });
            
            // Check if there are any users
            const [users] = await connection.query('SELECT COUNT(*) as count FROM users');
            console.log(`✅ Users in database: ${users[0].count}`);
            
            // Check if there are any categories
            const [categories] = await connection.query('SELECT COUNT(*) as count FROM categories');
            console.log(`✅ Categories in database: ${categories[0].count}`);
            
            // Check if there are any events
            const [events] = await connection.query('SELECT COUNT(*) as count FROM events');
            console.log(`✅ Events in database: ${events[0].count}`);
            
        } else {
            console.log(`❌ Database '${process.env.DB_NAME}' does NOT exist`);
            console.log('Available databases:');
            databases.forEach(db => {
                console.log(`   - ${db.Database}`);
            });
        }
        
        await connection.end();
        process.exit(0);
        
    } catch (error) {
        console.error('❌ Connection failed:', error.message);
        console.error('');
        console.error('Possible solutions:');
        console.error('1. Make sure MySQL is installed and running');
        console.error('2. Check your .env file credentials');
        console.error('3. Install MySQL: brew install mysql');
        console.error('4. Start MySQL: brew services start mysql');
        process.exit(1);
    }
}

testConnection();
