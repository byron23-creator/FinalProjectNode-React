const request = require('supertest');
const app = require('../../server');
const { setupTestDatabase, cleanupTestDatabase, closeTestDatabase, getTestPool } = require('../setup/testDb');
const { createTestUser, generateToken, createTestCategory } = require('../setup/helpers');

describe('Categories Routes - Integration Tests', () => {
  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterEach(async () => {
    await cleanupTestDatabase();
  });

  afterAll(async () => {
    await closeTestDatabase();
  });

  describe('GET /api/categories', () => {
    test('should list all categories without authentication', async () => {
      const response = await request(app)
        .get('/api/categories')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.categories).toBeDefined();
      expect(response.body.categories.length).toBeGreaterThan(0); // Default categories exist
    });

    test('should include default categories', async () => {
      const response = await request(app)
        .get('/api/categories')
        .expect(200);

      const categoryNames = response.body.categories.map(c => c.name);
      expect(categoryNames).toContain('Music');
      expect(categoryNames).toContain('Sports');
      expect(categoryNames).toContain('Technology');
    });
  });

  describe('POST /api/categories', () => {
    test('should create category as admin', async () => {
      const admin = await createTestUser({ role: 'admin' });
      const token = generateToken(admin);

      const categoryData = {
        name: 'New Category',
        description: 'Category description'
      };

      const response = await request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${token}`)
        .send(categoryData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Category created successfully');
      expect(response.body.data.id).toBeDefined();
      expect(response.body.data.name).toBe(categoryData.name);

      // Verify category was created in database
      const pool = getTestPool();
      const [categories] = await pool.query('SELECT * FROM categories WHERE id = ?', [response.body.data.id]);
      expect(categories.length).toBe(1);
      expect(categories[0].name).toBe(categoryData.name);
    });

    test('should reject category creation by organizer', async () => {
      const organizer = await createTestUser({ role: 'organizer' });
      const token = generateToken(organizer);

      const categoryData = {
        name: 'Organizer Category',
        description: 'Should fail'
      };

      const response = await request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${token}`)
        .send(categoryData)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Access denied. Admin privileges required.');
    });

    test('should reject category creation by regular user', async () => {
      const user = await createTestUser({ role: 'user' });
      const token = generateToken(user);

      const categoryData = {
        name: 'User Category',
        description: 'Should fail'
      };

      const response = await request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${token}`)
        .send(categoryData)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Access denied. Admin privileges required.');
    });

    test('should reject category creation without authentication', async () => {
      const categoryData = {
        name: 'No Auth Category',
        description: 'Should fail'
      };

      const response = await request(app)
        .post('/api/categories')
        .send(categoryData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Access denied. No token provided.');
    });

    test('should reject duplicate category name', async () => {
      const admin = await createTestUser({ role: 'admin' });
      const token = generateToken(admin);

      const categoryData = {
        name: 'Music', // Already exists in default categories
        description: 'Duplicate'
      };

      const response = await request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${token}`)
        .send(categoryData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Category already exists');
    });

    test('should reject category creation without name', async () => {
      const admin = await createTestUser({ role: 'admin' });
      const token = generateToken(admin);

      const categoryData = {
        description: 'No name'
      };

      const response = await request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${token}`)
        .send(categoryData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Category name is required');
    });
  });

  describe('PUT /api/categories/:id', () => {
    test('should update category as admin', async () => {
      const admin = await createTestUser({ role: 'admin' });
      const token = generateToken(admin);
      const category = await createTestCategory();

      const updateData = {
        name: 'Updated Category',
        description: 'Updated description'
      };

      const response = await request(app)
        .put(`/api/categories/${category.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Category updated successfully');

      // Verify update in database
      const pool = getTestPool();
      const [categories] = await pool.query('SELECT * FROM categories WHERE id = ?', [category.id]);
      expect(categories[0].name).toBe('Updated Category');
    });

    test('should reject update by non-admin', async () => {
      const user = await createTestUser({ role: 'user' });
      const token = generateToken(user);
      const category = await createTestCategory();

      const updateData = {
        name: 'Updated Category',
        description: 'Should fail'
      };

      const response = await request(app)
        .put(`/api/categories/${category.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send(updateData)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Access denied. Admin privileges required.');
    });

    test('should return 404 for non-existent category', async () => {
      const admin = await createTestUser({ role: 'admin' });
      const token = generateToken(admin);

      const updateData = {
        name: 'Updated Category',
        description: 'Should fail'
      };

      const response = await request(app)
        .put('/api/categories/99999')
        .set('Authorization', `Bearer ${token}`)
        .send(updateData)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Category not found');
    });
  });

  describe('DELETE /api/categories/:id', () => {
    test('should delete category as admin', async () => {
      const admin = await createTestUser({ role: 'admin' });
      const token = generateToken(admin);
      const category = await createTestCategory();

      const response = await request(app)
        .delete(`/api/categories/${category.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Category deleted successfully');

      // Verify deletion in database
      const pool = getTestPool();
      const [categories] = await pool.query('SELECT * FROM categories WHERE id = ?', [category.id]);
      expect(categories.length).toBe(0);
    });

    test('should reject deletion by non-admin', async () => {
      const user = await createTestUser({ role: 'user' });
      const token = generateToken(user);
      const category = await createTestCategory();

      const response = await request(app)
        .delete(`/api/categories/${category.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Access denied. Admin privileges required.');
    });

    test('should return 404 for non-existent category', async () => {
      const admin = await createTestUser({ role: 'admin' });
      const token = generateToken(admin);

      const response = await request(app)
        .delete('/api/categories/99999')
        .set('Authorization', `Bearer ${token}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Category not found');
    });

    test('should reject deletion of category in use by events', async () => {
      const admin = await createTestUser({ role: 'admin' });
      const organizer = await createTestUser({ role: 'organizer' });
      const token = generateToken(admin);

      // Create event with category 1 (Music)
      const pool = getTestPool();
      await pool.query(
        `INSERT INTO events (title, description, location, event_date, price, available_tickets, category_id, organizer_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        ['Test Event', 'Description', 'Location', '2025-12-31 18:00:00', 50.00, 100, 1, organizer.id]
      );

      const response = await request(app)
        .delete('/api/categories/1')
        .set('Authorization', `Bearer ${token}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Cannot delete category that is being used by events');
    });
  });
});
