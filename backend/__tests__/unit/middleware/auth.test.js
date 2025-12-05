const jwt = require('jsonwebtoken');
const { verifyToken, isAdmin, isAdminOrOrganizer } = require('../../../middleware/auth');

describe('Auth Middleware - Unit Tests', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      headers: {},
      user: null
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    next = jest.fn();
    process.env.JWT_SECRET = 'test-secret-key';
  });

  describe('verifyToken', () => {
    test('should reject request without token', () => {
      verifyToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Access denied. No token provided.'
      });
      expect(next).not.toHaveBeenCalled();
    });

    test('should reject request with invalid token', () => {
      req.headers.authorization = 'Bearer invalid-token';

      verifyToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid or expired token.'
      });
      expect(next).not.toHaveBeenCalled();
    });

    test('should accept request with valid token', () => {
      const payload = { id: 1, email: 'test@example.com', role: 'user' };
      const token = jwt.sign(payload, process.env.JWT_SECRET);
      req.headers.authorization = `Bearer ${token}`;

      verifyToken(req, res, next);

      expect(req.user).toMatchObject(payload);
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    test('should reject expired token', () => {
      const payload = { id: 1, email: 'test@example.com', role: 'user' };
      const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '-1s' });
      req.headers.authorization = `Bearer ${token}`;

      verifyToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid or expired token.'
      });
      expect(next).not.toHaveBeenCalled();
    });

    test('should handle malformed authorization header', () => {
      req.headers.authorization = 'InvalidFormat';

      verifyToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Access denied. No token provided.'
      });
    });
  });

  describe('isAdmin', () => {
    test('should allow admin role', () => {
      req.user = { id: 1, email: 'admin@example.com', role: 'admin' };

      isAdmin(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    test('should reject non-admin role (user)', () => {
      req.user = { id: 2, email: 'user@example.com', role: 'user' };

      isAdmin(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
      expect(next).not.toHaveBeenCalled();
    });

    test('should reject non-admin role (organizer)', () => {
      req.user = { id: 3, email: 'organizer@example.com', role: 'organizer' };

      isAdmin(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('isAdminOrOrganizer', () => {
    test('should allow admin role', () => {
      req.user = { id: 1, email: 'admin@example.com', role: 'admin' };

      isAdminOrOrganizer(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    test('should allow organizer role', () => {
      req.user = { id: 2, email: 'organizer@example.com', role: 'organizer' };

      isAdminOrOrganizer(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    test('should reject user role', () => {
      req.user = { id: 3, email: 'user@example.com', role: 'user' };

      isAdminOrOrganizer(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Access denied. Organizer or Admin privileges required.'
      });
      expect(next).not.toHaveBeenCalled();
    });
  });
});
