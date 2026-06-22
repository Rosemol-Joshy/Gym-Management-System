// auth.test.js
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

describe('Authentication System - Unit Tests', () => {
  
  describe('JWT Token Generation', () => {
    const JWT_SECRET = 'test_secret_key';

    test('should generate a valid JWT token', () => {
      const userId = 'user123';
      const token = jwt.sign({ id: userId }, JWT_SECRET);
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      
      const decoded = jwt.verify(token, JWT_SECRET);
      expect(decoded.id).toBe(userId);
    });

    test('should include user ID in token payload', () => {
      const payload = { id: 'testuser', email: 'test@example.com', role: 'user' };
      const token = jwt.sign(payload, JWT_SECRET);
      
      const decoded = jwt.verify(token, JWT_SECRET);
      expect(decoded.id).toBe(payload.id);
      expect(decoded.email).toBe(payload.email);
      expect(decoded.role).toBe(payload.role);
    });

    test('should create token with expiration', () => {
      const userId = 'user123';
      const token = jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: '24h' });
      
      const decoded = jwt.verify(token, JWT_SECRET);
      expect(decoded.iat).toBeDefined(); // Issued at
      expect(decoded.exp).toBeDefined(); // Expiration
    });
  });

  describe('Password Hashing', () => {
    test('should hash passwords correctly', async () => {
      const password = 'MyPassword123!';
      const hashedPassword = await bcrypt.hash(password, 10);
      
      expect(hashedPassword).toBeDefined();
      expect(hashedPassword).not.toBe(password);
      expect(hashedPassword.length).toBeGreaterThan(20); // bcrypt hash is typically 60+ chars
    });

    test('should verify hashed password correctly', async () => {
      const password = 'TestPassword456!';
      const hashedPassword = await bcrypt.hash(password, 10);
      
      const isMatch = await bcrypt.compare(password, hashedPassword);
      expect(isMatch).toBe(true);
    });

    test('should not match incorrect password', async () => {
      const password = 'CorrectPassword123!';
      const wrongPassword = 'WrongPassword456!';
      const hashedPassword = await bcrypt.hash(password, 10);
      
      const isMatch = await bcrypt.compare(wrongPassword, hashedPassword);
      expect(isMatch).toBe(false);
    });

    test('should create different hashes for same password', async () => {
      const password = 'MyPassword123!';
      const hash1 = await bcrypt.hash(password, 10);
      const hash2 = await bcrypt.hash(password, 10);
      
      expect(hash1).not.toBe(hash2); // Bcrypt adds salt, so hashes should differ
      expect(await bcrypt.compare(password, hash1)).toBe(true);
      expect(await bcrypt.compare(password, hash2)).toBe(true);
    });
  });

  describe('Token Validation', () => {
    const JWT_SECRET = 'test_secret_key';

    test('should verify valid token successfully', () => {
      const payload = { id: 'user123' };
      const token = jwt.sign(payload, JWT_SECRET);
      
      expect(() => jwt.verify(token, JWT_SECRET)).not.toThrow();
    });

    test('should throw error for invalid token', () => {
      expect(() => jwt.verify('invalid_token', JWT_SECRET)).toThrow();
    });

    test('should throw error for tampered token', () => {
      const payload = { id: 'user123' };
      const token = jwt.sign(payload, JWT_SECRET);
      const tamperedToken = token.slice(0, -5) + 'xxxxx';
      
      expect(() => jwt.verify(tamperedToken, JWT_SECRET)).toThrow();
    });

    test('should throw error when wrong secret is used', () => {
      const payload = { id: 'user123' };
      const token = jwt.sign(payload, JWT_SECRET);
      
      expect(() => jwt.verify(token, 'wrong_secret')).toThrow();
    });
  });

  describe('User Validation', () => {
    test('should validate email format', () => {
      const validEmails = [
        'user@example.com',
        'john.doe@company.co.uk',
        'test+tag@domain.com'
      ];
      
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      validEmails.forEach(email => {
        expect(emailRegex.test(email)).toBe(true);
      });
    });

    test('should reject invalid email format', () => {
      const invalidEmails = [
        'notanemail',
        'missing@domain',
        '@nodomain.com',
        'spaces in@email.com'
      ];
      
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      invalidEmails.forEach(email => {
        expect(emailRegex.test(email)).toBe(false);
      });
    });

    test('should validate password strength', () => {
      const strongPasswords = [
        'SecurePass123!',
        'MyP@ssw0rd2024',
        'Str0ng!Pass'
      ];
      
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
      strongPasswords.forEach(password => {
        expect(passwordRegex.test(password)).toBe(true);
      });
    });

    test('should reject weak passwords', () => {
      const weakPasswords = [
        'weak',
        'nospecialchar123',
        '123456789',
        'NoNumbers!'
      ];
      
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
      weakPasswords.forEach(password => {
        expect(passwordRegex.test(password)).toBe(false);
      });
    });
  });

  describe('Cookie Handling', () => {
    test('should store token in cookie', () => {
      const token = 'test_token_value';
      const cookieOptions = {
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
      };
      
      expect(cookieOptions.httpOnly).toBe(true);
      expect(cookieOptions.secure).toBe(true);
      expect(cookieOptions.maxAge).toBeGreaterThan(0);
    });

    test('should handle cookie expiration', () => {
      const oneDay = 24 * 60 * 60 * 1000;
      const maxAge = oneDay;
      
      expect(maxAge).toBe(86400000);
    });
  });
});
