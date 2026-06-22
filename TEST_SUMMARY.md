# Authentication System Tests

## Overview
Comprehensive test suite for the authentication system covering JWT tokens, password hashing, token validation, user validation, and middleware functionality.

## Test Results
✅ **All 22 tests passing**

### Test Summary

#### 1. **JWT Token Generation** (3 tests)
- ✅ Generate valid JWT tokens
- ✅ Include user ID and metadata in token payload
- ✅ Create tokens with expiration timestamps

#### 2. **Password Hashing** (4 tests)
- ✅ Hash passwords with bcryptjs
- ✅ Verify hashed passwords correctly
- ✅ Reject incorrect passwords
- ✅ Generate unique hashes for same password (salt verification)

#### 3. **Token Validation** (4 tests)
- ✅ Verify valid tokens successfully
- ✅ Reject invalid tokens
- ✅ Detect tampered tokens
- ✅ Reject tokens with wrong secret

#### 4. **User Validation** (4 tests)
- ✅ Validate proper email formats
- ✅ Reject invalid email formats
- ✅ Enforce strong password requirements
- ✅ Reject weak passwords

#### 5. **Cookie Handling** (2 tests)
- ✅ Store tokens in secure HTTP-only cookies
- ✅ Handle cookie expiration (24-hour maxAge)

#### 6. **Auth Middleware** (5 tests)
- ✅ Pass valid tokens to next middleware
- ✅ Return 401 when token is missing
- ✅ Return 401 for invalid tokens
- ✅ Return 401 for expired tokens
- ✅ Correctly decode token payload

## Key Testing Areas

### Security
- Password hashing with bcryptjs (10 rounds)
- JWT token validation and expiration
- HTTP-only cookie protection
- Token tampering detection
- Expired token rejection

### Validation
- Email format validation (regex)
- Password strength requirements
  - Minimum 8 characters
  - At least one uppercase letter
  - At least one lowercase letter
  - At least one number
  - At least one special character

### Middleware Functionality
- Request routing for authenticated users
- Proper error responses (401 status)
- User payload attachment to request object

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm test -- --coverage
```

## Test Files

- `auth.test.js` - Core authentication logic tests (JWT, password hashing, validation)
- `tests/authMiddleware.test.js` - Authentication middleware tests

## Dependencies

- **jest** - Testing framework
- **supertest** - HTTP assertion library (for future integration tests)
- **jsonwebtoken** - JWT token generation and verification
- **bcryptjs** - Password hashing

## Environment Configuration

```env
JWT_SECRET=your_super_secret_key_change_this
PORT=5000
MONGO_URI=mongodb://localhost:27017/auth_db
```

## Next Steps

- [ ] Implement auth routes (signup, login, logout, refresh token)
- [ ] Add integration tests with MongoDB
- [ ] Test error handling and edge cases
- [ ] Add rate limiting tests
- [ ] Test cross-origin cookie sharing
- [ ] Test CORS and CSRF protection
