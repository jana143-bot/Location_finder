require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const apiRoutes = require('./routes/api');
const errorHandler = require('./middleware/errorHandler');
const { apiLimiter } = require('./middleware/rateLimiter');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(cookieParser());

// CORS configuration to allow requests from the React frontend
app.use(cors({
  origin: 'http://localhost:5173', // Vite default port
  credentials: true // Allow cookies to be sent
}));

// Apply general API rate limiter to all /api routes
app.use('/api', apiLimiter);

// Mount API routes
app.use('/api', apiRoutes);

// 404 Handler for undefined routes
app.use((req, res, next) => {
  const err = new Error('Route Not Found');
  err.statusCode = 404;
  next(err);
});

// Centralized Error Handling Middleware (must be the last middleware)
app.use(errorHandler);

// Start Server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log('Location Finder Dashboard Backend is ready.');
});
