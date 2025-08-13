require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const path = require('path');

// Import database and routes
const database = require('./config/database');
const routes = require('./routes');

// Import middleware
const { optionalAuthMiddleware } = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 3001;
const HOST = process.env.HOST || '0.0.0.0';

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Compression middleware
if (process.env.ENABLE_COMPRESSION === 'true') {
  app.use(compression());
}

// Logging middleware
if (process.env.ENABLE_REQUEST_LOGGING === 'true') {
  if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
  } else {
    app.use(morgan('combined'));
  }
}

// Body parsing middleware
app.use(express.json({ 
  limit: process.env.MAX_PAYLOAD_SIZE || '10mb' 
}));
app.use(express.urlencoded({ 
  extended: true, 
  limit: process.env.MAX_PAYLOAD_SIZE || '10mb' 
}));

// Optional authentication middleware for all routes
app.use(optionalAuthMiddleware);

// API routes
app.use('/api', routes);

// Serve static files (for uploaded images)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Enhanced health check endpoint
app.get('/health', async (req, res) => {
  try {
    const dbHealth = await database.healthCheck();
    
    res.json({
      success: true,
      message: 'SmartMeal Backend is running',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      version: process.env.npm_package_version || '1.0.0',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      database: dbHealth,
      features: {
        mpesa: !!process.env.MPESA_CONSUMER_KEY,
        email: process.env.ENABLE_EMAIL_NOTIFICATIONS === 'true',
        redis: process.env.ENABLE_REDIS_CACHE === 'true',
        compression: process.env.ENABLE_COMPRESSION === 'true'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Health check failed',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Database status endpoint
app.get('/api/db/status', async (req, res) => {
  try {
    const status = await database.healthCheck();
    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 404 handler for non-API routes
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.originalUrl,
    timestamp: new Date().toISOString()
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('Global error handler:', error);

  // Handle Prisma errors
  if (error.code === 'P2002') {
    return res.status(400).json({
      success: false,
      message: 'Duplicate entry. This record already exists.',
      error: 'DUPLICATE_ENTRY'
    });
  }

  if (error.code === 'P2025') {
    return res.status(404).json({
      success: false,
      message: 'Record not found.',
      error: 'RECORD_NOT_FOUND'
    });
  }

  if (error.code === 'P2003') {
    return res.status(400).json({
      success: false,
      message: 'Foreign key constraint failed.',
      error: 'FOREIGN_KEY_CONSTRAINT'
    });
  }

  // Handle validation errors
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: error.errors,
      error: 'VALIDATION_ERROR'
    });
  }

  // Handle JWT errors
  if (error.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid token',
      error: 'INVALID_TOKEN'
    });
  }

  if (error.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Token expired',
      error: 'TOKEN_EXPIRED'
    });
  }

  // Default error response
  const statusCode = error.statusCode || 500;
  const message = error.message || 'Internal server error';
  
  res.status(statusCode).json({
    success: false,
    message: process.env.NODE_ENV === 'production' ? 'Internal server error' : message,
    error: process.env.NODE_ENV === 'production' ? 'INTERNAL_ERROR' : error.stack,
    timestamp: new Date().toISOString()
  });
});

// Graceful shutdown handling
const gracefulShutdown = async (signal) => {
  console.log(`\n🔄 Received ${signal}. Starting graceful shutdown...`);
  
  try {
    // Close database connection
    if (database.isReady()) {
      await database.disconnect();
    }
    
    // Close server
    server.close(() => {
      console.log('✅ HTTP server closed');
      process.exit(0);
    });
    
    // Force exit after 10 seconds
    setTimeout(() => {
      console.error('❌ Could not close connections in time, forcefully shutting down');
      process.exit(1);
    }, 10000);
    
  } catch (error) {
    console.error('❌ Error during graceful shutdown:', error);
    process.exit(1);
  }
};

// Start server
const startServer = async () => {
  try {
    // Connect to database first
    await database.connect();
    
    // Start HTTP server
    const server = app.listen(PORT, HOST, () => {
      console.log(`🚀 SmartMeal Backend Server running on http://${HOST}:${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV}`);
      console.log(`🔗 API Base: http://${HOST}:${PORT}/api`);
      console.log(`🏥 Health Check: http://${HOST}:${PORT}/health`);
    });
    
    // Handle graceful shutdown
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    
    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      console.error('❌ Uncaught Exception:', error);
      gracefulShutdown('uncaughtException');
    });
    
    process.on('unhandledRejection', (reason, promise) => {
      console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
      gracefulShutdown('unhandledRejection');
    });
    
    return server;
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
startServer();
