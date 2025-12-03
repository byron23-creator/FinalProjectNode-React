import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { eventsAPI, ticketsAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import './EventDetail.css';

const EventDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [purchasing, setPurchasing] = useState(false);
  const [purchaseSuccess, setPurchaseSuccess] = useState(false);

  useEffect(() => {
    fetchEventDetails();
  }, [id]);

  const fetchEventDetails = async () => {
    try {
      const response = await eventsAPI.getById(id);
      setEvent(response.data.event);
    } catch (err) {
      setError('Failed to load event details');
      console.error('Error fetching event:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async () => {
    if (!isAuthenticated()) {
      navigate('/login');
      return;
    }

    setPurchasing(true);
    setError('');

    try {
      await ticketsAPI.purchase({
        event_id: event.id,
        quantity: quantity
      });
      
      setPurchaseSuccess(true);
      setTimeout(() => {
        navigate('/my-tickets');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to purchase tickets');
    } finally {
      setPurchasing(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
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

  const calculateTotal = () => {
    if (!event) return 0;
    return formatPrice(event.price * quantity);
  };

  if (loading) {
    return <div className="loading">Loading event details...</div>;
  }

  if (error && !event) {
    return (
      <div className="container" style={{ padding: '40px', textAlign: 'center' }}>
        <p className="error-message">{error}</p>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="container" style={{ padding: '40px', textAlign: 'center' }}>
        <p>Event not found</p>
      </div>
    );
  }

  return (
    <div className="event-detail-page">
      <div className="container">
        <div className="event-detail-container">
          <div className="event-detail-image">
            {event.primary_image ? (
              <img 
                src={`http://localhost:5001${event.primary_image}`} 
                alt={event.title}
              />
            ) : (
              <div className="no-image-large">No Image Available</div>
            )}
          </div>

          <div className="event-detail-info">
            <div className="event-category-badge">{event.category_name}</div>
            
            <h1 className="event-detail-title">{event.title}</h1>
            
            <div className="event-meta">
              <div className="meta-item">
                <span className="meta-icon">📅</span>
                <span>{formatDate(event.event_date)}</span>
              </div>
              <div className="meta-item">
                <span className="meta-icon">📍</span>
                <span>{event.location}</span>
              </div>
              <div className="meta-item">
                <span className="meta-icon">👥</span>
                <span>{event.available_tickets} tickets available</span>
              </div>
            </div>

            <div className="event-description">
              <h2>About This Event</h2>
              <p>{event.description}</p>
            </div>

            <div className="purchase-section">
              <div className="price-display">
                <span className="price-label">Price per ticket:</span>
                <span className="price-value">{formatPrice(event.price)}</span>
              </div>

              {purchaseSuccess ? (
                <div className="success-message">
                  ✅ Tickets purchased successfully! Redirecting to My Tickets...
                </div>
              ) : event.available_tickets > 0 ? (
                <>
                  <div className="quantity-selector">
                    <label>Quantity:</label>
                    <div className="quantity-controls">
                      <button 
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="quantity-btn"
                      >
                        -
                      </button>
                      <span className="quantity-display">{quantity}</span>
                      <button 
                        onClick={() => setQuantity(Math.min(event.available_tickets, quantity + 1))}
                        className="quantity-btn"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div className="total-price">
                    <span>Total:</span>
                    <span className="total-amount">{calculateTotal()}</span>
                  </div>

                  {error && <div className="error-message">{error}</div>}

                  <button 
                    onClick={handlePurchase}
                    disabled={purchasing}
                    className="purchase-button"
                  >
                    {purchasing ? 'Processing...' : 'Purchase Tickets'}
                  </button>
                </>
              ) : (
                <div className="sold-out-message">
                  ❌ Sorry, this event is sold out
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventDetail;
