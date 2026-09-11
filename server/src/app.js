const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const marketplaceRoutes = require('./routes/marketplaceRoutes');
const orderRoutes = require('./routes/orderRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const jobRoutes = require('./routes/jobRoutes');
const sahayakRoutes = require('./routes/sahayakRoutes');
const marketplaceController = require('./controllers/marketplaceController');
const { errorHandler, notFound } = require('./middleware/errorMiddleware');
const requestLogger = require('./middleware/requestLogger');

const app = express();

// Request diagnostic logging middleware
app.use(requestLogger);

// Security middleware
app.use(helmet());

// CORS setup - fully driven by environment variables
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim())
  : '*';

app.use(
  cors({
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files for local image uploads fallback
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));

// Health check endpoints (GET /api/health and GET /health)
const mongoose = require('mongoose');
const handleHealthCheck = (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1
    ? 'connected'
    : mongoose.connection.readyState === 2
    ? 'connecting'
    : 'disconnected';

  res.status(200).json({
    status: 'ok',
    service: 'KalaSetu Backend API',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    database: dbStatus,
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
};

app.get('/api/health', handleHealthCheck);
app.get('/health', handleHealthCheck);

// Public Shareable Storefront direct URL
app.get('/store/:artisanId', marketplaceController.getPublicStorefront);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/marketplace', marketplaceRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/sahayak', sahayakRoutes);
app.use('/api/v1/sahayak', sahayakRoutes);


// Catch 404 and forward to error handler
app.use(notFound);

// Centralized error handling
app.use(errorHandler);

module.exports = app;
