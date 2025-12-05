const request = require('supertest');
const app = require('../../server');
const { setupTestDatabase, cleanupTestDatabase, closeTestDatabase, getTestPool } = require('../setup/testDb');
const { createTestUser, generateToken, createTestEvent } = require('../setup/helpers');

describe('Events Routes - Integration Tests', () => {
  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterEach(async () => {
    await cleanupTestDatabase();
  });

  afterAll(async () => {
    await closeTestDatabase();
  });

  describe('GET /api/events', () => {
    test('should list all events with pagination', async () => {
      const organizer = await createTestUser({ role: 'organizer' });
      await createTestEvent({ title: 'Event 1' }, organizer.id);
      await createTestEvent({ title: 'Event 2' }, organizer.id);

      const response = await request(app)
        .get('/api/events')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.events).toBeDefined();
      expect(response.body.events.length).toBe(2);
      expect(response.body.pagination).toBeDefined();
      expect(response.body.pagination.currentPage).toBe(1);
      expect(response.body.pagination.totalItems).toBe(2);
    });

    test('should filter events by category', async () => {
      const organizer = await createTestUser({ role: 'organizer' });
      await createTestEvent({ title: 'Music Event', category_id: 1 }, organizer.id);
      await createTestEvent({ title: 'Sports Event', category_id: 2 }, organizer.id);

      const response = await request(app)
        .get('/api/events?category=1')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.events.length).toBe(1);
      expect(response.body.events[0].title).toBe('Music Event');
    });

    test('should search events by title', async () => {
      const organizer = await createTestUser({ role: 'organizer' });
      await createTestEvent({ title: 'Rock Concert' }, organizer.id);
      await createTestEvent({ title: 'Jazz Festival' }, organizer.id);

      const response = await request(app)
        .get('/api/events?search=Rock')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.events.length).toBe(1);
      expect(response.body.events[0].title).toBe('Rock Concert');
    });

    test('should filter featured events', async () => {
      const organizer = await createTestUser({ role: 'organizer' });
      await createTestEvent({ title: 'Featured Event', is_featured: true }, organizer.id);
      await createTestEvent({ title: 'Regular Event', is_featured: false }, organizer.id);

      const response = await request(app)
        .get('/api/events?featured=true')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.events.length).toBe(1);
      expect(response.body.events[0].title).toBe('Featured Event');
    });

    test('should paginate results correctly', async () => {
      const organizer = await createTestUser({ role: 'organizer' });
      for (let i = 1; i <= 15; i++) {
        await createTestEvent({ title: `Event ${i}` }, organizer.id);
      }

      const response = await request(app)
        .get('/api/events?page=2&limit=10')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.events.length).toBe(5);
      expect(response.body.pagination.currentPage).toBe(2);
      expect(response.body.pagination.totalPages).toBe(2);
    });
  });

  describe('GET /api/events/:id', () => {
    test('should get event details by id', async () => {
      const organizer = await createTestUser({ role: 'organizer' });
      const event = await createTestEvent({ title: 'Test Event' }, organizer.id);

      const response = await request(app)
        .get(`/api/events/${event.id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.event).toBeDefined();
      expect(response.body.event.title).toBe('Test Event');
      expect(response.body.event.organizer_first_name).toBe(organizer.first_name);
    });

    test('should return 404 for non-existent event', async () => {
      const response = await request(app)
        .get('/api/events/99999')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Event not found');
    });
  });

  describe('POST /api/events', () => {
    test('should create event as organizer', async () => {
      const organizer = await createTestUser({ role: 'organizer' });
      const token = generateToken(organizer);

      const eventData = {
        title: 'New Event',
        description: 'Event description',
        location: 'Event Location',
        event_date: '2025-12-31 18:00:00',
        price: 75.00,
        available_tickets: 200,
        category_id: 1,
        is_featured: false
      };

      const response = await request(app)
        .post('/api/events')
        .set('Authorization', `Bearer ${token}`)
        .send(eventData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Event created successfully');
      expect(response.body.data.id).toBeDefined();

      // Verify event was created in database
      const pool = getTestPool();
      const [events] = await pool.query('SELECT * FROM events WHERE id = ?', [response.body.data.id]);
      expect(events.length).toBe(1);
      expect(events[0].title).toBe(eventData.title);
      expect(events[0].organizer_id).toBe(organizer.id);
    });

    test('should create event as admin', async () => {
      const admin = await createTestUser({ role: 'admin' });
      const token = generateToken(admin);

      const eventData = {
        title: 'Admin Event',
        description: 'Event description',
        location: 'Event Location',
        event_date: '2025-12-31 18:00:00',
        price: 50.00,
        available_tickets: 100,
        category_id: 1
      };

      const response = await request(app)
        .post('/api/events')
        .set('Authorization', `Bearer ${token}`)
        .send(eventData)
        .expect(201);

      expect(response.body.success).toBe(true);
    });

    test('should reject event creation by regular user', async () => {
      const user = await createTestUser({ role: 'user' });
      const token = generateToken(user);

      const eventData = {
        title: 'User Event',
        description: 'Event description',
        location: 'Event Location',
        event_date: '2025-12-31 18:00:00',
        price: 50.00,
        available_tickets: 100,
        category_id: 1
      };

      const response = await request(app)
        .post('/api/events')
        .set('Authorization', `Bearer ${token}`)
        .send(eventData)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Access denied. Organizer or Admin privileges required.');
    });

    test('should reject event creation without token', async () => {
      const eventData = {
        title: 'No Auth Event',
        description: 'Event description',
        location: 'Event Location',
        event_date: '2025-12-31 18:00:00',
        price: 50.00,
        available_tickets: 100,
        category_id: 1
      };

      const response = await request(app)
        .post('/api/events')
        .send(eventData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Access denied. No token provided.');
    });

    test('should reject event creation with missing required fields', async () => {
      const organizer = await createTestUser({ role: 'organizer' });
      const token = generateToken(organizer);

      const eventData = {
        title: 'Incomplete Event'
        // Missing required fields
      };

      const response = await request(app)
        .post('/api/events')
        .set('Authorization', `Bearer ${token}`)
        .send(eventData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('All fields are required');
    });
  });

  describe('PUT /api/events/:id', () => {
    test('should update event as organizer', async () => {
      const organizer = await createTestUser({ role: 'organizer' });
      const token = generateToken(organizer);
      const event = await createTestEvent({ title: 'Original Title' }, organizer.id);

      const updateData = {
        title: 'Updated Title',
        description: 'Updated description',
        location: 'Updated Location',
        event_date: '2025-12-31 20:00:00',
        price: 100.00,
        available_tickets: 150,
        category_id: 2,
        is_featured: true,
        status: 'active'
      };

      const response = await request(app)
        .put(`/api/events/${event.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Event updated successfully');

      // Verify update in database
      const pool = getTestPool();
      const [events] = await pool.query('SELECT * FROM events WHERE id = ?', [event.id]);
      expect(events[0].title).toBe('Updated Title');
      expect(parseFloat(events[0].price)).toBe(100.00);
    });

    test('should return 404 for non-existent event', async () => {
      const organizer = await createTestUser({ role: 'organizer' });
      const token = generateToken(organizer);

      const updateData = {
        title: 'Updated Title',
        description: 'Updated description',
        location: 'Updated Location',
        event_date: '2025-12-31 20:00:00',
        price: 100.00,
        available_tickets: 150,
        category_id: 1
      };

      const response = await request(app)
        .put('/api/events/99999')
        .set('Authorization', `Bearer ${token}`)
        .send(updateData)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Event not found');
    });
  });

  describe('DELETE /api/events/:id', () => {
    test('should delete event as organizer', async () => {
      const organizer = await createTestUser({ role: 'organizer' });
      const token = generateToken(organizer);
      const event = await createTestEvent({}, organizer.id);

      const response = await request(app)
        .delete(`/api/events/${event.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Event deleted successfully');

      // Verify deletion in database
      const pool = getTestPool();
      const [events] = await pool.query('SELECT * FROM events WHERE id = ?', [event.id]);
      expect(events.length).toBe(0);
    });

    test('should return 404 for non-existent event', async () => {
      const organizer = await createTestUser({ role: 'organizer' });
      const token = generateToken(organizer);

      const response = await request(app)
        .delete('/api/events/99999')
        .set('Authorization', `Bearer ${token}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Event not found');
    });
  });
});
