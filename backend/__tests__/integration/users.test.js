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
      expect(response.body.user).toBeDefined();
      expect(response.body.user.email).toBe(user.email);
      expect(response.body.user.password).toBeUndefined();
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

    it('should reject invalid email format', async () => {
      const user = await createTestUser('user');
      const token = generateToken(user);

      await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${token}`)
        .send({ email: 'invalid-email' })
        .expect(400);
    });
  });

  describe('PUT /api/users/password', () => {
    it('should change password with correct current password', async () => {
      const user = await createTestUser('user');
      const token = generateToken(user);

      const response = await request(app)
        .put('/api/users/password')
        .set('Authorization', `Bearer ${token}`)
        .send({
          currentPassword: 'password123',
          newPassword: 'newPassword123'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('changed');
    });

    it('should reject with incorrect current password', async () => {
      const user = await createTestUser('user');
      const token = generateToken(user);

      await request(app)
        .put('/api/users/password')
        .set('Authorization', `Bearer ${token}`)
        .send({
          currentPassword: 'wrongpassword',
          newPassword: 'newPassword123'
        })
        .expect(401);
    });

    it('should reject without authentication', async () => {
      await request(app)
        .put('/api/users/password')
        .send({
          currentPassword: 'password123',
          newPassword: 'newPassword123'
        })
        .expect(401);
    });

    it('should reject short new password', async () => {
      const user = await createTestUser('user');
      const token = generateToken(user);

      await request(app)
        .put('/api/users/password')
        .set('Authorization', `Bearer ${token}`)
        .send({
          currentPassword: 'password123',
          newPassword: '123'
        })
        .expect(400);
    });

    it('should reject missing current password', async () => {
      const user = await createTestUser('user');
      const token = generateToken(user);

      await request(app)
        .put('/api/users/password')
        .set('Authorization', `Bearer ${token}`)
        .send({
          newPassword: 'newPassword123'
        })
        .expect(400);
    });
  });

  describe('DELETE /api/users/account', () => {
    it('should delete user account with correct password', async () => {
      const user = await createTestUser('user');
      const token = generateToken(user);

      const response = await request(app)
        .delete('/api/users/account')
        .set('Authorization', `Bearer ${token}`)
        .send({ password: 'password123' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('deleted');
    });

    it('should reject with incorrect password', async () => {
      const user = await createTestUser('user');
      const token = generateToken(user);

      await request(app)
        .delete('/api/users/account')
        .set('Authorization', `Bearer ${token}`)
        .send({ password: 'wrongpassword' })
        .expect(401);
    });

    it('should reject without authentication', async () => {
      await request(app)
        .delete('/api/users/account')
        .send({ password: 'password123' })
        .expect(401);
    });

    it('should reject without password', async () => {
      const user = await createTestUser('user');
      const token = generateToken(user);

      await request(app)
        .delete('/api/users/account')
        .set('Authorization', `Bearer ${token}`)
        .send({})
        .expect(400);
    });
  });
});
