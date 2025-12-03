import React, { useState, useEffect } from 'react';
import { eventsAPI, categoriesAPI } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import './AdminEvents.css';

const AdminEvents = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category_id: '',
    event_date: '',
    event_time: '',
    location: '',
    venue: '',
    price: '',
    available_tickets: '',
    status: 'active',
    is_featured: false
  });
  const [imageFile, setImageFile] = useState(null);

  useEffect(() => {
    fetchEvents();
    fetchCategories();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const response = await eventsAPI.getAll({ limit: 100 });
      setEvents(response.data.events || []);
    } catch (err) {
      setError('Failed to load events');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await categoriesAPI.getAll();
      setCategories(response.data.categories || []);
    } catch (err) {
      console.error('Failed to load categories:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const formDataToSend = new FormData();
      
      // Combine date and time
      const eventDateTime = `${formData.event_date} ${formData.event_time}:00`;
      
      formDataToSend.append('title', formData.title);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('category_id', formData.category_id);
      formDataToSend.append('event_date', eventDateTime);
      formDataToSend.append('location', formData.location);
      formDataToSend.append('venue', formData.venue);
      formDataToSend.append('price', formData.price);
      formDataToSend.append('available_tickets', formData.available_tickets);
      formDataToSend.append('status', formData.status);
      formDataToSend.append('is_featured', formData.is_featured ? '1' : '0');
      
      if (imageFile) {
        formDataToSend.append('image', imageFile);
      }

      if (editingEvent) {
        await eventsAPI.update(editingEvent.id, formDataToSend);
        setSuccess('Event updated successfully!');
      } else {
        await eventsAPI.create(formDataToSend);
        setSuccess('Event created successfully!');
      }
      
      fetchEvents();
      handleCloseModal();
    } catch (err) {
      setError(err.response?.data?.message || 'Operation failed');
      console.error(err);
    }
  };

  const handleDelete = async (id, title) => {
    if (window.confirm(`Are you sure you want to delete "${title}"?`)) {
      try {
        await eventsAPI.delete(id);
        setSuccess('Event deleted successfully!');
        fetchEvents();
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to delete event');
      }
    }
  };

  const handleEdit = (event) => {
    setEditingEvent(event);
    
    // Parse the event_date to get date and time separately
    const eventDate = new Date(event.event_date);
    const dateStr = eventDate.toISOString().split('T')[0];
    const timeStr = eventDate.toTimeString().slice(0, 5);
    
    setFormData({
      title: event.title,
      description: event.description,
      category_id: event.category_id,
      event_date: dateStr,
      event_time: timeStr,
      location: event.location,
      venue: event.venue,
      price: event.price,
      available_tickets: event.available_tickets,
      status: event.status,
      is_featured: event.is_featured === 1
    });
    
    if (event.primary_image) {
      setImagePreview(`http://localhost:5001${event.primary_image}`);
    }
    
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingEvent(null);
    setFormData({
      title: '',
      description: '',
      category_id: '',
      event_date: '',
      event_time: '',
      location: '',
      venue: '',
      price: '',
      available_tickets: '',
      status: 'active',
      is_featured: false
    });
    setImageFile(null);
    setImagePreview(null);
    setError('');
  };

  const handleOpenModal = () => {
    setShowModal(true);
    setEditingEvent(null);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'active':
        return 'status-badge status-active';
      case 'cancelled':
        return 'status-badge status-cancelled';
      case 'completed':
        return 'status-badge status-completed';
      default:
        return 'status-badge';
    }
  };

  return (
    <div className="admin-events">
      <div className="admin-header">
        <h1>Manage Events</h1>
        <button className="btn-primary" onClick={handleOpenModal}>
          + Create Event
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {loading ? (
        <div className="loading">Loading events...</div>
      ) : (
        <div className="events-grid">
          {events.length === 0 ? (
            <div className="no-data">No events found. Create your first event!</div>
          ) : (
            events.map((event) => (
              <div key={event.id} className="event-card">
                <div className="event-image">
                  {event.primary_image ? (
                    <img src={`http://localhost:5001${event.primary_image}`} alt={event.title} />
                  ) : (
                    <div className="no-image">No Image</div>
                  )}
                  {event.is_featured === 1 && (
                    <span className="featured-badge">⭐ Featured</span>
                  )}
                </div>
                
                <div className="event-content">
                  <h3>{event.title}</h3>
                  <p className="event-category">{event.category_name}</p>
                  <p className="event-date">
                    📅 {new Date(event.event_date).toLocaleDateString()} at {new Date(event.event_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                  <p className="event-location">📍 {event.location}</p>
                  <p className="event-price">💰 Q{event.price}</p>
                  <p className="event-tickets">🎫 {event.available_tickets} tickets available</p>
                  
                  <div className="event-status">
                    <span className={getStatusBadgeClass(event.status)}>
                      {event.status}
                    </span>
                  </div>
                  
                  <div className="event-actions">
                    <button className="btn-edit" onClick={() => handleEdit(event)}>
                      Edit
                    </button>
                    <button className="btn-delete" onClick={() => handleDelete(event.id, event.title)}>
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingEvent ? 'Edit Event' : 'Create New Event'}</h2>
              <button className="close-btn" onClick={handleCloseModal}>×</button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label>Event Title *</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                    placeholder="e.g., Summer Music Festival"
                  />
                </div>

                <div className="form-group">
                  <label>Category *</label>
                  <select
                    value={formData.category_id}
                    onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                    required
                  >
                    <option value="">Select a category</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Description *</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                  placeholder="Describe your event..."
                  rows="4"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Event Date *</label>
                  <input
                    type="date"
                    value={formData.event_date}
                    onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Event Time *</label>
                  <input
                    type="time"
                    value={formData.event_time}
                    onChange={(e) => setFormData({ ...formData, event_time: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Location *</label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    required
                    placeholder="e.g., New York, NY"
                  />
                </div>

                <div className="form-group">
                  <label>Venue *</label>
                  <input
                    type="text"
                    value={formData.venue}
                    onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                    required
                    placeholder="e.g., Madison Square Garden"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Price ($) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    required
                    placeholder="0.00"
                  />
                </div>

                <div className="form-group">
                  <label>Available Tickets *</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.available_tickets}
                    onChange={(e) => setFormData({ ...formData, available_tickets: e.target.value })}
                    required
                    placeholder="100"
                  />
                </div>

                <div className="form-group">
                  <label>Status *</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    required
                  >
                    <option value="active">Active</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.is_featured}
                    onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                  />
                  <span>Featured Event (appears on homepage)</span>
                </label>
              </div>

              <div className="form-group">
                <label>Event Image</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                />
                {imagePreview && (
                  <div className="image-preview">
                    <img src={imagePreview} alt="Preview" />
                  </div>
                )}
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={handleCloseModal}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {editingEvent ? 'Update' : 'Create'} Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminEvents;
