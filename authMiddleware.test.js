// tests/authMiddleware.test.js
const jwt = require('jsonwebtoken');

// Inline the middleware function for testing
function authMiddleware(req, res, next) {
  const token = req.cookies.token;

  if (!token) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token is not valid' });
  }
}

describe('Auth Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      cookies: {}
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
    process.env.JWT_SECRET = 'test_secret_key';
  });

  test('should pass to next middleware when valid token is provided', () => {
    const userId = 'user123';
    const token = jwt.sign({ id: userId }, process.env.JWT_SECRET);
    req.cookies.token = token;

    authMiddleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.user).toBeDefined();
    expect(req.user.id).toBe(userId);
    expect(res.status).not.toHaveBeenCalled();
  });

  test('should return 401 when no token is provided', () => {
    authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      message: 'No token, authorization denied'
    });
    expect(next).not.toHaveBeenCalled();
  });

  test('should return 401 when token is invalid', () => {
    req.cookies.token = 'invalid_token';

    authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Token is not valid'
    });
    expect(next).not.toHaveBeenCalled();
  });

  test('should return 401 when token is expired', () => {
    const expiredToken = jwt.sign(
      { id: 'user123' },
      process.env.JWT_SECRET,
      { expiresIn: '-1h' } // Expired token
    );
    req.cookies.token = expiredToken;

    authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Token is not valid'
    });
    expect(next).not.toHaveBeenCalled();
  });

  test('should correctly decode token payload', () => {
    const userData = { id: 'user456', email: 'test@example.com' };
    const token = jwt.sign(userData, process.env.JWT_SECRET);
    req.cookies.token = token;

    authMiddleware(req, res, next);

    expect(req.user.id).toBe(userData.id);
    expect(req.user.email).toBe(userData.email);
  });
});
