const request = require('supertest');
const app = require('../../server');
const { setupTestDatabase, cleanupTestDatabase, closeTestDatabase } = require('../setup/testDb');
const { createTestUser, generateToken, createTestEvent } = require('../setup/helpers');

describe('Security & Role-Based Access - Integration Tests', () => {
  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterEach(async () => {
    await cleanupTestDatabase();
  });

  afterAll(async () => {
    await closeTestDatabase();
  });

  describe('Authentication Security', () => {
    test('should reject protected endpoints without token (401)', async () => {
      const endpoints = [
        { method: 'post', path: '/api/events', data: { title: 'Test' } },
        { method: 'put', path: '/api/events/1', data: { title: 'Test' } },
        { method: 'delete', path: '/api/events/1' },
        { method: 'post', path: '/api/tickets', data: { event_id: 1, quantity: 1 } },
        { method: 'get', path: '/api/tickets/user' },
        { method: 'get', path: '/api/tickets/1' },
        { method: 'post', path: '/api/categories', data: { name: 'Test' } },
        { method: 'put', path: '/api/categories/1', data: { name: 'Test' } },
        { method: 'delete', path: '/api/categories/1' }
      ];

      for (const endpoint of endpoints) {
        const response = await request(app)[endpoint.method](endpoint.path)
          .send(endpoint.data || {});

        expect(response.status).toBe(401);
        expect(response.body.success).toBe(false);
        expect(response.body.message).toBe('Access denied. No token provided.');
      }
    });

    test('should reject protected endpoints with invalid token (403)', async () => {
      const invalidToken = 'invalid.token.here';

      const response = await request(app)
        .post('/api/events')
        .set('Authorization', `Bearer ${invalidToken}`)
        .send({ title: 'Test Event' });

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid or expired token.');
    });

    test('should never expose password in registration response', async () => {
      const userData = {
        email: 'security@test.com',
        password: 'password123',
        first_name: 'Security',
        last_name: 'Test'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body.user.password).toBeUndefined();
      expect(response.body.password).toBeUndefined();
      
      // Ensure no password field in entire response
      const responseString = JSON.stringify(response.body);
      expect(responseString).not.toContain('$2a$'); // bcrypt hash prefix
    });

    test('should never expose password in login response', async () => {
      const user = await createTestUser({
        email: 'login@test.com',
        password: 'password123'
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: user.email,
          password: user.password
        })
        .expect(200);

      expect(response.body.user.password).toBeUndefined();
      expect(response.body.password).toBeUndefined();
      
      // Ensure no password field in entire response
      const responseString = JSON.stringify(response.body);
      expect(responseString).not.toContain('$2a$'); // bcrypt hash prefix
    });
  });

  describe('Admin-Only Endpoints', () => {
    test('should allow admin to create category', async () => {
      const admin = await createTestUser({ role: 'admin' });
      const token = generateToken(admin);

      const response = await request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Admin Category', description: 'Test' })
        .expect(201);

      expect(response.body.success).toBe(true);
    });

    test('should reject organizer from creating category (403)', async () => {
      const organizer = await createTestUser({ role: 'organizer' });
      const token = generateToken(organizer);

      const response = await request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Organizer Category', description: 'Test' })
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Access denied. Admin privileges required.');
    });

    test('should reject user from creating category (403)', async () => {
      const user = await createTestUser({ role: 'user' });
      const token = generateToken(user);

      const response = await request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'User Category', description: 'Test' })
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Access denied. Admin privileges required.');
    });

    test('should reject organizer from updating category (403)', async () => {
      const organizer = await createTestUser({ role: 'organizer' });
      const token = generateToken(organizer);

      const response = await request(app)
        .put('/api/categories/1')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Updated', description: 'Test' })
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Access denied. Admin privileges required.');
    });

    test('should reject user from deleting category (403)', async () => {
      const user = await createTestUser({ role: 'user' });
      const token = generateToken(user);

      const response = await request(app)
        .delete('/api/categories/1')
        .set('Authorization', `Bearer ${token}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Access denied. Admin privileges required.');
    });
  });

  describe('Admin/Organizer-Only Endpoints', () => {
    test('should allow admin to create event', async () => {
      const admin = await createTestUser({ role: 'admin' });
      const token = generateToken(admin);

      const eventData = {
        title: 'Admin Event',
        description: 'Test',
        location: 'Location',
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

    test('should allow organizer to create event', async () => {
      const organizer = await createTestUser({ role: 'organizer' });
      const token = generateToken(organizer);

      const eventData = {
        title: 'Organizer Event',
        description: 'Test',
        location: 'Location',
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

    test('should reject user from creating event (403)', async () => {
      const user = await createTestUser({ role: 'user' });
      const token = generateToken(user);

      const eventData = {
        title: 'User Event',
        description: 'Test',
        location: 'Location',
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

    test('should reject user from updating event (403)', async () => {
      const user = await createTestUser({ role: 'user' });
      const organizer = await createTestUser({ role: 'organizer' });
      const event = await createTestEvent({}, organizer.id);
      const token = generateToken(user);

      const updateData = {
        title: 'Updated',
        description: 'Test',
        location: 'Location',
        event_date: '2025-12-31 18:00:00',
        price: 50.00,
        available_tickets: 100,
        category_id: 1
      };

      const response = await request(app)
        .put(`/api/events/${event.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send(updateData)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Access denied. Organizer or Admin privileges required.');
    });

    test('should reject user from deleting event (403)', async () => {
      const user = await createTestUser({ role: 'user' });
      const organizer = await createTestUser({ role: 'organizer' });
      const event = await createTestEvent({}, organizer.id);
      const token = generateToken(user);

      const response = await request(app)
        .delete(`/api/events/${event.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Access denied. Organizer or Admin privileges required.');
    });
  });

  describe('User Access Control', () => {
    test('should allow any authenticated user to purchase tickets', async () => {
      const user = await createTestUser({ role: 'user' });
      const organizer = await createTestUser({ role: 'organizer' });
      const event = await createTestEvent({}, organizer.id);
      const token = generateToken(user);

      const response = await request(app)
        .post('/api/tickets')
        .set('Authorization', `Bearer ${token}`)
        .send({ event_id: event.id, quantity: 2 })
        .expect(201);

      expect(response.body.success).toBe(true);
    });

    test('should only show user their own tickets', async () => {
      const user1 = await createTestUser({ role: 'user', email: 'user1@test.com' });
      const user2 = await createTestUser({ role: 'user', email: 'user2@test.com' });
      const organizer = await createTestUser({ role: 'organizer' });
      const event = await createTestEvent({}, organizer.id);

      const token1 = generateToken(user1);
      const token2 = generateToken(user2);

      // User1 purchases ticket
      await request(app)
        .post('/api/tickets')
        .set('Authorization', `Bearer ${token1}`)
        .send({ event_id: event.id, quantity: 1 });

      // User2 purchases ticket
      await request(app)
        .post('/api/tickets')
        .set('Authorization', `Bearer ${token2}`)
        .send({ event_id: event.id, quantity: 2 });

      // User1 gets their tickets
      const response1 = await request(app)
        .get('/api/tickets/user')
        .set('Authorization', `Bearer ${token1}`)
        .expect(200);

      expect(response1.body.data.length).toBe(1);
      expect(response1.body.data[0].quantity).toBe(1);

      // User2 gets their tickets
      const response2 = await request(app)
        .get('/api/tickets/user')
        .set('Authorization', `Bearer ${token2}`)
        .expect(200);

      expect(response2.body.data.length).toBe(1);
      expect(response2.body.data[0].quantity).toBe(2);
    });
  });

  describe('Public Endpoints', () => {
    test('should allow unauthenticated access to list events', async () => {
      const response = await request(app)
        .get('/api/events')
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    test('should allow unauthenticated access to event details', async () => {
      const organizer = await createTestUser({ role: 'organizer' });
      const event = await createTestEvent({}, organizer.id);

      const response = await request(app)
        .get(`/api/events/${event.id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    test('should allow unauthenticated access to list categories', async () => {
      const response = await request(app)
        .get('/api/categories')
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });
});
