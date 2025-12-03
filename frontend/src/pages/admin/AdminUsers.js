import React, { useState, useEffect } from 'react';
import { usersAPI } from '../../utils/api';
import './AdminUsers.css';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newRole, setNewRole] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const roles = [
    { id: 1, name: 'admin', label: 'Admin' },
    { id: 2, name: 'organizer', label: 'Organizer' },
    { id: 3, name: 'user', label: 'User' }
  ];

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await usersAPI.getAll();
      setUsers(response.data.users || response.data || []);
    } catch (err) {
      setError('Failed to load users');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleChangeRole = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      await usersAPI.changeRole(selectedUser.id, { role_id: parseInt(newRole) });
      setSuccess(`Role updated successfully for ${selectedUser.first_name} ${selectedUser.last_name}!`);
      fetchUsers();
      handleCloseModal();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update role');
    }
  };

  const handleOpenRoleModal = (user) => {
    setSelectedUser(user);
    setNewRole(user.role_id.toString());
    setShowModal(true);
    setError('');
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedUser(null);
    setNewRole('');
  };

  const getRoleBadgeClass = (roleName) => {
    switch (roleName?.toLowerCase()) {
      case 'admin':
        return 'role-badge role-admin';
      case 'organizer':
        return 'role-badge role-organizer';
      default:
        return 'role-badge role-user';
    }
  };

  return (
    <div className="admin-users">
      <div className="admin-header">
        <h1>Manage Users</h1>
        <div className="stats">
          <div className="stat-card">
            <span className="stat-label">Total Users</span>
            <span className="stat-value">{users.length}</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Admins</span>
            <span className="stat-value">
              {users.filter(u => u.role_name === 'admin').length}
            </span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Organizers</span>
            <span className="stat-value">
              {users.filter(u => u.role_name === 'organizer').length}
            </span>
          </div>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {loading ? (
        <div className="loading">Loading users...</div>
      ) : (
        <div className="users-table">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Role</th>
                <th>Registered</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan="7" className="no-data">No users found</td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id}>
                    <td>{user.id}</td>
                    <td>
                      <strong>{user.first_name} {user.last_name}</strong>
                    </td>
                    <td>{user.email}</td>
                    <td>{user.phone || 'N/A'}</td>
                    <td>
                      <span className={getRoleBadgeClass(user.role_name)}>
                        {user.role_name}
                      </span>
                    </td>
                    <td>{new Date(user.created_at).toLocaleDateString()}</td>
                    <td className="actions">
                      <button 
                        className="btn-edit" 
                        onClick={() => handleOpenRoleModal(user)}
                      >
                        Change Role
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {showModal && selectedUser && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Change User Role</h2>
              <button className="close-btn" onClick={handleCloseModal}>×</button>
            </div>
            
            <form onSubmit={handleChangeRole}>
              <div className="user-info">
                <p><strong>User:</strong> {selectedUser.first_name} {selectedUser.last_name}</p>
                <p><strong>Email:</strong> {selectedUser.email}</p>
                <p><strong>Current Role:</strong> <span className={getRoleBadgeClass(selectedUser.role_name)}>{selectedUser.role_name}</span></p>
              </div>

              <div className="form-group">
                <label>New Role *</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  required
                >
                  {roles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="role-descriptions">
                <h4>Role Descriptions:</h4>
                <ul>
                  <li><strong>Admin:</strong> Full access to all features and settings</li>
                  <li><strong>Organizer:</strong> Can create and manage events</li>
                  <li><strong>User:</strong> Can browse events and purchase tickets</li>
                </ul>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={handleCloseModal}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Update Role
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;
