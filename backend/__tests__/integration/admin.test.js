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

  describe('GET /api/admin/dashboard', () => {
    it('should get dashboard statistics as admin', async () => {
      const admin = await createTestUser('admin');
      const token = generateToken(admin);

      const response = await request(app)
        .get('/api/admin/dashboard')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.overview).toBeDefined();
    });

    it('should reject non-admin users', async () => {
      const user = await createTestUser('user');
      const token = generateToken(user);

      await request(app)
        .get('/api/admin/dashboard')
        .set('Authorization', `Bearer ${token}`)
        .expect(403);
    });

    it('should reject without authentication', async () => {
      await request(app)
        .get('/api/admin/dashboard')
        .expect(401);
    });
  });

  describe('GET /api/admin/reports/sales', () => {
    it('should get sales report as admin', async () => {
      const admin = await createTestUser('admin');
      const token = generateToken(admin);

      const response = await request(app)
        .get('/api/admin/reports/sales')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
    });

    it('should reject non-admin users', async () => {
      const user = await createTestUser('user');
      const token = generateToken(user);

      await request(app)
        .get('/api/admin/reports/sales')
        .set('Authorization', `Bearer ${token}`)
        .expect(403);
    });
  });
});
