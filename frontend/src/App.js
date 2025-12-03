import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import EventDetail from './pages/EventDetail';
import MyTickets from './pages/MyTickets';
import Profile from './pages/Profile';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminEvents from './pages/admin/AdminEvents';
import AdminUsers from './pages/admin/AdminUsers';
import AdminCategories from './pages/admin/AdminCategories';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated() ? children : <Navigate to="/login" />;
};

const AdminRoute = ({ children }) => {
  const { isAdmin } = useAuth();
  return isAdmin() ? children : <Navigate to="/" />;
};

const AppRoutes = () => {
  const { isAuthenticated } = useAuth();

  return (
    <Router>
      <Navbar />
      
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/events/:id" element={<EventDetail />} />
        
        <Route 
          path="/login" 
          element={isAuthenticated() ? <Navigate to="/" /> : <Login />} 
        />
        <Route 
          path="/register" 
          element={isAuthenticated() ? <Navigate to="/" /> : <Register />} 
        />

        <Route 
          path="/my-tickets" 
          element={
            <ProtectedRoute>
              <MyTickets />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/profile" 
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/admin/dashboard" 
          element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          } 
        />
        <Route 
          path="/admin/events" 
          element={
            <AdminRoute>
              <AdminEvents />
            </AdminRoute>
          } 
        />
        <Route 
          path="/admin/users" 
          element={
            <AdminRoute>
              <AdminUsers />
            </AdminRoute>
          } 
        />
        <Route 
          path="/admin/categories" 
          element={
            <AdminRoute>
              <AdminCategories />
            </AdminRoute>
          } 
        />

        <Route path="*" element={<div style={{padding: '40px', textAlign: 'center'}}>Page Not Found</div>} />
      </Routes>
    </Router>
  );
};

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}

export default App;
