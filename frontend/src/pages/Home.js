import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { eventsAPI, categoriesAPI } from '../utils/api';
import './Home.css';

const Home = () => {
  const [events, setEvents] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    featured: false
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [currentPage, filters]);

  const fetchCategories = async () => {
    try {
      const response = await categoriesAPI.getAll();
      setCategories(response.data.categories || []);
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  const fetchEvents = async () => {
    setLoading(true);
    setError('');
    
    try {
      const params = {
        page: currentPage,
        limit: 9,
        ...(filters.search && { search: filters.search }),
        ...(filters.category && { category: filters.category }),
        ...(filters.featured && { featured: 'true' })
      };

      const response = await eventsAPI.getAll(params);
      
      setEvents(response.data.events || []);
      setTotalPages(response.data.pagination?.totalPages || 1);
    } catch (err) {
      setError('Failed to load events. Please try again.');
      console.error('Error fetching events:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e) => {
    setFilters({ ...filters, search: e.target.value });
    setCurrentPage(1);
  };

  const handleCategoryChange = (e) => {
    setFilters({ ...filters, category: e.target.value });
    setCurrentPage(1);
  };

  const handleFeaturedToggle = () => {
    setFilters({ ...filters, featured: !filters.featured });
    setCurrentPage(1);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatPrice = (price) => {
    return `Q${parseFloat(price).toFixed(2)}`;
  };

  return (
    <div className="home-page">
      <section className="hero-section">
        <div className="container">
          <h1 className="hero-title">Discover Amazing Events</h1>
          <p className="hero-subtitle">
            Find and book tickets for concerts, sports, conferences, and more
          </p>
        </div>
      </section>

      <section className="filter-section">
        <div className="container">
          <div className="filters">
            <div className="search-box">
              <input
                type="text"
                placeholder="Search events..."
                value={filters.search}
                onChange={handleSearchChange}
                className="search-input"
              />
            </div>

            <div className="filter-box">
              <select
                value={filters.category}
                onChange={handleCategoryChange}
                className="filter-select"
              >
                <option value="">All Categories</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-box">
              <label className="featured-checkbox">
                <input
                  type="checkbox"
                  checked={filters.featured}
                  onChange={handleFeaturedToggle}
                />
                <span>Featured Only</span>
              </label>
            </div>
          </div>
        </div>
      </section>

      <section className="events-section">
        <div className="container">
          {loading ? (
            <div className="loading">Loading events...</div>
          ) : error ? (
            <div className="error-message">{error}</div>
          ) : events.length === 0 ? (
            <div className="no-events">
              <p>No events found. Try adjusting your filters.</p>
            </div>
          ) : (
            <>
              <div className="events-grid">
                {events.map(event => (
                  <div key={event.id} className="event-card">
                    <div className="event-image">
                      {event.primary_image ? (
                        <img 
                          src={`http://localhost:5001${event.primary_image}`} 
                          alt={event.title}
                        />
                      ) : (
                        <div className="no-image">No Image</div>
                      )}
                      {event.is_featured && (
                        <span className="featured-badge">Featured</span>
                      )}
                    </div>

                    <div className="event-details">
                      <div className="event-category">{event.category_name}</div>
                      <h3 className="event-title">{event.title}</h3>
                      <p className="event-description">
                        {event.description.substring(0, 100)}...
                      </p>
                      
                      <div className="event-info">
                        <div className="event-date">
                          📅 {formatDate(event.event_date)}
                        </div>
                        <div className="event-location">
                          📍 {event.location}
                        </div>
                      </div>

                      <div className="event-footer">
                        <div className="event-price">{formatPrice(event.price)}</div>
                        <Link to={`/events/${event.id}`} className="view-button">
                          View Details
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {totalPages > 1 && (
                <div className="pagination">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="pagination-button"
                  >
                    Previous
                  </button>
                  
                  <span className="pagination-info">
                    Page {currentPage} of {totalPages}
                  </span>
                  
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="pagination-button"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  );
};

export default Home;
