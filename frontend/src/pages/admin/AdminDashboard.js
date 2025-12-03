// Admin Dashboard - Shows statistics and overview
import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../utils/api';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const response = await adminAPI.getDashboard();
      // Backend returns data in response.data.data.overview
      setStats(response.data.data.overview);
    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">Loading dashboard...</div>;

  return (
    <div className="admin-dashboard">
      <div className="container">
        <h1>Admin Dashboard</h1>
        
        {stats && (
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">📊</div>
              <div className="stat-info">
                <h3>Total Events</h3>
                <p className="stat-value">{stats.totalEvents}</p>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon">👥</div>
              <div className="stat-info">
                <h3>Total Users</h3>
                <p className="stat-value">{stats.totalUsers}</p>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon">🎫</div>
              <div className="stat-info">
                <h3>Tickets Sold</h3>
                <p className="stat-value">{stats.totalTicketsSold}</p>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon">💰</div>
              <div className="stat-info">
                <h3>Total Revenue</h3>
                <p className="stat-value">Q{parseFloat(stats.totalRevenue).toFixed(2)}</p>
              </div>
            </div>
          </div>
        )}

        <div className="admin-links">
          <a href="/admin/events" className="admin-link-card">
            <h3>📅 Manage Events</h3>
            <p>Create, edit, and delete events</p>
          </a>
          <a href="/admin/users" className="admin-link-card">
            <h3>👤 Manage Users</h3>
            <p>View and manage user accounts</p>
          </a>
          <a href="/admin/categories" className="admin-link-card">
            <h3>🏷️ Manage Categories</h3>
            <p>Create and edit event categories</p>
          </a>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
