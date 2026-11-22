const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/auth.routes');
const readingRoutes = require('./routes/reading.routes');
const reportRoutes = require('./routes/report.routes');
const profileRoutes = require('./routes/profile.routes');

const app = express();

// Security headers
app.use(helmet());

// Allow frontend requests
app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  })
);

// Parse JSON request bodies
app.use(express.json({ limit: '10kb' }));

// Parse URL-encoded data
app.use(express.urlencoded({ extended: true }));

// General API rate limiter
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 200,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests. Please try again later.',
  },
});

app.use('/api', generalLimiter);

// Health check route
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Sweety API is running',
    timestamp: new Date().toISOString(),
  });
});

// Authentication routes
app.use('/api/auth', authRoutes);

// Glucose reading routes
app.use('/api/readings', readingRoutes);

// Reports routes
app.use('/api/reports', reportRoutes);

// Profile routes
app.use('/api/profile', profileRoutes);

// Root route
app.get('/', (req, res) => {
  res.status(200).json({
    message: 'Welcome to Sweety - Blood Glucose Tracker API',
    health: '/api/health',
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', err.message);

  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Internal server error',
  });
});

module.exports = app;