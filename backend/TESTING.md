# Testing Documentation - Event Management Platform

## Overview

This document describes the comprehensive testing infrastructure for the Event Management Platform backend API. The testing suite includes **unit tests**, **integration tests**, and **security tests** with a minimum coverage threshold of **80%**.

## 📋 Requirements Met

Based on the project requirements (Proyecto_Final_Testing.pdf), this testing implementation covers:

✅ **Unit Tests** - Isolated testing of middleware and utilities  
✅ **Integration Tests** - End-to-end API testing with real database  
✅ **Security Tests** - Authentication and role-based access control validation  
✅ **80% Code Coverage** - Enforced via Jest configuration  
✅ **GitHub Actions CI/CD** - Automated testing on push/PR  
✅ **Real Database Testing** - No mocks, using actual MySQL test database  

## 🛠️ Setup

### Prerequisites

- Node.js 18+
- MySQL 8.0+
- npm or yarn

### Installation

```bash
cd backend
npm install
```

### Database Setup

Create a test database:

```sql
CREATE DATABASE event_management_test;
```

Configure your `.env.test` file:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=event_management
DB_NAME_TEST=event_management_test
JWT_SECRET=test-secret-key-for-testing
PORT=5000
NODE_ENV=test
```

## 🧪 Running Tests

### All Tests with Coverage

```bash
npm run test:coverage
```

### Unit Tests Only

```bash
npm run test:unit
```

### Integration Tests Only

```bash
npm run test:integration
```

### Watch Mode (for development)

```bash
npm run test:watch
```

## 📁 Test Structure

```
backend/
├── __tests__/
│   ├── setup/
│   │   ├── testDb.js          # Test database setup/teardown
│   │   └── helpers.js         # Test helper functions
│   ├── unit/
│   │   └── middleware/
│   │       └── auth.test.js   # Auth middleware unit tests
│   └── integration/
│       ├── auth.test.js       # Authentication endpoints
│       ├── events.test.js     # Events CRUD operations
│       ├── tickets.test.js    # Ticket purchase & management
│       ├── categories.test.js # Category management
│       └── security.test.js   # Security & role-based access
├── jest.config.js             # Jest configuration
└── .env.test                  # Test environment variables
```

## 📊 Test Coverage

### Coverage Thresholds

The project enforces minimum coverage of **80%** for:
- Statements
- Branches
- Functions
- Lines

### Covered Files

- `routes/**/*.js` - All API routes
- `middleware/**/*.js` - Authentication & authorization
- `config/**/*.js` - Database configuration

## 🔍 Test Categories

### 1. Unit Tests (11 tests)

**Auth Middleware (`__tests__/unit/middleware/auth.test.js`)**
- ✓ Token verification (valid, invalid, expired, missing)
- ✓ Admin role validation
- ✓ Organizer role validation
- ✓ Role-based access control

### 2. Integration Tests - Authentication (10 tests)

**Registration (`POST /api/auth/register`)**
- ✓ Successful user registration (201)
- ✓ User created in database
- ✓ Password not exposed in response
- ✓ Duplicate email rejection (400)
- ✓ Invalid email validation
- ✓ Short password validation
- ✓ Missing required fields validation

**Login (`POST /api/auth/login`)**
- ✓ Successful login with valid credentials (200)
- ✓ Token generation
- ✓ Password not exposed in response
- ✓ Invalid email rejection (401)
- ✓ Invalid password rejection (401)
- ✓ Correct role assignment (admin, organizer, user)

### 3. Integration Tests - Events (15 tests)

**List Events (`GET /api/events`)**
- ✓ Pagination support
- ✓ Category filtering
- ✓ Search functionality
- ✓ Featured events filter
- ✓ Date range filtering

**Event Details (`GET /api/events/:id`)**
- ✓ Retrieve event by ID (200)
- ✓ 404 for non-existent events

**Create Event (`POST /api/events`)**
- ✓ Admin can create events (201)
- ✓ Organizer can create events (201)
- ✓ User cannot create events (403)
- ✓ Requires authentication (401)
- ✓ Event created in database
- ✓ Validation for required fields

**Update/Delete Events**
- ✓ Update event (200)
- ✓ Delete event (200)
- ✓ 404 for non-existent events

### 4. Integration Tests - Tickets (12 tests)

**Purchase Tickets (`POST /api/tickets`)**
- ✓ **CRITICAL: Successful purchase with capacity decrement** (201)
- ✓ Ticket created in database
- ✓ Available tickets decremented correctly
- ✓ Insufficient tickets rejection (400)
- ✓ Non-existent event rejection (404)
- ✓ Invalid quantity validation
- ✓ Multiple purchases handled correctly
- ✓ Requires authentication (401)

**User Tickets (`GET /api/tickets/user`)**
- ✓ List user's tickets (200)
- ✓ Empty array for users with no tickets
- ✓ Requires authentication (401)

**Ticket Details (`GET /api/tickets/:id`)**
- ✓ Retrieve specific ticket (200)
- ✓ Users can only view their own tickets
- ✓ 404 for non-existent tickets

### 5. Integration Tests - Categories (13 tests)

**List Categories (`GET /api/categories`)**
- ✓ Public access (no authentication required)
- ✓ Includes default categories

**Create Category (`POST /api/categories`)**
- ✓ Admin can create (201)
- ✓ Organizer cannot create (403)
- ✓ User cannot create (403)
- ✓ Requires authentication (401)
- ✓ Category created in database
- ✓ Duplicate name rejection
- ✓ Name required validation

**Update/Delete Categories**
- ✓ Admin can update/delete
- ✓ Non-admin rejected (403)
- ✓ Cannot delete category in use by events

### 6. Security Tests (15 tests)

**Authentication Security**
- ✓ Protected endpoints reject without token (401)
- ✓ Protected endpoints reject invalid token (403)
- ✓ Password never exposed in registration
- ✓ Password never exposed in login

**Admin-Only Endpoints**
- ✓ Admin can create categories
- ✓ Organizer rejected from category creation (403)
- ✓ User rejected from category creation (403)
- ✓ Organizer rejected from category update (403)
- ✓ User rejected from category deletion (403)

**Admin/Organizer Endpoints**
- ✓ Admin can create events
- ✓ Organizer can create events
- ✓ User rejected from event creation (403)
- ✓ User rejected from event update (403)
- ✓ User rejected from event deletion (403)

**User Access Control**
- ✓ Users can purchase tickets
- ✓ Users only see their own tickets

**Public Endpoints**
- ✓ Unauthenticated access to list events
- ✓ Unauthenticated access to event details
- ✓ Unauthenticated access to categories

## 🚀 GitHub Actions CI/CD

The project includes automated testing via GitHub Actions (`.github/workflows/test.yml`).

### Workflow Triggers

- Every `push` to any branch
- Every `pull_request` to main/develop

### Workflow Steps

1. ✅ Checkout code
2. ✅ Setup Node.js 18
3. ✅ Install dependencies
4. ✅ Setup MySQL 8.0 service
5. ✅ Create test database
6. ✅ Run unit tests
7. ✅ Run integration tests
8. ✅ Generate coverage report
9. ✅ Enforce 80% coverage threshold
10. ✅ Upload coverage to Codecov (optional)

### Coverage Enforcement

The CI pipeline will **fail** if coverage drops below 80% for any metric.

## 🔧 Test Helpers

### Database Helpers (`__tests__/setup/testDb.js`)

- `setupTestDatabase()` - Creates test database schema
- `cleanupTestDatabase()` - Cleans data between tests
- `closeTestDatabase()` - Closes database connections
- `getTestPool()` - Returns test database pool

### Test Data Helpers (`__tests__/setup/helpers.js`)

- `createTestUser(userData)` - Creates test user with role
- `generateToken(user)` - Generates JWT for testing
- `createTestEvent(eventData, organizerId)` - Creates test event
- `createTestCategory(categoryData)` - Creates test category
- `createTestTicket(ticketData)` - Creates test ticket

## 📝 Best Practices

### 1. Database Isolation

- Each test suite sets up a fresh database
- Data is cleaned between tests
- No test pollution

### 2. Real Database Testing

- Uses actual MySQL database (not mocks)
- Validates database operations
- Ensures data integrity

### 3. Comprehensive Coverage

- Tests happy paths and error cases
- Validates authentication and authorization
- Checks database state after operations

### 4. Security Focus

- Validates role-based access control
- Ensures passwords are never exposed
- Tests token validation

## 🐛 Troubleshooting

### Database Connection Issues

```bash
# Ensure MySQL is running
mysql -u root -p

# Create test database
CREATE DATABASE event_management_test;
```

### Port Conflicts

If port 5000 is in use, update `.env.test`:

```env
PORT=5001
```

### Coverage Not Meeting Threshold

Run coverage report to see uncovered lines:

```bash
npm run test:coverage
```

Check the `coverage/lcov-report/index.html` file in your browser for detailed coverage information.

## 📈 Continuous Improvement

### Adding New Tests

1. Create test file in appropriate directory
2. Follow existing test patterns
3. Ensure database cleanup
4. Run coverage to verify threshold

### Maintaining Coverage

- Add tests for new features
- Update tests when modifying routes
- Review coverage reports regularly

## ✅ Success Criteria

All requirements from the PDF have been met:

- ✅ 80%+ code coverage
- ✅ Unit tests for middleware
- ✅ Integration tests for all critical endpoints
- ✅ Security and role-based access tests
- ✅ GitHub Actions workflow
- ✅ Real database (no mocks)
- ✅ Automated testing on push/PR

## 📞 Support

For issues or questions about testing:
1. Check this documentation
2. Review test files for examples
3. Check GitHub Actions logs for CI failures
