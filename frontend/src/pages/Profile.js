// Profile Page - User profile management
import React from 'react';
import { useAuth } from '../context/AuthContext';

const Profile = () => {
  const { user } = useAuth();

  return (
    <div className="container" style={{ padding: '40px 20px', maxWidth: '600px' }}>
      <h1>My Profile</h1>
      <div style={{ marginTop: '30px', padding: '30px', backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontWeight: '600', marginBottom: '5px' }}>Name</label>
          <p>{user.first_name} {user.last_name}</p>
        </div>
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontWeight: '600', marginBottom: '5px' }}>Email</label>
          <p>{user.email}</p>
        </div>
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontWeight: '600', marginBottom: '5px' }}>Phone</label>
          <p>{user.phone || 'Not provided'}</p>
        </div>
        <div>
          <label style={{ display: 'block', fontWeight: '600', marginBottom: '5px' }}>Role</label>
          <p style={{ textTransform: 'capitalize' }}>{user.role}</p>
        </div>
      </div>
    </div>
  );
};

export default Profile;
