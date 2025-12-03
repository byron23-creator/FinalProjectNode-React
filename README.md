# ZonaTickets - Event Ticketing Platform

A full-stack event ticketing platform built with React and Node.js, allowing users to browse events, purchase tickets, and manage bookings. Administrators can manage events, categories, and users through a dedicated admin panel.

## Features

### User Features
- **Browse Events**: View all available events with search and filtering capabilities
- **Event Details**: See detailed information about events including date, location, and pricing
- **Ticket Purchase**: Buy tickets for events with quantity selection
- **User Authentication**: Secure login and registration system
- **My Tickets**: View purchased tickets and booking history
- **User Profile**: Manage personal information

### Admin Features
- **Dashboard**: Overview of platform statistics and metrics
- **Event Management**: Create, edit, and delete events with image uploads
- **Category Management**: Organize events by categories
- **User Management**: View and manage user accounts and roles
- **Sales Reports**: Track ticket sales and revenue

## Technologies Used

### Frontend
- **React** - UI library
- **React Router** - Navigation and routing
- **Axios** - HTTP client for API requests
- **CSS3** - Styling and responsive design

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web application framework
- **MySQL** - Relational database
- **JWT** - Authentication and authorization
- **Bcrypt** - Password hashing
- **Multer** - File upload handling

## Prerequisites

Before running this project, make sure you have:

- Node.js (v14 or higher)
- MySQL (v8.0 or higher)
- npm or yarn package manager

## Installation

### 1. Clone the Repository
```bash
git clone https://github.com/byron23-creator/FinalProjectNode-React.git
cd FinalProjectNode-React
```

### 2. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file in the `backend` directory with the following variables:

```env
PORT=5001
DB_HOST=localhost
DB_USER=your_mysql_username
DB_PASSWORD=your_mysql_password
DB_NAME=event_ticketing
JWT_SECRET=your_secret_key_here
```

### 3. Database Setup

Run the SQL schema to create the database:

```bash
mysql -u your_username -p < backend/database/schema.sql
```

Or manually execute the SQL file in MySQL Workbench or your preferred MySQL client.

### 4. Frontend Setup

```bash
cd frontend
npm install
```

## Running the Application

### Start the Backend Server

```bash
cd backend
npm start
```

The backend server will run on `http://localhost:5001`

### Start the Frontend Development Server

```bash
cd frontend
npm start
```

The frontend will run on `http://localhost:3000`

## Default Admin Account

After setting up the database, you can create an admin user by running:

```bash
cd backend/database
node generate-admin-hash.js
```

Then use the generated hash in the SQL file to create your admin account.

Default credentials (if using the provided setup):
- **Email**: admin@zonatickets.com
- **Password**: admin123

## 📁 Project Structure

```
FinalProjectNode-React/
├── backend/
│   ├── config/          # Database configuration
│   ├── database/        # SQL schemas and setup scripts
│   ├── middleware/      # Authentication and upload middleware
│   ├── routes/          # API routes
│   ├── uploads/         # Uploaded event images
│   └── server.js        # Express server entry point
├── frontend/
│   ├── public/          # Static files
│   └── src/
│       ├── components/  # Reusable components
│       ├── context/     # React context (Auth)
│       ├── pages/       # Page components
│       ├── utils/       # API utilities
│       └── App.js       # Main app component
└── README.md
```

