import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../utils/api';
import './Login.css';

const Register = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    first_name: '',
    last_name: '',
    phone: ''
  });
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      const response = await authAPI.register({
        email: formData.email,
        password: formData.password,
        first_name: formData.first_name,
        last_name: formData.last_name,
        phone: formData.phone
      });
      
      if (response.data.success) {
        login(response.data.token, response.data.user);
        navigate('/');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-left">
        <div className="login-logo">
          <div className="logo-icon">🎉</div>
        </div>
        
        <h1 className="login-title">
          Join<br />
          ZonaTickets! 🚀
        </h1>
        
        <p className="login-subtitle">
          Create your account and start discovering<br />
          amazing events in your city!
        </p>
        
        <p className="login-footer">
          © 2025 ZonaTickets. All rights reserved.
        </p>
      </div>

      <div className="login-right">
        <div className="login-form-container">
          <h2 className="brand-name">ZonaTickets</h2>
          
          <h3 className="form-title">Create Account</h3>
          
          <p className="form-subtitle">
            Already have an account? <Link to="/login" className="signup-link">Login here.</Link>
          </p>

          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <input
                type="text"
                name="first_name"
                placeholder="First Name"
                value={formData.first_name}
                onChange={handleChange}
                required
                className="form-input"
              />
            </div>

            <div className="form-group">
              <input
                type="text"
                name="last_name"
                placeholder="Last Name"
                value={formData.last_name}
                onChange={handleChange}
                required
                className="form-input"
              />
            </div>

            <div className="form-group">
              <input
                type="email"
                name="email"
                placeholder="Email address"
                value={formData.email}
                onChange={handleChange}
                required
                className="form-input"
              />
            </div>

            <div className="form-group">
              <input
                type="tel"
                name="phone"
                placeholder="Phone (optional)"
                value={formData.phone}
                onChange={handleChange}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <input
                type="password"
                name="password"
                placeholder="Password (min 6 characters)"
                value={formData.password}
                onChange={handleChange}
                required
                className="form-input"
              />
            </div>

            <div className="form-group">
              <input
                type="password"
                name="confirmPassword"
                placeholder="Confirm Password"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                className="form-input"
              />
            </div>

            {error && <div className="error-message">{error}</div>}

            <button 
              type="submit" 
              className="login-button"
              disabled={loading}
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>

            <button 
              type="button" 
              className="google-button"
              onClick={() => alert('Google registration not implemented in this demo')}
            >
              <span className="google-icon">G</span>
              Sign up with Google
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Register;
