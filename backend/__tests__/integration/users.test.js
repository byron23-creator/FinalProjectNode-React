const request = require('supertest');
const app = require('../../server');
const { setupTestDatabase, cleanupTestDatabase, closeTestDatabase } = require('../setup/testDb');
const { createTestUser, generateToken } = require('../setup/helpers');

describe('Users Routes - Integration Tests', () => {
  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterEach(async () => {
    await cleanupTestDatabase();
  });

  afterAll(async () => {
    await closeTestDatabase();
  });

  describe('GET /api/users/profile', () => {
    it('should get user profile when authenticated', async () => {
      const user = await createTestUser('user');
      const token = generateToken(user);

      const response = await request(app)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.email).toBe(user.email);
    });

    it('should reject without authentication', async () => {
      await request(app)
        .get('/api/users/profile')
        .expect(401);
    });
  });

  describe('PUT /api/users/profile', () => {
    it('should update user profile', async () => {
      const user = await createTestUser('user');
      const token = generateToken(user);

      const updateData = {
        first_name: 'Updated',
        last_name: 'Name',
        phone: '1234567890'
      };

      const response = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${token}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('updated');
    });

    it('should reject without authentication', async () => {
      await request(app)
        .put('/api/users/profile')
        .send({ first_name: 'Test' })
        .expect(401);
    });

    it('should reject missing required fields', async () => {
      const user = await createTestUser('user');
      const token = generateToken(user);

      await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${token}`)
        .send({ phone: '123456' })
        .expect(400);
    });
  });

  describe('GET /api/users/', () => {
    it('should list all users as admin', async () => {
      const admin = await createTestUser('admin');
      const token = generateToken(admin);

      const response = await request(app)
        .get('/api/users/')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.users)).toBe(true);
    });

    it('should reject non-admin users', async () => {
      const user = await createTestUser('user');
      const token = generateToken(user);

      await request(app)
        .get('/api/users/')
        .set('Authorization', `Bearer ${token}`)
        .expect(403);
    });
  });

  describe('PUT /api/users/:id/role', () => {
    it('should update user role as admin', async () => {
      const admin = await createTestUser('admin');
      const user = await createTestUser('user');
      const token = generateToken(admin);

      const response = await request(app)
        .put(`/api/users/${user.id}/role`)
        .set('Authorization', `Bearer ${token}`)
        .send({ role_id: 2 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('updated');
    });

    it('should reject non-admin users', async () => {
      const user = await createTestUser('user');
      const token = generateToken(user);

      await request(app)
        .put(`/api/users/999/role`)
        .set('Authorization', `Bearer ${token}`)
        .send({ role_id: 2 })
        .expect(403);
    });

    it('should return 404 for non-existent user', async () => {
      const admin = await createTestUser('admin');
      const token = generateToken(admin);

      await request(app)
        .put('/api/users/99999/role')
        .set('Authorization', `Bearer ${token}`)
        .send({ role_id: 2 })
        .expect(404);
    });
  });

  describe('GET /api/users/stats', () => {
    it('should get user statistics as admin', async () => {
      const admin = await createTestUser('admin');
      const token = generateToken(admin);

      const response = await request(app)
        .get('/api/users/stats')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
    });

    it('should reject non-admin users', async () => {
      const user = await createTestUser('user');
      const token = generateToken(user);

      await request(app)
        .get('/api/users/stats')
        .set('Authorization', `Bearer ${token}`)
        .expect(403);
    });
  });
});
