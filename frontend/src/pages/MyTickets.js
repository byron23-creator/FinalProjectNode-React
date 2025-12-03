// My Tickets Page - Shows user's purchased tickets
import React, { useState, useEffect } from 'react';
import { ticketsAPI } from '../utils/api';

const MyTickets = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      const response = await ticketsAPI.getUserTickets();
      setTickets(response.data.data);
    } catch (err) {
      console.error('Error fetching tickets:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">Loading tickets...</div>;

  return (
    <div className="container" style={{ padding: '40px 20px' }}>
      <h1>My Tickets</h1>
      {tickets.length === 0 ? (
        <p>You haven't purchased any tickets yet.</p>
      ) : (
        <div style={{ display: 'grid', gap: '20px', marginTop: '20px' }}>
          {tickets.map(ticket => (
            <div key={ticket.id} style={{ padding: '20px', backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
              <h3>{ticket.event_title}</h3>
              <p>Quantity: {ticket.quantity}</p>
              <p>Total: Q{ticket.total_price}</p>
              <p>Purchase Date: {new Date(ticket.purchase_date).toLocaleDateString()}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyTickets;
