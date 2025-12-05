const request = require('supertest');
const app = require('../../server');
const { setupTestDatabase, cleanupTestDatabase, closeTestDatabase, getTestPool } = require('../setup/testDb');
const { createTestUser, generateToken, createTestEvent } = require('../setup/helpers');

describe('Tickets Routes - Integration Tests', () => {
  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterEach(async () => {
    await cleanupTestDatabase();
  });

  afterAll(async () => {
    await closeTestDatabase();
  });

  describe('POST /api/tickets', () => {
    test('should purchase ticket successfully and decrement capacity', async () => {
      const user = await createTestUser({ role: 'user' });
      const organizer = await createTestUser({ role: 'organizer' });
      const event = await createTestEvent({ available_tickets: 100 }, organizer.id);
      const token = generateToken(user);

      const ticketData = {
        event_id: event.id,
        quantity: 5
      };

      const response = await request(app)
        .post('/api/tickets')
        .set('Authorization', `Bearer ${token}`)
        .send(ticketData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Tickets purchased successfully');
      expect(response.body.data).toBeDefined();
      expect(response.body.data.ticket_id).toBeDefined();
      expect(response.body.data.quantity).toBe(5);
      expect(response.body.data.total_price).toBe(250.00); // 5 * 50.00

      // Verify ticket was created in database
      const pool = getTestPool();
      const [tickets] = await pool.query('SELECT * FROM tickets WHERE id = ?', [response.body.data.ticket_id]);
      expect(tickets.length).toBe(1);
      expect(tickets[0].user_id).toBe(user.id);
      expect(tickets[0].event_id).toBe(event.id);
      expect(tickets[0].quantity).toBe(5);

      // CRITICAL: Verify capacity was decremented in database
      const [events] = await pool.query('SELECT available_tickets FROM events WHERE id = ?', [event.id]);
      expect(events[0].available_tickets).toBe(95); // 100 - 5
    });

    test('should reject purchase without authentication', async () => {
      const organizer = await createTestUser({ role: 'organizer' });
      const event = await createTestEvent({}, organizer.id);

      const ticketData = {
        event_id: event.id,
        quantity: 2
      };

      const response = await request(app)
        .post('/api/tickets')
        .send(ticketData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Access denied. No token provided.');
    });

    test('should reject purchase with insufficient tickets', async () => {
      const user = await createTestUser({ role: 'user' });
      const organizer = await createTestUser({ role: 'organizer' });
      const event = await createTestEvent({ available_tickets: 10 }, organizer.id);
      const token = generateToken(user);

      const ticketData = {
        event_id: event.id,
        quantity: 15 // More than available
      };

      const response = await request(app)
        .post('/api/tickets')
        .set('Authorization', `Bearer ${token}`)
        .send(ticketData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Only 10 tickets available');

      // Verify capacity was NOT decremented
      const pool = getTestPool();
      const [events] = await pool.query('SELECT available_tickets FROM events WHERE id = ?', [event.id]);
      expect(events[0].available_tickets).toBe(10); // Should remain unchanged
    });

    test('should reject purchase for non-existent event', async () => {
      const user = await createTestUser({ role: 'user' });
      const token = generateToken(user);

      const ticketData = {
        event_id: 99999,
        quantity: 2
      };

      const response = await request(app)
        .post('/api/tickets')
        .set('Authorization', `Bearer ${token}`)
        .send(ticketData)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Event not found or not available');
    });

    test('should reject purchase with invalid quantity', async () => {
      const user = await createTestUser({ role: 'user' });
      const organizer = await createTestUser({ role: 'organizer' });
      const event = await createTestEvent({}, organizer.id);
      const token = generateToken(user);

      const ticketData = {
        event_id: event.id,
        quantity: 0 // Invalid quantity
      };

      const response = await request(app)
        .post('/api/tickets')
        .set('Authorization', `Bearer ${token}`)
        .send(ticketData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Event ID and valid quantity are required');
    });

    test('should reject purchase with missing event_id', async () => {
      const user = await createTestUser({ role: 'user' });
      const token = generateToken(user);

      const ticketData = {
        quantity: 2
        // Missing event_id
      };

      const response = await request(app)
        .post('/api/tickets')
        .set('Authorization', `Bearer ${token}`)
        .send(ticketData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Event ID and valid quantity are required');
    });

    test('should handle multiple purchases correctly', async () => {
      const user1 = await createTestUser({ role: 'user', email: 'user1@test.com' });
      const user2 = await createTestUser({ role: 'user', email: 'user2@test.com' });
      const organizer = await createTestUser({ role: 'organizer' });
      const event = await createTestEvent({ available_tickets: 50 }, organizer.id);
      
      const token1 = generateToken(user1);
      const token2 = generateToken(user2);

      // First purchase
      await request(app)
        .post('/api/tickets')
        .set('Authorization', `Bearer ${token1}`)
        .send({ event_id: event.id, quantity: 10 })
        .expect(201);

      // Second purchase
      await request(app)
        .post('/api/tickets')
        .set('Authorization', `Bearer ${token2}`)
        .send({ event_id: event.id, quantity: 15 })
        .expect(201);

      // Verify total capacity decremented correctly
      const pool = getTestPool();
      const [events] = await pool.query('SELECT available_tickets FROM events WHERE id = ?', [event.id]);
      expect(events[0].available_tickets).toBe(25); // 50 - 10 - 15
    });
  });

  describe('GET /api/tickets/user', () => {
    test('should get all tickets for authenticated user', async () => {
      const user = await createTestUser({ role: 'user' });
      const organizer = await createTestUser({ role: 'organizer' });
      const event1 = await createTestEvent({ title: 'Event 1' }, organizer.id);
      const event2 = await createTestEvent({ title: 'Event 2' }, organizer.id);
      const token = generateToken(user);

      // Purchase tickets
      await request(app)
        .post('/api/tickets')
        .set('Authorization', `Bearer ${token}`)
        .send({ event_id: event1.id, quantity: 2 });

      await request(app)
        .post('/api/tickets')
        .set('Authorization', `Bearer ${token}`)
        .send({ event_id: event2.id, quantity: 3 });

      // Get user tickets
      const response = await request(app)
        .get('/api/tickets/user')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.length).toBe(2);
      expect(response.body.data[0].event_title).toBeDefined();
      expect(response.body.data[0].category_name).toBeDefined();
    });

    test('should return empty array for user with no tickets', async () => {
      const user = await createTestUser({ role: 'user' });
      const token = generateToken(user);

      const response = await request(app)
        .get('/api/tickets/user')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual([]);
    });

    test('should reject request without authentication', async () => {
      const response = await request(app)
        .get('/api/tickets/user')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Access denied. No token provided.');
    });
  });

  describe('GET /api/tickets/:id', () => {
    test('should get specific ticket details', async () => {
      const user = await createTestUser({ role: 'user' });
      const organizer = await createTestUser({ role: 'organizer' });
      const event = await createTestEvent({ title: 'Test Event' }, organizer.id);
      const token = generateToken(user);

      // Purchase ticket
      const purchaseResponse = await request(app)
        .post('/api/tickets')
        .set('Authorization', `Bearer ${token}`)
        .send({ event_id: event.id, quantity: 2 });

      const ticketId = purchaseResponse.body.data.ticket_id;

      // Get ticket details
      const response = await request(app)
        .get(`/api/tickets/${ticketId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.id).toBe(ticketId);
      expect(response.body.data.event_title).toBe('Test Event');
      expect(response.body.data.quantity).toBe(2);
    });

    test('should return 404 for non-existent ticket', async () => {
      const user = await createTestUser({ role: 'user' });
      const token = generateToken(user);

      const response = await request(app)
        .get('/api/tickets/99999')
        .set('Authorization', `Bearer ${token}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Ticket not found');
    });

    test('should not allow user to view another user\'s ticket', async () => {
      const user1 = await createTestUser({ role: 'user', email: 'user1@test.com' });
      const user2 = await createTestUser({ role: 'user', email: 'user2@test.com' });
      const organizer = await createTestUser({ role: 'organizer' });
      const event = await createTestEvent({}, organizer.id);
      
      const token1 = generateToken(user1);
      const token2 = generateToken(user2);

      // User1 purchases ticket
      const purchaseResponse = await request(app)
        .post('/api/tickets')
        .set('Authorization', `Bearer ${token1}`)
        .send({ event_id: event.id, quantity: 1 });

      const ticketId = purchaseResponse.body.data.ticket_id;

      // User2 tries to view User1's ticket
      const response = await request(app)
        .get(`/api/tickets/${ticketId}`)
        .set('Authorization', `Bearer ${token2}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Ticket not found');
    });
  });
});
