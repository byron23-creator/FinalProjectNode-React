import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../utils/api';
import './Login.css';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  
  const [formData, setFormData] = useState({
    email: '',
    password: ''
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
    setLoading(true);

    try {
      const response = await authAPI.login(formData);
      
      if (response.data.success) {
        login(response.data.token, response.data.user);
        
        if (response.data.user.role === 'admin') {
          navigate('/admin/dashboard');
        } else {
          navigate('/');
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-left">
        <div className="login-logo">
          <div className="logo-icon">🪐</div>
        </div>
        
        <h1 className="login-title">
          Hello<br />
          Dreamer! 👋
        </h1>
        
        <p className="login-subtitle">
          Discover amazing events and book your tickets.<br />
          Join thousands of dreamers today!
        </p>
        
        <p className="login-footer">
          © 2025 ZonaTickets. All rights reserved.
        </p>
      </div>

      <div className="login-right">
        <div className="login-form-container">
          <h2 className="brand-name">ZonaTickets</h2>
          
          <h3 className="form-title">Welcome Back!</h3>
          
          <p className="form-subtitle">
            Don't have an account? <Link to="/register" className="signup-link">Create a new account now.</Link><br />
          </p>

          <form onSubmit={handleSubmit} className="login-form">
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
                type="password"
                name="password"
                placeholder="Password"
                value={formData.password}
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
              {loading ? 'Logging in...' : 'Login Now'}
            </button>

            <button 
              type="button" 
              className="google-button"
              onClick={() => alert('Google login not implemented in this demo')}
            >
              <span className="google-icon">G</span>
              Login with Google
            </button>

            <div className="forgot-password">
              <Link to="/forgot-password" className="forgot-link">
                Forget password? Click here
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
