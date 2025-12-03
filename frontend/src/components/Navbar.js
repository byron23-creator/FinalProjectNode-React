import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

const Navbar = () => {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="navbar">
      <div className="container">
        <div className="navbar-content">
          <Link to="/" className="navbar-brand">
            <span className="brand-icon">🌎</span>
            <span className="brand-text">ZonaTickets</span>
          </Link>

          <div className="navbar-links">
            <Link to="/" className="nav-link">Events</Link>
            
            {isAuthenticated() ? (
              <>
                <Link to="/my-tickets" className="nav-link">My Tickets</Link>
                <Link to="/profile" className="nav-link">Profile</Link>
                
                {isAdmin() && (
                  <Link to="/admin/dashboard" className="nav-link admin-link">
                    Admin Panel
                  </Link>
                )}
                
                <div className="user-menu">
                  <span className="user-name">
                    {user.first_name} {user.last_name}
                  </span>
                  <button onClick={handleLogout} className="logout-button">
                    Logout
                  </button>
                </div>
              </>
            ) : (
              <>
                <Link to="/login" className="nav-link">Login</Link>
                <Link to="/register" className="nav-link-button">Sign Up</Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
