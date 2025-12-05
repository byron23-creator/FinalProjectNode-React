const request = require('supertest');
const app = require('../../server');
const { setupTestDatabase, cleanupTestDatabase, closeTestDatabase } = require('../setup/testDb');
const { createTestUser, generateToken } = require('../setup/helpers');

describe('Admin Routes - Integration Tests', () => {
  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterEach(async () => {
    await cleanupTestDatabase();
  });

  afterAll(async () => {
    await closeTestDatabase();
  });

  describe('GET /api/admin/users', () => {
    it('should list all users as admin', async () => {
      const admin = await createTestUser('admin');
      const token = generateToken(admin);

      const response = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.users)).toBe(true);
    });

    it('should reject non-admin users', async () => {
      const user = await createTestUser('user');
      const token = generateToken(user);

      await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${token}`)
        .expect(403);
    });

    it('should reject without authentication', async () => {
      await request(app)
        .get('/api/admin/users')
        .expect(401);
    });
  });

  describe('GET /api/admin/stats', () => {
    it('should get dashboard statistics as admin', async () => {
      const admin = await createTestUser('admin');
      const token = generateToken(admin);

      const response = await request(app)
        .get('/api/admin/stats')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.stats).toBeDefined();
    });

    it('should reject non-admin users', async () => {
      const user = await createTestUser('user');
      const token = generateToken(user);

      await request(app)
        .get('/api/admin/stats')
        .set('Authorization', `Bearer ${token}`)
        .expect(403);
    });
  });

  describe('PUT /api/admin/users/:id/role', () => {
    it('should update user role as admin', async () => {
      const admin = await createTestUser('admin');
      const user = await createTestUser('user');
      const token = generateToken(admin);

      const response = await request(app)
        .put(`/api/admin/users/${user.id}/role`)
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
        .put(`/api/admin/users/999/role`)
        .set('Authorization', `Bearer ${token}`)
        .send({ role_id: 2 })
        .expect(403);
    });

    it('should return 404 for non-existent user', async () => {
      const admin = await createTestUser('admin');
      const token = generateToken(admin);

      await request(app)
        .put('/api/admin/users/99999/role')
        .set('Authorization', `Bearer ${token}`)
        .send({ role_id: 2 })
        .expect(404);
    });
  });

  describe('DELETE /api/admin/users/:id', () => {
    it('should delete user as admin', async () => {
      const admin = await createTestUser('admin');
      const user = await createTestUser('user');
      const token = generateToken(admin);

      const response = await request(app)
        .delete(`/api/admin/users/${user.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('deleted');
    });

    it('should reject non-admin users', async () => {
      const user = await createTestUser('user');
      const token = generateToken(user);

      await request(app)
        .delete('/api/admin/users/999')
        .set('Authorization', `Bearer ${token}`)
        .expect(403);
    });

    it('should return 404 for non-existent user', async () => {
      const admin = await createTestUser('admin');
      const token = generateToken(admin);

      await request(app)
        .delete('/api/admin/users/99999')
        .set('Authorization', `Bearer ${token}`)
        .expect(404);
    });
  });
});
