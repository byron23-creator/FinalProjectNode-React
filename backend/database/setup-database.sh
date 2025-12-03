#!/bin/bash

# Database Setup Script for Event Management Platform
# This script will create the database and run the schema

echo "=========================================="
echo "Event Management Database Setup"
echo "=========================================="
echo ""

# Database credentials from .env
DB_USER="root"
DB_PASSWORD="tarea.2025"
DB_NAME="event_management"

echo "Step 1: Creating database '$DB_NAME'..."
mysql -u $DB_USER -p$DB_PASSWORD -e "CREATE DATABASE IF NOT EXISTS $DB_NAME;" 2>/dev/null

if [ $? -eq 0 ]; then
    echo "✓ Database created successfully!"
else
    echo "✗ Failed to create database. Please check your MySQL installation and credentials."
    exit 1
fi

echo ""
echo "Step 2: Running schema to create tables..."
mysql -u $DB_USER -p$DB_PASSWORD $DB_NAME < schema.sql 2>/dev/null

if [ $? -eq 0 ]; then
    echo "✓ Tables created successfully!"
else
    echo "✗ Failed to create tables. Please check the schema.sql file."
    exit 1
fi

echo ""
echo "Step 3: Verifying database setup..."
mysql -u $DB_USER -p$DB_PASSWORD -e "USE $DB_NAME; SHOW TABLES;" 2>/dev/null

echo ""
echo "=========================================="
echo "Database setup completed successfully!"
echo "=========================================="
echo ""
echo "Default admin credentials:"
echo "  Email: admin@events.com"
echo "  Password: admin123"
echo ""
echo "You can now start the backend server with: npm start"
