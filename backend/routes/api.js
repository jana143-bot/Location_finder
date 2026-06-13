const express = require('express');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const { searchLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-for-mock-oauth';

// ==========================================
// MOCK OAUTH AUTHENTICATION ENDPOINTS
// ==========================================

// Mock OAuth Login Redirect
router.get('/auth/login', (req, res) => {
  // In a real OAuth flow, this would redirect to the provider's login page (e.g., GitHub, Google)
  // Here, we simulate the redirect to a "mock" provider callback immediately
  const mockProviderUrl = `http://localhost:3000/api/auth/callback?code=mock_authorization_code_12345`;
  res.redirect(mockProviderUrl);
});

// Mock OAuth Callback
router.get('/auth/callback', (req, res, next) => {
  try {
    const { code } = req.query;

    if (!code) {
      const err = new Error('Authorization code missing');
      err.statusCode = 400;
      throw err;
    }

    // In a real OAuth flow, we would exchange the 'code' for an access token with the provider
    // and then fetch the user profile. Here, we mock the user profile.
    const mockUserProfile = {
      id: 'mock_user_987',
      name: 'John Doe',
      username: 'johndoe_mock',
      avatar_url: 'https://ui-avatars.com/api/?name=John+Doe'
    };

    // Create a JWT for our application session
    const token = jwt.sign(mockUserProfile, JWT_SECRET, { expiresIn: '1h' });

    // Set token in HTTP-only cookie
    res.cookie('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 3600000 // 1 hour
    });

    // Redirect to frontend dashboard
    res.redirect('http://localhost:5173/dashboard');
  } catch (error) {
    next(error);
  }
});

// Get current user profile
router.get('/auth/me', (req, res, next) => {
  try {
    const token = req.cookies.auth_token;

    if (!token) {
      const err = new Error('Not authenticated');
      err.statusCode = 401;
      throw err;
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    res.json({ success: true, user: decoded });
  } catch (error) {
    console.error('JWT Error:', error.message, req.cookies.auth_token);
    // If JWT is invalid or expired
    const err = new Error('Invalid or expired token');
    err.statusCode = 401;
    next(err);
  }
});

// Logout
router.post('/auth/logout', (req, res) => {
  res.clearCookie('auth_token');
  res.json({ success: true, message: 'Logged out successfully' });
});

// ==========================================
// EXTERNAL API INTEGRATION: LOCATION SEARCH
// ==========================================

// Middleware to protect routes (Modified for Demo Local Storage Auth)
const requireAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: { message: 'Unauthorized. Please login.', status: 401 } });
  }

  const token = authHeader.split(' ')[1];
  
  // Accept the demo local storage token
  if (token === 'demo-local-token') {
    req.user = { name: 'Demo User' };
    return next();
  }

  // Fallback to cookie-based JWT verification if still used
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (err) {
    return res.status(401).json({ success: false, error: { message: 'Invalid token', status: 401 } });
  }
};

// Location Search Endpoint
// Applying rate limiter specifically to this external API call to prevent abuse
router.get('/locations/search', requireAuth, searchLimiter, async (req, res, next) => {
  try {
    const { q } = req.query;

    if (!q) {
      const err = new Error('Search query "q" is required');
      err.statusCode = 400;
      throw err;
    }

    // Call OpenStreetMap Nominatim API
    // Nominatim requires a valid User-Agent header
    const response = await axios.get('https://nominatim.openstreetmap.org/search', {
      params: {
        q: q,
        format: 'json',
        addressdetails: 1,
        limit: 5
      },
      headers: {
        'User-Agent': 'LocationFinderDashboard/1.0',
        'Accept-Language': 'en'
      }
    });

    res.json({
      success: true,
      data: response.data
    });
  } catch (error) {
    console.error('Error calling external API:', error.message);
    const err = new Error('Failed to fetch location data from external service');
    err.statusCode = 502; // Bad Gateway
    next(err);
  }
});

module.exports = router;
